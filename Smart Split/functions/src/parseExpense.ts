import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Ensure Firebase Admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}

const db = admin.firestore();

// ── Types ────────────────────────────────────────────────────────────────────

interface ReceiptInput {
    type: 'receipt';
    fileUrl: string;
}

interface TextInput {
    type: 'text';
    message: string;
    friendsList: { uid: string; displayName: string }[];
    groupsList?: { id: string; name: string }[];
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[];
    context?: { timeOfDay: string; currency: string };
}

type ParseExpenseInput = ReceiptInput | TextInput;

interface ParsedExpense {
    success: boolean;
    confidence: number;
    merchant?: string;
    date?: string;
    items?: { name: string; price: number }[];
    total?: number;
    currency?: string;
    category?: string;
    participants?: {
        inputName: string;
        matchedUid: string | null;
        matchedName: string | null;
        confidence: number;
    }[];
    splitType?: 'equal' | 'custom';
    groupId?: string;
    groupName?: string;
    needsFollowUp?: boolean;
    followUpQuestion?: string;
    message?: string;
}

// ── Rate Limiting ────────────────────────────────────────────────────────────

const DAILY_LIMIT = 100; // Generous limit for testing

async function checkAndIncrementUsage(userId: string): Promise<boolean> {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const usageRef = db.doc(`users/${userId}/usage/${today}`);

    const result = await db.runTransaction(async (transaction) => {
        const usageDoc = await transaction.get(usageRef);
        const currentCount = usageDoc.exists ? (usageDoc.data()?.count || 0) : 0;

        if (currentCount >= DAILY_LIMIT) {
            return false; // Rate limit exceeded
        }

        transaction.set(usageRef, {
            count: currentCount + 1,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        return true;
    });

    return result;
}

// ── Gemini Integration ───────────────────────────────────────────────────────

const GEMINI_MODEL = 'gemini-2.5-flash-lite';

async function callGeminiWithImage(imageBase64: string, mimeType: string): Promise<ParsedExpense> {
    const { VertexAI } = await import('@google-cloud/vertexai');

    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) throw new Error('No project ID found');

    const vertexAI = new VertexAI({
        project: projectId,
        location: 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({ model: GEMINI_MODEL });

    const prompt = `You are a receipt scanning assistant. Analyze this receipt image and extract the following information.

Return a valid JSON object with these fields:
{
  "success": true,
  "confidence": 0.0 to 1.0,
  "merchant": "store/restaurant name",
  "date": "YYYY-MM-DD or null if not visible",
  "items": [{"name": "item name", "price": 12.99}],
  "total": 45.00,
  "currency": "USD",
  "category": "one of: Food, Rental, Groceries, Entertainment, Beverage, Transportation, Utilities, Shopping, Travel, Other"
}

Rules:
- Extract the merchant/store name from the header of the receipt
- Extract all line items with their prices
- Extract the total amount (use the final total, not subtotal)
- Map the merchant to the most appropriate category
- If the receipt is unclear or not a receipt, set success to false and confidence to 0
- Only return valid JSON, no other text`;

    const result = await model.generateContent({
        contents: [{
            role: 'user',
            parts: [
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: imageBase64,
                    },
                },
            ],
        }],
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
            success: parsed.success !== false,
            confidence: parsed.confidence || 0,
            merchant: parsed.merchant,
            date: parsed.date,
            items: Array.isArray(parsed.items) ? parsed.items : [],
            total: parsed.total,
            currency: parsed.currency || 'USD',
            category: parsed.category || 'Other',
        };
    }

    return {
        success: false,
        confidence: 0,
        message: 'Could not parse receipt. Please try again with a clearer image.',
    };
}

async function callGeminiWithText(
    message: string,
    friendsList: { uid: string; displayName: string }[],
    groupsList?: { id: string; name: string }[],
    conversationHistory?: { role: 'user' | 'assistant'; content: string }[],
    context?: { timeOfDay: string; currency: string }
): Promise<ParsedExpense> {
    const { VertexAI } = await import('@google-cloud/vertexai');

    const projectId = process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT;
    if (!projectId) throw new Error('No project ID found');

    const vertexAI = new VertexAI({
        project: projectId,
        location: 'us-central1',
    });

    const model = vertexAI.getGenerativeModel({ model: GEMINI_MODEL });

    // Build friend list string — display names only for security, UIDs for matching
    const friendListStr = friendsList.length > 0
        ? friendsList.map(f => `- "${f.displayName}" (uid: ${f.uid})`).join('\n')
        : '(no friends added yet)';

    const groupListStr = groupsList && groupsList.length > 0
        ? groupsList.map(g => `- "${g.name}" (id: ${g.id})`).join('\n')
        : '(no groups)';

    const timeContext = context
        ? `Current time of day: ${context.timeOfDay}. User's preferred currency: ${context.currency}.`
        : '';

    const systemPrompt = `You are a smart, friendly AI expense assistant for a bill-splitting app called Smart Split. Your job is to help users log expenses quickly through natural language conversation.

${timeContext}

=== USER'S FRIEND LIST ===
${friendListStr}

=== USER'S GROUPS ===
${groupListStr}

=== YOUR TASK ===
Parse the user's message to extract expense details. You MUST return ONLY a valid JSON object (no markdown, no code fences, no extra text).

=== JSON RESPONSE FORMAT ===
{
  "success": true,
  "confidence": 0.0 to 1.0,
  "merchant": "merchant or description of the expense",
  "total": 45.00,
  "currency": "USD",
  "category": "Food | Rental | Groceries | Entertainment | Beverage | Transportation | Utilities | Shopping | Travel | Other",
  "participants": [
    {
      "inputName": "what the user typed",
      "matchedUid": "uid from friend list or null",
      "matchedName": "exact display name from friend list or null",
      "confidence": 0.0 to 1.0
    }
  ],
  "splitType": "equal",
  "groupId": "matched group id or null",
  "groupName": "matched group name or null",
  "needsFollowUp": false,
  "followUpQuestion": null,
  "message": "Your friendly response to the user"
}

=== CRITICAL RULES FOR PARTICIPANT MATCHING ===
1. When the user mentions names, you MUST search the friend list above for matches.
2. Use FUZZY matching: "Jon" should match "John Smith", "Sara" should match "Sarah Lee", etc.
3. If a name has a CLOSE match in the friend list (typo, nickname, partial name), set matchedUid to that friend's uid and matchedName to their exact display name. Set confidence based on how close the match is.
4. If a name has NO match at all in the friend list, you MUST:
   - Set needsFollowUp to true
   - In your message, explicitly tell the user: "I couldn't find '[name]' in your friend list. Your friends are: [list all friend names]. Did you mean one of them, or is this a new person?"
   - Still include the unmatched name in participants with matchedUid: null and matchedName: null
5. NEVER silently ignore unmatched participants. ALWAYS tell the user about unmatched names.

=== CRITICAL RULES FOR GROUP MATCHING ===
1. When the user mentions a group, search the group list above for matches.
2. If a group name matches, set groupId and groupName.
3. If the mentioned group doesn't exist, set needsFollowUp to true and tell the user which groups are available.

=== CRITICAL RULES FOR FOLLOW-UP ===
1. If the AMOUNT is missing, ALWAYS set needsFollowUp to true and ask for the amount.
2. If participants are mentioned but NONE match the friend list, set needsFollowUp to true and list the available friends.
3. If the category is ambiguous, you can suggest one based on time-of-day defaults:
   - Morning: Beverage or Food
   - Lunch (noon): Food
   - Afternoon: Food or Shopping
   - Evening: Entertainment or Food
   - Night: Entertainment
4. After successfully parsing everything, your message should be a clear summary like:
   "Got it! [Merchant] for $[amount], split equally with [names]. Category: [category]. Ready to save!"

=== SUPPORTED INPUT FORMATS ===
- "Pizzahut 45, split with John, Mary" — explicit split
- "Coffee 12.50" — personal expense (no split)
- "Uber 30, for Weekend Trip group" — group expense
- "John owes me 20 for lunch" — directional debt (John is participant)
- "Split dinner 120 equally between me, John and Mary"
- "I paid 50 for groceries, John and I split it"

=== IMPORTANT ===
- Only handle expense-related requests. For anything else, set success to false and respond helpfully.
- The "message" field is what the user sees. Make it conversational and helpful.
- Always return valid JSON only. No markdown formatting, no code fences.`;

    // Build conversation contents for multi-turn
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // Add conversation history
    if (conversationHistory && conversationHistory.length > 0) {
        // Add system context as first user message
        contents.push({
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nHere is our conversation so far. Please continue helping the user based on the full context above.' }],
        });
        contents.push({
            role: 'model',
            parts: [{
                text: JSON.stringify({
                    success: false,
                    confidence: 0,
                    needsFollowUp: false,
                    message: "I understand. I'll help you log expenses. Tell me what you spent!"
                })
            }],
        });

        // Add history (last 10 messages = ~5 exchanges)
        const recentHistory = conversationHistory.slice(-10);
        for (const msg of recentHistory) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }],
            });
        }

        // Add current message
        contents.push({
            role: 'user',
            parts: [{ text: message }],
        });
    } else {
        // Single-turn: system prompt + user message
        contents.push({
            role: 'user',
            parts: [{ text: systemPrompt + '\n\nUser message: ' + message }],
        });
    }

    const result = await model.generateContent({ contents });
    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Try to extract JSON from the response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            const parsed = JSON.parse(jsonMatch[0]);
            return {
                success: parsed.success !== false,
                confidence: parsed.confidence || 0,
                merchant: parsed.merchant || undefined,
                total: parsed.total || undefined,
                currency: parsed.currency || 'USD',
                category: parsed.category || 'Other',
                participants: Array.isArray(parsed.participants) ? parsed.participants : [],
                splitType: parsed.splitType || 'equal',
                groupId: parsed.groupId || undefined,
                groupName: parsed.groupName || undefined,
                needsFollowUp: parsed.needsFollowUp || false,
                followUpQuestion: parsed.followUpQuestion || undefined,
                message: parsed.message || undefined,
            };
        } catch (parseError) {
            console.error('JSON parse error:', parseError, 'Raw text:', text);
        }
    }

    return {
        success: false,
        confidence: 0,
        message: 'I had trouble understanding that. Could you try rephrasing? For example: "Pizzahut 45, split with John"',
        needsFollowUp: true,
        followUpQuestion: 'Could you tell me the merchant/description, amount, and who to split with?',
    };
}

// ── Main Cloud Function ──────────────────────────────────────────────────────

export const parseExpense = functions.https.onCall(async (data: ParseExpenseInput, context) => {
    // 1. Authenticate
    if (!context.auth) {
        throw new functions.https.HttpsError(
            'unauthenticated',
            'You must be logged in to use this feature.'
        );
    }

    const userId = context.auth.uid;

    // 2. Rate limit
    const allowed = await checkAndIncrementUsage(userId);
    if (!allowed) {
        throw new functions.https.HttpsError(
            'resource-exhausted',
            `You've reached your daily limit of ${DAILY_LIMIT} AI requests. Try again tomorrow!`
        );
    }

    // 3. Process based on type
    try {
        if (data.type === 'receipt') {
            // Receipt mode: download image from Storage and process
            const fileUrl = data.fileUrl;
            if (!fileUrl) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'File URL is required for receipt scanning.'
                );
            }

            // Extract the Storage path from the URL
            const bucket = admin.storage().bucket();
            let filePath: string;

            if (fileUrl.startsWith('gs://')) {
                filePath = fileUrl.replace(/^gs:\/\/[^/]+\//, '');
            } else {
                // Extract path from download URL
                const match = fileUrl.match(/\/o\/(.+?)(\?|$)/);
                if (match) {
                    filePath = decodeURIComponent(match[1]);
                } else {
                    throw new functions.https.HttpsError(
                        'invalid-argument',
                        'Invalid file URL format.'
                    );
                }
            }

            const file = bucket.file(filePath);

            // Validate file exists and check size
            const [metadata] = await file.getMetadata();
            const fileSize = parseInt(metadata.size as string, 10);

            if (fileSize > 5 * 1024 * 1024) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Image is too large. Please use an image under 5MB.'
                );
            }

            const contentType = metadata.contentType || 'image/jpeg';
            if (!contentType.startsWith('image/')) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'File must be an image.'
                );
            }

            // Download and convert to base64
            const [fileBuffer] = await file.download();
            const base64Image = fileBuffer.toString('base64');

            return await callGeminiWithImage(base64Image, contentType);

        } else if (data.type === 'text') {
            // Text/Chat mode
            const { message, friendsList, groupsList, conversationHistory, context: userContext } = data;

            if (!message || message.trim().length === 0) {
                throw new functions.https.HttpsError(
                    'invalid-argument',
                    'Message is required.'
                );
            }

            return await callGeminiWithText(
                message.trim(),
                friendsList || [],
                groupsList,
                conversationHistory,
                userContext
            );

        } else {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'Invalid request type. Must be "receipt" or "text".'
            );
        }
    } catch (error: any) {
        // Re-throw HttpsErrors, wrap others
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        console.error('parseExpense error:', error);
        throw new functions.https.HttpsError(
            'internal',
            'An error occurred while processing your request. Please try again.'
        );
    }
});
