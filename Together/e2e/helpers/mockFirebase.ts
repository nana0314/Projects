/**
 * mockFirebase.ts
 *
 * Injects test data via window.__E2E__ (read by service-layer overrides) and
 * mocks Firebase Auth so tests bypass the real Google Sign-In popup.
 */
import { Page } from '@playwright/test';
import { E2EData } from '@/src/lib/testMode';

const API_KEY = 'AIzaSyABPfGInmgOCx5JBcw7E2s9GKID8FZl8Dk';

// ── Test users ─────────────────────────────────────────────────────────────────
export const MOCK_USER = {
  uid:         'mock-uid-tester-001',
  email:       'tester@pin.test',
  displayName: 'Test User',
  photoURL:    '',
};
export const MOCK_OTHER_USER = {
  uid:         'mock-uid-other-002',
  email:       'other@pin.test',
  displayName: 'Other Person',
  photoURL:    '',
};

// ── Seed data ──────────────────────────────────────────────────────────────────
const now = Math.floor(Date.now() / 1000);

export const MOCK_POSTS = [
  {
    id: 'post-test-1',
    authorId: MOCK_OTHER_USER.uid, authorName: MOCK_OTHER_USER.displayName, authorPhoto: '',
    header: 'Ride Share',
    title: 'Anyone heading to Cambridge station at 5pm?',
    body:  'Looking to split an Uber. **Departure: City Centre.** Destination: *Cambridge Station*.',
    hashtags:     ['cambridge', 'rideshare', 'uber'],
    searchTokens: ['anyone', 'heading', 'cambridge', 'station', 'split', 'uber', 'rideshare'],
    visibility: 'public' as const, commentCount: 1,
    createdAt: { seconds: now - 3600, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  },
  {
    id: 'post-test-2',
    authorId: MOCK_OTHER_USER.uid, authorName: MOCK_OTHER_USER.displayName, authorPhoto: '',
    header: 'Bundle Split',
    title: 'Splitting a Costco membership — anyone interested?',
    body:  'Annual fee is £25, split two ways = £12.50 each.',
    hashtags:     ['costco', 'bundle', 'split'],
    searchTokens: ['splitting', 'costco', 'membership', 'interested', 'bundle', 'split'],
    visibility: 'public' as const, commentCount: 0,
    createdAt: { seconds: now - 7200, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  },
  {
    id: 'post-cn-1',
    authorId: MOCK_OTHER_USER.uid, authorName: MOCK_OTHER_USER.displayName, authorPhoto: '',
    header: 'Ride Share',
    title: '有人一起去剑桥火车站吗？',
    body:  '下午五点从市中心出发，想拼车去剑桥站。',
    hashtags:     ['剑桥', '拼车'],
    searchTokens: ['有人', '一起', '剑桥', '火车', '车站', '下午', '市中心', '拼车'],
    visibility: 'public' as const, commentCount: 0,
    createdAt: { seconds: now - 1800, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  },
];

export const MOCK_COMMENTS = [
  {
    id: 'comment-1',
    authorId: MOCK_USER.uid, authorName: MOCK_USER.displayName, authorPhoto: '',
    body: "I'm interested! What time are you leaving?",
    parentId: null,
    createdAt: { seconds: now - 1800, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  },
];

export const MOCK_FRIEND_REQUESTS = [
  {
    id: 'fr-incoming-1',
    fromId: MOCK_OTHER_USER.uid, fromName: MOCK_OTHER_USER.displayName, fromPhoto: '',
    toId: MOCK_USER.uid, status: 'pending' as const,
    createdAt: { seconds: now - 300, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  },
];

const DM_CHAT = {
  id: 'dm-chat-1',
  type: 'dm' as const,
  participantIds: [MOCK_USER.uid, MOCK_OTHER_USER.uid],
  participantNames: { [MOCK_USER.uid]: MOCK_USER.displayName, [MOCK_OTHER_USER.uid]: MOCK_OTHER_USER.displayName },
  participantPhotos: { [MOCK_USER.uid]: '', [MOCK_OTHER_USER.uid]: '' },
  lastMessage: 'Hey, are you going to Cambridge?',
  lastMessageAt: { seconds: now - 300, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
  createdAt: { seconds: now - 600, nanoseconds: 0 } as unknown as import('firebase/firestore').Timestamp,
};

// ── Build E2E data payload ─────────────────────────────────────────────────────
function buildE2EData(opts: { areFriends?: boolean; includeChats?: boolean } = {}): E2EData {
  return {
    posts: MOCK_POSTS as unknown as import('@/src/types').Post[],
    postById: Object.fromEntries(MOCK_POSTS.map(p => [p.id, p])) as unknown as Record<string, import('@/src/types').Post>,
    commentsByPost: { 'post-test-1': MOCK_COMMENTS as unknown as import('@/src/types').Comment[] },
    users: {
      [MOCK_USER.uid]:       { uid: MOCK_USER.uid, displayName: MOCK_USER.displayName, email: MOCK_USER.email, photoURL: '' },
      [MOCK_OTHER_USER.uid]: { uid: MOCK_OTHER_USER.uid, displayName: MOCK_OTHER_USER.displayName, email: MOCK_OTHER_USER.email, photoURL: '' },
    },
    friendRequests: MOCK_FRIEND_REQUESTS as unknown as import('@/src/types').FriendRequest[],
    friendships: opts.areFriends ? [[MOCK_USER.uid, MOCK_OTHER_USER.uid]] : [],
    chats: opts.includeChats !== false ? [DM_CHAT as unknown as import('@/src/types').Chat] : [],
    chatById: { 'dm-chat-1': DM_CHAT as unknown as import('@/src/types').Chat },
    messagesByChat: {},
  };
}

// ── Auth injection (bypasses Google Sign-In) ───────────────────────────────────
export async function injectMockAuth(page: Page) {
  await page.addInitScript(({ user, apiKey }) => {
    const key = `firebase:authUser:${apiKey}:[DEFAULT]`;
    localStorage.setItem(key, JSON.stringify({
      uid: user.uid, email: user.email, emailVerified: true,
      displayName: user.displayName, isAnonymous: false, photoURL: user.photoURL,
      providerData: [{ providerId: 'google.com', uid: user.uid, displayName: user.displayName,
                       email: user.email, phoneNumber: null, photoURL: user.photoURL }],
      stsTokenManager: { refreshToken: 'mock-refresh-token', accessToken: 'mock-access-token',
                         expirationTime: Date.now() + 3_600_000 },
      createdAt: String(Date.now()), lastLoginAt: String(Date.now()), apiKey, appName: '[DEFAULT]',
    }));
  }, { user: MOCK_USER, apiKey: API_KEY });
}

// ── Inject E2E data into window.__E2E__ ───────────────────────────────────────
export async function injectE2EData(page: Page, data: E2EData) {
  await page.addInitScript((d) => {
    (window as unknown as Record<string, unknown>).__E2E__ = d;
  }, data as unknown as Record<string, unknown>);
}

// ── Auth API mocks ─────────────────────────────────────────────────────────────
export async function mockAuthAPIs(page: Page) {
  await page.route('**/securetoken.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ access_token: 'mock-access-token', expires_in: '3600',
      token_type: 'Bearer', refresh_token: 'mock-refresh-token',
      id_token: 'mock-id-token', user_id: MOCK_USER.uid }),
  }));
  await page.route('**/identitytoolkit.googleapis.com/**', route => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ users: [{ localId: MOCK_USER.uid, email: MOCK_USER.email,
      displayName: MOCK_USER.displayName, photoUrl: MOCK_USER.photoURL,
      emailVerified: true, validSince: String(Math.floor(Date.now() / 1000) - 3600) }] }),
  }));
}

// ── Combined setup ────────────────────────────────────────────────────────────
export interface MockOptions {
  areFriends?: boolean;
  includeChats?: boolean;
}

export async function setupMockFirebase(page: Page, opts: MockOptions = {}) {
  const data = buildE2EData({ areFriends: opts.areFriends, includeChats: opts.includeChats ?? true });
  await injectMockAuth(page);
  await injectE2EData(page, data);
  await mockAuthAPIs(page);
}

/** Inject E2E data only (no auth) — for testing unauthenticated views that still need mock Firestore data. */
export async function setupE2EDataOnly(page: Page, opts: MockOptions = {}) {
  const data = buildE2EData({ areFriends: opts.areFriends, includeChats: opts.includeChats ?? true });
  await injectE2EData(page, data);
}
