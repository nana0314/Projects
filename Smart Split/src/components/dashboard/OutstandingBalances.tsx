'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/src/context/AuthContext';
import { calculateUserBalances } from '@/src/utils/expenses';
import { getUserFriends } from '@/src/utils/friends';
import { User } from '@/src/types';

interface Balance {
    userId: string;
    name: string;
    photoURL?: string;
    amount: number; // positive = you're owed, negative = you owe
}

export default function OutstandingBalances() {
    const { user } = useAuth();
    const [balances, setBalances] = useState<Balance[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) loadBalances();
    }, [user]);

    const loadBalances = async () => {
        if (!user) return;
        try {
            setLoading(true);
            const [userBalances, friends] = await Promise.all([
                calculateUserBalances(user.uid),
                getUserFriends(user.uid),
            ]);

            const friendMap = new Map<string, User>();
            friends.forEach((f) => friendMap.set(f.uid, f));

            const balanceList: Balance[] = [];
            const processedIds = new Set<string>();

            // Process owedFrom (friends owe you)
            Object.entries(userBalances.owedFrom).forEach(([id, amt]) => {
                if (amt > 0.01) {
                    processedIds.add(id);
                    const friend = friendMap.get(id);
                    const owedTo = userBalances.owedTo[id] || 0;
                    const net = amt - owedTo;
                    if (Math.abs(net) > 0.01) {
                        balanceList.push({
                            userId: id,
                            name: friend?.displayName || 'Unknown',
                            photoURL: friend?.photoURL,
                            amount: net,
                        });
                    }
                }
            });

            // Process owedTo (you owe friends) — only those not already processed
            Object.entries(userBalances.owedTo).forEach(([id, amt]) => {
                if (amt > 0.01 && !processedIds.has(id)) {
                    const friend = friendMap.get(id);
                    balanceList.push({
                        userId: id,
                        name: friend?.displayName || 'Unknown',
                        photoURL: friend?.photoURL,
                        amount: -amt,
                    });
                }
            });

            // Sort: largest amounts first
            balanceList.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));
            setBalances(balanceList);
        } catch (err) {
            console.error('Failed to load balances:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl shadow p-4 animate-pulse">
                <div className="h-4 w-40 bg-gray-200 rounded mb-3" />
                <div className="space-y-2">
                    <div className="h-10 bg-gray-100 rounded" />
                    <div className="h-10 bg-gray-100 rounded" />
                </div>
            </div>
        );
    }

    if (balances.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-2">Outstanding Balances</h3>
                <p className="text-xs text-gray-500">All settled up! 🎉</p>
            </div>
        );
    }

    const totalOwed = balances.filter((b) => b.amount > 0).reduce((s, b) => s + b.amount, 0);
    const totalOwe = balances.filter((b) => b.amount < 0).reduce((s, b) => s + Math.abs(b.amount), 0);

    return (
        <div className="bg-white rounded-xl shadow p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Outstanding Balances</h3>

            {/* Summary */}
            <div className="flex items-center gap-4 mb-3">
                {totalOwed > 0 && (
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Owed ${totalOwed.toFixed(2)}
                    </span>
                )}
                {totalOwe > 0 && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
                        You owe ${totalOwe.toFixed(2)}
                    </span>
                )}
            </div>

            {/* Balance list */}
            <div className="space-y-2">
                {balances.slice(0, 5).map((b) => (
                    <div key={b.userId} className="flex items-center justify-between py-1.5">
                        <div className="flex items-center gap-2">
                            {b.photoURL ? (
                                <img src={b.photoURL} alt={b.name} className="w-7 h-7 rounded-full object-cover" />
                            ) : (
                                <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                                    <span className="text-xs text-gray-500">{b.name.charAt(0).toUpperCase()}</span>
                                </div>
                            )}
                            <span className="text-sm text-gray-700">{b.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${b.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {b.amount > 0 ? `+$${b.amount.toFixed(2)}` : `-$${Math.abs(b.amount).toFixed(2)}`}
                        </span>
                    </div>
                ))}
                {balances.length > 5 && (
                    <p className="text-xs text-gray-400 text-center pt-1">
                        +{balances.length - 5} more
                    </p>
                )}
            </div>
        </div>
    );
}
