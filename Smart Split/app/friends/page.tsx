'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { addFriendByUniqueId, getUserFriends, getPendingFriendRequests, acceptFriendRequest, declineFriendRequest } from '@/src/utils/friends';
import { calculateUserBalances, getUserExpenses } from '@/src/utils/expenses';
import { getSettleUpData, shouldHideSettledUp } from '@/src/utils/settleUpStorage';
import { getBlockedUsers } from '@/src/utils/moderation';
import { User } from '@/src/types';
import Link from 'next/link';
import QRCodeModal from '@/src/components/QRCodeModal';
import BlockReportMenu from '@/src/components/BlockReportMenu';
import { PageSkeleton, FriendsListSkeleton } from '@/src/components/SkeletonLoader';

export default function Friends() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<any[]>([]);
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
  const [showQRModal, setShowQRModal] = useState(false);
  const [blockedIds, setBlockedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadFriends();

      // Check for invite_id in URL
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        const inviteId = params.get('invite_id');
        if (inviteId) {
          setFriendId(inviteId);
          setShowAddModal(true);
          // Clean up URL
          window.history.replaceState({}, '', '/friends');
        }
      }
    }
  }, [user, loading, router]);

  const loadFriends = async () => {
    if (!user) return;
    try {
      setLoadingFriends(true);
      const [userFriends, balances, expenses, requests, blocked] = await Promise.all([
        getUserFriends(user.uid),
        calculateUserBalances(user.uid),
        getUserExpenses(user.uid),
        getPendingFriendRequests(user.uid),
        getBlockedUsers(user.uid),
      ]);
      setFriends(userFriends);
      setFriendRequests(requests);
      setOwedTo(balances.owedTo);
      setOwedFrom(balances.owedFrom);
      setSettleUpData(getSettleUpData(user.uid));
      setBlockedIds(new Set(blocked));
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

  const handleAcceptRequest = async (requestId: string, senderId: string) => {
    if (!user) return;
    try {
      await acceptFriendRequest(user.uid, senderId);
      await loadFriends();
    } catch (err: any) {
      setError(err.message || 'Failed to accept friend request');
    }
  };

  const handleDeclineRequest = async (requestId: string, senderId: string) => {
    if (!user) return;
    try {
      await declineFriendRequest(user.uid, senderId);
      await loadFriends();
    } catch (err: any) {
      setError(err.message || 'Failed to decline friend request');
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
  // Filter out blocked users from friends
  const visibleFriends = friends.filter(f => !blockedIds.has(f.uid));

  const activeFriends = visibleFriends.filter((f) => activeIds.has(f.uid));
  const settledFriends = visibleFriends.filter(
    (f) => settledIds.has(f.uid) && !activeIds.has(f.uid)
  );
  // Show remaining friends (no balance, not in settle-up data) with "settled up" label
  const otherFriends = visibleFriends.filter(
    (f) => !activeIds.has(f.uid) && !settledIds.has(f.uid)
  );

  if (loading || !user) {
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between relative">
            {/* Left: Profile Picture */}
            <Link
              href="/profile"
              className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
              title="Profile"
            >
              {userData?.photoURL ? (
                <img
                  src={userData.photoURL}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg
                  className="w-6 h-6 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              )}
            </Link>

            {/* Center: Smart Split Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-xl font-semibold text-gray-800">Smart Split</h1>
            </div>

            {/* Right: Add Friend Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQRModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-white text-gray-600 border border-gray-200 rounded-full hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
                title="Show QR Code"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4h-4v-2h4v-4h6v4zM5 8h4V4H5v4zm0 12h4v-4H5v4zm10-8h4V8h-4v4z" />
                  <rect x="5" y="5" width="2" height="2" fill="currentColor" stroke="none" />
                  <rect x="15" y="15" width="2" height="2" fill="currentColor" stroke="none" />
                  <rect x="5" y="15" width="2" height="2" fill="currentColor" stroke="none" />
                  <rect x="15" y="5" width="2" height="2" fill="currentColor" stroke="none" />
                </svg>
              </button>
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

      {/* QR Code Modal */}
      {showQRModal && userData && (
        <QRCodeModal
          uniqueId={userData.uniqueId}
          displayName={userData.displayName}
          onClose={() => setShowQRModal(false)}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Friend Requests Section */}
        {friendRequests.length > 0 && (
          <div className="bg-white rounded-lg shadow mb-6">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                Friend Requests
              </h2>
            </div>
            <div className="divide-y divide-gray-200">
              {friendRequests.map((request) => (
                <div key={request.id} className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {request.senderInfo?.photoURL ? (
                      <img
                        src={request.senderInfo.photoURL}
                        alt={request.senderInfo.displayName}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-lg text-gray-400">
                          {request.senderInfo?.displayName?.charAt(0).toUpperCase() || '?'}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-800">
                        {request.senderInfo?.displayName || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        ID: {request.senderInfo?.uniqueId || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id, request.senderId)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:scale-95 transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id, request.senderId)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 active:scale-95 transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Friends List — only expense-involved */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">
              Your Friends
            </h2>
          </div>

          {loadingFriends ? (
            <FriendsListSkeleton />
          ) : (
            <>
              {visibleFriends.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No friends yet. Add friends to see them here.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {activeFriends.map((friend) => {
                    const owedToAmount = owedTo[friend.uid] || 0;
                    const owedFromAmount = owedFrom[friend.uid] || 0;
                    const netBalance = owedFromAmount - owedToAmount;
                    return (
                      <Link key={friend.uid} href={`/friends/details?id=${friend.uid}`} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {netBalance > 0 && (
                            <span className="text-sm text-green-600 font-medium">
                              You&apos;re owed ${netBalance.toFixed(2)}
                            </span>
                          )}
                          {netBalance < 0 && (
                            <span className="text-sm text-red-600 font-medium">
                              You owe ${Math.abs(netBalance).toFixed(2)}
                            </span>
                          )}
                          {netBalance === 0 && (
                            <span className="text-sm text-gray-400">settled up</span>
                          )}
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </Link>
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
                        <Link key={friend.uid} href={`/friends/details?id=${friend.uid}`} className="p-6 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer">
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
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">settled up</span>
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
                        </Link>
                      ))}
                    </>
                  )}
                  {!hideSettled && settledFriends.map((friend) => (
                    <Link key={friend.uid} href={`/friends/details?id=${friend.uid}`} className="p-6 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer">
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">settled up</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  ))}
                  {/* Other friends (no balance, no settle-up data) */}
                  {otherFriends.map((friend) => (
                    <Link key={friend.uid} href={`/friends/details?id=${friend.uid}`} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer">
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
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">settled up</span>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
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