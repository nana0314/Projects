'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getUserFriends } from '@/src/utils/friends';
import { getUserExpenses, deleteExpense } from '@/src/utils/expenses';
import { Expense, User, ExpenseCategory } from '@/src/types';
import { format } from 'date-fns';
import Link from 'next/link';

export default function RecentActivity() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
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
      const [userFriends, userExpenses] = await Promise.all([
        getUserFriends(user.uid),
        getUserExpenses(user.uid),
      ]);
      setFriends(userFriends);
      
      // Filter out group expenses - only show expenses between friends (no groupId)
      const friendExpenses = userExpenses.filter(expense => !expense.groupId);
      setAllExpenses(friendExpenses);
      applyFiltersAndSort(friendExpenses);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const getExpensePayerName = (payerId: string): string => {
    if (payerId === user?.uid) return 'You';
    const friend = friends.find((f) => f.uid === payerId);
    return friend?.displayName || 'Unknown';
  };

  const getParticipantNames = (participantIds: string[]): string => {
    return participantIds
      .map((id) => (id === user?.uid ? 'You' : friends.find((f) => f.uid === id)?.displayName || 'Unknown'))
      .join(', ');
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Recent Activity</h1>
            <p className="text-gray-600 mt-1">Expenses between you and your friends</p>
          </div>
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
                {(['Food', 'Rental', 'Groceries', 'Entertainment', 'Beverage'] as ExpenseCategory[]).map((category) => (
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
            <p className="text-gray-500 mb-4">
              {allExpenses.length === 0 
                ? 'No expenses with friends yet.'
                : 'No expenses match your filters.'}
            </p>
            {allExpenses.length === 0 && (
              <Link
                href="/expenses"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-block"
              >
                Add Your First Expense
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="divide-y divide-gray-200">
              {expenses.map((expense) => (
                <div key={expense.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                          {expense.category}
                        </span>
                        <span className="text-xl font-bold text-gray-800">
                          ${expense.amount.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Paid by {getExpensePayerName(expense.payerId)}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Split with: {getParticipantNames(expense.participants)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {format(expense.date.toDate(), 'MMM dd, yyyy')}
                      </p>
                      {expense.description && (
                        <p className="text-sm text-gray-700 mt-2">{expense.description}</p>
                      )}
                    </div>
                    {(expense.createdBy === user?.uid || expense.payerId === user?.uid) && (
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        disabled={deleting === expense.id}
                        className="ml-4 px-3 py-1 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Delete expense"
                      >
                        {deleting === expense.id ? 'Deleting...' : 'Delete'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
