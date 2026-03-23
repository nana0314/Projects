import { test, expect } from '@playwright/test';
import { setupMockFirebase, MOCK_POSTS, MOCK_USER } from './helpers/mockFirebase';

test.describe('Feed Page — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows pin header with logo', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'pin' })).toBeVisible();
  });

  test('shows bottom nav with 5 tabs', async ({ page }) => {
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
    for (const tab of ['feed', 'post', 'search', 'chat', 'profile']) {
      await expect(page.getByTestId(`nav-${tab}`)).toBeVisible();
    }
  });

  test('shows notification bell when signed in', async ({ page }) => {
    await expect(page.getByTestId('notifications-link')).toBeVisible({ timeout: 10000 });
  });

  test('renders post cards from mock data', async ({ page }) => {
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 10000 });
  });

  test('post card shows Ride Share header badge', async ({ page }) => {
    await expect(page.getByText('Ride Share').first()).toBeVisible({ timeout: 10000 });
  });

  test('post card shows English title', async ({ page }) => {
    await expect(page.getByText(/Anyone heading to Cambridge station/)).toBeVisible({ timeout: 10000 });
  });

  test('post card shows author name', async ({ page }) => {
    await expect(page.getByText(MOCK_POSTS[0].authorName).first()).toBeVisible({ timeout: 10000 });
  });

  test('post card shows #cambridge hashtag', async ({ page }) => {
    await expect(page.getByText('#cambridge').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows Chinese post title in feed', async ({ page }) => {
    await expect(page.getByText('有人一起去剑桥火车站吗？')).toBeVisible({ timeout: 10000 });
  });

  test('clicking a post card navigates to post detail', async ({ page }) => {
    const card = page.getByTestId('post-card').first();
    await card.waitFor({ timeout: 10000 });
    await card.click();
    await expect(page).toHaveURL(/\/post\//);
  });

  test('Create Post nav button navigates to create page', async ({ page }) => {
    await page.getByTestId('nav-post').click();
    await expect(page).toHaveURL(/\/create/);
  });
});

test.describe('Feed Page — Unauthenticated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows pin header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'pin' })).toBeVisible();
  });

  test('no notification bell when not signed in', async ({ page }) => {
    await expect(page.getByTestId('notifications-link')).not.toBeVisible();
  });
});
