import { Timestamp } from 'firebase/firestore';

export interface WeeklyInsight {
    id: string;
    userId: string;
    weekOf: Timestamp; // Start of the week this insight covers
    totalSpent: number;
    topCategory: string;
    topCategoryAmount: number;
    comparisonToPrevWeek: number; // Percentage change: positive = spent more, negative = spent less
    tips: string[]; // AI-generated tips (2-3 tips)
    summary: string; // AI-generated natural language summary
    personalExpenses: number; // Total personal expenses this week
    sharedExpenses: number; // Total shared expenses this week
    createdAt: Timestamp;
}

export interface InsightSettings {
    enabled: boolean;
    lastGeneratedAt?: Timestamp;
}
