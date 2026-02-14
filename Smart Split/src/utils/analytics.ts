import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/src/config/firebase';
import { Expense, ExpenseCategory } from '@/src/types';
import {
    PeriodSpending,
    BudgetData,
    CategoryBreakdown,
    MerchantBreakdown,
    DailyAverageStats,
    TrendComparison,
} from '@/src/types/analytics';
import {
    startOfDay,
    endOfDay,
    subDays,
    format,
    isWithinInterval,
    differenceInDays,
} from 'date-fns';

// =============================================================================
// CONFIGURATION
// =============================================================================

// Period length in days (2 for testing, will be 14 for bi-weekly)
const PERIOD_DAYS = 2;

// Number of periods to show in trend chart
const TREND_PERIODS = 4;

// Days to consider a group "active"
const ACTIVE_DAYS_THRESHOLD = 3;

// Category colors for pie chart
const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
    'Food': '#FF6384',
    'Rental': '#36A2EB',
    'Groceries': '#FFCE56',
    'Entertainment': '#4BC0C0',
    'Beverage': '#9966FF',
    'Transportation': '#FF9F40',
    'Utilities': '#C9CBCF',
    'Shopping': '#7BC043',
    'Travel': '#F37735',
    'Other': '#8B8B8B',
};

// Merchant colors for pie chart
const MERCHANT_COLORS = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF'];

// =============================================================================
// PERIOD HELPERS
// =============================================================================

/**
 * Get the current period boundaries (start and end dates)
 */
export const getCurrentPeriod = (referenceDate: Date = new Date()): { start: Date; end: Date } => {
    const end = endOfDay(referenceDate);
    const start = startOfDay(subDays(referenceDate, PERIOD_DAYS - 1));
    return { start, end };
};

/**
 * Get period boundaries for a specific number of periods ago
 * 0 = current period, 1 = previous period, etc.
 */
export const getPeriodByOffset = (offset: number, referenceDate: Date = new Date()): { start: Date; end: Date } => {
    const daysAgo = offset * PERIOD_DAYS;
    const periodEnd = endOfDay(subDays(referenceDate, daysAgo));
    const periodStart = startOfDay(subDays(periodEnd, PERIOD_DAYS - 1));
    return { start: periodStart, end: periodEnd };
};

/**
 * Format period label for display
 */
export const formatPeriodLabel = (start: Date, end: Date): string => {
    return `${format(start, 'MMM d')}-${format(end, 'd')}`;
};

// =============================================================================
// EXPENSE TYPE FILTER
// =============================================================================

export type ExpenseTypeFilter = 'all' | 'personal' | 'shared';

/**
 * Filter expenses by type: personal (single participant) or shared (multiple participants)
 */
export const filterExpensesByType = (
    expenses: Expense[],
    filter: ExpenseTypeFilter
): Expense[] => {
    if (filter === 'all') return expenses;
    if (filter === 'personal') return expenses.filter(e => e.participants.length === 1);
    return expenses.filter(e => e.participants.length > 1); // 'shared'
};

// =============================================================================
// USER SPENDING TREND
// =============================================================================

/**
 * Calculate user's personal spending trend across all expenses
 * Returns spending grouped by periods
 */
export const calculateUserSpendingTrend = (
    expenses: Expense[],
    userId: string,
    referenceDate: Date = new Date()
): PeriodSpending[] => {
    const periods: PeriodSpending[] = [];

    for (let i = TREND_PERIODS - 1; i >= 0; i--) {
        const { start, end } = getPeriodByOffset(i, referenceDate);

        const periodExpenses = expenses.filter((expense) => {
            const expenseDate = expense.date.toDate();
            return isWithinInterval(expenseDate, { start, end });
        });

        // Calculate user's share of spending
        let totalSpending = 0;
        periodExpenses.forEach((expense) => {
            if (expense.payerId === userId) {
                // User paid - their share is what they actually spent on themselves
                if (expense.splitType === 'equal') {
                    totalSpending += expense.amount / expense.participants.length;
                } else if (expense.splitAmounts && expense.splitAmounts[userId]) {
                    totalSpending += expense.splitAmounts[userId];
                }
            } else if (expense.participants.includes(userId)) {
                // User is a participant but didn't pay - their share is what they owe
                if (expense.splitType === 'equal') {
                    totalSpending += expense.amount / expense.participants.length;
                } else if (expense.splitAmounts && expense.splitAmounts[userId]) {
                    totalSpending += expense.splitAmounts[userId];
                }
            }
        });

        periods.push({
            periodStart: start,
            periodEnd: end,
            totalSpending,
            label: formatPeriodLabel(start, end),
        });
    }

    return periods;
};

/**
 * Calculate trend comparison between current and previous period
 */
export const calculateTrendComparison = (
    expenses: Expense[],
    userId: string,
    referenceDate: Date = new Date()
): TrendComparison => {
    const periods = calculateUserSpendingTrend(expenses, userId, referenceDate);

    const currentPeriod = periods[periods.length - 1];
    const previousPeriod = periods.length >= 2 ? periods[periods.length - 2] : null;

    if (!previousPeriod || previousPeriod.totalSpending === 0) {
        return {
            currentPeriod,
            previousPeriod,
            percentageChange: null,
            direction: previousPeriod ? 'no-data' : 'no-data',
        };
    }

    const percentageChange = ((currentPeriod.totalSpending - previousPeriod.totalSpending) / previousPeriod.totalSpending) * 100;

    let direction: 'increased' | 'decreased' | 'unchanged';
    if (Math.abs(percentageChange) < 0.01) {
        direction = 'unchanged';
    } else if (percentageChange > 0) {
        direction = 'increased';
    } else {
        direction = 'decreased';
    }

    return {
        currentPeriod,
        previousPeriod,
        percentageChange: Math.abs(percentageChange),
        direction,
    };
};

// =============================================================================
// GROUP ANALYTICS
// =============================================================================

/**
 * Check if a group is active (has expenses in last N days)
 */
export const isGroupActive = (
    groupExpenses: Expense[],
    referenceDate: Date = new Date()
): boolean => {
    const cutoffDate = startOfDay(subDays(referenceDate, ACTIVE_DAYS_THRESHOLD));

    return groupExpenses.some((expense) => {
        const expenseDate = expense.date.toDate();
        return expenseDate >= cutoffDate;
    });
};

/**
 * Calculate spending trend for a specific group
 */
export const calculateGroupSpendingTrend = (
    groupExpenses: Expense[],
    referenceDate: Date = new Date()
): PeriodSpending[] => {
    const periods: PeriodSpending[] = [];

    for (let i = TREND_PERIODS - 1; i >= 0; i--) {
        const { start, end } = getPeriodByOffset(i, referenceDate);

        const periodExpenses = groupExpenses.filter((expense) => {
            const expenseDate = expense.date.toDate();
            return isWithinInterval(expenseDate, { start, end });
        });

        const totalSpending = periodExpenses.reduce((sum, e) => sum + e.amount, 0);

        periods.push({
            periodStart: start,
            periodEnd: end,
            totalSpending,
            label: formatPeriodLabel(start, end),
        });
    }

    return periods;
};

// =============================================================================
// CATEGORY BREAKDOWN
// =============================================================================

/**
 * Calculate category breakdown for current period
 */
export const calculateCategoryBreakdown = (
    expenses: Expense[],
    userId: string,
    referenceDate: Date = new Date()
): CategoryBreakdown[] => {
    const { start, end } = getCurrentPeriod(referenceDate);

    const periodExpenses = expenses.filter((expense) => {
        const expenseDate = expense.date.toDate();
        return isWithinInterval(expenseDate, { start, end });
    });

    // Sum by category (user's share)
    const categoryTotals: Record<string, number> = {};

    periodExpenses.forEach((expense) => {
        let userShare = 0;

        if (expense.payerId === userId || expense.participants.includes(userId)) {
            if (expense.splitType === 'equal') {
                userShare = expense.amount / expense.participants.length;
            } else if (expense.splitAmounts && expense.splitAmounts[userId]) {
                userShare = expense.splitAmounts[userId];
            }
        }

        if (userShare > 0) {
            const category = expense.category || 'Other';
            categoryTotals[category] = (categoryTotals[category] || 0) + userShare;
        }
    });

    // Calculate percentages
    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    if (total === 0) return [];

    return Object.entries(categoryTotals)
        .filter(([, amount]) => amount > 0)
        .map(([category, amount]) => ({
            category,
            amount,
            percentage: (amount / total) * 100,
            color: CATEGORY_COLORS[category as ExpenseCategory] || '#8B8B8B',
        }))
        .sort((a, b) => b.amount - a.amount);
};

// =============================================================================
// MERCHANT BREAKDOWN
// =============================================================================

/**
 * Calculate top 3 merchants for current period
 * Uses expense description as merchant name
 */
export const calculateMerchantBreakdown = (
    expenses: Expense[],
    userId: string,
    referenceDate: Date = new Date()
): MerchantBreakdown[] => {
    const { start, end } = getCurrentPeriod(referenceDate);

    const periodExpenses = expenses.filter((expense) => {
        const expenseDate = expense.date.toDate();
        return isWithinInterval(expenseDate, { start, end });
    });

    // Sum by merchant (description)
    const merchantTotals: Record<string, number> = {};

    periodExpenses.forEach((expense) => {
        let userShare = 0;

        if (expense.payerId === userId || expense.participants.includes(userId)) {
            if (expense.splitType === 'equal') {
                userShare = expense.amount / expense.participants.length;
            } else if (expense.splitAmounts && expense.splitAmounts[userId]) {
                userShare = expense.splitAmounts[userId];
            }
        }

        if (userShare > 0) {
            const merchant = expense.description || 'Unnamed';
            merchantTotals[merchant] = (merchantTotals[merchant] || 0) + userShare;
        }
    });

    // Get top 3 and calculate percentages
    const sortedMerchants = Object.entries(merchantTotals)
        .filter(([, amount]) => amount > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3);

    const total = sortedMerchants.reduce((sum, [, amount]) => sum + amount, 0);

    if (total === 0) return [];

    return sortedMerchants.map(([merchant, amount], index) => ({
        merchant,
        amount,
        percentage: (amount / total) * 100,
        color: MERCHANT_COLORS[index] || '#8B8B8B',
    }));
};

// =============================================================================
// DAILY AVERAGE
// =============================================================================

/**
 * Calculate daily average based on active spending days
 */
export const calculateDailyAverage = (
    expenses: Expense[],
    userId: string,
    referenceDate: Date = new Date()
): DailyAverageStats => {
    const { start, end } = getCurrentPeriod(referenceDate);

    const periodExpenses = expenses.filter((expense) => {
        const expenseDate = expense.date.toDate();
        return isWithinInterval(expenseDate, { start, end });
    });

    // Track unique spending days and total
    const spendingDays = new Set<string>();
    let totalSpending = 0;

    periodExpenses.forEach((expense) => {
        let userShare = 0;

        if (expense.payerId === userId || expense.participants.includes(userId)) {
            if (expense.splitType === 'equal') {
                userShare = expense.amount / expense.participants.length;
            } else if (expense.splitAmounts && expense.splitAmounts[userId]) {
                userShare = expense.splitAmounts[userId];
            }
        }

        if (userShare > 0) {
            totalSpending += userShare;
            const dayKey = format(expense.date.toDate(), 'yyyy-MM-dd');
            spendingDays.add(dayKey);
        }
    });

    const activeDays = spendingDays.size;
    const average = activeDays > 0 ? totalSpending / activeDays : 0;

    return {
        average,
        totalSpending,
        activeDays,
        periodStart: start,
        periodEnd: end,
    };
};

// =============================================================================
// BUDGET MANAGEMENT
// =============================================================================

/**
 * Get user's budget from Firestore
 */
export const getBudget = async (userId: string): Promise<number | null> => {
    try {
        const budgetRef = doc(db, 'users', userId, 'settings', 'budget');
        const budgetDoc = await getDoc(budgetRef);

        if (budgetDoc.exists()) {
            const data = budgetDoc.data() as BudgetData;
            return data.amount;
        }
        return null;
    } catch (error) {
        console.error('Error getting budget:', error);
        return null;
    }
};

/**
 * Set user's budget in Firestore
 */
export const setBudget = async (userId: string, amount: number): Promise<void> => {
    const budgetRef = doc(db, 'users', userId, 'settings', 'budget');

    await setDoc(budgetRef, {
        amount,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
    }, { merge: true });
};

/**
 * Calculate budget vs actual for current period
 */
export const calculateBudgetVsActual = (
    expenses: Expense[],
    userId: string,
    budget: number,
    referenceDate: Date = new Date()
): {
    budget: number;
    actual: number;
    difference: number;
    isOverBudget: boolean;
    percentUsed: number;
} => {
    const { start, end } = getCurrentPeriod(referenceDate);

    const periodExpenses = expenses.filter((expense) => {
        const expenseDate = expense.date.toDate();
        return isWithinInterval(expenseDate, { start, end });
    });

    let actual = 0;
    periodExpenses.forEach((expense) => {
        if (expense.payerId === userId || expense.participants.includes(userId)) {
            if (expense.splitType === 'equal') {
                actual += expense.amount / expense.participants.length;
            } else if (expense.splitAmounts && expense.splitAmounts[userId]) {
                actual += expense.splitAmounts[userId];
            }
        }
    });

    const difference = budget - actual;
    const isOverBudget = actual > budget;
    const percentUsed = budget > 0 ? (actual / budget) * 100 : 0;

    return {
        budget,
        actual,
        difference: Math.abs(difference),
        isOverBudget,
        percentUsed: Math.min(percentUsed, 100),
    };
};

// =============================================================================
// SPENDING TREND
// =============================================================================

/**
 * Calculate category breakdown for a group (total spending)
 */
export const calculateGroupCategoryBreakdown = (
    groupExpenses: Expense[],
    referenceDate: Date = new Date()
): CategoryBreakdown[] => {
    const { start, end } = getCurrentPeriod(referenceDate);

    const periodExpenses = groupExpenses.filter((expense) => {
        const expenseDate = expense.date.toDate();
        return isWithinInterval(expenseDate, { start, end });
    });

    // Sum by category
    const categoryTotals: Record<string, number> = {};

    periodExpenses.forEach((expense) => {
        const category = expense.category || 'Other';
        categoryTotals[category] = (categoryTotals[category] || 0) + expense.amount;
    });

    const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);

    if (total === 0) return [];

    return Object.entries(categoryTotals)
        .map(([category, amount]) => ({
            category,
            amount,
            percentage: (amount / total) * 100,
            color: CATEGORY_COLORS[category as ExpenseCategory] || '#8B8B8B',
        }))
        .filter((item) => item.amount > 0)
        .sort((a, b) => b.amount - a.amount);
};

/**
 * Calculate trend comparison for a group
 */
export const calculateGroupTrendComparison = (
    groupExpenses: Expense[],
    referenceDate: Date = new Date()
): TrendComparison => {
    const periods = calculateGroupSpendingTrend(groupExpenses, referenceDate);

    const currentPeriod = periods[periods.length - 1];
    const previousPeriod = periods.length >= 2 ? periods[periods.length - 2] : null;

    if (!previousPeriod || previousPeriod.totalSpending === 0) {
        return {
            currentPeriod,
            previousPeriod,
            percentageChange: null,
            direction: previousPeriod ? 'unchanged' : 'no-data',
        };
    }

    const percentageChange = ((currentPeriod.totalSpending - previousPeriod.totalSpending) / previousPeriod.totalSpending) * 100;

    let direction: 'increased' | 'decreased' | 'unchanged';
    if (Math.abs(percentageChange) < 0.01) {
        direction = 'unchanged';
    } else if (percentageChange > 0) {
        direction = 'increased';
    } else {
        direction = 'decreased';
    }

    return {
        currentPeriod,
        previousPeriod,
        percentageChange: Math.abs(percentageChange),
        direction,
    };
};
