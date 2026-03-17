# FanFan — Recipe Discovery PWA

A Tinder-style recipe discovery Progressive Web App built with Next.js 15. Swipe through recipes, save favorites into Meal Packs, and filter by cuisine, diet, and meal type.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| UI | React 19, Tailwind CSS |
| Gestures | @use-gesture/react |
| Bottom Sheets | Vaul |
| Auth & DB | Firebase Auth (Google), Cloud Firestore |
| Recipe API | Spoonacular (primary), TheMealDB (fallback) |
| PWA | next-pwa, Web App Manifest |
| Testing | Playwright (E2E, 48 tests) |

## Features

### Swipe Discovery
- **Swipe left** — skip to next recipe
- **Swipe right** — undo, restore previous recipe
- **Swipe up** — save to a Meal Pack
- **Single tap** — preview ingredients in a bottom sheet
- **Double tap** — view full recipe details (ingredients + step-by-step instructions)

### Meal Packs
User-created recipe collections (similar to Spotify playlists). Works in two modes:
- **Guest mode** — stored in `localStorage`, no sign-in required
- **Authenticated mode** — synced to Firebase Firestore via Google Sign-In

Includes duplicate detection — if a recipe is already saved in a pack, the UI shows "Already Saved ✓" and prevents re-adding.

### Filters
Filter recipes by any combination of:
- **Cuisine** — Italian, Japanese, Mexican, Indian, Chinese, Thai, Korean, Mediterranean, etc.
- **Diet** — Vegetarian, Vegan, Gluten Free, Ketogenic, Paleo, etc.
- **Intolerances** — Dairy, Gluten, Peanut, Shellfish, etc.
- **Meal type** — Breakfast, Lunch, Dinner, Snack, Dessert

### Daily Inspiration
A rotating "Recipe of the Day" card on the discovery page, cached in `localStorage` for 24 hours.

### Profile
Account management (Google Sign-In / Sign-Out) and default filter preferences that persist across sessions.

## Architecture

### Recipe Queue
Recipes are managed as a FIFO queue (`useState<Recipe[]>`) with a separate history stack for undo:

```
Swipe left:   queue[0] → history[0],  queue.shift()
Swipe right:  history[0] → queue[0],  history.shift()
```

The queue prefetches in batches of 10 and auto-refills when it drops to 3 remaining. When all recipes are exhausted, it resets and loops from the beginning.

### API Abstraction
`RecipeService.ts` abstracts the data source behind a single interface. The active API is controlled by the `NEXT_PUBLIC_RECIPE_API` environment variable (`spoonacular` or `mealdb`). Switching APIs requires zero component changes.

### Dual Storage for Meal Packs
`useMealPacks` hook checks `useAuth()` to decide storage:
- If authenticated → Firestore (`users/{uid}/mealPacks/{packId}/recipes`)
- If guest → `localStorage` keys (`fanfan_meal_packs`, `fanfan_pack_recipes_{id}`)

## Project Structure

```
Recipe Swipe/
├── app/                          # Next.js App Router pages
│   ├── page.tsx                  # Discovery (swipe) page
│   ├── layout.tsx                # Root layout with providers
│   ├── globals.css               # Tailwind + custom styles
│   ├── packs/
│   │   ├── page.tsx              # Meal Packs list
│   │   └── [packId]/page.tsx     # Pack detail (recipes in pack)
│   ├── profile/page.tsx          # Profile & filter preferences
│   └── recipe/[id]/page.tsx      # Full recipe detail
├── src/
│   ├── components/               # Reusable UI components
│   │   ├── SwipeStack.tsx        # Swipe card stack with gesture handling
│   │   ├── SwipeCard.tsx         # Individual recipe card
│   │   ├── ActionButtons.tsx     # Skip / Save / Undo buttons
│   │   ├── AddToPackSheet.tsx    # Bottom sheet for saving to packs
│   │   ├── IngredientSheet.tsx   # Bottom sheet for ingredient preview
│   │   ├── FilterModal.tsx       # Filter selection drawer
│   │   ├── DailyInspirationCard.tsx
│   │   └── BottomNav.tsx         # Tab navigation bar
│   ├── hooks/
│   │   ├── useRecipeQueue.ts     # FIFO queue + prefetch + looping
│   │   ├── useSwipeHistory.ts    # Undo stack (max 20)
│   │   └── useMealPacks.ts      # CRUD for packs (Firestore + localStorage)
│   ├── services/
│   │   ├── RecipeService.ts      # API abstraction layer
│   │   ├── spoonacular.ts        # Spoonacular API client
│   │   └── mealdb.ts             # TheMealDB API client
│   ├── context/
│   │   ├── AuthContext.tsx        # Firebase Auth provider
│   │   └── FilterContext.tsx      # Global filter state
│   ├── config/
│   │   ├── firebase.ts           # Firebase initialization
│   │   └── cuisines.ts           # Cuisine, diet, intolerance constants
│   └── types/index.ts            # TypeScript interfaces
├── e2e/                          # Playwright E2E tests
│   ├── fixtures.ts               # API mocking (Spoonacular interceptors)
│   ├── discovery.spec.ts
│   ├── swipe-actions.spec.ts
│   ├── meal-packs.spec.ts
│   ├── filters.spec.ts
│   ├── navigation.spec.ts
│   ├── ingredient-sheet.spec.ts
│   ├── recipe-detail.spec.ts
│   ├── profile.spec.ts
│   └── daily-inspiration.spec.ts
├── public/
│   └── manifest.json             # PWA manifest
├── playwright.config.ts
├── tailwind.config.ts
├── next.config.js
└── package.json
```

## Getting Started

### Prerequisites
- Node.js 18+
- A Spoonacular API key (free at [spoonacular.com](https://spoonacular.com/food-api))
- A Firebase project with Auth and Firestore enabled

### Setup

```bash
cd "Recipe Swipe"
npm install --legacy-peer-deps
```

Create `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=your_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_SPOONACULAR_API_KEY=your_spoonacular_key
NEXT_PUBLIC_RECIPE_API=spoonacular
```

### Run

```bash
npm run dev          # Development server at http://localhost:3000
npm run build        # Production build
npm run start        # Production server
```

### Test

```bash
npx playwright install chromium   # First time only
npm run test:e2e                  # Run all 48 tests (headless)
npm run test:e2e:headed           # Run with visible browser
npm run test:e2e:ui               # Playwright UI mode
```

All tests use API mocking via `e2e/fixtures.ts` — no Spoonacular quota is consumed during test runs.

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Attribution

- Recipe data powered by [Spoonacular](https://spoonacular.com/) and [TheMealDB](https://www.themealdb.com/)
