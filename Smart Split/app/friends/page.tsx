'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { addFriendByUniqueId, getUserFriends } from '@/src/utils/friends';
import { calculateUserBalances, getUserExpenses } from '@/src/utils/expenses';
import { getSettleUpData, shouldHideSettledUp } from '@/src/utils/settleUpStorage';
import { User } from '@/src/types';
import Link from 'next/link';

export default function Friends() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<User[]>([]);
  const [friendId, setFriendId] = useState('');
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [owedTo, setOwedTo] = useState<{ [userId: string]: number }>({});
  const [owedFrom, setOwedFrom] = useState<{ [userId: string]: number }>({});
  const [settleUpData, setSettleUpData] = useState<{ lastSettleUpAt: number; friendIds: string[]; groupIds: string[] } | null>(null);
  const [showSettledUp, setShowSettledUp] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadFriends();
    }
  }, [user, loading, router]);

  const loadFriends = async () => {
    if (!user) return;
    try {
      setLoadingFriends(true);
      const [userFriends, balances, expenses] = await Promise.all([
        getUserFriends(user.uid),
        calculateUserBalances(user.uid),
        getUserExpenses(user.uid),
      ]);
      setFriends(userFriends);
      setOwedTo(balances.owedTo);
      setOwedFrom(balances.owedFrom);
      setSettleUpData(getSettleUpData(user.uid));
    } catch (err: unknown) {
      const e = err as { message?: string };
      setError(e.message || 'Failed to load friends');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !friendId.trim()) return;

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      await addFriendByUniqueId(user.uid, friendId.trim().toUpperCase());
      setSuccess('Friend request sent successfully!');
      setFriendId('');
      setShowAddModal(false);
      await loadFriends();
    } catch (err: any) {
      setError(err.message || 'Failed to add friend');
    } finally {
      setAdding(false);
    }
  };

  const activeIds = new Set<string>();
  Object.entries(owedTo).forEach(([id, amt]) => {
    if (amt > 0) activeIds.add(id);
  });
  Object.entries(owedFrom).forEach(([id, amt]) => {
    if (amt > 0) activeIds.add(id);
  });
  const settledIds = new Set(settleUpData?.friendIds ?? []);
  const hideSettled = shouldHideSettledUp(settleUpData);
  // Active friends = those with balance > 0 (including previously settled-up friends who got new expenses)
  // Settled-up = in settle-up data but balance = 0. Only hide them after 7 days.
  const involved = friends.filter(
    (f) => activeIds.has(f.uid) || settledIds.has(f.uid)
  );
  const activeFriends = involved.filter((f) => activeIds.has(f.uid));
  const settledFriends = involved.filter(
    (f) => settledIds.has(f.uid) && !activeIds.has(f.uid)
  );

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between relative">
            {/* Spacer for layout balance */}
            <div className="w-10" aria-hidden="true" />
            
            {/* Center: Smart Split Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-xl font-semibold text-gray-800">Smart Split</h1>
            </div>
            
            {/* Right: Add Friend Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95"
                title="Add Friend"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Friends List — only expense-involved */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Friends
            </h2>
          </div>

          {loadingFriends ? (
            <div className="p-8 text-center text-gray-500">Loading friends...</div>
          ) : (
            <>
              {activeFriends.length === 0 && settledFriends.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No friends with expenses yet. Add friends and add expenses to see them here.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {activeFriends.map((friend) => {
                    const owedToAmount = owedTo[friend.uid] || 0;
                    const owedFromAmount = owedFrom[friend.uid] || 0;
                    const netBalance = owedFromAmount - owedToAmount;
                    return (
                      <div key={friend.uid} className="p-6 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {friend.photoURL ? (
                            <img
                              src={friend.photoURL}
                              alt={friend.displayName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                              <span className="text-lg text-gray-400">
                                {friend.displayName.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-800">{friend.displayName}</p>
                            <p className="text-sm text-gray-500">ID: {friend.uniqueId}</p>
                            {netBalance > 0 && (
                              <p className="text-sm text-green-600 font-medium mt-1">
                                You&apos;re owed ${netBalance.toFixed(2)}
                              </p>
                            )}
                            {netBalance < 0 && (
                              <p className="text-sm text-red-600 font-medium mt-1">
                                You owe ${Math.abs(netBalance).toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {hideSettled && settledFriends.length > 0 && !showSettledUp && (
                    <button
                      type="button"
                      onClick={() => setShowSettledUp(true)}
                      className="w-full p-4 text-left text-sm text-green-600 hover:bg-gray-50 font-medium"
                    >
                      Show {settledFriends.length} settled-up friend{settledFriends.length !== 1 ? 's' : ''}
                    </button>
                  )}
                  {hideSettled && settledFriends.length > 0 && showSettledUp && (
                    <>
                      <button
                        type="button"
                        onClick={() => setShowSettledUp(false)}
                        className="w-full p-4 text-left text-sm text-green-600 hover:bg-gray-50 font-medium border-t border-gray-200"
                      >
                        Hide {settledFriends.length} settled-up friend{settledFriends.length !== 1 ? 's' : ''}
                      </button>
                      {settledFriends.map((friend) => (
                        <div key={friend.uid} className="p-6 flex items-center justify-between bg-gray-50/50">
                          <div className="flex items-center gap-4">
                            {friend.photoURL ? (
                              <img
                                src={friend.photoURL}
                                alt={friend.displayName}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-lg text-gray-400">
                                  {friend.displayName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">{friend.displayName}</p>
                              <p className="text-sm text-gray-500">ID: {friend.uniqueId} · Settled up</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                  {!hideSettled && settledFriends.map((friend) => (
                    <div key={friend.uid} className="p-6 flex items-center justify-between bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-lg text-gray-400">
                              {friend.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{friend.displayName}</p>
                          <p className="text-sm text-gray-500">ID: {friend.uniqueId} · Settled up</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Add Friend Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Friend by ID</h2>
            
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                {success}
              </div>
            )}

            <form onSubmit={handleAddFriend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Friend&apos;s Unique ID
                </label>
                <input
                  type="text"
                  value={friendId}
                  onChange={(e) => setFriendId(e.target.value.toUpperCase())}
                  placeholder="Enter friend's unique ID (e.g., ABC12345)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  maxLength={8}
                  required
                />
              </div>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setError('');
                    setSuccess('');
                    setFriendId('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adding || !friendId.trim()}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-95 transition-transform"
                >
                  {adding ? 'Adding...' : 'Add Friend'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}