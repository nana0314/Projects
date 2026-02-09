import { Timestamp } from 'firebase/firestore';

// Bi-weekly (2-day for testing) spending data
export interface PeriodSpending {
    periodStart: Date;
    periodEnd: Date;
    totalSpending: number;
    label: string; // e.g., "Feb 1-2"
}

// Budget data stored in Firestore
export interface BudgetData {
    amount: number;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

// Category breakdown for pie chart
export interface CategoryBreakdown {
    category: string;
    amount: number;
    percentage: number;
    color: string;
}

// Merchant breakdown for pie chart
export interface MerchantBreakdown {
    merchant: string;
    amount: number;
    percentage: number;
    color: string;
}

// Daily average stats
export interface DailyAverageStats {
    average: number;
    totalSpending: number;
    activeDays: number;
    periodStart: Date;
    periodEnd: Date;
}

// Group activity status
export interface GroupActivityStatus {
    groupId: string;
    groupName: string;
    isActive: boolean;
    lastExpenseDate: Date | null;
    currentPeriodSpending: number;
}

// Trend comparison result
export interface TrendComparison {
    currentPeriod: PeriodSpending;
    previousPeriod: PeriodSpending | null;
    percentageChange: number | null;
    direction: 'increased' | 'decreased' | 'unchanged' | 'no-data';
}
