'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/src/context/AuthContext';
import { getUserExpenses } from '@/src/utils/expenses';
import { getUserGroups, getGroupById } from '@/src/utils/groups';
import {
    calculateUserSpendingTrend,
    calculateTrendComparison,
    calculateCategoryBreakdown,
    calculateMerchantBreakdown,
    calculateDailyAverage,
    calculateGroupSpendingTrend,
    isGroupActive,
    getBudget,
    setBudget,
    getCurrentPeriod,
    filterExpensesByType,
    ExpenseTypeFilter,
} from '@/src/utils/analytics';
import { Expense, Group } from '@/src/types';
import { PeriodSpending, TrendComparison, CategoryBreakdown, MerchantBreakdown, DailyAverageStats } from '@/src/types/analytics';

// Dashboard components
import SpendingTrendChart from '@/src/components/dashboard/SpendingTrendChart';
import BudgetVsActual from '@/src/components/dashboard/BudgetVsActual';
import CategoryPieChart from '@/src/components/dashboard/CategoryPieChart';
import TopMerchantsPieChart from '@/src/components/dashboard/TopMerchantsPieChart';
import DailyAverageCard from '@/src/components/dashboard/DailyAverageCard';
import ActiveGroupsChart from '@/src/components/dashboard/ActiveGroupsChart';
import InsightsCard from '@/src/components/dashboard/InsightsCard';
import OutstandingBalances from '@/src/components/dashboard/OutstandingBalances';
import { PageSkeleton, DashboardSkeleton } from '@/src/components/SkeletonLoader';

interface GroupWithAnalytics {
    group: Group;
    isActive: boolean;
    currentPeriodSpending: number;
    trendData: PeriodSpending[];
}

export default function Dashboard() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    // Data states
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [budget, setBudgetState] = useState<number | null>(null);
    const [dataLoading, setDataLoading] = useState(true);

    // Analytics states
    const [trendData, setTrendData] = useState<PeriodSpending[]>([]);
    const [comparison, setComparison] = useState<TrendComparison | null>(null);
    const [categoryData, setCategoryData] = useState<CategoryBreakdown[]>([]);
    const [merchantData, setMerchantData] = useState<MerchantBreakdown[]>([]);
    const [dailyStats, setDailyStats] = useState<DailyAverageStats | null>(null);
    const [groupsWithAnalytics, setGroupsWithAnalytics] = useState<GroupWithAnalytics[]>([]);
    const [expenseFilter, setExpenseFilter] = useState<ExpenseTypeFilter>('all');

    // Simplify debts toggle
    const [simplify, setSimplify] = useState(false);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('simplifyDebts');
            setSimplify(saved === 'true');
        }
    }, []);

    const toggleSimplify = () => {
        const newValue = !simplify;
        setSimplify(newValue);
        localStorage.setItem('simplifyDebts', String(newValue));
        window.dispatchEvent(new Event('simplifyToggled'));
    };

    // Auth redirect
    useEffect(() => {
        if (!loading && !user) {
            router.push('/');
        }
    }, [user, loading, router]);

    // Fetch data
    const fetchData = useCallback(async () => {
        if (!user) return;

        setDataLoading(true);
        try {
            // Fetch expenses and groups in parallel
            const [userExpenses, userGroups, userBudget] = await Promise.all([
                getUserExpenses(user.uid),
                getUserGroups(user.uid),
                getBudget(user.uid),
            ]);

            setExpenses(userExpenses);
            setGroups(userGroups);
            setBudgetState(userBudget);

            // Calculate analytics using filtered expenses
            const filteredExpenses = filterExpensesByType(userExpenses, expenseFilter);
            const trend = calculateUserSpendingTrend(filteredExpenses, user.uid);
            const trendComp = calculateTrendComparison(filteredExpenses, user.uid);
            const categories = calculateCategoryBreakdown(filteredExpenses, user.uid);
            const merchants = calculateMerchantBreakdown(filteredExpenses, user.uid);
            const daily = calculateDailyAverage(filteredExpenses, user.uid);

            setTrendData(trend);
            setComparison(trendComp);
            setCategoryData(categories);
            setMerchantData(merchants);
            setDailyStats(daily);

            // Calculate group analytics
            const groupAnalytics: GroupWithAnalytics[] = await Promise.all(
                userGroups.map(async (group) => {
                    const groupExpenses = userExpenses.filter((e) => e.groupId === group.id);
                    const active = isGroupActive(groupExpenses);
                    const groupTrend = calculateGroupSpendingTrend(groupExpenses);
                    const { start, end } = getCurrentPeriod();
                    const currentSpending = groupExpenses
                        .filter((e) => {
                            const date = e.date.toDate();
                            return date >= start && date <= end;
                        })
                        .reduce((sum, e) => sum + e.amount, 0);

                    return {
                        group,
                        isActive: active,
                        currentPeriodSpending: currentSpending,
                        trendData: groupTrend,
                    };
                })
            );

            setGroupsWithAnalytics(groupAnalytics);
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setDataLoading(false);
        }
    }, [user, expenseFilter]);

    // Recalculate when filter changes
    useEffect(() => {
        if (user && expenses.length > 0) {
            const filteredExpenses = filterExpensesByType(expenses, expenseFilter);
            const trend = calculateUserSpendingTrend(filteredExpenses, user.uid);
            const trendComp = calculateTrendComparison(filteredExpenses, user.uid);
            const categories = calculateCategoryBreakdown(filteredExpenses, user.uid);
            const merchants = calculateMerchantBreakdown(filteredExpenses, user.uid);
            const daily = calculateDailyAverage(filteredExpenses, user.uid);

            setTrendData(trend);
            setComparison(trendComp);
            setCategoryData(categories);
            setMerchantData(merchants);
            setDailyStats(daily);
        }
    }, [expenseFilter, expenses, user]);

    useEffect(() => {
        if (user) {
            fetchData();
        }
    }, [user, fetchData]);

    // Handle budget change
    const handleBudgetChange = async (amount: number) => {
        if (!user) return;
        await setBudget(user.uid, amount);
        setBudgetState(amount);
    };

    // Calculate actual spending for budget
    const actualSpending = dailyStats?.totalSpending ?? 0;

    if (loading || !user) {
        return <PageSkeleton />;
    }

    const profilePhotoURL = userData?.photoURL || user?.photoURL;

    return (
        <div className="min-h-screen bg-gray-50 pb-36">
            {/* Header */}
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between relative">
                        {/* Left: Profile Picture */}
                        <Link
                            href="/profile"
                            className="w-10 h-10 flex items-center justify-center rounded-full overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                            title="Profile"
                        >
                            {profilePhotoURL ? (
                                <img
                                    src={profilePhotoURL}
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
                            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
                        </div>

                        {/* Right: Simplify toggle + Refresh button */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleSimplify}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${simplify
                                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                    }`}
                                title={simplify ? 'Simplify debts: ON' : 'Simplify debts: OFF'}
                            >
                                {simplify ? '✓ Simplified' : 'Simplify'}
                            </button>
                            <button
                                onClick={fetchData}
                                disabled={dataLoading}
                                className="p-2 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
                                title="Refresh"
                            >
                                <svg
                                    className={`w-5 h-5 text-gray-500 ${dataLoading ? 'animate-spin' : ''}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {dataLoading ? (
                    <DashboardSkeleton />
                ) : (
                    <div className="space-y-4">
                        {/* AI Insights Card */}
                        <InsightsCard />

                        {/* Outstanding Balances */}
                        <OutstandingBalances />

                        {/* Expense Type Filter */}
                        <div className="flex items-center gap-1 bg-white rounded-xl shadow-sm border border-gray-100 p-1">
                            {(['all', 'personal', 'shared'] as ExpenseTypeFilter[]).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setExpenseFilter(type)}
                                    className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${expenseFilter === type
                                        ? 'bg-indigo-500 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                        }`}
                                >
                                    {type === 'all' ? 'All' : type === 'personal' ? 'Personal' : 'Shared'}
                                </button>
                            ))}
                        </div>

                        {/* Spending Trend */}
                        {comparison && (
                            <SpendingTrendChart trendData={trendData} comparison={comparison} />
                        )}

                        {/* Budget vs Actual */}
                        <BudgetVsActual
                            budget={budget}
                            actual={actualSpending}
                            onBudgetChange={handleBudgetChange}
                        />

                        {/* Active Groups */}
                        <ActiveGroupsChart groups={groupsWithAnalytics} />

                        {/* Categories & Merchants - side by side on larger screens */}
                        <div className="grid grid-cols-2 gap-4">
                            <CategoryPieChart data={categoryData} />
                            <TopMerchantsPieChart data={merchantData} />
                        </div>

                        {/* Daily Average */}
                        {dailyStats && <DailyAverageCard stats={dailyStats} />}

                        {/* Empty state */}
                        {expenses.length === 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                                <svg
                                    className="w-12 h-12 mx-auto text-gray-300 mb-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={1.5}
                                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                                    />
                                </svg>
                                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    No expenses yet
                                </h3>
                                <p className="text-gray-500 text-sm mb-4">
                                    Start adding expenses to see your analytics
                                </p>
                                <Link
                                    href="/add-expense"
                                    className="inline-flex items-center px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    Add Expense
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
