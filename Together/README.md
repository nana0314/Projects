# Together — Local Coordination Forum

A Next.js 15 PWA for local coordination posts (ride sharing, bundle splitting, etc.) with real-time chat, friend system, and bilingual search.

## Tech Stack

- **Framework**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS (indigo brand palette)
- **PWA**: `next-pwa` (offline-ready, installable)
- **Backend**: Firebase Auth (Google Sign-In) + Cloud Firestore
- **Markdown**: `react-markdown` (bold/italic in post bodies)
- **Testing**: Playwright E2E

## Features

### Posts
- Create discussion posts with topic headers (Ride Share, Bundle Split, etc.)
- Bold/italic markdown toolbar for departure/destination clarity
- Hashtag support — English and **Chinese (中文)** keywords both searchable
- Public / private visibility toggle
- Delete your own posts

### Comments & Replies
- Threaded replies (one level deep)
- Delete your own comments
- Authors shown with real Google profile names/photos for trust

### Search
- `#hashtag` → exact Firestore `array-contains` match
- Keywords → mixed English + Chinese bigram tokenizer, ranked by match count

### Social
- View any user's public profile and posts
- Send / accept / decline friend requests
- Notifications page (bell icon in header) for incoming requests
- Block or report users
- Direct messages with friends (real-time via Firestore `onSnapshot`)
- Group chats with custom names, add friends as members

### Profile
- My Posts tab
- Commented tab (posts you've replied to)

## Getting Started

1. Copy `.env.local.example` to `.env.local` and fill in your Firebase project keys.
2. Install and run:

```bash
npm install
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

## Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Posts: public read, auth write, owner delete
    match /posts/{postId} {
      allow read: if resource.data.visibility == 'public' || request.auth.uid == resource.data.authorId;
      allow create: if request.auth != null;
      allow delete: if request.auth.uid == resource.data.authorId;
      allow update: if request.auth != null;

      match /comments/{commentId} {
        allow read: if true;
        allow create: if request.auth != null;
        allow delete: if request.auth.uid == resource.data.authorId;
      }
    }

    // Users
    match /users/{userId} {
      allow read: if true;
      allow write: if request.auth.uid == userId;

      match /commentedPosts/{postId} {
        allow read, write: if request.auth.uid == userId;
      }
    }

    // Friend requests
    match /friendRequests/{reqId} {
      allow read: if request.auth.uid == resource.data.fromId || request.auth.uid == resource.data.toId;
      allow create: if request.auth.uid == request.resource.data.fromId;
      allow update: if request.auth.uid == resource.data.toId;
      allow delete: if request.auth.uid == resource.data.fromId;
    }

    // Friendships
    match /friendships/{friendshipId} {
      allow read: if request.auth.uid in resource.data.userIds;
      allow create, delete: if request.auth.uid in resource.data.userIds;
    }

    // Blocks
    match /blocks/{blockerId}/blockedUsers/{blockedId} {
      allow read, write: if request.auth.uid == blockerId;
    }

    // Reports
    match /reports/{reportId} {
      allow create: if request.auth != null;
    }

    // Chats & Messages (friends only — enforced in app layer)
    match /chats/{chatId} {
      allow read, update: if request.auth.uid in resource.data.participantIds;
      allow create: if request.auth != null;

      match /messages/{messageId} {
        allow read: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participantIds;
        allow create: if request.auth.uid in get(/databases/$(database)/documents/chats/$(chatId)).data.participantIds;
      }
    }
  }
}
```

## E2E Tests

```bash
npm run test:e2e          # headless
npm run test:e2e:headed   # with browser visible
npm run test:e2e:ui       # Playwright UI mode
```

18 tests covering navigation, feed, search (hashtag + keyword modes), create post, profile, and chat auth gates.
