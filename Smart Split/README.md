# Smart Split 🐻

A modern, mobile-first web application for splitting expenses with friends and groups effortlessly. Built with Next.js 15, TypeScript, and Firebase.

![Smart Split App](/public/icons/icon-512x512.png)

## 🚀 Live Demo

**Access the live app here:** [https://smart-split-bay.vercel.app](https://smart-split-bay.vercel.app)

*Note: This is a PWA (Progressive Web App). You can install it on your phone for a native app-like experience!*

---

## ✨ Core Functions

### 👥 Friend System
- **Unique ID System:** Every user gets a random 8-character ID (e.g., `NANA0314`) to share easily.
- **Friend Requests:** Send and receive requests instantly.
- **Real-time Updates:** See new friends appear immediately without refreshing.

### 💰 Expense Splitting
- **Group Expenses:** Create groups (e.g., "Trip to Japan") and track shared costs.
- **Direct Expenses:** Split bills one-on-one with specific friends.
- **Flexible Options:**
  - **Equal Split:** Automatically divide cost by number of people.
  - **Custom Split:** detailed manual adjustments for complex bills.
- **Smart Balances:** The app automatically calculates who owes whom.

### 🏠 Group Management
- **Dashboard:** See all your groups in one place with total balance summaries.
- **Activity Log:** Track recent actions (who added what).
- **Settling Up:** Mark debts as paid to reset balances.

### 📱 PWA Features (Mobile Optimized)
- **Installable:** Add to Home Screen on iOS and Android.
- **App-like UI:** Bottom navigation, smooth transitions, and safe-area handling.
- **Offline Support:** Basic UI loads even without internet.

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 15 (App Router), React 19, TypeScript
- **Styling:** Tailwind CSS, PostCSS
- **Backend:** Firebase (Authentication, Firestore, Storage)
- **Deployment:** Vercel (Production), Vercel Analytics

---

## 🚀 Getting Started Locally

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/smart-split.git
   cd smart-split
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   Create a `.env.local` file with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=...
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   NEXT_PUBLIC_FIREBASE_APP_ID=...
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

5. **Open Browser**
   Visit [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```bash
Smart Split/
├── app/                    # Next.js App Router pages
│   ├── friends/           # Friends management
│   ├── groups/            # Group details & lists
│   ├── profile/           # User profile settings
│   ├── activity/          # Recent activity feed
│   └── layout.tsx         # Main app layout (PWA wrapper)
├── src/
│   ├── components/        # Reusable UI components (BottomNav, etc.)
│   ├── context/           # AuthContext & global state
│   ├── utils/             # Firebase logic (friends.ts, groups.ts)
│   └── types/             # TypeScript interfaces
├── public/                 # Static assets (icons, manifest)
└── firestore.rules        # Security rules for database
```

---

## 🔒 Security

- **Authentication:** Protected Routes ensure only logged-in users access app features.
- **Database Rules:** Firestore security rules prevent unauthorized access to other users' data.
- **Environment Variables:** API keys are secured via Vercel environment configuration.

---

## 📄 License

Private Project. Created for personal use.