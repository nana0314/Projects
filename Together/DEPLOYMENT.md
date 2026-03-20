# Deploying Together (public website)

Together is a **Next.js 15** app with **Firebase** (Auth + Firestore). The live site is the frontend; data stays in your Firebase project.

## 1. Vercel project

1. Go to [vercel.com](https://vercel.com) and sign in (GitHub recommended).
2. **Add New Project** → import the Git repository that contains this app.
3. **Root Directory:** set to `Together` (if the repo root is `projects` or a monorepo).
4. **Framework Preset:** Next.js (auto-detected).
5. **Build Command:** `npm run build` (default).
6. **Output:** default (no static export).
7. **Environment Variables:** add every variable from [`.env.local.example`](./.env.local.example) using your real Firebase values:

   | Name | Where to find |
   |------|----------------|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase Console → Project settings → Your apps |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | same |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | same |
   | `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | same |
   | `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | same |
   | `NEXT_PUBLIC_FIREBASE_APP_ID` | same |

8. Deploy. Note the production URL (e.g. `https://together-xxx.vercel.app`).

### CLI (optional)

```bash
cd Together
npx vercel login
npx vercel link    # link to team/project
npx vercel env pull .env.local   # optional: sync env locally
npx vercel --prod
```

---

## 2. Firebase Auth — authorized domains

Without this step, sign-in on the deployed URL often fails.

1. Open [Firebase Console](https://console.firebase.google.com) → your project.
2. **Authentication** → **Settings** → **Authorized domains**.
3. Add:
   - `your-project.vercel.app`
   - Your custom domain (if you add one in Vercel).
4. Save.

---

## 3. Firestore rules and indexes

Rules and indexes live in this repo; deploy them to the same Firebase project your env vars point to.

```bash
cd Together
npm install -g firebase-tools
firebase login
firebase deploy --only firestore:rules,firestore:indexes
```

Verify in Firebase Console → Firestore → **Rules** and **Indexes**.

---

## 4. Production smoke tests (Playwright)

Point Playwright at your deployed URL (no local dev server needed):

```bash
cd Together
set PLAYWRIGHT_BASE_URL=https://your-app.vercel.app
npm run test:e2e:prod
```

`playwright.config.ts` reads `PLAYWRIGHT_BASE_URL` and skips starting a local dev server when it is set.

---

## Checklist

- [ ] Vercel project created; Root Directory = `Together`
- [ ] All `NEXT_PUBLIC_FIREBASE_*` env vars set on Vercel
- [ ] Production deployment succeeds (`npm run build` passes locally first)
- [ ] Firebase Auth authorized domains include the Vercel URL
- [ ] `firebase deploy --only firestore:rules,firestore:indexes` run against production project
- [ ] Manual smoke: open site, sign in, create/view post, open chat
