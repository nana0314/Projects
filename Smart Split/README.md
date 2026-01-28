# Smart Split

A web application for splitting expenses with friends and groups. Built with Next.js, TypeScript, Firebase, and Firestore.

## Features

- **Google Authentication**: Sign up and log in with Google email, with persistent login (no auto logout)
- **Unique User ID**: Each user receives a random unique ID upon signup
- **Friend Management**: Add friends by ID, manage friend requests
- **User Profile**: Manage profile including picture and name
- **Groups**: Create groups, join/leave groups, manage group details
- **Expense Tracking**: Add expenses in groups or directly with friends
- **Flexible Splitting**: 
  - Equal split among participants
  - Custom amounts per participant
- **Balance Management**: Track who owes whom

## Tech Stack

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Firebase Authentication** - Google sign-in
- **Cloud Firestore** - Database
- **Firebase Storage** - File storage for profile/group pictures
- **Tailwind CSS** - Styling

## Getting Started

### Prerequisites

- Node.js 18+ installed
- Firebase project created
- Google Authentication enabled in Firebase Console

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the root directory:
```
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

3. Deploy Firestore rules:
```bash
firebase deploy --only firestore:rules
```

4. Deploy Firestore indexes:
```bash
firebase deploy --only firestore:indexes
```

### Running the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
Smart Split/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/login page
├── src/
│   ├── config/           # Firebase configuration
│   ├── context/          # React contexts
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
│       ├── auth.ts       # Authentication helpers
│       ├── users.ts      # User management
│       ├── friends.ts    # Friend management
│       ├── groups.ts     # Group management
│       └── expenses.ts   # Expense management
├── firestore.rules       # Firestore security rules
├── firestore.indexes.json # Firestore indexes
└── firebase.json         # Firebase configuration
```

## Firebase Setup

1. Create a new Firebase project
2. Enable Google Authentication in Authentication > Sign-in method
3. Create a Firestore database
4. Set up Firebase Storage
5. Copy your Firebase configuration to `.env.local`

## Database Schema

### Users Collection
- `uid` (document ID)
- `email`: string
- `displayName`: string
- `photoURL`: string (optional)
- `uniqueId`: string (8-character unique ID)
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Friends Collection
- `userId`: string (user who sent request)
- `friendId`: string (user who received request)
- `status`: 'pending' | 'accepted'
- `addedAt`: timestamp

### Groups Collection
- `name`: string
- `description`: string (optional)
- `photoURL`: string (optional)
- `createdBy`: string (user ID)
- `members`: array of user IDs
- `createdAt`: timestamp
- `updatedAt`: timestamp

### Expenses Collection
- `amount`: number
- `category`: 'Food' | 'Rental' | 'Groceries' | 'Entertainment' | 'Beverage'
- `date`: timestamp
- `payerId`: string (user who paid)
- `participants`: array of user IDs
- `splitType`: 'equal' | 'custom'
- `splitAmounts`: object mapping user ID to amount (for custom splits)
- `groupId`: string (optional, if expense is in a group)
- `description`: string (optional)
- `createdAt`: timestamp
- `createdBy`: string (user ID)

## Next Steps

This is a starter template. You'll need to create additional pages for:
- Profile management (`/profile`)
- Friends management (`/friends`)
- Groups management (`/groups`)
- Expense creation/editing (`/expenses`)
- Balance viewing (`/balances`)

## License

Private project