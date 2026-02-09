'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import {
  getGroupById,
  getGroupMembers,
  uploadGroupPicture,
  updateGroup,
  leaveGroup,
  inviteUserToGroup,
  removeMemberFromGroup,
} from '@/src/utils/groups';
import { getUserFriends } from '@/src/utils/friends';
import {
  getGroupExpenses,
  createExpense,
  calculateGroupBalances,
  deleteExpense,
} from '@/src/utils/expenses';
import { Group, User, Expense, ExpenseCategory } from '@/src/types';
import { format } from 'date-fns';
import CategoryBadge from '@/src/components/CategoryBadge';
import { PeriodSpending, CategoryBreakdown, TrendComparison } from '@/src/types/analytics';
import {
  calculateGroupSpendingTrend,
  calculateGroupCategoryBreakdown,
  calculateGroupTrendComparison
} from '@/src/utils/analytics';
import SpendingTrendChart from '@/src/components/dashboard/SpendingTrendChart';
import CategoryPieChart from '@/src/components/dashboard/CategoryPieChart';

export default function GroupDetails() {
  const { user, userData, loading: authLoading } = useAuth();
  const router = useRouter();
  const [groupId, setGroupId] = useState<string | null>(null);

  // Get groupId from URL query parameter
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const id = params.get('id');
      if (id) {
        setGroupId(id);
      } else {
        setError('Group ID is missing from URL');
        setLoading(false);
      }
    }
  }, []);

  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<User[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [success, setSuccess] = useState('');

  // Analytics states
  const [trendData, setTrendData] = useState<PeriodSpending[]>([]);
  const [comparison, setComparison] = useState<TrendComparison | null>(null);
  const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);

  // Balance states
  const [owedTo, setOwedTo] = useState<{ [userId: string]: number }>({});
  const [owedFrom, setOwedFrom] = useState<{ [userId: string]: number }>({});

  // Expense modal state
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Food');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [payerId, setPayerId] = useState('');
  const [participants, setParticipants] = useState<string[]>([]);
  const [splitType, setSplitType] = useState<'equal' | 'custom'>('equal');
  const [customAmounts, setCustomAmounts] = useState<{ [key: string]: string }>({});
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  // Invite modal state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [friends, setFriends] = useState<User[]>([]);
  const [selectedFriendsToInvite, setSelectedFriendsToInvite] = useState<Set<string>>(new Set());
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
      return;
    }
    if (user && groupId) {
      loadGroupData();
    } else if (user && !groupId && !loading) {
      // Only show error if we're not still loading the groupId from URL
      const params = new URLSearchParams(window.location.search);
      if (!params.get('id')) {
        setError('Group ID is required');
        setLoading(false);
      }
    }
  }, [user, authLoading, groupId, router]);

  useEffect(() => {
    if (user && members.length > 0) {
      setPayerId(user.uid);
      loadBalances();
    }
  }, [user, members, expenses]);

  const loadGroupData = async () => {
    if (!user || !groupId) {
      if (!groupId) {
        setError('Group ID is required');
        setLoading(false);
      }
      return;
    }
    try {
      setLoading(true);
      setError('');

      const groupData = await getGroupById(groupId);

      if (!groupData) {
        setError(`Group not found. ID: ${groupId}`);
        setLoading(false);
        return;
      }

      if (!groupData.members || !groupData.members.some(m => m.userId === user.uid)) {
        setError('You are not a member of this group');
        setLoading(false);
        router.push('/friends');
        return;
      }

      const [groupMembers, groupExpenses] = await Promise.all([
        getGroupMembers(groupId),
        getGroupExpenses(groupId),
      ]);

      setGroup(groupData);
      setMembers(groupMembers);
      setExpenses(groupExpenses);

      // Calculate analytics
      const trend = calculateGroupSpendingTrend(groupExpenses);
      const comp = calculateGroupTrendComparison(groupExpenses);
      const categories = calculateGroupCategoryBreakdown(groupExpenses);

      setTrendData(trend);
      setComparison(comp);
      setCategoryData(categories);
    } catch (err: any) {
      console.error('Error loading group data:', err);
      setError(err.message || 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  const loadBalances = async () => {
    if (!user || !groupId) return;
    try {
      const balances = await calculateGroupBalances(groupId, user.uid);
      setOwedTo(balances.owedTo);
      setOwedFrom(balances.owedFrom);
    } catch (err: any) {
      console.error('Failed to load balances:', err);
    }
  };

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
    if (participants.includes(userId)) {
      setCustomAmounts((prev) => {
        const newAmounts = { ...prev };
        delete newAmounts[userId];
        return newAmounts;
      });
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !payerId || participants.length === 0) return;

    const expenseAmount = parseFloat(amount);
    if (isNaN(expenseAmount) || expenseAmount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setCreating(true);
    setError('');

    try {
      let splitAmounts: { [userId: string]: number } | undefined;

      if (splitType === 'custom') {
        splitAmounts = {};
        let total = 0;
        for (const participantId of participants) {
          const customAmount = parseFloat(customAmounts[participantId] || '0');
          if (customAmount > 0) {
            splitAmounts[participantId] = customAmount;
            total += customAmount;
          }
        }
        if (Math.abs(total - expenseAmount) > 0.01) {
          setError('Custom split amounts must equal the total expense amount');
          setCreating(false);
          return;
        }
      }

      await createExpense(
        expenseAmount,
        category,
        new Date(date),
        payerId,
        participants,
        splitType,
        user.uid,
        groupId!,
        description.trim() || undefined,
        splitAmounts
      );

      setSuccess('Expense created successfully!');
      resetExpenseForm();
      setShowExpenseModal(false);
      await loadGroupData();
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setCreating(false);
    }
  };

  const resetExpenseForm = () => {
    setAmount('');
    setCategory('Food');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPayerId(user?.uid || '');
    setParticipants([]);
    setSplitType('equal');
    setCustomAmounts({});
    setDescription('');
  };

  const getTotalSpending = (): number => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  };

  const getUserName = (userId: string, expense?: Expense): string => {
    // If expense provided, try to use participantNames first
    if (expense && expense.participantNames && expense.participantNames[userId]) {
      return userId === user?.uid ? 'You' : expense.participantNames[userId];
    }
    // Fallback to members list
    if (userId === user?.uid) return 'You';
    const member = members.find((m) => m.uid === userId);
    return member?.displayName || 'Unknown';
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!user) return;

    if (!confirm('Are you sure you want to delete this expense? This action cannot be undone.')) {
      return;
    }

    setDeleting(expenseId);
    setError('');
    setSuccess('');

    try {
      await deleteExpense(expenseId, user.uid);
      setSuccess('Expense deleted successfully!');
      await loadGroupData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setDeleting(null);
    }
  };

  const handleLeaveGroup = async () => {
    if (!user || !groupId) return;

    const isCreator = group?.createdBy === user.uid;
    const confirmMessage = isCreator
      ? 'Are you sure you want to leave this group? As the creator, this will delete the group and all its expenses. This action cannot be undone.'
      : 'Are you sure you want to leave this group?';

    if (!confirm(confirmMessage)) {
      return;
    }

    setLeaving(true);
    setError('');
    setSuccess('');

    try {
      await leaveGroup(groupId, user.uid);
      setSuccess('Left group successfully!');
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/friends');
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to leave group');
      setLeaving(false);
    }
  };

  const loadFriendsForInvite = async () => {
    if (!user) return;
    setLoadingFriends(true);
    try {
      const userFriends = await getUserFriends(user.uid);
      // Filter out friends who are already members
      const memberIds = members.map(m => m.uid);
      const availableFriends = userFriends.filter(f => !memberIds.includes(f.uid));
      setFriends(availableFriends);
    } catch (err: any) {
      setError(err.message || 'Failed to load friends');
    } finally {
      setLoadingFriends(false);
    }
  };

  const handleRemoveMember = async (memberUid: string) => {
    if (!user || !groupId) return;

    if (!confirm('Are you sure you want to remove this member from the group?')) {
      return;
    }

    setRemovingMember(memberUid);
    setError('');
    setSuccess('');

    try {
      await removeMemberFromGroup(groupId, memberUid, user.uid);
      setSuccess('Member removed successfully!');
      await loadGroupData();
    } catch (err: any) {
      setError(err.message || 'Failed to remove member');
    } finally {
      setRemovingMember(null);
    }
  };

  const toggleFriendSelection = (friendUid: string) => {
    setSelectedFriendsToInvite(prev => {
      const newSet = new Set(prev);
      if (newSet.has(friendUid)) {
        newSet.delete(friendUid);
      } else {
        newSet.add(friendUid);
      }
      return newSet;
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !groupId || !e.target.files?.[0]) return;

    // Only creator can upload
    if (group?.createdBy !== user.uid) {
      setError('Only the group creator can update the picture');
      return;
    }

    const file = e.target.files[0];

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      // 1. Upload picture
      const photoURL = await uploadGroupPicture(groupId, file);

      // 2. Update group in Firestore
      await updateGroup(groupId, { photoURL });

      setSuccess('Group picture updated successfully!');

      // 3. Refresh group data
      await loadGroupData();
    } catch (err: any) {
      console.error('Error uploading group Picture:', err);
      setError(err.message || 'Failed to upload group picture');
    } finally {
      setUploading(false);
      // Reset input
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const handleInviteMembers = async () => {
    if (!user || !groupId || selectedFriendsToInvite.size === 0) return;

    setInviting(true);
    setError('');
    setSuccess('');

    try {
      const invitePromises = Array.from(selectedFriendsToInvite).map(friendUid => {
        const friend = friends.find(f => f.uid === friendUid);
        if (friend) {
          return inviteUserToGroup(groupId, user.uid, friend.uniqueId);
        }
        return Promise.resolve();
      });
      await Promise.all(invitePromises);
      setSuccess(`${selectedFriendsToInvite.size} member(s) invited successfully!`);
      setSelectedFriendsToInvite(new Set());
      setShowInviteModal(false);
      await loadGroupData();
    } catch (err: any) {
      setError(err.message || 'Failed to invite members');
    } finally {
      setInviting(false);
    }
  };


  if (authLoading || loading || !user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-xl text-red-600 mb-4">
              {error || 'Group not found'}
            </div>
            {groupId && (
              <p className="text-sm text-gray-500 mb-4">Group ID: {groupId}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-0">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-end">
          <button
            onClick={handleLeaveGroup}
            disabled={leaving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {leaving ? 'Leaving...' : group?.createdBy === user?.uid ? 'Delete Group' : 'Leave Group'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Group Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="relative group/image">
                <button
                  type="button"
                  onClick={() => group.createdBy === user?.uid && fileRef.current?.click()}
                  className={`relative ${group.createdBy === user?.uid ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
                  disabled={uploading || group.createdBy !== user?.uid}
                  title={group.createdBy === user?.uid ? "Change group picture" : ""}
                >
                  {group.photoURL ? (
                    <img
                      src={group.photoURL}
                      alt={group.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-purple-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-purple-600">
                        {group.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  {/* Overlay for creator */}
                  {group.createdBy === user?.uid && (
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover/image:bg-opacity-30 flex items-center justify-center rounded-lg transition-all duration-200">
                      <div className="opacity-0 group-hover/image:opacity-100 bg-white/20 p-1 rounded-full backdrop-blur-sm">
                        <svg className="w-5 h-5 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                    </div>
                  )}

                  {uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{group.name}</h1>
                {group.description && (
                  <p className="text-gray-600 mt-1">{group.description}</p>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  Group ID: {group.id}
                </p>
              </div>
            </div>
            <button
              onClick={() => router.push(`/add-expense?groupId=${groupId}`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Total Spending:</span> ${getTotalSpending().toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              <span className="font-semibold">Members:</span> {members.length}
            </p>
          </div>
        </div>

        {/* Analytics Section */}
        {expenses.length > 0 && (
          <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            {comparison && (
              <SpendingTrendChart trendData={trendData} comparison={comparison} compact={false} />
            )}
            <CategoryPieChart data={categoryData} />
          </div>
        )}

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Members and Balances */}
          <div className="lg:col-span-1 space-y-6">
            {/* Members */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Members</h2>
              <div className="space-y-3">
                {members.map((member) => (
                  <div key={member.uid} className="flex items-center gap-3">
                    {member.photoURL ? (
                      <img
                        src={member.photoURL}
                        alt={member.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-sm text-gray-400">
                          {member.displayName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">{member.displayName}</p>
                      <p className="text-xs text-gray-500">ID: {member.uniqueId}</p>
                    </div>
                    {/* Remove button - only visible to creator, not for themselves */}
                    {group?.createdBy === user?.uid && member.uid !== user?.uid && (
                      <button
                        onClick={() => handleRemoveMember(member.uid)}
                        disabled={removingMember === member.uid}
                        className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Remove member"
                      >
                        {removingMember === member.uid ? '...' : 'Remove'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {/* Invite button - only visible to group creator */}
              {group?.createdBy === user?.uid && (
                <button
                  onClick={() => {
                    loadFriendsForInvite();
                    setSelectedFriendsToInvite(new Set());
                    setShowInviteModal(true);
                  }}
                  className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium active:scale-95 transition-transform"
                >
                  Invite Member
                </button>
              )}
            </div>

            {/* Your Balances in Group */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Balances</h2>
              {(() => {
                // Calculate net balances per member
                const allMembers = new Set([...Object.keys(owedTo), ...Object.keys(owedFrom)]);
                const netBalances: { userId: string; net: number }[] = [];

                allMembers.forEach(userId => {
                  const youOwe = owedTo[userId] || 0;
                  const theyOwe = owedFrom[userId] || 0;
                  const net = theyOwe - youOwe; // positive = they owe you, negative = you owe them
                  netBalances.push({ userId, net });
                });

                if (netBalances.length === 0) {
                  return <p className="text-sm text-gray-400">No balances in this group</p>;
                }

                return (
                  <div className="space-y-2">
                    {netBalances.map(({ userId, net }) => (
                      <div key={userId} className="flex justify-between items-center text-sm">
                        <span className="text-gray-600">{getUserName(userId)}</span>
                        {net > 0 ? (
                          <span className="text-green-600 font-semibold">You're owed ${net.toFixed(2)}</span>
                        ) : net < 0 ? (
                          <span className="text-red-600 font-semibold">You owe ${Math.abs(net).toFixed(2)}</span>
                        ) : (
                          <span className="text-gray-400">settled up</span>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Right Column - Expenses */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">Expense History</h2>
            </div>
            {expenses.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <p>No expenses yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {expenses.map((expense) => {
                  const payerName = getUserName(expense.payerId, expense);
                  const payerMember = members.find(m => m.uid === expense.payerId);
                  const payerPhoto = payerMember?.photoURL || null;
                  const participantAvatars = expense.participants.map(id => {
                    const member = members.find(m => m.uid === id);
                    return {
                      uid: id,
                      photo: member?.photoURL || null,
                      name: getUserName(id, expense)
                    };
                  });
                  const maxAvatars = 5;
                  const extraCount = participantAvatars.length - maxAvatars;

                  return (
                    <div key={expense.id} className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Payer avatar */}
                        {payerPhoto ? (
                          <img
                            src={payerPhoto}
                            alt={payerName}
                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm text-gray-500 font-medium">
                              {payerName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}

                        {/* Main content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {payerName} paid
                              </p>
                              <div className="mt-1">
                                <CategoryBadge category={expense.category} />
                              </div>
                              {expense.description && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {expense.description}
                                </p>
                              )}
                            </div>
                            <span className="text-lg font-bold text-gray-900 flex-shrink-0">
                              ${expense.amount.toFixed(2)}
                            </span>
                          </div>

                          {/* Participant avatars row */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center">
                              <span className="text-xs text-gray-500 mr-2">Split with:</span>
                              <div className="flex -space-x-2">
                                {participantAvatars.slice(0, maxAvatars).map((p) => (
                                  p.photo ? (
                                    <img
                                      key={p.uid}
                                      src={p.photo}
                                      alt={p.name}
                                      title={p.name}
                                      className="w-6 h-6 rounded-full object-cover border-2 border-white"
                                    />
                                  ) : (
                                    <div
                                      key={p.uid}
                                      title={p.name}
                                      className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center border-2 border-white"
                                    >
                                      <span className="text-xs text-gray-600">
                                        {p.name.charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  )
                                ))}
                                {extraCount > 0 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center border-2 border-white">
                                    <span className="text-xs text-white font-medium">+{extraCount}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-gray-400">
                              {format(expense.date.toDate(), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>

                        {/* Delete button */}
                        {(expense.createdBy === user?.uid || expense.payerId === user?.uid) && (
                          <button
                            onClick={() => handleDeleteExpense(expense.id)}
                            disabled={deleting === expense.id}
                            className="px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                            title="Delete expense"
                          >
                            {deleting === expense.id ? '...' : '×'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Add Expense Modal - Same as expenses page */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add Expense to Group</h2>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="Food">Food</option>
                    <option value="Rental">Rental</option>
                    <option value="Groceries">Groceries</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Beverage">Beverage</option>
                    <option value="Transportation">Transportation</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Shopping">Shopping</option>
                    <option value="Travel">Travel</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Who Paid? *
                  </label>
                  <select
                    value={payerId}
                    onChange={(e) => setPayerId(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {members.map((member) => (
                      <option key={member.uid} value={member.uid}>
                        {member.uid === user.uid ? 'You' : member.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants * (select who should split)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {members.map((member) => (
                      <label
                        key={member.uid}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={participants.includes(member.uid)}
                          onChange={() => handleParticipantToggle(member.uid)}
                        />
                        <span>{member.uid === user.uid ? 'You' : member.displayName}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Split Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={splitType === 'equal'}
                        onChange={() => setSplitType('equal')}
                      />
                      <span>Equal Split</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        checked={splitType === 'custom'}
                        onChange={() => setSplitType('custom')}
                      />
                      <span>Custom Amounts</span>
                    </label>
                  </div>
                </div>

                {splitType === 'custom' && participants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Amounts (must total ${amount || '0.00'})
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                      {participants.map((participantId) => {
                        const participant = members.find((m) => m.uid === participantId);
                        return (
                          <div key={participantId} className="flex items-center gap-2">
                            <label className="flex-1 text-sm">
                              {participantId === user.uid ? 'You' : participant?.displayName}:
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={customAmounts[participantId] || ''}
                              onChange={(e) =>
                                setCustomAmounts({
                                  ...customAmounts,
                                  [participantId]: e.target.value,
                                })
                              }
                              className="w-32 px-3 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                              placeholder="0.00"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (optional)
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowExpenseModal(false);
                      resetExpenseForm();
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || participants.length === 0 || !amount}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {creating ? 'Creating...' : 'Create Expense'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )
        }

        {/* Invite Member Modal */}
        {
          showInviteModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Invite Friends</h2>

                {loadingFriends ? (
                  <div className="py-8 text-center text-gray-500">Loading friends...</div>
                ) : friends.length === 0 ? (
                  <div className="py-8 text-center text-gray-500">
                    <p>No friends available to invite.</p>
                    <p className="text-sm mt-2">All your friends are already members of this group.</p>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto mb-4 space-y-2">
                    {friends.map((friend) => (
                      <label
                        key={friend.uid}
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedFriendsToInvite.has(friend.uid)}
                          onChange={() => toggleFriendSelection(friend.uid)}
                          className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        {friend.photoURL ? (
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm text-gray-400">
                              {friend.displayName.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{friend.displayName}</p>
                          <p className="text-xs text-gray-500">ID: {friend.uniqueId}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowInviteModal(false);
                      setSelectedFriendsToInvite(new Set());
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    disabled={inviting}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleInviteMembers}
                    disabled={inviting || selectedFriendsToInvite.size === 0}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    {inviting ? 'Inviting...' : `Invite (${selectedFriendsToInvite.size})`}
                  </button>
                </div>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}
