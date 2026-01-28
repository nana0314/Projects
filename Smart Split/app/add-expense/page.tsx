'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { getUserFriends } from '@/src/utils/friends';
import { getUserGroups, getGroupMembers } from '@/src/utils/groups';
import { createExpense } from '@/src/utils/expenses';
import { User, Group } from '@/src/types';

type FriendOption = 'you_paid_equal' | 'you_owed_full' | 'friend_paid_equal' | 'friend_owed_full';

export default function AddExpensePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Selection: exactly one friend OR one group
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Friend flow
  const [friendOption, setFriendOption] = useState<FriendOption>('you_paid_equal');

  // Group flow
  const [payerId, setPayerId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<{ [uid: string]: string }>({});
  const [showCustom, setShowCustom] = useState(false);
  const effectiveSplitType = showCustom ? 'custom' : 'equal';

  useEffect(() => {
    if (!user) {
      router.push('/');
      return;
    }
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, router]);

  useEffect(() => {
    if (selectedGroup && user) {
      getGroupMembers(selectedGroup.id).then((members) => {
        setGroupMembers(members);
        setPayerId(user.uid);
        setParticipants([user.uid]);
        setCustomAmounts({});
        setShowCustom(false);
        setSplitType('equal');
      });
    } else {
      setGroupMembers([]);
      setPayerId('');
      setParticipants([]);
      setCustomAmounts({});
      setShowCustom(false);
    }
  }, [selectedGroup, user]);

  useEffect(() => {
    if (!selectedGroup || !payerId) return;
    setParticipants((prev) => (prev.includes(payerId) ? prev : [payerId, ...prev]));
  }, [selectedGroup, payerId]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userFriends, userGroups] = await Promise.all([
        getUserFriends(user.uid),
        getUserGroups(user.uid),
      ]);
      setFriends(userFriends || []);
      setGroups(userGroups || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const selectFriend = (f: User) => {
    setSelectedFriend(f);
    setSelectedGroup(null);
    setFriendOption('you_paid_equal');
  };

  const selectGroup = (g: Group) => {
    setSelectedGroup(g);
    setSelectedFriend(null);
  };

  const clearSelection = () => {
    setSelectedFriend(null);
    setSelectedGroup(null);
    setFriendOption('you_paid_equal');
    setParticipants([]);
    setPayerId(user?.uid || '');
    setCustomAmounts({});
    setShowCustom(false);
    setSplitType('equal');
  };

  const toggleParticipant = (uid: string) => {
    setParticipants((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const amountNum = parseFloat(amount) || 0;
  const isValidAmount = amountNum > 0;
  const participantsList = groupMembers.filter((m) => participants.includes(m.uid));
  const amountPerPerson = participantsList.length > 0 ? amountNum / participantsList.length : 0;

  const totalCustom = Object.values(customAmounts).reduce(
    (sum, s) => sum + (parseFloat(s) || 0),
    0
  );
  const customValid = !showCustom || Math.abs(totalCustom - amountNum) < 0.01;

  const canSubmit =
    isValidAmount &&
    (selectedFriend || selectedGroup) &&
    (selectedFriend
      ? true
      : selectedGroup &&
        participants.length >= 2 &&
        payerId &&
        (effectiveSplitType === 'equal' || (showCustom && customValid)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !canSubmit) return;

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      const expenseAmount = amountNum;
      const date = new Date();
      const category = 'Food';
      const createdBy = user.uid;

      if (selectedFriend) {
        const friend = selectedFriend;
        const participantsList = [user.uid, friend.uid];
        let payerId: string;
        let splitType: 'equal' | 'custom' = 'equal';
        let splitAmounts: { [uid: string]: number } | undefined;

        switch (friendOption) {
          case 'you_paid_equal':
            payerId = user.uid;
            splitType = 'equal';
            break;
          case 'you_owed_full':
            payerId = friend.uid;
            splitType = 'custom';
            splitAmounts = { [user.uid]: 0, [friend.uid]: expenseAmount };
            break;
          case 'friend_paid_equal':
            payerId = friend.uid;
            splitType = 'equal';
            break;
          case 'friend_owed_full':
            payerId = user.uid;
            splitType = 'custom';
            splitAmounts = { [user.uid]: 0, [friend.uid]: expenseAmount };
            break;
          default:
            payerId = user.uid;
            splitType = 'equal';
        }

        const participantNames: { [uid: string]: string } = {
          [user.uid]: user.displayName || 'You',
          [friend.uid]: friend.displayName || 'Unknown',
        };

        await createExpense(
          expenseAmount,
          category,
          date,
          payerId,
          participantsList,
          splitType,
          createdBy,
          undefined,
          description.trim() || undefined,
          splitAmounts,
          participantNames
        );
      } else if (selectedGroup) {
        const participantIds = participants.includes(payerId)
          ? participants
          : [payerId, ...participants];
        let splitAmounts: { [uid: string]: number } | undefined;

        if (effectiveSplitType === 'custom' && showCustom) {
          splitAmounts = {};
          for (const pid of participantIds) {
            splitAmounts[pid] = parseFloat(customAmounts[pid] || '0') || 0;
          }
        }

        const participantNames: { [uid: string]: string } = {};
        for (const m of groupMembers) {
          if (participantIds.includes(m.uid)) {
            participantNames[m.uid] =
              m.uid === user.uid ? (user.displayName || 'You') : m.displayName || 'Unknown';
          }
        }

        await createExpense(
          expenseAmount,
          category,
          date,
          payerId,
          participantIds,
          effectiveSplitType,
          createdBy,
          selectedGroup.id,
          description.trim() || undefined,
          splitAmounts,
          participantNames
        );
      }

      setSuccess('Expense created!');
      setAmount('');
      setDescription('');
      setTimeout(() => router.push('/activity'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setCreating(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <Link
          href="/friends"
          className="text-gray-600 hover:text-gray-900 flex items-center gap-1 active:scale-95 transition-transform"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-lg font-semibold text-gray-900">Add Expense</h1>
        <div className="w-14" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-xl mx-auto">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {success}
          </div>
        )}

        {/* Step 1: Choose friend or group */}
        <section>
          <h2 className="text-sm font-medium text-gray-700 mb-2">Choose one friend or one group</h2>
          {loading ? (
            <p className="text-gray-500 text-sm">Loading…</p>
          ) : (
            <div className="space-y-4">
              {friends.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Friends</p>
                  <div className="flex flex-wrap gap-2">
                    {friends.map((f) => (
                      <button
                        key={f.uid}
                        type="button"
                        onClick={() => selectFriend(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                          selectedFriend?.uid === f.uid
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {f.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {groups.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => selectGroup(g)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                          selectedGroup?.id === g.id
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!loading && friends.length === 0 && groups.length === 0 && (
                <p className="text-gray-500 text-sm">Add friends or groups first.</p>
              )}
              {(selectedFriend || selectedGroup) && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-sm text-gray-500 underline hover:text-gray-700"
                >
                  Clear selection
                </button>
              )}
            </div>
          )}
        </section>

        {!(selectedFriend || selectedGroup) ? null : (
          <>
            {/* Description (optional) */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Pizza Hut"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </section>

            {/* Amount */}
            <section>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount * ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </section>

            {/* Friend: 4 options */}
            {selectedFriend && (
              <section>
                <h2 className="text-sm font-medium text-gray-700 mb-2">Who paid & how to split</h2>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="friendOption"
                      checked={friendOption === 'you_paid_equal'}
                      onChange={() => setFriendOption('you_paid_equal')}
                      className="text-green-600"
                    />
                    <span className="text-gray-900">You paid, split equally</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="friendOption"
                      checked={friendOption === 'you_owed_full'}
                      onChange={() => setFriendOption('you_owed_full')}
                      className="text-green-600"
                    />
                    <span className="text-gray-900">You are owed the full amount</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="friendOption"
                      checked={friendOption === 'friend_paid_equal'}
                      onChange={() => setFriendOption('friend_paid_equal')}
                      className="text-green-600"
                    />
                    <span className="text-gray-900">
                      {selectedFriend.displayName} paid, split equally
                    </span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="friendOption"
                      checked={friendOption === 'friend_owed_full'}
                      onChange={() => setFriendOption('friend_owed_full')}
                      className="text-green-600"
                    />
                    <span className="text-gray-900">
                      {selectedFriend.displayName} is owed the full amount
                    </span>
                  </label>
                </div>
              </section>
            )}

            {/* Group: paid by, participants, equal/custom */}
            {selectedGroup && (
              <section className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Paid by (Who?)
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    {groupMembers.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.uid === user.uid ? 'You' : m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants (who is involved, at least 2)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {groupMembers.map((m) => (
                      <button
                        key={m.uid}
                        type="button"
                        onClick={() => toggleParticipant(m.uid)}
                        className={`px-4 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${
                          participants.includes(m.uid)
                            ? 'bg-green-600 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {m.uid === user.uid ? 'You' : m.displayName}
                      </button>
                    ))}
                  </div>
                </div>

                {participants.length > 0 && (
                  <>
                    {!showCustom ? (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-700 mb-1">Split equally</p>
                        <p className="text-lg font-semibold text-gray-900">
                          Everyone pays ${amountPerPerson.toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustom(true);
                            setSplitType('custom');
                            const initial: { [uid: string]: string } = {};
                            const n = participantsList.length;
                            const base = Math.floor((amountNum * 100) / n) / 100;
                            const remainder = Math.round((amountNum - base * n) * 100) / 100;
                            participantsList.forEach((m, i) => {
                              const last = i === n - 1;
                              initial[m.uid] = (base + (last ? remainder : 0)).toFixed(2);
                            });
                            setCustomAmounts(initial);
                          }}
                          className="mt-3 px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
                        >
                          Custom
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-white border border-gray-200 rounded-lg space-y-3">
                        <p className="text-sm font-medium text-gray-700">Custom amounts</p>
                        {participantsList.map((m) => (
                          <div key={m.uid} className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-700">
                              {m.uid === user.uid ? 'You' : m.displayName}:
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={customAmounts[m.uid] ?? ''}
                              onChange={(e) =>
                                setCustomAmounts((prev) => ({
                                  ...prev,
                                  [m.uid]: e.target.value,
                                }))
                              }
                              placeholder="0.00"
                              className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                        ))}
                        <p className="text-xs text-gray-500">
                          Total must equal ${amountNum.toFixed(2)}. Current: ${totalCustom.toFixed(2)}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowCustom(false);
                            setSplitType('equal');
                            setCustomAmounts({});
                          }}
                          className="text-sm text-gray-600 underline hover:text-gray-800"
                        >
                          Back to equal split
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/friends')}
                className="flex-1 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || creating}
                className="flex-1 py-2.5 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500 active:scale-95 transition-transform"
              >
                {creating ? 'Creating…' : 'Create Expense'}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
