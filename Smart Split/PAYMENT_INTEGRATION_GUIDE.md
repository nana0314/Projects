# 💰 Guide: Adding One-Time Payments (3 AUD)

Since your app is primarily a Web App (PWA), the best way to accept payments is **Stripe**. It's secure, widely used, and easy to integrate with Next.js and Firebase.

## ⚠️ Important Rule for Mobile Apps
*   **Web/PWA:** You can use Stripe (Fee: ~2.9% + 30¢).
*   **App Store (iOS) / Play Store (Android):** If you publish natively, Apple/Google **require** you to use their "In-App Purchase" (IAP) system for digital features. They take a 15-30% cut.
    *   *Strategy:* Many apps allow users to pay on the *website* first, then login to the *app* to use the features. This avoids the 30% Apple tax.

---

## 🛠️ The "Pro Status" Plan

### 1. Database Change (Firestore)
You need to know who has paid. Add a field to your `users` collection:
```typescript
// users/{userId}
{
  displayName: "Song",
  email: "...",
  isPro: true, // New field! Default is false.
  proSince: Timestamp
}
```

### 2. The Logic Flow
1.  **Lock Features:** In your code, check the status before allowing actions.
    ```typescript
    if (!user.isPro) {
      alert("Please upgrade to Pro for $3!");
      return;
    }
    // Allow create group...
    ```
2.  **Payment:** Redirect user to Stripe.
3.  **Verification:** Stripe tells your database "Payment Successful".

---

## Implementation Steps (Stripe + Next.js)

### Step 1: Create Stripe Account
1.  Go to [stripe.com](https://stripe.com).
2.  Create a "Product" called "Smart Split Pro".
3.  Set price to **3.00 AUD (One-time)**.
4.  Copy the **Price ID** (e.g., `price_12345`).

### Step 2: Install Stripe in Project
```bash
npm install stripe @stripe/stripe-js
```

### Step 3: Create Payment Link (Simplest Way)
You don't even need complex code!
1.  In Stripe Dashboard, create a **Payment Link** for your product.
2.  In the URL configuration, add a parameter to track *who* is paying:
    `https://buy.stripe.com/test_123...?client_reference_id={USER_ID}`

### Step 4: Handle Success (The Webhook)
This is the only "backend" code you need. You will create a new API route in Next.js: `app/api/webhook/route.ts`.

**Logic:**
1.  Stripe sends a message to your API: *"Payment completed for Reference ID: XYZ"*
2.  Your API uses `firebase-admin` to update Firestore:
    ```typescript
    await firestore.collection('users').doc(userId).update({
      isPro: true
    });
    ```

---

## 📱 Native App Strategy (Future Publication)

If you publish to the App Store or Play Store later, you have two choices:

### Choice A: The "Reader" Model (Recommended - 0% Fee)
This is what Netflix, Spotify, and Kindle do.
1.  **On the App:** You **DO NOT** show a "Buy" button. You essentially hide the fact that payments exist.
    *   *Allowed Message:* "To upgrade to Pro, please visit our website at smart-split.com" (Check current Apple guidelines on wording).
    *   *Prohibited:* You cannot link directly to the checkout page from the app.
2.  **On the Web:** Users pay $3 via Stripe.
3.  **Result:** You keep 100% of the profit (minus Stripe fees). Apple gets $0.

### Choice B: The "Convenience" Model (30% Fee)
You implement Apple In-App Purchases (IAP) inside the app.
1.  **On the App:** User clicks "Buy", scans FaceID, and pays instantly.
2.  **Result:** Apple takes 30% of that $3.
3.  **Why do this?** It converts better because it's easier for the user. But you make less money per sale.

**Summary:** Most startups start with **Choice A** (Web Payments only) to maximize revenue.
