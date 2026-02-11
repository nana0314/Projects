
# Phase 3 Upgrade: AI & Advanced Analytics

## Executive Summary
This document outlines the "Smart Split AI" upgrade.
**Goal**: Integrate affordable, high-impact AI features that work seamlessly on iOS/Android via Capacitor.
**Core Philosophy**: "Serverless AI". We will avoid managing complex Python servers. We will use **Firebase + Gemini API** directly.

---

## 1. The "Super-Feature": AI Financial Assistant (Merged)
> *User Question: Can I merge Chatbot + Receipt Scanning?*
> **Answer: YES.**

Instead of separate "Chat" and "Scan" tools, we build a single **Smart Assistant Interface**.

### User Experience: "Auto-Fill Magic"
1.  **Scan**: User taps "Scan Receipt" (Camera opens).
2.  **AI Process**: Gemini extracts Merchant, Date, Total, and Items.
3.  **Review**: The app opens the standard **"Add Expense"** screen, but it is **pre-filled** with the data.
4.  **Edit & Save**: User corrects any mistakes (e.g., changes category) and hits "Save".

*Why this is better*: It feels like magic but keeps the user in control. They don't have to "chat" to fix a $5 mistake; they just tap the text field.

### Image Capture Strategy (Web → Native Transition)
- **Before Capacitor**: Use `<input type="file" accept="image/*" capture="camera">` — this opens the native camera on mobile browsers and also works inside Capacitor's WebView.
- **After Capacitor**: Upgrade to `@capacitor/camera` plugin for a more polished experience (instant camera, no file picker dialog). The basic web version works as a fallback.
- This means receipt scanning UI can be **built and tested now** without Capacitor.

### Error & Edge Case Handling
- **Non-receipt images**: If Gemini returns no merchant/total or a low confidence score, show "We couldn't read this clearly — please enter manually" instead of pre-filling with garbage data.
- **Blurry/partial receipts**: Allow the user to re-scan or manually fill remaining fields. Pre-fill whatever was extracted.
- **Non-English receipts**: Gemini 1.5 Flash supports multilingual input — document supported languages and test with common local receipts.
- **Cloud Function timeout**: Set a 30-second timeout with a clear loading spinner. If it fails, show a retry option.
- **Gemini API unavailable**: Graceful fallback — user can still add expenses manually.

### Tech Stack Recommendation (Cost: Low/Free)
*   **AI Model**: **Google Gemini 1.5 Flash**.
    *   *Why?* It is extremely fast, cheap, and multimodal (can "see" receipts and "read" text).
    *   *Cost*: Free tier is generous.
*   **Backend**: **Firebase Cloud Functions (Node.js)**.
    *   *Why?* No need for a separate Python server. Gemini comes with a Node.js SDK.
*   **Database**: Firestore (Existing).

### Cost Control & Rate Limiting
- **Per-user limit**: Max 20 receipt scans per user per day (tracked in Firestore `users/{uid}/usage/{date}`).
- **Image size enforcement**: Server-side validation — reject images > 5MB even if the client compresses them.
- **Estimated costs** (Gemini 1.5 Flash):
  - 10 users × 5 scans/day ≈ Free tier
  - 100 users × 5 scans/day ≈ ~$5/month
  - 1000 users × 5 scans/day ≈ ~$50/month
- **Budget alert**: Set up Cloud Billing alerts at $10, $25, $50 thresholds.

---

## 2. QR Code Scanner (Friends/Groups)
> *User Question: In-built Camera vs Custom?*
> **Recommendation: Use `capacitor-community/barcode-scanner` (Native)**

*   **Why Native?** Web-based scanners (`jsQR`, `react-qr-reader`) are laggy and blurry — a previous attempt with these libraries was reverted due to poor performance. The Native scanner uses the phone's hardware directly.
*   **Availability**: This feature **requires Capacitor** — it cannot be implemented for the web PWA. Build it after the Capacitor migration.
*   **Flow**:
    1.  User taps "Scan QR".
    2.  App opens full-screen native camera.
    3.  Instantly detects User ID / Group ID.

---

## 3. AI Insights & Analytics (Consolidated)
*Merging features 4, 5, 6, 7, 8 into a single "Intelligence Layer".*

Don't build 5 different "micro-features". Build one **"Weekly Insight Job"**.

### Feature: "The Sunday Briefing"
Every Sunday, a Cloud Function runs and asks Gemini to analyze the user's last 30 days of expenses.

**Gemini Prompt**:
> "Analyze these 50 expenses. Identify: 1) Abnormal spikes (Z-score concept), 2) Recurring subscriptions, 3) Forecast next month. output JSON."

**Output (UI)**:
*   "🚨 **Alert**: Shopping spending is up 240% this week."
*   "📅 **Subscription**: Detected 'Netflix' ($14.99). Mark as recurring?"
*   "📉 **Tip**: You could save $90 if you cut dining out by 10%."

### Privacy Considerations
- **Data sent to Gemini**: Aggregated categories and amounts (e.g., "Food: $500, Transport: $120") rather than raw merchant names where possible.
- **User opt-in**: Add a toggle in Settings: "Enable AI Insights" — disabled by default. Users must explicitly opt in.
- **Mention in Privacy Policy / EULA**: Disclose that expense data is processed by Google's Gemini API for analysis.
- **No data retention**: Instruct Gemini via API settings not to retain user data for training.

### Tech Stack
*   **Compute**: **Firebase Scheduled Functions** (Serverless Cron).
*   **Math/Stats**: Do simple math in Node.js (lodash/mathjs). Use Gemini for the "reasoning".
    *   *Avoid*: Python microservices (Overkill & expensive to host).
*   **Visualization**: **Recharts** (Existing).

### User Experience Changes: "Lean Dashboard"
*   **Goal**: The main dashboard should answer "How am I doing *today*?".
*   **Keep (Daily/Active)**:
    *   **Budget vs Actual**: Immediate status.
    *   **Active Groups**: Who do I owe right now?
    *   **Daily Average**: Am I spending too fast?
    *   **Categories/Merchants**: For the current rolling period (Today/Yesterday).
*   **Remove (Move to AI Report)**:
    *   **Spending Trend Line Chart**: Moves to the "Weekly Insight" report.
    *   **Monthly Analysis**: Moves to the "Monthly Insight" report.

---

## 4. Final Tech Stack Verdict (iOS/Android Compatible)

| Feature | Recommended Tool | Why? | Cost |
| :--- | :--- | :--- | :--- |
| **AI Brain** | **Gemini 1.5 Flash** | Fast, Multimodal, Cheap. | Free / Low |
| **Backend** | **Firebase Functions (Node.js)** | Keeps everything in one place. | Pay-as-you-go |
| **Receipt OCR** | **Gemini (Vision)** | Better than Tesseract.js for messy receipts. | Free / Low |
| **QR Scanner** | **Capacitor Barcode Scanner** | Native performance. | Free |
| **Database** | **Firestore** | Already using it. | Free / Low |

### What we removed/changed:
*   ❌ **Python/Pandas/Scikit-learn**: removed. You don't need heavy ML libraries for personal finance data (usually <1000 records/month). Standard math + LLM reasoning is enough.
*   ❌ **Tesseract.js**: removed. LLMs (Gemini Vision) are now much better at reading receipts than old-school OCR.

---

## Implementation Roadmap (Post-Migration)
1.  **Backend**: Set up Firebase Cloud Functions.
2.  **Assistant UI**: Build the Chat/Upload interface.
3.  **Intelligence**: Specific Gemini prompts for analytics.

---

## 5. UX Refinement: Dashboard vs Friends Page
> *User Question: Is showing "Who I Owe" on the Dashboard redundant with the Friends Page?*
> **Answer: No, if we treat them differently.**

### The Distinction Strategy
1.  **Dashboard = "Action Items" (Urgency)**
    *   **Only show non-zero balances** (Debts).
    *   Show "You owe Alice $50" with a big **"Settle Up"** button.
    *   *Goal*: Clear the debt immediately.
    *   *Hidden*: Friends with $0 balance (Active friendships but no debt).

2.  **Friends Page = "Directory" (Management)**
    *   **Show ALL friends**, whether you owe them, they owe you, or it's $0.
    *   **Show Balances**: Yes, still show the green/red numbers next to their names.
    *   **Tap a Friend**: Opens "Friend Details" to see the full history.
        *   **Actions**: **"Settle Up"** (Pay off debt) and **"Delete Friend"**.

3.  **Group Details = "Shared Ledger"**
    *   **Context**: Groups often have complex splits.
    *   **Action**: prominent **"Settle Up"** button at the top if you owe the group (or specific members).
    *   *Goal*: Make it easy to pay without leaving the group page.

### "Settle Up" Logic Coverage
*Existing logic in `src/utils/settleUpStorage.ts` and `src/utils/debtSimplification.ts` is preserved — the UI changes where it's invoked from, not how it works.*
*   **Context-Aware**:
    *   **From Dashboard**: "I want to clear my $50 debt to Alice." -> Opens payment screen with Alice selected.
    *   **From Group**: "I want to clear my $20 share of the Dinner." -> Opens payment screen linked to that specific group.
*   **Scenarios Covered**:
    *   ✅ **Full Payment**: One-tap to pay entire balance.
    *   ✅ **Partial Payment**: "I can only pay $10 today" (Remaining debt stays).
    *   ✅ **Uneven Splits**: Handling group debts where people owe different amounts.
    *   ✅ **Simplify Debts**: The algorithm to minimize group transactions (e.g., A owes B, B owes C -> A pays C directly) will be **preserved**.

**Verdict**: The new buttons will invoke the *same* robust logic as the existing settle-up flow, just launched from better locations.

---

## 6. Compliance & Safety (App Store Ready)
> *User Requirement: Apple Sign-In, Deletion, and Block/Report features.*

### A. Authentication & Profile
1.  **Apple Sign-In**:
    *   **Location**: Login Screen.
    *   **UI**: "Sign in with Apple" button **side-by-side** with Google.
    *   **Logic**: Uses `@capacitor-firebase/authentication` native provider (see Migration Plan).
2.  **Account Deletion**:
    *   **Location**: Profile Page (Danger Zone).
    *   **Logic**: Irreversibly deletes user data from Firestore + Auth. (Required for iOS).
3.  **EULA**:
    *   **Location**: Login Screen (Footer) + Profile Page.
    *   **Text**: "By using Smart Split, you agree to our Terms...".

### B. Block & Report (Safety)
*   **Location**: Next to "Settle Up" on **Friend History** and **Group Details**.
*   **Functionality**:
    *   **Report**:
        1.  User selects "Report User/Content".
        2.  Selects reason (Spam, Abusive).
        3.  Action: Flags content in Firestore for Admin review.
    *   **Block**:
        1.  User selects "Block User".
        2.  **Effect**:
            *   You no longer see their expenses.
            *   They cannot add you to new groups.
            *   Common groups: You still see existing shared debts (for financial integrity) but their new chats/activity are hidden.
