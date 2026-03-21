# Together — Local Coordination Forum

A Progressive Web App for local coordination: post ride-share requests, bundle splits, or any group activity; find co-participants in the comments; then move private coordination into real-time DMs or group chats. Google Sign-In ensures every participant's real name and photo is visible — trust before you meet up.

---

## Purpose

Together solves the problem of coordinating with strangers locally. Examples:

1. **Ride share** — Uber is expensive alone. Post "Anyone heading to Cambridge station at 5pm?", discuss in comments, then DM to arrange pickup and split the fare.
2. **Bundle split** — Costco membership or bulk buy too much for one person. Post, find someone to split with, meet up to hand off.
3. **Group buys** — Any coordination where you want to know who you're meeting before committing.

The flow: **Post → Comment (public) → Add Friend → DM/Group Chat (private)**. Real identities throughout.

---

## Tech Stack


| Layer     | Tech                                           |
| --------- | ---------------------------------------------- |
| Framework | Next.js 15 (App Router), React 19, TypeScript  |
| Styling   | Tailwind CSS (indigo brand palette)            |
| PWA       | `next-pwa` (offline-ready, installable)        |
| Auth      | Firebase Auth (Google Sign-In)                 |
| Database  | Cloud Firestore (real-time listeners for chat) |
| Markdown  | `react-markdown` (bold/italic in post bodies)  |
| Testing   | Playwright E2E (133 tests, mocked Firebase)    |


---

## How It Works

### Social & Chat Flow

```
View post/comment → Click user avatar/name → User profile (/user/uid)
                                              ↓
                                    [Add Friend] (if not friends)
                                              ↓
                                    Friend request sent (pending)
                                              ↓
                                    Recipient sees bell badge → /notifications
                                              ↓
                                    Accept / Decline
                                              ↓
                                    [Friends] → [Message] button → DM chat
                                    [Friends] → Can be added to group chats
```

- **Not friends** → Add Friend → Request sent
- **Request pending** → "Request Sent" (disabled)
- **Friends** → Message button + three-dot menu (Remove Friend / Block / Report)
- **Blocked** → Unblock only

### Post → Comment → DM Flow

1. Create a post with header (e.g. "Ride Share Cambridge"), title, body (markdown), hashtags.
2. Others comment publicly. Each comment shows author's real name and photo.
3. Click a commenter → their profile → Add Friend (if not friends).
4. Once friends → Message button unlocks → start a DM or add them to a group chat.
5. Coordinate privately (meetup time, place, payment) in chat.

---

## Data Model (Firestore)

### Forum

`**posts`** — Discussion posts

```
authorId, authorName, authorPhoto
header: string          // e.g. "Ride Share Cambridge"
title: string           // one-line summary
body: string            // markdown-lite (**bold**, _italic_)
hashtags: string[]
searchTokens: string[]  // mixed English/Chinese tokens for search
visibility: "public" | "private"
createdAt, commentCount
```

`**posts/{postId}/comments**` — Threaded comments

```
authorId, authorName, authorPhoto
body: string
parentId: string | null   // null = top-level, commentId = reply
createdAt
```

### Social

`**users/{userId}**` — Profile (displayName, email, photoURL)

`**friendRequests**` — fromId, toId, status (pending | accepted | declined)

`**friendships**` — userIds: [uid1, uid2] (array-contains for friend list)

`**blocks**` — blockerId → blockedUsers subcollection

`**reports**` — reporterId, reportedUserId, reason

### Chat

`**chats**` — type (dm | group), participantIds, groupName?, lastMessage, lastMessageAt

`**chats/{chatId}/messages**` — senderId, senderName, body, createdAt (real-time via `onSnapshot`)

---

## Search Strategy

Two modes, detected by whether input starts with `#`:


| Mode        | Input                   | Query                                                 |
| ----------- | ----------------------- | ----------------------------------------------------- |
| **Hashtag** | `#rideshare` or `#拼车`   | `where("hashtags", "array-contains", tag)`            |
| **Keyword** | `cambridge 剑桥` or mixed | `where("searchTokens", "array-contains-any", tokens)` |


### Mixed Tokenizer (English + Chinese)

- **English:** Split by spaces/punctuation, lowercase.
- **Chinese (CJK):** Generate consecutive bigrams.

Example:

```
tokenize("ride share 剑桥火车站")
→ ["ride", "share", "剑桥", "桥火", "火车", "车站"]
```

Tokens are built from: header + title + first 150 chars of body + hashtags. Keyword results are ranked client-side by match count.

---

## App Structure

```
app/
├── page.tsx                    # Feed (public posts, newest first)
├── post/
│   ├── create/page.tsx         # Create post
│   └── [id]/page.tsx           # Post detail + comments
├── user/[userId]/page.tsx      # Public user profile
├── notifications/page.tsx      # Friend requests (bell icon)
├── chat/
│   ├── page.tsx                # Chat list (DMs + Groups)
│   ├── new-group/page.tsx      # Create group chat
│   └── [chatId]/page.tsx       # Chat conversation (real-time)
├── profile/page.tsx            # My Posts + Commented tabs
├── search/page.tsx             # Hashtag + keyword search
└── layout.tsx                  # AuthProvider + BottomNav

src/
├── components/     PostCard, Avatar, BottomNav, SignInPrompt
├── hooks/          useFeed, useComments, useFriends, useChats, useMessages
├── services/       PostService, CommentService, FriendService, ChatService
├── context/        AuthContext
└── lib/            tokenizer, testMode (E2E mocking)
```

---

## Pages & Features


| Page          | Route             | Auth     | Description                                                  |
| ------------- | ----------------- | -------- | ------------------------------------------------------------ |
| Feed          | `/`               | Required | Public posts, newest first, paginated                        |
| Create Post   | `/create`         | Required | Header, title, body (markdown toolbar), hashtags, visibility |
| Post Detail   | `/post/[id]`      | Optional | Markdown body, hashtag links, comments, reply threading      |
| User Profile  | `/user/[userId]`  | Required | Posts, Add Friend / Message / Remove Friend                  |
| Notifications | `/notifications`  | Required | Friend requests, Accept / Decline                            |
| Chat List     | `/chat`           | Required | DMs + Groups, last message preview                           |
| Chat          | `/chat/[chatId]`  | Required | Real-time messages, send/receive                             |
| Create Group  | `/chat/new-group` | Required | Name group, pick friends                                     |
| Profile       | `/profile`        | Required | My Posts, Commented tabs, Sign Out                           |
| Search        | `/search`         | Optional | `#hashtag` or keywords, English + 中文                         |


---

## Bottom Navigation


| Tab     | Route      |
| ------- | ---------- |
| Feed    | `/`        |
| Post    | `/create`  |
| Search  | `/search`  |
| Chat    | `/chat`    |
| Profile | `/profile` |


Bell icon in header → `/notifications` (badge when pending friend requests)

---

## Visibility

- **public** — Surfaces in feed and search
- **private** — Direct URL only, shareable via link

---

## Live Site

**[https://together-0314.vercel.app](https://together-0314.vercel.app)**

Deployed on [Vercel](https://vercel.com) with Firebase (Auth + Firestore) as the backend.

---

## Getting Started (Local)

1. Copy `.env.local.example` to `.env.local` and add your Firebase config.
2. Create a Firebase project, enable Auth (Google) and Firestore.
3. Deploy Firestore rules:

```bash
npx firebase-tools deploy --only firestore:rules,firestore:indexes --project <your-project-id>
```

1. Run locally:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Firestore Security Rules

Rules in `firestore.rules` enforce:

- **Users** — Any signed-in user can read profiles; only the owner can write their own.
- **Posts** — Public posts readable by anyone; only the author can create/delete.
- **Comments** — Readable by all; only signed-in users can create with their own `authorId`.
- **Friend requests** — Visible only to sender and recipient; updates limited to `status` field.
- **Friendships** — Readable/deletable only by the two friends involved.
- **Chats & Messages** — Participants only; only the sender can create a message.
- **Blocks** — Owner-only.
- **Reports** — Any signed-in user can file; read/edit blocked (admin console only).

---

## E2E Tests

```bash
npm run test:e2e          # headless (local)
npm run test:e2e:headed   # with browser visible
npm run test:e2e:ui       # Playwright UI mode

# Against production URL:
$env:PLAYWRIGHT_BASE_URL="https://together-0314.vercel.app"
npm run test:e2e:prod
```

**133 tests** covering:

- Feed, create post, post detail (English + Chinese)
- Comments, replies, delete
- Search (hashtag, keyword, Chinese, mixed)
- User profiles, Add Friend, friend requests
- Notifications (accept/decline)
- Chat list, DM conversation, group creation
- Profile tabs, navigation

Tests use mocked Firebase (auth + Firestore) via `window.__E2E__` injection — no real backend calls. All 133 tests pass against the production Vercel URL.