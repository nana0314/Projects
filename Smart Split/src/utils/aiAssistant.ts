import { getFunctions, httpsCallable } from 'firebase/functions';
import { ParsedExpense } from '@/src/types/receipt';
import { getUserExpenses } from '@/src/utils/expenses';

interface FriendInfo {
    uid: string;
    displayName: string;
}

interface GroupInfo {
    id: string;
    name: string;
    members?: { uid: string; displayName: string }[];
}

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ExpensePattern {
    merchant: string;
    category: string;
    count: number;
}

interface ExpenseContext {
    timeOfDay: string;
    currency: string;
    recentPatterns?: ExpensePattern[];
}

/**
 * Build context information for smart defaults.
 */
export function buildContext(): ExpenseContext {
    const hour = new Date().getHours();
    let timeOfDay: string;

    if (hour >= 5 && hour < 12) {
        timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
        timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
        timeOfDay = 'evening';
    } else {
        timeOfDay = 'night';
    }

    // Default to USD, could be extended with user locale detection
    const currency = 'USD';

    return { timeOfDay, currency };
}

/**
 * Extract expense patterns from user's past expenses.
 * This builds a merchant→category mapping with frequency counts
 * so the AI can learn from the user's habits.
 */
export async function buildExpensePatterns(userId: string): Promise<ExpensePattern[]> {
    try {
        const expenses = await getUserExpenses(userId);

        // Build merchant → category frequency map
        const merchantMap: Record<string, Record<string, number>> = {};

        expenses.forEach((expense) => {
            const merchant = expense.description?.trim();
            if (!merchant || merchant === 'Settlement payment') return;

            const category = expense.category || 'Other';

            if (!merchantMap[merchant]) {
                merchantMap[merchant] = {};
            }
            merchantMap[merchant][category] = (merchantMap[merchant][category] || 0) + 1;
        });

        // For each merchant, pick the most frequently used category
        const patterns: ExpensePattern[] = [];

        for (const [merchant, categories] of Object.entries(merchantMap)) {
            // Find the most common category for this merchant
            let bestCategory = 'Other';
            let bestCount = 0;

            for (const [category, count] of Object.entries(categories)) {
                if (count > bestCount) {
                    bestCategory = category;
                    bestCount = count;
                }
            }

            patterns.push({
                merchant,
                category: bestCategory,
                count: bestCount,
            });
        }

        // Sort by frequency (most used first) and take top 20
        patterns.sort((a, b) => b.count - a.count);
        return patterns.slice(0, 20);
    } catch (err) {
        console.error('Error building expense patterns:', err);
        return [];
    }
}

/**
 * Call the parseExpense Cloud Function in text/chat mode.
 */
export async function parseTextExpense(
    message: string,
    friendsList: FriendInfo[],
    groupsList?: GroupInfo[],
    conversationHistory?: ConversationMessage[],
    context?: ExpenseContext
): Promise<ParsedExpense> {
    const functions = getFunctions();
    const parseExpense = httpsCallable<
        {
            type: string;
            message: string;
            friendsList: FriendInfo[];
            groupsList?: GroupInfo[];
            conversationHistory?: ConversationMessage[];
            context?: ExpenseContext;
        },
        ParsedExpense
    >(functions, 'parseExpense');

    const result = await parseExpense({
        type: 'text',
        message,
        friendsList,
        groupsList,
        conversationHistory,
        context: context || buildContext(),
    });

    return result.data;
}

/**
 * Format a parsed expense into a human-readable summary string.
 */
export function formatExpenseSummary(parsed: ParsedExpense): string {
    if (!parsed.success) {
        return parsed.message || 'Could not parse expense.';
    }

    const parts: string[] = [];

    // Merchant/description
    if (parsed.merchant) {
        parts.push(`\u{1F3EA} ${parsed.merchant}`);
    }

    // Amount
    if (parsed.total) {
        const currency = parsed.currency || 'USD';
        const symbol = currency === 'USD' ? '$' : currency;
        parts.push(`\u{1F4B0} ${symbol}${parsed.total.toFixed(2)}`);
    }

    // Category
    if (parsed.category) {
        parts.push(`\u{1F4C2} ${parsed.category}`);
    }

    // Participants
    if (parsed.participants && parsed.participants.length > 0) {
        const names = parsed.participants.map(
            (p) => p.matchedName || p.inputName
        );
        parts.push(`\u{1F465} Split with: ${names.join(', ')}`);
    }

    // Group
    if (parsed.groupName) {
        parts.push(`\u{1F3E0} Group: ${parsed.groupName}`);
    }

    return parts.join('\n');
}
