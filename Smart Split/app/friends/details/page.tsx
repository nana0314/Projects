'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { getUserById } from '@/src/utils/users';
import { getUserExpenses, deleteExpense, calculateFriendOnlyBalances } from '@/src/utils/expenses';
import { performSettleUpForFriend, performPartialSettleUp } from '@/src/utils/settleUpStorage';
import { Expense, User } from '@/src/types';
import { format } from 'date-fns';
import Link from 'next/link';
import CategoryBadge from '@/src/components/CategoryBadge';
import BlockReportMenu from '@/src/components/BlockReportMenu';
import { getBlockedUsers } from '@/src/utils/moderation';
import { PageSkeleton } from '@/src/components/SkeletonLoader';

export default function FriendDetails() {
    const { user, userData, loading: authLoading } = useAuth();
    const router = useRouter();
    const [friendId, setFriendId] = useState<string | null>(null);
    const [friend, setFriend] = useState<User | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [deleting, setDeleting] = useState<string | null>(null);

    // Balance
    const [netBalance, setNetBalance] = useState(0);

    // Settle up state
    const [settling, setSettling] = useState(false);
    const [showSettleConfirm, setShowSettleConfirm] = useState(false);
    const [showPartial, setShowPartial] = useState(false);
    const [partialAmount, setPartialAmount] = useState('');

    // Block state
    const [isBlocked, setIsBlocked] = useState(false);

    // Get friendId from URL
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const id = params.get('id');
            if (id) {
                setFriendId(id);
            } else {
                setError('Friend ID is missing from URL');
                setLoading(false);
            }
        }
    }, []);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/');
            return;
        }
        if (user && friendId) {
            loadFriendData();
        }
    }, [user, authLoading, friendId, router]);

    const loadFriendData = async () => {
        if (!user || !friendId) return;
        try {
            setLoading(true);
            setError('');

            // Fetch friend profile
            const friendData = await getUserById(friendId);
            if (!friendData) {
                setError('Friend not found');
                setLoading(false);
                return;
            }
            setFriend(friendData);

            // Check if blocked
            const blocked = await getBlockedUsers(user.uid);
            setIsBlocked(blocked.includes(friendId));

            // Fetch all user expenses and filter to ones involving both users
            const allExpenses = await getUserExpenses(user.uid);
            const sharedExpenses = allExpenses.filter((e) => {
                const involvesFriend =
                    e.payerId === friendId ||
                    e.participants.includes(friendId) ||
                    e.createdBy === friendId;
                const involvesUser =
                    e.payerId === user.uid ||
                    e.participants.includes(user.uid) ||
                    e.createdBy === user.uid;
                return involvesFriend && involvesUser && !e.groupId;
            });
            setExpenses(sharedExpenses);

            // Calculate balance
            const balances = await calculateFriendOnlyBalances(user.uid);
            const owed = balances.owedFrom[friendId] ?? 0;
            const owing = balances.owedTo[friendId] ?? 0;
            setNetBalance(owed - owing);
        } catch (err: any) {
            console.error('Error loading friend data:', err);
            setError(err.message || 'Failed to load friend data');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm('Are you sure you want to delete this expense?')) return;
        try {
            setDeleting(expenseId);
            await deleteExpense(expenseId, user!.uid);
            setSuccess('Expense deleted');
            await loadFriendData();
        } catch (err: any) {
            setError(err.message || 'Failed to delete expense');
        } finally {
            setDeleting(null);
        }
    };

    const handleSettleFull = async () => {
        if (!user || !friendId || !friend) return;
        setSettling(true);
        setError('');
        try {
            await performSettleUpForFriend(user.uid, friendId);
            setSuccess('Settled up with ' + friend.displayName + '!');
            setShowSettleConfirm(false);
            setTimeout(() => loadFriendData(), 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to settle up');
        } finally {
            setSettling(false);
        }
    };

    const handlePartialSettle = async () => {
        if (!user || !friendId || !friend) return;
        const amount = parseFloat(partialAmount);
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        setSettling(true);
        setError('');
        try {
            await performPartialSettleUp(
                user.uid,
                friendId,
                amount,
                user.displayName || 'You',
                friend.displayName
            );
            setSuccess(`Partial payment of $${amount.toFixed(2)} recorded`);
            setShowPartial(false);
            setPartialAmount('');
            setTimeout(() => loadFriendData(), 1500);
        } catch (err: any) {
            setError(err.message || 'Failed to record partial payment');
        } finally {
            setSettling(false);
        }
    };

    const getPayerName = (expense: Expense): string => {
        if (expense.participantNames && expense.participantNames[expense.payerId]) {
            return expense.payerId === user?.uid ? 'You' : expense.participantNames[expense.payerId];
        }
        if (expense.payerId === user?.uid) return 'You';
        return friend?.displayName || 'Unknown';
    };

    if (authLoading || loading) {
        return <PageSkeleton />;
    }

    if (error && !friend) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Link href="/friends" className="text-blue-600 hover:underline">← Back to Friends</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-36">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => router.back()}
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                            <span className="text-sm font-medium">Back</span>
                        </button>
                        <h1 className="text-xl font-semibold text-gray-800">
                            {friend?.displayName || 'Friend'}
                        </h1>
                        {friend && user && (
                            <BlockReportMenu
                                currentUserId={user.uid}
                                targetUserId={friend.uid}
                                targetName={friend.displayName}
                                isBlocked={isBlocked}
                                onBlockChange={() => loadFriendData()}
                            />
                        )}
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
                {/* Friend Profile Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-4">
                        {friend?.photoURL ? (
                            <img
                                src={friend.photoURL}
                                alt={friend.displayName}
                                className="w-16 h-16 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-2xl text-gray-400">
                                    {friend?.displayName.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1">
                            <h2 className="text-lg font-semibold text-gray-800">{friend?.displayName}</h2>
                            <p className="text-sm text-gray-500">ID: {friend?.uniqueId}</p>
                            {/* Balance */}
                            <div className="mt-1">
                                {netBalance > 0 && (
                                    <span className="text-sm font-medium text-green-600">
                                        You&apos;re owed ${netBalance.toFixed(2)}
                                    </span>
                                )}
                                {netBalance < 0 && (
                                    <span className="text-sm font-medium text-red-600">
                                        You owe ${Math.abs(netBalance).toFixed(2)}
                                    </span>
                                )}
                                {netBalance === 0 && (
                                    <span className="text-sm text-gray-400">Settled up</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Settle Up Section */}
                {Math.abs(netBalance) > 0.01 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        {error && (
                            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                {success}
                            </div>
                        )}

                        {showSettleConfirm ? (
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-700">
                                    Settle ${Math.abs(netBalance).toFixed(2)} with {friend?.displayName}?
                                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setShowSettleConfirm(false)}
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSettleFull}
                                        disabled={settling}
                                        className="px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                    >
                                        {settling ? 'Settling...' : 'Confirm'}
                                    </button>
                                </div>
                            </div>
                        ) : showPartial ? (
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-500">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        max={Math.abs(netBalance)}
                                        value={partialAmount}
                                        onChange={(e) => setPartialAmount(e.target.value)}
                                        placeholder="Amount"
                                        className="w-28 px-2 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => { setShowPartial(false); setPartialAmount(''); }}
                                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handlePartialSettle}
                                        disabled={settling || !partialAmount}
                                        className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                    >
                                        {settling ? 'Paying...' : 'Pay'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setShowPartial(true)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 active:scale-95 transition-transform"
                                >
                                    Partial Payment
                                </button>
                                <button
                                    onClick={() => setShowSettleConfirm(true)}
                                    className="flex-1 px-4 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-95 transition-transform"
                                >
                                    Settle Up
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Success/Error outside settle section */}
                {netBalance === 0 && success && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                        {success}
                    </div>
                )}

                {/* Expenses List */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">
                            Shared Expenses ({expenses.length})
                        </h3>
                    </div>

                    {expenses.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            No expenses with {friend?.displayName} yet.
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {expenses.map((expense) => {
                                const payerName = getPayerName(expense);
                                const userShare =
                                    expense.splitType === 'equal'
                                        ? expense.amount / expense.participants.length
                                        : expense.splitAmounts?.[user!.uid] ?? 0;

                                return (
                                    <div
                                        key={expense.id}
                                        className="p-4 hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="font-medium text-gray-800 truncate">
                                                        {expense.description || 'Expense'}
                                                    </span>
                                                    {expense.participants.length === 1 && expense.participants[0] === user?.uid && (
                                                        <span className="px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded">
                                                            Personal
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <span>{payerName} paid</span>
                                                    <span>·</span>
                                                    <span>{format(expense.date.toDate(), 'MMM d, yyyy')}</span>
                                                    {expense.category && (
                                                        <>
                                                            <span>·</span>
                                                            <CategoryBadge category={expense.category} />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 ml-3">
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold text-gray-800">
                                                        ${expense.amount.toFixed(2)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        Your share: ${userShare.toFixed(2)}
                                                    </p>
                                                </div>
                                                {expense.payerId === user?.uid && (
                                                    <button
                                                        onClick={() => handleDeleteExpense(expense.id)}
                                                        disabled={deleting === expense.id}
                                                        className="text-red-400 hover:text-red-600 p-1"
                                                        title="Delete expense"
                                                    >
                                                        {deleting === expense.id ? (
                                                            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
