'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getUserFriends } from '@/src/utils/friends';
import { getUserGroups } from '@/src/utils/groups';
import { getUserExpenses, deleteExpense } from '@/src/utils/expenses';
import { Expense, User, ExpenseCategory, Group } from '@/src/types';
import { format } from 'date-fns';
import Link from 'next/link';
import CategoryBadge from '@/src/components/CategoryBadge';

export default function RecentActivity() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Filter and sort states
  const [filterPaidByYou, setFilterPaidByYou] = useState(false);
  const [filterCategory, setFilterCategory] = useState<ExpenseCategory | 'all'>('all');
  const [sortByDate, setSortByDate] = useState<'newest' | 'oldest'>('newest');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoadingExpenses(true);
      const [userFriends, userExpenses, userGroups] = await Promise.all([
        getUserFriends(user.uid),
        getUserExpenses(user.uid),
        getUserGroups(user.uid),
      ]);
      setFriends(userFriends);
      setGroups(userGroups);

      // Include all expenses (friend and group)
      setAllExpenses(userExpenses);
      applyFiltersAndSort(userExpenses);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const getExpensePayerName = (expense: Expense): string => {
    // First try to use stored participantNames (most accurate)
    if (expense.participantNames && expense.participantNames[expense.payerId]) {
      return expense.payerId === user?.uid ? 'You' : expense.participantNames[expense.payerId];
    }
    // Fallback to looking up in friends list
    if (expense.payerId === user?.uid) return 'You';
    const friend = friends.find((f) => f.uid === expense.payerId);
    return friend?.displayName || 'Unknown';
  };

  const getParticipantNames = (participantIds: string[], expense: Expense): string => {
    return participantIds
      .map((id) => {
        // Try stored participantNames first
        if (expense.participantNames && expense.participantNames[id]) {
          return id === user?.uid ? 'You' : expense.participantNames[id];
        }
        // Fallback to friends list
        return id === user?.uid ? 'You' : friends.find((f) => f.uid === id)?.displayName || 'Unknown';
      })
      .join(', ');
  };

  const getPayerPhoto = (expense: Expense): string | null => {
    if (expense.payerId === user?.uid) {
      return userData?.photoURL || null;
    }
    const friend = friends.find((f) => f.uid === expense.payerId);
    return friend?.photoURL || null;
  };

  const getGroupName = (groupId: string): string => {
    const group = groups.find((g) => g.id === groupId);
    return group?.name || 'Unknown Group';
  };

  const getParticipantAvatars = (expense: Expense): { uid: string; photo: string | null; name: string }[] => {
    return expense.participants.map((id) => {
      if (id === user?.uid) {
        return { uid: id, photo: userData?.photoURL || null, name: 'You' };
      }
      const friend = friends.find((f) => f.uid === id);
      const name = expense.participantNames?.[id] || friend?.displayName || 'Unknown';
      return { uid: id, photo: friend?.photoURL || null, name };
    });
  };

  const applyFiltersAndSort = (expensesToFilter: Expense[]) => {
    let filtered = [...expensesToFilter];

    // Filter by "Paid by You"
    if (filterPaidByYou) {
      filtered = filtered.filter(expense => expense.payerId === user?.uid);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === filterCategory);
    }

    // Sort by date first, then by createdAt (time) for expenses on the same date
    filtered.sort((a, b) => {
      const dateA = a.date.toMillis();
      const dateB = b.date.toMillis();

      // First compare by expense date
      if (dateA !== dateB) {
        return sortByDate === 'newest' ? dateB - dateA : dateA - dateB;
      }

      // If dates are the same, sort by createdAt (time when expense was added)
      const createdAtA = a.createdAt?.toMillis() || 0;
      const createdAtB = b.createdAt?.toMillis() || 0;
      return sortByDate === 'newest' ? createdAtB - createdAtA : createdAtA - createdAtB;
    });

    setExpenses(filtered);
  };

  useEffect(() => {
    if (allExpenses.length > 0) {
      applyFiltersAndSort(allExpenses);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterPaidByYou, filterCategory, sortByDate, user?.uid, allExpenses.length]);

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
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete expense');
    } finally {
      setDeleting(null);
    }
  };

  if (loading || !user || !userData) {
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

            {/* Center: Title */}
            <div className="absolute left-1/2 transform -translate-x-1/2 text-center">
              <h1 className="text-xl font-semibold text-gray-800">Activity</h1>
            </div>

            {/* Right: Spacer for layout balance */}
            <div className="w-10" aria-hidden="true" />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-gray-600">Your expenses with friends and groups</p>
        </div>

        {/* Filters and Sort */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Paid by You Filter */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filterPaidByYou}
                onChange={(e) => setFilterPaidByYou(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Paid by You</span>
            </label>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value as ExpenseCategory | 'all')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All</option>
                {[
                  'Food',
                  'Rental',
                  'Groceries',
                  'Entertainment',
                  'Beverage',
                  'Transportation',
                  'Utilities',
                  'Shopping',
                  'Travel',
                  'Other'
                ].map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort by Date */}
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm font-medium text-gray-700">Sort:</span>
              <select
                value={sortByDate}
                onChange={(e) => setSortByDate(e.target.value as 'newest' | 'oldest')}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

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

        {loadingExpenses ? (
          <div className="text-center py-12 text-gray-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">
              {allExpenses.length === 0
                ? 'No expenses with friends yet.'
                : 'No expenses match your filters.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {expenses.map((expense) => {
                const payerPhoto = getPayerPhoto(expense);
                const payerName = getExpensePayerName(expense);
                const participantAvatars = getParticipantAvatars(expense);
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
                              {expense.groupId && (
                                <><span className="text-gray-900"> in </span><span className="text-green-600">{getGroupName(expense.groupId)}</span></>
                              )}
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
                              {participantAvatars.slice(0, maxAvatars).map((p, idx) => (
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
          </div>
        )}
      </main>
    </div>
  );
}
