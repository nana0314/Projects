import { Page } from '@playwright/test';
import { Timestamp } from 'firebase/firestore';

export const MOCK_POSTS = [
  {
    id: 'post-1',
    authorId: 'user-1',
    authorName: 'Alice Chan',
    authorPhoto: '',
    header: 'Ride Share',
    title: 'Anyone heading to Cambridge station?',
    body: 'Looking to split an Uber around **5pm** today.',
    hashtags: ['cambridge', 'rideshare'],
    searchTokens: ['anyone', 'heading', 'cambridge', 'station', 'cambridge', 'rideshare'],
    visibility: 'public' as const,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 },
    commentCount: 2,
  },
  {
    id: 'post-2',
    authorId: 'user-2',
    authorName: 'Bob Lee',
    authorPhoto: '',
    header: 'Bundle Split',
    title: 'Splitting a Costco membership',
    body: 'Anyone want to share the cost?',
    hashtags: ['costco', 'bundle'],
    searchTokens: ['splitting', 'costco', 'membership', 'bundle'],
    visibility: 'public' as const,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200, nanoseconds: 0 },
    commentCount: 0,
  },
];

export const MOCK_COMMENTS = [
  {
    id: 'comment-1',
    authorId: 'user-2',
    authorName: 'Bob Lee',
    authorPhoto: '',
    body: 'I might be interested!',
    parentId: null,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 1800, nanoseconds: 0 },
  },
  {
    id: 'comment-2',
    authorId: 'user-3',
    authorName: 'Carol Wu',
    authorPhoto: '',
    body: 'Same here, let\'s connect',
    parentId: null,
    createdAt: { seconds: Math.floor(Date.now() / 1000) - 900, nanoseconds: 0 },
  },
];

export async function mockFirestore(page: Page) {
  // Mock Firebase Firestore API calls
  await page.route('**/firestore.googleapis.com/**', async route => {
    const url = route.request().url();

    // Feed query
    if (url.includes('posts') && url.includes('runQuery')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_POSTS.map(p => ({
          document: {
            name: `projects/test/databases/(default)/documents/posts/${p.id}`,
            fields: {
              authorId: { stringValue: p.authorId },
              authorName: { stringValue: p.authorName },
              authorPhoto: { stringValue: p.authorPhoto },
              header: { stringValue: p.header },
              title: { stringValue: p.title },
              body: { stringValue: p.body },
              hashtags: { arrayValue: { values: p.hashtags.map(h => ({ stringValue: h })) } },
              searchTokens: { arrayValue: { values: p.searchTokens.map(t => ({ stringValue: t })) } },
              visibility: { stringValue: p.visibility },
              commentCount: { integerValue: p.commentCount.toString() },
              createdAt: { timestampValue: new Date(p.createdAt.seconds * 1000).toISOString() },
            },
          },
        }))),
      });
      return;
    }

    await route.continue();
  });
}
