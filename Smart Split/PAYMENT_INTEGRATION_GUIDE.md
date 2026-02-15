# 💰 Guide: Adding One-Time Payments (3 AUD)

Since your app is primarily a Web App (PWA), the best way to accept payments is **Stripe**. It's secure, widely used, and easy to integrate with Next.js and Firebase.

## ⚠️ Important: Platform Fee Comparison

| Platform | Fee on $3 AUD | You Keep |
|:--|:--|:--|
| **Stripe (AU domestic cards)** | 1.75% + 30¢ = ~$0.35 | **$2.65** |
| **Stripe (international cards)** | 2.9% + 30¢ = ~$0.39 | **$2.61** |
| **Apple IAP** | 30% = $0.90 | **$2.10** |
| **Google Play IAP** | 15% (small biz) = $0.45 | **$2.55** |

> [!WARNING]
> On a $3 transaction, fees are proportionally high regardless of provider. Consider pricing at **$4.99** or higher to improve margins — most users won't notice the difference for a one-time premium unlock.

---

## 🛠️ The "Pro Status" Plan

### 1. Database Change (Firestore)
You need to know who has paid. Add a field to your `users` collection:
```typescript
// users/{userId}
{
  displayName: "Song",
  email: "...",
  isPro: true,       // New field! Default is false.
  proSince: Timestamp // When they upgraded
}
```

### 2. The Logic Flow
1.  **Lock Features:** In your code, check the status before allowing actions.
    ```typescript
    if (!user.isPro) {
      // Show upgrade modal with benefits
      showUpgradeModal();
      return;
    }
    // Allow premium feature...
    ```
2.  **Payment:** Redirect user to Stripe Checkout.
3.  **Verification:** Stripe sends a webhook → your server verifies signature → updates Firestore.

---

## Implementation Steps (Stripe + Next.js)

### Step 1: Create Stripe Account
1.  Go to [stripe.com](https://stripe.com) and create an account.
2.  Create a **Product** called "Smart Split Pro".
3.  Set price to **3.00 AUD (One-time)**.
4.  Copy the **Price ID** (e.g., `price_12345`).
5.  Get your **API keys** from Dashboard → Developers → API Keys.

### Step 2: Install Stripe in Project
```bash
npm install stripe @stripe/stripe-js
```

Add to `.env.local`:
```env
STRIPE_SECRET_KEY=sk_live_...         # Server-side only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...  # Client-side
STRIPE_WEBHOOK_SECRET=whsec_...       # From webhook setup
```

### Step 3: Two Options — Payment Link (Simple) or Checkout Session (Modern)

#### Option A: Payment Link (Simplest — No Code)
1.  In Stripe Dashboard → Payment Links → Create.
2.  Select your product, add `client_reference_id` parameter:
    ```
    https://buy.stripe.com/test_123...?client_reference_id={USER_ID}
    ```
3.  Redirect user to this link when they click "Upgrade".

#### Option B: Stripe Checkout Session (Recommended — What Modern Apps Use)
Create an API route that creates a Checkout Session with metadata:

```typescript
// app/api/checkout/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { userId, userEmail } = await req.json();

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: 'price_12345', quantity: 1 }],
    mode: 'payment',
    customer_email: userEmail,
    client_reference_id: userId,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    metadata: { userId },
  });

  return NextResponse.json({ url: session.url });
}
```

Client-side redirect:
```typescript
const handleUpgrade = async () => {
  const res = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId: user.uid, userEmail: user.email }),
  });
  const { url } = await res.json();
  window.location.href = url; // Redirects to Stripe Checkout
};
```

### Step 4: Handle Success (Webhook — Critical for Security)

> [!CAUTION]
> **Never trust the client.** Don't set `isPro: true` just because the user landed on `?upgraded=true`. Always verify via webhook.

Create a webhook handler that **verifies Stripe's signature** to prevent spoofing:

```typescript
// app/api/webhook/route.ts
import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Initialize Firebase Admin (server-side)
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!)),
  });
}
const db = getFirestore();

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  // 1. Verify webhook signature (prevents fake requests)
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // 2. Handle the payment success event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;

    if (userId) {
      await db.collection('users').doc(userId).update({
        isPro: true,
        proSince: FieldValue.serverTimestamp(),
        stripeSessionId: session.id,
      });
      console.log(`✅ User ${userId} upgraded to Pro`);
    }
  }

  return NextResponse.json({ received: true });
}

// Stripe needs raw body, disable Next.js body parsing
export const config = { api: { bodyParser: false } };
```

### Step 5: Register Webhook in Stripe
1. Go to Stripe Dashboard → Developers → Webhooks.
2. Add endpoint: `https://your-domain.vercel.app/api/webhook`
3. Select event: `checkout.session.completed`
4. Copy the **Webhook Signing Secret** → add to `.env.local` as `STRIPE_WEBHOOK_SECRET`.

---

## 📱 Native App Strategy (Future Publication)

If you publish to the App Store or Play Store later:

### Understanding App Store Rules

> [!IMPORTANT]
> Apple and Google **require** In-App Purchases (IAP) for **digital goods and features** (premium unlocks, subscriptions, virtual items). This applies to Smart Split's "Pro" upgrade since it unlocks digital features within the app.

The "Reader App" exemption (Netflix, Spotify, Kindle) **does NOT apply** to utility/finance apps like Smart Split. That exemption is only for apps whose primary purpose is consuming content (books, music, video, news).

### Your Options for Native App

#### Option A: Web-Only Payments + App Login (Most Common for Small Apps)
How Splitwise, many SaaS tools, and indie apps handle it:

1. **On the App:** Don't show any payment UI. The app checks `isPro` from Firestore.
2. **On the Website:** Users pay via Stripe on your website.
3. **In the App:** After paying on web, user opens the app → `isPro` is already `true` → features unlocked.
4. **App Store compliance:** You can display a message like *"Manage your account at smartsplit.vercel.app"* — but you **cannot** include a direct link to the payment page (in most regions).

> [!WARNING]
> Apple's rules on this are strict and change frequently. As of 2025:
> - **US**: You can include "External Purchase Links" (pay 27% commission instead of 30%)
> - **EU**: Digital Markets Act allows linking to external payment (pay reduced commission)
> - **Rest of world**: No direct links to payment pages allowed from within the app

#### Option B: Apple/Google IAP (Best Conversion, Highest Fee)
1. Implement `@capacitor/in-app-purchases` or RevenueCat SDK.
2. User taps "Upgrade" → native payment sheet → Face ID/fingerprint → instant purchase.
3. Apple takes 30% (or 15% if you qualify for Small Business Program < $1M/year revenue).
4. **Pro:** Highest conversion rate — frictionless one-tap purchase.
5. **Con:** Lowest revenue per sale.

#### Option C: Hybrid (What Most Mature Apps Do)
1. Offer **both** IAP in the app AND Stripe on the website.
2. Price the IAP version slightly higher ($4.99) to offset Apple's cut.
3. Website version at $3.00.
4. Users who want convenience pay in-app. Price-sensitive users pay on web.

### Recommendation for Smart Split

**Start with Option A** (web-only Stripe payments). It's zero additional code for the native app — just deploy the Stripe webhook and checkout page. When your user base grows and you want better conversion, add IAP with Option C.

---

## 🔒 Security Checklist

- [ ] Webhook signature verification (prevents fake "payment complete" requests)
- [ ] `isPro` only set server-side (webhook or Cloud Function), never from client
- [ ] Stripe API keys in environment variables, never in client code
- [ ] `STRIPE_SECRET_KEY` only used in server routes (`app/api/`), not in client components
- [ ] Test with Stripe test mode before going live
- [ ] Handle edge cases: duplicate webhooks, failed updates, refunds
