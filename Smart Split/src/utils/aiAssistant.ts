import { getFunctions, httpsCallable } from 'firebase/functions';
import { ParsedExpense } from '@/src/types/receipt';

interface FriendInfo {
    uid: string;
    displayName: string;
}

interface GroupInfo {
    id: string;
    name: string;
}

interface ConversationMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ExpenseContext {
    timeOfDay: string;
    currency: string;
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
