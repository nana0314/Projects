'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import {
  createGroup,
  getUserGroups,
  joinGroup,
  leaveGroup,
} from '@/src/utils/groups';
import { calculateGroupBalances } from '@/src/utils/expenses';
import { getSettleUpData, shouldHideSettledUp } from '@/src/utils/settleUpStorage';
import { Group } from '@/src/types';
import Link from 'next/link';
import { PageSkeleton, GroupsListSkeleton } from '@/src/components/SkeletonLoader';

export default function Groups() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [groupId, setGroupId] = useState('');
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [groupNetBalances, setGroupNetBalances] = useState<{ [gid: string]: number }>({});
  const [settleUpData, setSettleUpData] = useState<{ lastSettleUpAt: number; friendIds: string[]; groupIds: string[] } | null>(null);
  const [showSettledUp, setShowSettledUp] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!loading && !user) {
      try {
        router.push('/');
      } catch (err) {
        console.error('Router error:', err);
        window.location.href = '/';
      }
      return;
    }
    if (user) {
      loadGroups();
    }
  }, [user, loading, router]);

  const loadGroups = async () => {
    if (!user) return;
    try {
      setLoadingGroups(true);
      setError('');
      const userGroups = await getUserGroups(user.uid);
      setGroups(userGroups || []);
      setSettleUpData(getSettleUpData(user.uid));
      const nets: { [gid: string]: number } = {};
      for (const g of userGroups || []) {
        try {
          const b = await calculateGroupBalances(g.id, user.uid);
          const to = Object.values(b.owedTo).reduce((s, a) => s + a, 0);
          const from = Object.values(b.owedFrom).reduce((s, a) => s + a, 0);
          nets[g.id] = from - to;
        } catch {
          nets[g.id] = 0;
        }
      }
      setGroupNetBalances(nets);
    } catch (err: unknown) {
      const e = err as { message?: string };
      console.error('Error loading groups:', e);
      setError(e.message || 'Failed to load groups');
      setGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupName.trim()) return;

    setCreating(true);
    setError('');
    setSuccess('');

    try {
      await createGroup(groupName.trim(), user.uid, groupDescription.trim() || undefined);
      setSuccess('Group created successfully!');
      setGroupName('');
      setGroupDescription('');
      setShowCreateModal(false);
      await loadGroups();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleJoinGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !groupId.trim()) return;

    setJoining(true);
    setError('');
    setSuccess('');

    try {
      await joinGroup(groupId.trim(), user.uid);
      setSuccess('Joined group successfully!');
      setGroupId('');
      setShowJoinModal(false);
      await loadGroups();
    } catch (err: any) {
      // Check if error is about group not found or permission denied (which usually means not found)
      if (err.message && (err.message.includes('not found') || err.message.includes('permission') || err.message.includes('Missing or insufficient'))) {
        setError('Group with this ID not found');
      } else {
        setError(err.message || 'Failed to join group');
      }
    } finally {
      setJoining(false);
    }
  };

  const settledGroupIds = new Set(settleUpData?.groupIds ?? []);
  const hideSettled = shouldHideSettledUp(settleUpData);
  // Active groups = those with balance > 0 OR newly created (not in settled-up list)
  // Settled-up = in settle-up data but balance = 0. Only hide them after 7 days.
  const activeGroups = groups.filter((g) => {
    const net = groupNetBalances[g.id] ?? 0;
    // Show if has expenses OR is not in settled-up list (newly created)
    return Math.abs(net) > 0.01 || !settledGroupIds.has(g.id);
  });
  const settledGroups = groups.filter(
    (g) => settledGroupIds.has(g.id) && Math.abs(groupNetBalances[g.id] ?? 0) <= 0.01
  );

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    const group = groups.find((g) => g.id === groupId);
    const isCreator = group?.createdBy === user.uid;
    const confirmMessage = isCreator
      ? 'Are you sure you want to delete this group? This will remove the group and all its expenses. This action cannot be undone.'
      : 'Are you sure you want to leave this group?';

    if (!confirm(confirmMessage)) return;

    try {
      await leaveGroup(groupId, user.uid);
      setSuccess(isCreator ? 'Group deleted successfully!' : 'Left group successfully!');
      await loadGroups();
    } catch (err: any) {
      setError(err.message || 'Failed to leave group');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Please sign in to view groups</div>
      </div>
    );
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
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-xl font-semibold text-gray-800">Groups</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setError('');
                  setSuccess('');
                  setShowJoinModal(true);
                }}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-95 transition-transform"
                title="Join Group"
              >
                Join
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all active:scale-95"
                title="Create Group"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Your Groups</h2>
          </div>

          {loadingGroups ? (
            <GroupsListSkeleton />
          ) : activeGroups.length === 0 && settledGroups.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No groups with expenses yet. Use Join or + above to create or join a group and add expenses.
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {activeGroups.map((group) => {
                const net = groupNetBalances[group.id] ?? 0;
                return (
                  <Link
                    key={group.id}
                    href={`/groups/details?id=${group.id}`}
                    className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      {group.photoURL ? (
                        <img
                          src={group.photoURL}
                          alt={group.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-purple-600">
                            {group.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800">
                          {group.name}
                        </h2>
                        {group.description && (
                          <p className="text-sm text-gray-500 truncate max-w-xs">{group.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {group.members.length} member{group.members.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        {net > 0 && (
                          <span className="text-sm text-green-600 font-medium block">
                            You're owed ${net.toFixed(2)}
                          </span>
                        )}
                        {net < 0 && (
                          <span className="text-sm text-red-600 font-medium block">
                            You owe ${Math.abs(net).toFixed(2)}
                          </span>
                        )}
                        {Math.abs(net) < 0.01 && (
                          <span className="text-sm text-gray-400 block">
                            Settled up
                          </span>
                        )}
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                        title={group.createdBy === user?.uid ? 'Delete Group' : 'Leave Group'}
                      >
                        {group.createdBy === user?.uid ? 'Delete' : 'Leave'}
                      </button>
                    </div>
                  </Link>
                );
              })}

              {hideSettled && settledGroups.length > 0 && !showSettledUp && (
                <button
                  type="button"
                  onClick={() => setShowSettledUp(true)}
                  className="w-full p-4 text-left text-sm text-green-600 hover:bg-gray-50 font-medium"
                >
                  Show {settledGroups.length} settled-up group{settledGroups.length !== 1 ? 's' : ''}
                </button>
              )}

              {hideSettled && settledGroups.length > 0 && showSettledUp && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowSettledUp(false)}
                    className="w-full p-4 text-left text-sm text-green-600 hover:bg-gray-50 font-medium border-t border-gray-200"
                  >
                    Hide {settledGroups.length} settled-up group{settledGroups.length !== 1 ? 's' : ''}
                  </button>
                  {settledGroups.map((group) => (
                    <Link
                      key={group.id}
                      href={`/groups/details?id=${group.id}`}
                      className="p-6 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-4">
                        {group.photoURL ? (
                          <img
                            src={group.photoURL}
                            alt={group.name}
                            className="w-12 h-12 rounded-lg object-cover grayscale opacity-75"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-400">
                              {group.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <h2 className="text-lg font-semibold text-gray-600">
                            {group.name}
                          </h2>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {group.members.length} member{group.members.length !== 1 ? 's' : ''} · Settled up
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleLeaveGroup(group.id);
                        }}
                        className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                        title={group.createdBy === user?.uid ? 'Delete Group' : 'Leave Group'}
                      >
                        {group.createdBy === user?.uid ? 'Delete' : 'Leave'}
                      </button>
                    </Link>
                  ))}
                </>
              )}

              {!hideSettled && settledGroups.map((group) => (
                <Link
                  key={group.id}
                  href={`/groups/details?id=${group.id}`}
                  className="p-6 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    {group.photoURL ? (
                      <img
                        src={group.photoURL}
                        alt={group.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                        <span className="text-xl font-bold text-gray-400">
                          {group.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h2 className="text-lg font-semibold text-gray-600">
                        {group.name}
                      </h2>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {group.members.length} member{group.members.length !== 1 ? 's' : ''} · Settled up
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleLeaveGroup(group.id);
                    }}
                    className="text-sm text-red-600 hover:text-red-700 px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    title={group.createdBy === user?.uid ? 'Delete Group' : 'Leave Group'}
                  >
                    {group.createdBy === user?.uid ? 'Delete' : 'Leave'}
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Create Group Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Create New Group</h2>
              <form onSubmit={handleCreateGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group Name *
                  </label>
                  <input
                    type="text"
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !groupName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 active:scale-95 transition-transform"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Join Group Modal */}
        {showJoinModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Join Group</h2>

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

              <form onSubmit={handleJoinGroup} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Group ID *
                  </label>
                  <input
                    type="text"
                    value={groupId}
                    onChange={(e) => setGroupId(e.target.value)}
                    placeholder="Enter group ID"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                    required
                  />
                </div>
                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false);
                      setError('');
                      setSuccess('');
                      setGroupId('');
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 active:scale-95 transition-transform"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={joining || !groupId.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 active:scale-95 transition-transform"
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}