'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { getUserFriends } from '@/src/utils/friends';
import { getUserGroups, getGroupMembers } from '@/src/utils/groups';
import { createExpense, updateExpense, getExpenseById } from '@/src/utils/expenses';
import { scanReceipt } from '@/src/utils/receiptScanner';
import { User, Group, ExpenseCategory } from '@/src/types';

type FriendOption = 'you_paid_equal' | 'you_owed_full' | 'friend_paid_equal' | 'friend_owed_full' | 'custom';

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
  const [scanning, setScanning] = useState(false);
  const receiptInputRef = useRef<HTMLInputElement>(null);

  // Edit mode
  const [editId, setEditId] = useState<string | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  // Selection: exactly one friend OR one group OR personal
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isPersonal, setIsPersonal] = useState(false);

  // Form
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');

  // Friend flow
  const [friendOption, setFriendOption] = useState<FriendOption>('you_paid_equal');
  const [friendPayerId, setFriendPayerId] = useState<string>('');
  const [friendCustomAmounts, setFriendCustomAmounts] = useState<{ you: string; friend: string }>({ you: '', friend: '' });

  // Category
  const [category, setCategory] = useState<ExpenseCategory>('Food');

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
        // Check if we should auto-select all members (from AI chat "everyone" flow)
        const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const shouldSelectAll = params?.get('selectAll') === 'true';
        if (shouldSelectAll) {
          setParticipants(members.map(m => m.uid));
        } else {
          setParticipants([user.uid]);
        }
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

  // Handle pre-selection of group from URL params (e.g., from group details page)
  useEffect(() => {
    if (typeof window !== 'undefined' && groups.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const preselectedGroupId = params.get('groupId');
      if (preselectedGroupId && !selectedGroup && !selectedFriend) {
        const group = groups.find(g => g.id === preselectedGroupId);
        if (group) {
          selectGroup(group);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups]);

  // Handle pre-fill from AI chat assistant (description, amount, category, friendId)
  const [prefilled, setPrefilled] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || loading || prefilled) return;
    const params = new URLSearchParams(window.location.search);
    const prefillDesc = params.get('description');
    const prefillAmount = params.get('amount');
    const prefillCategory = params.get('category');
    const prefillFriendId = params.get('friendId');
    const hasGroupId = params.get('groupId');
    if (prefillDesc || prefillAmount || prefillCategory || prefillFriendId) {
      if (prefillDesc) setDescription(prefillDesc);
      if (prefillAmount) setAmount(prefillAmount);
      if (prefillCategory) setCategory(prefillCategory as ExpenseCategory);
      // Pre-select friend if friendId is provided
      if (prefillFriendId && friends.length > 0) {
        const friend = friends.find(f => f.uid === prefillFriendId);
        if (friend) {
          selectFriend(friend);
        }
      } else if (!hasGroupId && !prefillFriendId) {
        // No group or friend specified, default to personal
        setIsPersonal(true);
      }
      setPrefilled(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, prefilled, friends]);

  // Handle edit mode — load existing expense and prefill form
  useEffect(() => {
    if (typeof window === 'undefined' || friends.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const id = params.get('editId');
    if (!id || editId) return; // Already loaded or no editId

    setEditId(id);
    setEditLoading(true);

    getExpenseById(id).then((expense) => {
      if (!expense) {
        setError('Expense not found');
        setEditLoading(false);
        return;
      }

      // Prefill basic fields
      setDescription(expense.description || '');
      setAmount(expense.amount.toString());
      setCategory(expense.category);

      // Determine expense type and prefill accordingly
      if (expense.groupId) {
        // Group expense
        const group = groups.find(g => g.id === expense.groupId);
        if (group) {
          selectGroup(group);
          // Wait for group members to load, then set participants and payer
          getGroupMembers(group.id).then((members) => {
            setGroupMembers(members);
            setPayerId(expense.payerId);
            setParticipants(expense.participants);

            if (expense.splitType === 'custom' && expense.splitAmounts) {
              setShowCustom(true);
              setSplitType('custom');
              const amounts: { [uid: string]: string } = {};
              for (const [uid, amt] of Object.entries(expense.splitAmounts)) {
                amounts[uid] = amt.toString();
              }
              setCustomAmounts(amounts);
            }
            setEditLoading(false);
          });
        } else {
          setEditLoading(false);
        }
      } else if (expense.participants.length === 1 && expense.participants[0] === user?.uid) {
        // Personal expense
        selectPersonal();
        setEditLoading(false);
      } else {
        // Friend expense
        const friendId = expense.participants.find(id => id !== user?.uid);
        const friend = friends.find(f => f.uid === friendId);
        if (friend) {
          selectFriend(friend);

          if (expense.splitType === 'custom' && expense.splitAmounts) {
            setFriendOption('custom');
            setFriendPayerId(expense.payerId);
            setFriendCustomAmounts({
              you: (expense.splitAmounts[user?.uid || ''] || 0).toString(),
              friend: (expense.splitAmounts[friend.uid] || 0).toString(),
            });
          } else if (expense.payerId === user?.uid) {
            setFriendOption('you_paid_equal');
          } else {
            setFriendOption('friend_paid_equal');
          }
        }
        setEditLoading(false);
      }
    }).catch((err) => {
      setError(err.message || 'Failed to load expense');
      setEditLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [friends, groups]);

  const selectFriend = (f: User) => {
    setSelectedFriend(f);
    setSelectedGroup(null);
    setIsPersonal(false);
    setFriendOption('you_paid_equal');
    setFriendPayerId(user?.uid || '');
    setFriendCustomAmounts({ you: '', friend: '' });
  };

  const selectGroup = (g: Group) => {
    setSelectedGroup(g);
    setSelectedFriend(null);
    setIsPersonal(false);
  };

  const selectPersonal = () => {
    setIsPersonal(true);
    setSelectedFriend(null);
    setSelectedGroup(null);
  };

  const clearSelection = () => {
    setSelectedFriend(null);
    setSelectedGroup(null);
    setIsPersonal(false);
    setFriendOption('you_paid_equal');
    setFriendPayerId(user?.uid || '');
    setFriendCustomAmounts({ you: '', friend: '' });
    setParticipants([]);
    setPayerId(user?.uid || '');
    setCustomAmounts({});
    setShowCustom(false);
    setSplitType('equal');
    setCategory('Food');
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

  // Friend custom validation
  const friendCustomTotal = (parseFloat(friendCustomAmounts.you) || 0) + (parseFloat(friendCustomAmounts.friend) || 0);
  const friendCustomValid = friendOption !== 'custom' || Math.abs(friendCustomTotal - amountNum) < 0.01;

  const canSubmit =
    isValidAmount &&
    (selectedFriend || selectedGroup || isPersonal) &&
    (isPersonal
      ? true
      : selectedFriend
        ? (friendOption !== 'custom' || (friendCustomValid && friendPayerId))
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
      const createdBy = user.uid;

      if (editId) {
        // Edit mode — update existing expense in-place
        if (isPersonal) {
          const participantNames: { [uid: string]: string } = {
            [user.uid]: user.displayName || 'You',
          };
          await updateExpense(editId, user.uid, {
            amount: expenseAmount,
            category,
            description: description.trim() || undefined,
            payerId: user.uid,
            participants: [user.uid],
            splitType: 'equal',
            participantNames,
          });
        } else if (selectedFriend) {
          const friend = selectedFriend;
          const participantsList = [user.uid, friend.uid];
          let editPayerId: string;
          let editSplitType: 'equal' | 'custom' = 'equal';
          let editSplitAmounts: { [uid: string]: number } | undefined;

          switch (friendOption) {
            case 'you_paid_equal':
              editPayerId = user.uid;
              break;
            case 'you_owed_full':
              editPayerId = user.uid;
              editSplitType = 'custom';
              editSplitAmounts = { [user.uid]: 0, [friend.uid]: expenseAmount };
              break;
            case 'friend_paid_equal':
              editPayerId = friend.uid;
              break;
            case 'friend_owed_full':
              editPayerId = friend.uid;
              editSplitType = 'custom';
              editSplitAmounts = { [user.uid]: expenseAmount, [friend.uid]: 0 };
              break;
            case 'custom':
              editPayerId = friendPayerId;
              editSplitType = 'custom';
              editSplitAmounts = {
                [user.uid]: parseFloat(friendCustomAmounts.you) || 0,
                [friend.uid]: parseFloat(friendCustomAmounts.friend) || 0,
              };
              break;
            default:
              editPayerId = user.uid;
          }

          const participantNames: { [uid: string]: string } = {
            [user.uid]: user.displayName || 'You',
            [friend.uid]: friend.displayName || 'Unknown',
          };

          await updateExpense(editId, user.uid, {
            amount: expenseAmount,
            category,
            description: description.trim() || undefined,
            payerId: editPayerId,
            participants: participantsList,
            splitType: editSplitType,
            splitAmounts: editSplitAmounts,
            participantNames,
          });
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

          await updateExpense(editId, user.uid, {
            amount: expenseAmount,
            category,
            description: description.trim() || undefined,
            payerId,
            participants: participantIds,
            splitType: effectiveSplitType,
            splitAmounts,
            participantNames,
            groupId: selectedGroup.id,
          });
        }

        setSuccess('Expense updated!');
      } else {
        // Create mode — original logic
        if (isPersonal) {
          // Personal expense — no split
          const participantNames: { [uid: string]: string } = {
            [user.uid]: user.displayName || 'You',
          };
          await createExpense(
            expenseAmount,
            category,
            date,
            user.uid,
            [user.uid],
            'equal',
            createdBy,
            undefined,
            description.trim() || undefined,
            undefined,
            participantNames
          );
        } else if (selectedFriend) {
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
              payerId = user.uid;
              splitType = 'custom';
              splitAmounts = { [user.uid]: 0, [friend.uid]: expenseAmount };
              break;
            case 'friend_paid_equal':
              payerId = friend.uid;
              splitType = 'equal';
              break;
            case 'friend_owed_full':
              payerId = friend.uid;
              splitType = 'custom';
              splitAmounts = { [user.uid]: expenseAmount, [friend.uid]: 0 };
              break;
            case 'custom':
              payerId = friendPayerId;
              splitType = 'custom';
              splitAmounts = {
                [user.uid]: parseFloat(friendCustomAmounts.you) || 0,
                [friend.uid]: parseFloat(friendCustomAmounts.friend) || 0,
              };
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
      }

      setAmount('');
      setDescription('');
      setTimeout(() => router.push('/activity'), 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to save expense');
    } finally {
      setCreating(false);
    }
  };

  const handleScanReceipt = async (file: File) => {
    if (!user) return;
    setScanning(true);
    setError('');
    try {
      const result = await scanReceipt(user.uid, file);
      if (result.success) {
        if (result.merchant) setDescription(result.merchant);
        if (result.total) setAmount(result.total.toString());
        if (result.category) setCategory(result.category as ExpenseCategory);
        setSuccess('Receipt scanned! Review the details below.');
      } else {
        setError(result.message || 'Could not read receipt. Please try manual entry.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to scan receipt. Please try manual entry.');
    } finally {
      setScanning(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      {/* Scanning overlay */}
      {scanning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 animate-fade-in">
          <div className="bg-white rounded-3xl p-8 flex flex-col items-center gap-4 shadow-2xl animate-scale-in">
            <div className="w-14 h-14 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-gray-900 font-semibold text-lg">Scanning receipt...</p>
            <p className="text-gray-500 text-sm">AI is reading your receipt</p>
          </div>
        </div>
      )}

      {/* Modern gradient header */}
      <div className="sticky top-0 z-10 bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 px-4 py-4 flex items-center justify-between shadow-lg">
        <Link
          href={editId ? '/activity' : '/friends'}
          className="text-white/90 hover:text-white flex items-center gap-1 btn-bounce transition-all"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </Link>
        <h1 className="text-lg font-bold text-white tracking-wide">
          {editId ? '\u270F\uFE0F Edit Expense' : '\u2728 New Expense'}
        </h1>
        <div className="w-14" />
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-6 max-w-xl mx-auto">
        {/* Scan Receipt — glassmorphism card */}
        <button
          type="button"
          onClick={() => receiptInputRef.current?.click()}
          disabled={scanning}
          className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-700 font-semibold hover:from-indigo-100 hover:to-purple-100 transition-all btn-bounce disabled:opacity-50 card-lift"
        >
          <span className="text-2xl animate-emoji-pop">📸</span>
          Scan Receipt
        </button>
        <input
          type="file"
          ref={receiptInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              handleScanReceipt(file);
              e.target.value = '';
            }
          }}
        />
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm animate-slide-up flex items-center gap-2">
            <span>\u26A0\uFE0F</span> {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-green-700 text-sm animate-slide-up flex items-center gap-2">
            <span className="animate-emoji-pop">\u2705</span> {success}
          </div>
        )}

        {/* Step 1: Choose friend, group, or personal */}
        <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-stagger-in card-lift" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">1</span>
            Who is this expense for?
          </h2>
          {loading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
              Loading your people...
            </div>
          ) : (
            <div className="space-y-4">
              {/* Just Me (Personal) */}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Personal</p>
                <button
                  type="button"
                  onClick={selectPersonal}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all chip-animate ${isPersonal
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-200 animate-pulse-ring'
                    : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                >
                  🧑 Just Me
                </button>
              </div>

              {friends.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Friends</p>
                  <div className="flex flex-wrap gap-2">
                    {friends.map((f, i) => (
                      <button
                        key={f.uid}
                        type="button"
                        onClick={() => selectFriend(f)}
                        style={{ animationDelay: `${i * 0.05}s` }}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all chip-animate animate-stagger-in flex items-center gap-2 ${selectedFriend?.uid === f.uid
                          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-md shadow-green-200 animate-pulse-ring'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                      >
                        {f.photoURL ? (
                          <img src={f.photoURL} alt="" className="w-5 h-5 rounded-full object-cover" />
                        ) : (
                          <span className="w-5 h-5 rounded-full bg-gray-300 flex items-center justify-center text-[10px] text-gray-600 font-bold">
                            {f.displayName?.charAt(0).toUpperCase()}
                          </span>
                        )}
                        {f.displayName}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {groups.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-2 font-semibold">Groups</p>
                  <div className="flex flex-wrap gap-2">
                    {groups.map((g, i) => (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => selectGroup(g)}
                        style={{ animationDelay: `${i * 0.05}s` }}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all chip-animate animate-stagger-in flex items-center gap-2 ${selectedGroup?.id === g.id
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200 animate-pulse-ring'
                          : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
                          }`}
                      >
                        👥 {g.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!loading && friends.length === 0 && groups.length === 0 && !isPersonal && (
                <p className="text-gray-400 text-sm text-center py-2">Add friends or groups first, or tap &quot;Just Me&quot; for personal expenses.</p>
              )}
              {(selectedFriend || selectedGroup || isPersonal) && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1 btn-bounce"
                >
                  ✕ Clear selection
                </button>
              )}
            </div>
          )}
        </section>

        {!(selectedFriend || selectedGroup || isPersonal) ? null : (
          <>
            {/* Description */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-reveal" style={{ animationDelay: '0.1s' }}>
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</span>
                What's it for?
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Dinner at Pizza Hut"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all text-base bg-gray-50 hover:bg-white"
              />
            </section>

            {/* Category — emoji chip picker */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-reveal" style={{ animationDelay: '0.15s' }}>
              <label className="block text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">3</span>
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'Food', emoji: '\u{1F354}', color: 'from-orange-400 to-amber-400 shadow-orange-200' },
                  { value: 'Rental', emoji: '\u{1F3E0}', color: 'from-green-500 to-emerald-500 shadow-green-200' },
                  { value: 'Groceries', emoji: '\u{1F6D2}', color: 'from-lime-500 to-green-500 shadow-lime-200' },
                  { value: 'Entertainment', emoji: '\u{1F3AC}', color: 'from-sky-400 to-blue-400 shadow-sky-200' },
                  { value: 'Beverage', emoji: '\u2615', color: 'from-amber-500 to-yellow-500 shadow-amber-200' },
                  { value: 'Transportation', emoji: '\u{1F697}', color: 'from-violet-500 to-purple-500 shadow-violet-200' },
                  { value: 'Utilities', emoji: '\u{1F4A1}', color: 'from-yellow-400 to-orange-400 shadow-yellow-200' },
                  { value: 'Shopping', emoji: '\u{1F6CD}\uFE0F', color: 'from-pink-400 to-rose-400 shadow-pink-200' },
                  { value: 'Travel', emoji: '\u2708\uFE0F', color: 'from-cyan-500 to-teal-500 shadow-cyan-200' },
                  { value: 'Personal', emoji: '\u{1F9D1}', color: 'from-blue-300 to-indigo-300 shadow-blue-200' },
                  { value: 'Other', emoji: '\u{1F4E6}', color: 'from-gray-400 to-slate-400 shadow-gray-200' },
                ].map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value as ExpenseCategory)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all chip-animate flex items-center gap-1.5 ${category === cat.value
                      ? `bg-gradient-to-r ${cat.color} text-white shadow-md`
                      : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                  >
                    <span className="text-base">{cat.emoji}</span>
                    {cat.value}
                  </button>
                ))}
              </div>
            </section>

            {/* Amount — large prominent input */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-reveal" style={{ animationDelay: '0.2s' }}>
              <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">4</span>
                Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  placeholder="0.00"
                  className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-all text-2xl font-bold bg-gray-50 hover:bg-white"
                />
              </div>
            </section>

            {/* Friend: 4 options */}
            {selectedFriend && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-reveal" style={{ animationDelay: '0.25s' }}>
                <h2 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">5</span>
                  Who paid & how to split
                </h2>
                <div className="space-y-2">
                  {[
                    { key: 'you_paid_equal', label: 'You paid, split equally', emoji: '\u{1F91D}' },
                    { key: 'you_owed_full', label: 'You are owed the full amount', emoji: '\u{1F4B0}' },
                    { key: 'friend_paid_equal', label: `${selectedFriend.displayName} paid, split equally`, emoji: '\u{1F465}' },
                    { key: 'friend_owed_full', label: `${selectedFriend.displayName} is owed the full amount`, emoji: '\u{1F4B8}' },
                    { key: 'custom', label: 'Custom amount', emoji: '\u2702\uFE0F' },
                  ].map((opt) => (
                    <label
                      key={opt.key}
                      className={`flex items-center gap-3 p-3.5 rounded-xl cursor-pointer transition-all chip-animate ${friendOption === opt.key
                        ? 'bg-green-50 border-2 border-green-400 shadow-sm'
                        : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                        }`}
                    >
                      <input
                        type="radio"
                        name="friendOption"
                        checked={friendOption === opt.key}
                        onChange={() => {
                          setFriendOption(opt.key as any);
                          if (opt.key === 'custom') setFriendPayerId(user?.uid || '');
                        }}
                        className="text-green-600 w-4 h-4"
                      />
                      <span className="text-lg">{opt.emoji}</span>
                      <span className="text-gray-900 text-sm font-medium">{opt.label}</span>
                    </label>
                  ))}
                </div>

                {/* Custom amount UI for friend */}
                {friendOption === 'custom' && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Who paid?
                      </label>
                      <select
                        value={friendPayerId}
                        onChange={(e) => setFriendPayerId(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                      >
                        <option value={user?.uid || ''}>You</option>
                        <option value={selectedFriend.uid}>{selectedFriend.displayName}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How much does each person owe?
                      </label>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="w-32 text-sm text-gray-700">You:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={friendCustomAmounts.you}
                            onChange={(e) => setFriendCustomAmounts(prev => ({ ...prev, you: e.target.value }))}
                            placeholder="0.00"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="w-32 text-sm text-gray-700 truncate">{selectedFriend.displayName}:</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={friendCustomAmounts.friend}
                            onChange={(e) => setFriendCustomAmounts(prev => ({ ...prev, friend: e.target.value }))}
                            placeholder="0.00"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      {isValidAmount && !friendCustomValid && (
                        <p className="text-sm text-red-500 mt-2">
                          Amounts must add up to ${amountNum.toFixed(2)} (currently ${friendCustomTotal.toFixed(2)})
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Group: paid by, participants, equal/custom */}
            {selectedGroup && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 animate-reveal space-y-4" style={{ animationDelay: '0.25s' }}>
                <h2 className="text-sm font-bold text-gray-800 mb-1 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">5</span>
                  Group Split Details
                </h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    💳 Paid by
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 bg-gray-50 hover:bg-white transition-all"
                  >
                    {groupMembers.map((m) => (
                      <option key={m.uid} value={m.uid}>
                        {m.uid === user.uid ? 'You' : m.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    👥 Participants (who is involved, at least 2)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {groupMembers.map((m) => (
                      <button
                        key={m.uid}
                        type="button"
                        onClick={() => toggleParticipant(m.uid)}
                        className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all chip-animate ${participants.includes(m.uid)
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-200'
                          : 'bg-gray-50 border border-gray-200 text-gray-600 hover:bg-gray-100'
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
                      <div className="p-4 bg-white rounded-xl border-2 border-blue-200 shadow-sm">
                        <p className="text-sm font-medium text-gray-700 mb-1">Split equally</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ${amountPerPerson.toFixed(2)} <span className="text-sm font-normal text-gray-500">per person</span>
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
                          className="mt-3 px-4 py-2.5 rounded-xl bg-blue-50 border border-blue-200 text-sm font-semibold text-blue-700 hover:bg-blue-100 btn-bounce transition-all"
                        >
                          ✂️ Custom Split
                        </button>
                      </div>
                    ) : (
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3 animate-reveal">
                        <p className="text-sm font-semibold text-gray-700">✂️ Custom amounts</p>
                        {participantsList.map((m) => (
                          <div key={m.uid} className="flex items-center justify-between gap-2">
                            <span className="text-sm text-gray-700 font-medium">
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
                              className="w-28 px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 bg-white"
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
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1 btn-bounce"
                        >
                          ← Back to equal split
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            <div className="flex gap-3 pt-6 pb-2">
              <button
                type="button"
                onClick={() => router.push(editId ? '/activity' : '/friends')}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 btn-bounce transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!canSubmit || creating}
                className="flex-1 py-3 btn-shine text-white rounded-xl font-semibold shadow-lg shadow-green-200 disabled:bg-gray-300 disabled:text-gray-500 disabled:shadow-none btn-bounce transition-all text-base"
              >
                {creating
                  ? (editId ? '✨ Saving…' : '✨ Creating…')
                  : (editId ? '💾 Save Changes' : '🚀 Create Expense')}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}
