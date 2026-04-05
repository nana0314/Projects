'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { calculateUserBalances } from '@/src/utils/expenses';
import { performSettleUp } from '@/src/utils/settleUpStorage';
import { getUserById } from '@/src/utils/users';
import { User } from '@/src/types';
import Link from 'next/link';

export default function Balances() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [owedTo, setOwedTo] = useState<{ [userId: string]: number }>({});
  const [owedFrom, setOwedFrom] = useState<{ [userId: string]: number }>({});
  const [userCache, setUserCache] = useState<{ [userId: string]: User }>({});
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settlingUp, setSettlingUp] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
      return;
    }
    if (user) {
      loadBalances();
    }
  }, [user, loading, router]);

  const loadBalances = async () => {
    if (!user) return;
    try {
      setLoadingBalances(true);
      const balances = await calculateUserBalances(user.uid);
      setOwedTo(balances.owedTo);
      setOwedFrom(balances.owedFrom);

      // Load user details for all users in balances
      const userIds = new Set([
        ...Object.keys(balances.owedTo),
        ...Object.keys(balances.owedFrom),
      ]);

      const users: { [userId: string]: User } = {};
      for (const userId of userIds) {
        const userData = await getUserById(userId);
        if (userData) {
          users[userId] = userData;
        }
      }
      setUserCache(users);
    } catch (err: any) {
      setError(err.message || 'Failed to load balances');
    } finally {
      setLoadingBalances(false);
    }
  };

  const getUserName = (userId: string): string => {
    if (userId === user?.uid) return 'You';
    return userCache[userId]?.displayName || 'Unknown';
  };

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
      await loadBalances();
    } catch (err: any) {
      setError(err.message || 'Failed to settle up expenses');
    } finally {
      setSettlingUp(false);
    }
  };

  const totalOwedTo = Object.values(owedTo).reduce((sum, amt) => sum + amt, 0);
  const totalOwedFrom = Object.values(owedFrom).reduce((sum, amt) => sum + amt, 0);
  const netBalance = totalOwedFrom - totalOwedTo;

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-36">
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

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

        {loadingBalances ? (
          <div className="text-center py-12 text-gray-500">Loading balances...</div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl font-bold text-gray-800">Balances</h1>
              {(totalOwedTo > 0 || totalOwedFrom > 0) && (
                <button
                  onClick={handleSettleUp}
                  disabled={settlingUp}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {settlingUp ? 'Settling Up...' : 'Settle Up'}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">You Owe</p>
                <p className="text-2xl font-bold text-red-600">${totalOwedTo.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">You&apos;re Owed</p>
                <p className="text-2xl font-bold text-green-600">${totalOwedFrom.toFixed(2)}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <p className="text-sm text-gray-500 mb-1">Net Balance</p>
                <p
                  className={`text-2xl font-bold ${
                    netBalance >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  ${Math.abs(netBalance).toFixed(2)}
                  {netBalance >= 0 ? ' (owed to you)' : ' (you owe)'}
                </p>
              </div>
            </div>

            {/* You Owe Section */}
            {Object.keys(owedTo).length > 0 && (
              <div className="bg-white rounded-lg shadow mb-6">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">You Owe</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {Object.entries(owedTo).map(([userId, amount]) => (
                    <div key={userId} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {userCache[userId]?.photoURL ? (
                          <img
                            src={userCache[userId].photoURL}
                            alt={getUserName(userId)}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm text-gray-400">
                              {getUserName(userId).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{getUserName(userId)}</p>
                          <p className="text-sm text-gray-500">ID: {userCache[userId]?.uniqueId}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-red-600">${amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* You're Owed Section */}
            {Object.keys(owedFrom).length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800">You&apos;re Owed</h2>
                </div>
                <div className="divide-y divide-gray-200">
                  {Object.entries(owedFrom).map(([userId, amount]) => (
                    <div key={userId} className="p-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {userCache[userId]?.photoURL ? (
                          <img
                            src={userCache[userId].photoURL}
                            alt={getUserName(userId)}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm text-gray-400">
                              {getUserName(userId).charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-800">{getUserName(userId)}</p>
                          <p className="text-sm text-gray-500">ID: {userCache[userId]?.uniqueId}</p>
                        </div>
                      </div>
                      <p className="text-xl font-bold text-green-600">${amount.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {Object.keys(owedTo).length === 0 && Object.keys(owedFrom).length === 0 && (
              <div className="bg-white rounded-lg shadow p-12 text-center">
                <p className="text-gray-500 mb-4">No balances yet.</p>
                <Link
                  href="/expenses"
                  className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Add an Expense
                </Link>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}