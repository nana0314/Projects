# Implementation Plan: All Phase 3 Features

> Features 1–10: **Build now** (PWA, carries over to iOS/Android)
> Features 11–14: **Build after deploying to iOS/Android** (requires Capacitor native plugins)

---

## 🟢 BUILD NOW (Pre-Deployment)

### Feature 1: Firebase Cloud Functions Backend

The foundation — AI and account features depend on this.

#### [NEW] `functions/` directory
```bash
firebase init functions  # TypeScript, Node.js 18, ESLint: Yes
```

#### [NEW] [functions/src/index.ts](file:///c:/Users/songz/projects/Smart%20Split/functions/src/index.ts)
- Re-exports: `scanReceipt`, `weeklyInsight`, `deleteAccount`

#### [MODIFY] [firebase.json](file:///c:/Users/songz/projects/Smart%20Split/firebase.json)
- Add `"functions"` section + `"emulators"` for local dev

#### [MODIFY] [.gitignore](file:///c:/Users/songz/projects/Smart%20Split/.gitignore)
- Add `functions/lib/`, `functions/node_modules/`

---

### Features 2 & 3: Receipt Scanning (Splitwise Method)

> **Splitwise approach**: Camera → upload → server OCR → pre-fill form → user reviews & saves.
> Uses `<input type="file" accept="image/*" capture="camera">` which opens native camera on mobile browsers. This same HTML attribute also works inside Capacitor WebView — so the flow is identical on PWA and native app.
>
> **PWA vs Native difference**: On PWA, the file picker dialog appears briefly before camera opens. On native app (after Capacitor + `@capacitor/camera`), the camera opens directly. The scanning accuracy is **identical** because Gemini processes the image server-side regardless of capture method. This is a cosmetic UX difference only.

#### [NEW] [functions/src/scanReceipt.ts](file:///c:/Users/songz/projects/Smart%20Split/functions/src/scanReceipt.ts)
- **Type**: Callable Function (`onCall`)
- **Input**: `{ fileUrl: string }`
- **Process**:
  1. Download image from Firebase Storage
  2. Validate size (reject > 5MB)
  3. Rate limit: `users/{uid}/usage/{date}` — max 20 scans/day
  4. Send to Gemini 1.5 Flash:
     ```
     Extract: merchant, date (YYYY-MM-DD), items [{name, price}], total, currency.
     Map category to: Food|Groceries|Entertainment|Beverage|Transportation|Utilities|Shopping|Travel|Other.
     Return JSON with confidence score 0-1.
     ```
  5. Return parsed data or error
- **Error handling**: Low confidence → "Could not read receipt"; rate exceeded → 429; timeout → retry option

#### [MODIFY] [storage.rules](file:///c:/Users/songz/projects/Smart%20Split/storage.rules)
- Add `/receipts/{userId}/{fileId}` path — read/write by owner only, max 5MB, image/* only

#### [NEW] [src/utils/receiptScanner.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/receiptScanner.ts)
- `uploadReceiptImage(userId, file)` → uploads to Storage, returns URL
- `scanReceipt(fileUrl)` → calls Cloud Function via `httpsCallable`
- `compressImage(file, maxWidth)` → client-side resize to 1024px

#### [NEW] [src/types/receipt.ts](file:///c:/Users/songz/projects/Smart%20Split/src/types/receipt.ts)
- `ReceiptData { success, confidence, merchant?, date?, items?, total?, category?, message? }`

#### [MODIFY] [app/add-expense/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/add-expense/page.tsx)
- Add "📸 Scan Receipt" button at top of form
- Hidden `<input type="file" accept="image/*" capture="camera">`
- On capture: compress → upload → scan → pre-fill amount, category, description
- Fallback: toast "Couldn't read receipt" → manual entry

---

### Feature 4: Personal Expenses (No Split)

> **New feature**: Users can add expenses for themselves only — pure personal finance tracking, no splitting. This shifts the app toward a fintech personal expense tracker with the splitting feature as a bonus.

#### [MODIFY] [app/add-expense/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/add-expense/page.tsx)
Currently the form requires selecting a friend or group (line 382: form fields hidden unless `selectedFriend || selectedGroup`). Changes:
- Add **"Just Me"** button alongside Friends and Groups in Step 1
- When "Just Me" selected: show Description, Category, Amount fields (skip split options entirely)
- Update `canSubmit` logic: valid if `isPersonal && isValidAmount`
- Update `handleSubmit`: if personal, call `createExpense` with `participants: [user.uid]`, `payerId: user.uid`, `splitType: 'equal'`, no groupId

#### [MODIFY] [src/utils/expenses.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/expenses.ts)
- `createExpense` already supports a single participant — just needs to accept `participants` with one user
- Update `getUserExpenses` to include personal expenses in output (they already would since `payerId === userId`)

#### [MODIFY] [src/utils/analytics.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/analytics.ts)
- Include personal expenses in spending trend / category / merchant calculations
- Add filter option: "All Expenses" | "Personal Only" | "Shared Only"

#### [MODIFY] [app/dashboard/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/dashboard/page.tsx)
- Add filter toggle above charts: All / Personal / Shared
- Personal expenses feed into Budget vs Actual, Categories, Daily Average

#### [MODIFY] [app/activity/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/activity/page.tsx)
- Show personal expenses with a "Personal" badge (vs friend name or group name)
- Filter tabs: All | Personal | Shared

---

### Feature 5: AI Insights — "Sunday Briefing"

#### [NEW] [functions/src/weeklyInsight.ts](file:///c:/Users/songz/projects/Smart%20Split/functions/src/weeklyInsight.ts)
- **Type**: Scheduled Function (every Sunday 9 AM UTC)
- Per opted-in user: aggregate 30 days → send categories/amounts to Gemini → save to `users/{uid}/insights/{weekId}`
- Returns: alerts, suggestions, forecast

#### [NEW] [src/types/insights.ts](file:///c:/Users/songz/projects/Smart%20Split/src/types/insights.ts)
- `WeeklyInsight { weekId, alerts[], suggestions[], forecast }`

#### [NEW] [src/utils/insights.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/insights.ts)
- `getLatestInsight()`, `getInsightHistory()`, `setAiInsightsEnabled()`

#### [NEW] [src/components/dashboard/InsightsCard.tsx](file:///c:/Users/songz/projects/Smart%20Split/src/components/dashboard/InsightsCard.tsx)
- Shows latest alerts/suggestions on dashboard

#### [NEW] [app/insights/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/insights/page.tsx)
- Full insights history with opt-in toggle

#### [MODIFY] [src/types/index.ts](file:///c:/Users/songz/projects/Smart%20Split/src/types/index.ts)
- Add `aiInsightsEnabled?: boolean` to `User` interface

---

### Feature 6: Dashboard UX Refinements

> Dashboard = "Action Items" — outstanding balances with Settle Up CTAs

#### [NEW] [src/components/dashboard/OutstandingBalances.tsx](file:///c:/Users/songz/projects/Smart%20Split/src/components/dashboard/OutstandingBalances.tsx)
- Shows non-zero balances with per-person Settle Up buttons
- Green "✓ All settled up!" when no debts

#### [MODIFY] [app/dashboard/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/dashboard/page.tsx)
- Add OutstandingBalances section at top
- Add InsightsCard below Budget vs Actual
- Add personal/shared expense filter toggle

---

### Feature 7: Account Deletion

#### [NEW] [functions/src/deleteAccount.ts](file:///c:/Users/songz/projects/Smart%20Split/functions/src/deleteAccount.ts)
- Callable Function — wipes: Firestore user data + subcollections, Storage files, Auth record
- Removes user from groups, cleans up friend records

#### [MODIFY] [app/profile/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/profile/page.tsx)
- Add "Danger Zone" section with red "Delete Account" button
- Confirmation modal: type "DELETE" to confirm → calls Cloud Function → redirect to login

---

### Feature 8: Block & Report

#### [NEW] [src/utils/moderation.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/moderation.ts)
- `blockUser()`, `unblockUser()`, `getBlockedUsers()`, `reportUser()`

#### [MODIFY] [firestore.rules](file:///c:/Users/songz/projects/Smart%20Split/firestore.rules)
- Add `users/{uid}/blocked_users/{blockedId}` rules (owner read/write)
- Add `reports/{reportId}` rules (create: authenticated, read: admin only)

#### [NEW] [src/components/BlockReportMenu.tsx](file:///c:/Users/songz/projects/Smart%20Split/src/components/BlockReportMenu.tsx)
- Dropdown with Block User / Report User options + modals

#### [MODIFY] [app/friends/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/friends/page.tsx) + [app/groups/[id]/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/groups/%5Bid%5D/page.tsx)
- Add BlockReportMenu to friend/member actions, filter blocked users

---

### Feature 9: EULA / Terms of Service

#### [NEW] [app/terms/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/terms/page.tsx) + [app/privacy/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/privacy/page.tsx)
- Static Terms of Service + Privacy Policy (required for App Store)
- Discloses: data collected, Firebase/Gemini usage, AI opt-in, deletion rights

#### [MODIFY] [app/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/page.tsx)
- Make footer text "Terms of Service" and "Privacy Policy" clickable

#### [MODIFY] [app/profile/page.tsx](file:///c:/Users/songz/projects/Smart%20Split/app/profile/page.tsx)
- Add Terms/Privacy links in profile settings

---

### Feature 10: Settle Up Improvements

#### [MODIFY] [src/components/FloatingSettleUp.tsx](file:///c:/Users/songz/projects/Smart%20Split/src/components/FloatingSettleUp.tsx)
- Accept `context` prop: `'dashboard' | 'friend' | 'group'`
- Dashboard: list all debts, pick which to settle
- Friend/Group: pre-selected, one-tap settle

#### [MODIFY] [src/utils/settleUpStorage.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/settleUpStorage.ts)
- Add `performPartialSettleUp(userId, friendId, amount)` — records partial payment as settlement expense

#### [MODIFY] [src/utils/expenses.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/expenses.ts)
- Add `createSettlementExpense()` for partial payments

#### [MODIFY] [src/types/index.ts](file:///c:/Users/songz/projects/Smart%20Split/src/types/index.ts)
- Add `type?: 'expense' | 'settlement'` to `Expense` interface

---

## 🔴 BUILD AFTER iOS/Android Deployment (Requires Capacitor)

### Feature 11: Native QR Scanner

> **PWA vs Native**: QR scanning on PWA (via `jsQR` / `html5-qrcode`) has low frame rates, poor autofocus, and high latency — your previous attempt was reverted for exactly these reasons. Native `capacitor-community/barcode-scanner` uses device hardware for instant, reliable scanning. **This is a significant quality gap — wait for native.**

#### [NEW] QR Scanner component using `capacitor-community/barcode-scanner`
- Full-screen native camera overlay
- Detects User ID / Group ID from QR codes

---

### Feature 12: Native Apple Sign-In

> Web popup (`signInWithPopup` + Apple provider) can be added now for Safari, but the real native Apple Sign-In (Face ID prompt) requires `@capacitor-firebase/authentication`.

#### [MODIFY] [src/utils/auth.ts](file:///c:/Users/songz/projects/Smart%20Split/src/utils/auth.ts)
- Add native Apple Sign-In via Capacitor plugin
- Platform detection: native → plugin, web → popup fallback

---

### Feature 13: FCM Push Notifications

> In-app notification UI can be built now (Feature 5 InsightsCard), but actual push when app is in background requires native plugins.

#### Plugin: `@capacitor/push-notifications`
- Token registration → store in `users/{uid}/fcmTokens/`
- iOS: APNs key upload to Firebase Console
- Android: FCM auto-configured via `google-services.json`

---

### Feature 14: App Icons, Splash Screens, Deep Linking

#### `@capacitor/assets` for icons/splash
#### `smartsplit://` URL scheme in native config
#### Version codes in Xcode/Android Studio

---

## QR Code vs Receipt Scanning: PWA vs Native App

| | Receipt Scanning | QR Code Scanning |
|:--|:--|:--|
| **PWA (now)** | ✅ Works **well** — `<input capture="camera">` opens camera, image goes to Gemini server-side. Same accuracy as native. Just a slightly less polished camera UX (file picker flashes) | ❌ Works **poorly** — web MediaStream API gives low frame rate, bad autofocus, laggy detection. Previous attempt reverted. |
| **Native (Capacitor)** | ✅ Works **great** — `@capacitor/camera` opens camera instantly (no file picker). Same server-side Gemini processing. Polish upgrade only. | ✅ Works **great** — `capacitor-community/barcode-scanner` uses hardware-accelerated detection. Instant, reliable. |
| **Difference** | **Minor** — cosmetic camera UX only. Scanning accuracy identical. | **Major** — web QR is unusable for production. Must wait for native. |

---

## Verification Plan

### Cloud Functions (Firebase Emulator)
```bash
cd functions && npm run build && firebase emulators:start --only functions,firestore,storage
```
- `scanReceipt` with test receipt image → verify JSON
- `deleteAccount` with test user → verify wipe
- Rate limiting: 21st call → expect error

### Build Verification
```bash
npm run build
```

### Manual Testing
1. **Personal expense**: Add Expense → "Just Me" → fill amount/category → save → verify in Activity with "Personal" badge
2. **Receipt scanning**: Add Expense → Scan Receipt → photo → verify pre-fill
3. **Account deletion**: Profile → Delete Account → type DELETE → verify redirect
4. **Block user**: Friends → Block → verify hidden
5. **Dashboard balances**: Add split expense → Dashboard → verify Outstanding Balances
6. **Settle up from dashboard**: Tap Settle Up → verify balance clears
