'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getUserFriends } from '@/src/utils/friends';
import { getUserGroups } from '@/src/utils/groups';
import { createExpense, getUserExpenses, getGroupExpenses, deleteExpense, calculateUserBalances } from '@/src/utils/expenses';
import { performSettleUp } from '@/src/utils/settleUpStorage';
import { simplifyDebts, calculateNetBalances, SimplifiedDebt } from '@/src/utils/debtSimplification';
import { Expense, ExpenseCategory, User, Group } from '@/src/types';
import { format } from 'date-fns';

export default function Expenses() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loadingExpenses, setLoadingExpenses] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('');

  // Expense form state
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [owedTo, setOwedTo] = useState<{ [userId: string]: number }>({});
  const [owedFrom, setOwedFrom] = useState<{ [userId: string]: number }>({});
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [settlingUp, setSettlingUp] = useState(false);
  const [simplifyEnabled, setSimplifyEnabled] = useState(false);
  const [simplifiedDebts, setSimplifiedDebts] = useState<SimplifiedDebt[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadData();
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && user.uid) {
      setPayerId(user.uid);
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoadingExpenses(true);
      const [userFriends, userGroups, userExpenses] = await Promise.all([
        getUserFriends(user.uid),
        getUserGroups(user.uid),
        getUserExpenses(user.uid),
      ]);
      setFriends(userFriends);
      setGroups(userGroups);
      setExpenses(userExpenses);
      await loadBalances();
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoadingExpenses(false);
    }
  };

  const loadBalances = async () => {
    if (!user) return;
    try {
      setLoadingBalances(true);
      const balances = await calculateUserBalances(user.uid);
      setOwedTo(balances.owedTo);
      setOwedFrom(balances.owedFrom);
    } catch (err: any) {
      console.error('Failed to load balances:', err);
    } finally {
      setLoadingBalances(false);
    }
  };

  // Listen for global simplify toggle from floating button
  useEffect(() => {
    const handleSimplifyToggle = (event: any) => {
      setSimplifyEnabled(event.detail.enabled);
    };

    // Load initial state from localStorage
    const saved = localStorage.getItem('simplifyEnabled');
    setSimplifyEnabled(saved === 'true');

    window.addEventListener('simplifyToggled', handleSimplifyToggle);
    return () => window.removeEventListener('simplifyToggled', handleSimplifyToggle);
  }, []);

  // Calculate simplified debts when balances change or simplify is toggled
  useEffect(() => {
    if (!user || !simplifyEnabled) {
      setSimplifiedDebts([]);
      return;
    }

    const netBalances = calculateNetBalances(owedTo, owedFrom);
    const simplified = simplifyDebts(netBalances);
    setSimplifiedDebts(simplified);
  }, [owedTo, owedFrom, simplifyEnabled, user]);

  const handleSettleUp = async () => {
    if (!user) return;

    if (!confirm('Are you sure you want to settle up all expenses? This will delete all expense records and cannot be undone.')) {
      return;
    }

    setSettlingUp(true);
    setError('');
    setSuccess('');

    try {
      await performSettleUp(user.uid);
      setSuccess('All expenses settled up successfully!');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to settle up expenses');
    } finally {
      setSettlingUp(false);
    }
  };

  const totalOwedTo = Object.values(owedTo).reduce((sum, amt) => sum + amt, 0);
  const totalOwedFrom = Object.values(owedFrom).reduce((sum, amt) => sum + amt, 0);
  const netBalance = totalOwedFrom - totalOwedTo;

  const handleParticipantToggle = (userId: string) => {
    setParticipants((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
    // Reset custom amounts when removing participant
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
    setSuccess('');

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
        selectedGroup || undefined,
        description.trim() || undefined,
        splitAmounts
      );

      setSuccess('Expense created successfully!');
      resetForm();
      setShowCreateModal(false);
      await loadData(); // This will also reload balances
    } catch (err: any) {
      setError(err.message || 'Failed to create expense');
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setAmount('');
    setCategory('Food');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setPayerId(user?.uid || '');
    setParticipants([]);
    setSplitType('equal');
    setCustomAmounts({});
    setDescription('');
    setSelectedGroup('');
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
      await loadData(); // This will also reload balances
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
    <div className="min-h-screen bg-gray-50 pb-36">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Expenses</h1>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Expense
          </button>
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

        {/* Balance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">You Owe</p>
            <p className="text-2xl font-bold text-red-600">
              {loadingBalances ? '...' : `$${totalOwedTo.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">You&apos;re Owed</p>
            <p className="text-2xl font-bold text-green-600">
              {loadingBalances ? '...' : `$${totalOwedFrom.toFixed(2)}`}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Net Balance</p>
            <p
              className={`text-2xl font-bold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
            >
              {loadingBalances ? '...' : (
                <>
                  ${Math.abs(netBalance).toFixed(2)}
                  {netBalance >= 0 ? ' (owed to you)' : ' (you owe)'}
                </>
              )}
            </p>
            {!loadingBalances && (
              <button
                onClick={handleSettleUp}
                disabled={settlingUp || (totalOwedTo === 0 && totalOwedFrom === 0)}
                className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-sm"
              >
                {settlingUp ? 'Settling Up...' : 'Settle Up'}
              </button>
            )}
          </div>
        </div>

        {/* Simplified Debts Section */}
        {simplifyEnabled && simplifiedDebts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Simplified Payments
              </h2>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                {simplifiedDebts.length} payment{simplifiedDebts.length !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              These simplified payments will settle all your debts with the minimum number of transactions.
            </p>
            <div className="space-y-3">
              {simplifiedDebts.map((debt, index) => {
                const fromUser = debt.from === user?.uid
                  ? 'You'
                  : friends.find(f => f.uid === debt.from)?.displayName || 'Unknown';
                const toUser = debt.to === user?.uid
                  ? 'You'
                  : friends.find(f => f.uid === debt.to)?.displayName || 'Unknown';

                // Only show debts involving the current user
                if (debt.from !== user?.uid && debt.to !== user?.uid) {
                  return null;
                }

                return (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`text-lg font-semibold ${debt.from === user?.uid ? 'text-red-600' : 'text-green-600'
                        }`}>
                        {debt.from === user?.uid ? '→' : '←'}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">
                          {debt.from === user?.uid
                            ? `Pay ${toUser}`
                            : `${fromUser} pays you`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {debt.from} → {debt.to}
                        </p>
                      </div>
                    </div>
                    <span className={`text-lg font-bold ${debt.from === user?.uid ? 'text-red-600' : 'text-green-600'
                      }`}>
                      ${debt.amount.toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {loadingExpenses ? (
          <div className="text-center py-12 text-gray-500">Loading expenses...</div>
        ) : expenses.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 mb-4">No expenses yet.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Expense
            </button>
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
                        Paid by {getExpensePayerName(expense)}
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        Split with: {getParticipantNames(expense.participants, expense)}
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

        {/* Create Expense Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 my-8 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Expense</h2>
              <form onSubmit={handleCreateExpense} className="space-y-4">
                {/* Group Selection */}
                {groups.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Group (optional)
                    </label>
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No group</option>
                      {groups.map((group) => (
                        <option key={group.id} value={group.id}>
                          {group.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Amount */}
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

                {/* Category */}
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
                  </select>
                </div>

                {/* Date */}
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

                {/* Payer */}
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
                    <option value={user.uid}>You</option>
                    {friends.map((friend) => (
                      <option key={friend.uid} value={friend.uid}>
                        {friend.displayName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Participants */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Participants * (select who should split the expense)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3 max-h-48 overflow-y-auto">
                    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={participants.includes(user.uid)}
                        onChange={() => handleParticipantToggle(user.uid)}
                      />
                      <span>You</span>
                    </label>
                    {friends.map((friend) => (
                      <label
                        key={friend.uid}
                        className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={participants.includes(friend.uid)}
                          onChange={() => handleParticipantToggle(friend.uid)}
                        />
                        <span>{friend.displayName}</span>
                      </label>
                    ))}
                  </div>
                  {participants.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one participant</p>
                  )}
                </div>

                {/* Split Type */}
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

                {/* Custom Amounts */}
                {splitType === 'custom' && participants.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Amounts (must total ${amount || '0.00'})
                    </label>
                    <div className="border border-gray-300 rounded-lg p-3 space-y-2">
                      {participants.map((participantId) => {
                        const participant = participantId === user.uid
                          ? { uid: user.uid, displayName: 'You' }
                          : friends.find((f) => f.uid === participantId);
                        return (
                          <div key={participantId} className="flex items-center gap-2">
                            <label className="flex-1 text-sm">{participant?.displayName}:</label>
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

                {/* Description */}
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
                      setShowCreateModal(false);
                      resetForm();
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
        )}
      </main>
    </div>
  );
}