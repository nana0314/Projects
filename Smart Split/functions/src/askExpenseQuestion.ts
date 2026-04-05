import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

interface ExpenseDoc {
    amount: number;
    category: string;
    participants: string[];
    payerId: string;
    date: admin.firestore.Timestamp;
    description?: string;
    settledAt?: admin.firestore.Timestamp;
    type?: string;
}

interface AskInput {
    question: string;
    dateRange?: { start: string; end: string }; // ISO strings
}

export const askExpenseQuestion = functions.https.onCall(async (data: AskInput, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'You must be logged in.');
    }
    const userId = context.auth.uid;
    const { question } = data;

    if (!question?.trim()) {
        throw new functions.https.HttpsError('invalid-argument', 'Question is required.');
    }

    // Rate limit: reuse the same usage counter as parseExpense
    const today = new Date().toISOString().split('T')[0];
    const usageRef = db.doc(`users/${userId}/usage/${today}`);
    const DAILY_LIMIT = 100;

    const allowed = await db.runTransaction(async (tx) => {
        const snap = await tx.get(usageRef);
        const count = snap.exists ? (snap.data()?.count || 0) : 0;
        if (count >= DAILY_LIMIT) return false;
        tx.set(usageRef, { count: count + 1 }, { merge: true });
        return true;
    });

    if (!allowed) {
        throw new functions.https.HttpsError(
            'resource-exhausted',
            `You've reached your daily limit of ${DAILY_LIMIT} AI requests.`
        );
    }

    // Determine date range
    const now = new Date();
    const rangeEnd = data.dateRange?.end ? new Date(data.dateRange.end) : now;
    const rangeStart = data.dateRange?.start
        ? new Date(data.dateRange.start)
        : new Date(now.getFullYear(), now.getMonth() - 2, 1); // Default: last ~2 months

    // Fetch expenses
    const snap = await db
        .collection('expenses')
        .where('participants', 'array-contains', userId)
        .where('date', '>=', admin.firestore.Timestamp.fromDate(rangeStart))
        .where('date', '<=', admin.firestore.Timestamp.fromDate(rangeEnd))
        .orderBy('date', 'desc')
        .get();

    const expenses = snap.docs.map((d) => d.data() as ExpenseDoc);
    const active = expenses.filter((e) => !e.settledAt && e.type !== 'settlement');

    // Compute analytics
    const totalSpent = active.reduce((sum, e) => {
        const share = e.payerId === userId ? e.amount : e.amount / e.participants.length;
        return sum + share;
    }, 0);

    const categoryTotals: Record<string, number> = {};
    active.forEach((e) => {
        const share = e.payerId === userId ? e.amount : e.amount / e.participants.length;
        categoryTotals[e.category] = (categoryTotals[e.category] || 0) + share;
    });

    const topCategories = Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`);

    const personalTotal = active
        .filter((e) => e.participants.length === 1 || (e.payerId === userId && e.participants.length === 1))
        .reduce((sum, e) => sum + e.amount, 0);
    const sharedTotal = totalSpent - personalTotal;

    const monthlyMap: Record<string, number> = {};
    active.forEach((e) => {
        const share = e.payerId === userId ? e.amount : e.amount / e.participants.length;
        const month = e.date.toDate().toLocaleString('default', { month: 'short', year: 'numeric' });
        monthlyMap[month] = (monthlyMap[month] || 0) + share;
    });
    const monthlyBreakdown = Object.entries(monthlyMap)
        .map(([m, a]) => `${m}: $${a.toFixed(2)}`)
        .join(', ');

    // Fetch budget if any
    let budgetLine = '';
    try {
        const budgetSnap = await db.doc(`users/${userId}/settings/budget`).get();
        if (budgetSnap.exists) {
            const budget = budgetSnap.data()?.amount;
            if (budget) {
                const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const currentMonthSpent = active
                    .filter((e) => e.date.toDate() >= currentMonthStart)
                    .reduce((sum, e) => {
                        const share = e.payerId === userId ? e.amount : e.amount / e.participants.length;
                        return sum + share;
                    }, 0);
                budgetLine = `Monthly budget: $${budget.toFixed(2)}, spent this month: $${currentMonthSpent.toFixed(2)} (${((currentMonthSpent / budget) * 100).toFixed(0)}%)`;
            }
        }
    } catch { /* budget is optional */ }

    // Build Gemini prompt
    const prompt = `You are a helpful personal finance assistant for Smart Split, an expense tracking app.
The user has asked: "${question}"

Their spending data (${rangeStart.toLocaleDateString()} – ${rangeEnd.toLocaleDateString()}):
- Total spent: $${totalSpent.toFixed(2)}
- Personal expenses: $${personalTotal.toFixed(2)}
- Shared expenses: $${sharedTotal.toFixed(2)}
- Top categories: ${topCategories.join(', ') || 'No data'}
- Monthly breakdown: ${monthlyBreakdown || 'No data'}
${budgetLine ? `- ${budgetLine}` : ''}
- Number of transactions: ${active.length}

Answer the user's question directly and helpfully in 2-4 sentences. Be specific with numbers from their data. If the question is about budgeting or recommendations, give concrete advice based on their actual spending patterns.`;

    try {
        const { VertexAI } = await import('@google-cloud/vertexai');
        const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
        if (!projectId) throw new Error('No project ID');

        const vertexAI = new VertexAI({ project: projectId, location: 'us-central1' });
        const model = vertexAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const result = await model.generateContent(prompt);
        const text = result.response.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return { answer: text.trim() || 'I couldn\'t generate an answer. Please try again.' };
    } catch (err) {
        console.error('Vertex AI error:', err);
        // Fallback: simple template answer
        const fallback = generateFallbackAnswer(question, totalSpent, topCategories, active.length);
        return { answer: fallback };
    }
});

function generateFallbackAnswer(
    question: string,
    total: number,
    topCategories: string[],
    count: number
): string {
    const q = question.toLowerCase();
    if (q.includes('spend') || q.includes('spent') || q.includes('total')) {
        return `You spent a total of $${total.toFixed(2)} across ${count} transactions. Your top spending categories were: ${topCategories.slice(0, 3).join(', ')}.`;
    }
    if (q.includes('categor') || q.includes('most')) {
        return `Your highest spending categories were: ${topCategories.slice(0, 3).join(', ')}.`;
    }
    return `Based on your data, you had ${count} transactions totalling $${total.toFixed(2)}. Top categories: ${topCategories.slice(0, 3).join(', ')}.`;
}
