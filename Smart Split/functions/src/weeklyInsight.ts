import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Weekly Insight Cloud Function
 * Scheduled to run every Sunday at 9:00 AM UTC.
 * 
 * For each user with aiInsightsEnabled=true, fetches their expenses
 * from the past week, calculates spending metrics, and generates
 * an AI-powered insight using Vertex AI (Gemini).
 * 
 * NOTE: This function requires the @google-cloud/vertexai package
 * and the Vertex AI API to be enabled in your Google Cloud project.
 * If Vertex AI is not available, it falls back to a template-based insight.
 */

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

interface ExpenseData {
    amount: number;
    category: string;
    participants: string[];
    payerId: string;
    date: admin.firestore.Timestamp;
    settledAt?: admin.firestore.Timestamp;
    type?: string;
}

/**
 * On-demand insight generation — callable by the client.
 * Generates an insight for the authenticated user immediately.
 */
export const generateInsightNow = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const userId = context.auth.uid;
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    await generateInsightForUser(userId, weekAgo, twoWeeksAgo, now);
    return { success: true };
});

export const generateWeeklyInsights = functions.pubsub
    .schedule('every sunday 09:00')
    .timeZone('UTC')
    .onRun(async () => {
        console.log('Starting weekly insight generation...');

        // Find all users with AI insights enabled
        const usersSnap = await db
            .collection('users')
            .where('aiInsightsEnabled', '==', true)
            .get();

        if (usersSnap.empty) {
            console.log('No users have AI insights enabled.');
            return;
        }

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

        for (const userDoc of usersSnap.docs) {
            const userId = userDoc.id;
            try {
                await generateInsightForUser(userId, weekAgo, twoWeeksAgo, now);
            } catch (err) {
                console.error(`Failed to generate insight for user ${userId}:`, err);
            }
        }

        console.log(`Generated insights for ${usersSnap.size} users.`);
    });

async function generateInsightForUser(
    userId: string,
    weekAgo: Date,
    twoWeeksAgo: Date,
    now: Date
): Promise<void> {
    // Fetch all user expenses in one query (array-contains + date range requires a
    // composite index that may not exist — filter by date in code instead)
    const allSnap = await db
        .collection('expenses')
        .where('participants', 'array-contains', userId)
        .get();

    const twoWeeksAgoTs = admin.firestore.Timestamp.fromDate(twoWeeksAgo);
    const weekAgoTs = admin.firestore.Timestamp.fromDate(weekAgo);
    const nowTs = admin.firestore.Timestamp.fromDate(now);

    const thisWeekExpenses = allSnap.docs
        .map((d) => d.data() as ExpenseData)
        .filter((e) => e.date >= weekAgoTs && e.date <= nowTs);

    const lastWeekExpenses = allSnap.docs
        .map((d) => d.data() as ExpenseData)
        .filter((e) => e.date >= twoWeeksAgoTs && e.date < weekAgoTs);

    // Calculate metrics
    const thisWeekTotal = calculateTotal(thisWeekExpenses, userId);
    const lastWeekTotal = calculateTotal(lastWeekExpenses, userId);
    const comparisonToPrevWeek =
        lastWeekTotal > 0
            ? ((thisWeekTotal - lastWeekTotal) / lastWeekTotal) * 100
            : 0;

    const categoryBreakdown = calculateCategoryBreakdown(thisWeekExpenses, userId);
    const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

    const personalExpenses = thisWeekExpenses
        .filter((e) => e.participants.length === 1 && e.participants[0] === userId)
        .reduce((sum, e) => sum + e.amount, 0);
    const sharedExpenses = thisWeekTotal - personalExpenses;

    // Generate AI insight (or fallback)
    let summary: string;
    let tips: string[];

    try {
        const aiResult = await generateAIInsight(
            thisWeekTotal,
            lastWeekTotal,
            comparisonToPrevWeek,
            categoryBreakdown,
            personalExpenses,
            sharedExpenses
        );
        summary = aiResult.summary;
        tips = aiResult.tips;
    } catch (err) {
        console.warn(`AI generation failed for user ${userId}, using fallback:`, err);
        const fallback = generateFallbackInsight(
            thisWeekTotal,
            comparisonToPrevWeek,
            topCategory?.[0] || 'Other',
            personalExpenses,
            sharedExpenses
        );
        summary = fallback.summary;
        tips = fallback.tips;
    }

    // Save insight to Firestore
    await db.collection(`users/${userId}/insights`).add({
        userId,
        weekOf: admin.firestore.Timestamp.fromDate(weekAgo),
        totalSpent: thisWeekTotal,
        topCategory: topCategory?.[0] || 'Other',
        topCategoryAmount: topCategory?.[1] || 0,
        comparisonToPrevWeek,
        tips,
        summary,
        personalExpenses,
        sharedExpenses,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
}

function calculateTotal(expenses: ExpenseData[], userId: string): number {
    return expenses.reduce((sum, exp) => {
        if (exp.settledAt || exp.type === 'settlement') return sum;
        // Calculate user's share
        if (exp.payerId === userId) {
            return sum + exp.amount;
        }
        // User is a participant, calculate their share
        const share = exp.amount / exp.participants.length;
        return sum + share;
    }, 0);
}

function calculateCategoryBreakdown(
    expenses: ExpenseData[],
    userId: string
): { [category: string]: number } {
    const breakdown: { [category: string]: number } = {};
    expenses.forEach((exp) => {
        if (exp.settledAt || exp.type === 'settlement') return;
        const share =
            exp.payerId === userId
                ? exp.amount
                : exp.amount / exp.participants.length;
        breakdown[exp.category] = (breakdown[exp.category] || 0) + share;
    });
    return breakdown;
}

async function generateAIInsight(
    total: number,
    lastWeekTotal: number,
    percentChange: number,
    categories: { [key: string]: number },
    personal: number,
    shared: number
): Promise<{ summary: string; tips: string[] }> {
    try {
        // Try to import Vertex AI
        const { VertexAI } = await import('@google-cloud/vertexai');

        const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
        if (!projectId) throw new Error('No project ID found');

        const vertexAI = new VertexAI({
            project: projectId,
            location: 'us-central1',
        });

        const model = vertexAI.getGenerativeModel({
            model: 'gemini-2.5-flash-lite',
        });

        const prompt = `You are a helpful personal finance assistant. Analyze this user's weekly spending and provide a brief, friendly summary and 2-3 actionable tips.

Weekly Spending Data:
- Total spent: $${total.toFixed(2)}
- Last week: $${lastWeekTotal.toFixed(2)} (${percentChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(0)}%)
- Personal expenses: $${personal.toFixed(2)}
- Shared expenses: $${shared.toFixed(2)}
- Category breakdown: ${Object.entries(categories).map(([k, v]) => `${k}: $${v.toFixed(2)}`).join(', ')}

Respond in JSON format only:
{"summary": "Brief 1-2 sentence overview", "tips": ["tip1", "tip2", "tip3"]}`;

        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        // Parse JSON from response
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                summary: parsed.summary || 'No summary available.',
                tips: Array.isArray(parsed.tips) ? parsed.tips.slice(0, 3) : [],
            };
        }
    } catch (err) {
        console.warn('Vertex AI not available, using fallback:', err);
    }

    throw new Error('AI generation failed');
}

function generateFallbackInsight(
    total: number,
    percentChange: number,
    topCategory: string,
    personal: number,
    shared: number
): { summary: string; tips: string[] } {
    const direction = percentChange > 0 ? 'more' : 'less';
    const absChange = Math.abs(percentChange).toFixed(0);

    const summary =
        total === 0
            ? 'You had no expenses this week. Great job saving!'
            : `You spent $${total.toFixed(0)} this week — ${absChange}% ${direction} than last week. Your top category was ${topCategory}.`;

    const tips: string[] = [];
    if (total > 0 && percentChange > 10) {
        tips.push(`Your spending increased by ${absChange}%. Consider reviewing your ${topCategory} expenses.`);
    }
    if (personal > shared && personal > 0) {
        tips.push('Most of your expenses were personal. Consider if any could be shared with friends.');
    }
    if (shared > personal && shared > 0) {
        tips.push('Most of your expenses were shared. Make sure to settle up regularly!');
    }
    if (tips.length === 0) {
        tips.push('Keep tracking your expenses consistently for better insights over time.');
    }

    return { summary, tips };
}
