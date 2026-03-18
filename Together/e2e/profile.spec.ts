import { test, expect } from '@playwright/test';
import { setupMockFirebase, MOCK_USER, MOCK_POSTS } from './helpers/mockFirebase';

test.describe('Profile — Unauthenticated', () => {
  test('shows sign-in prompt or redirects', async ({ page }) => {
    await page.goto('/profile/');
    await page.waitForLoadState('domcontentloaded');
    const hasSignIn = await page.getByText(/sign in/i).isVisible();
    const redirected = !page.url().includes('/profile');
    expect(hasSignIn || redirected).toBeTruthy();
  });
});

test.describe('Profile — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/profile/');
    await page.waitForSelector('[data-testid="profile-page"]', { timeout: 15000 });
  });

  test('shows profile page', async ({ page }) => {
    await expect(page.getByTestId('profile-page')).toBeVisible();
  });

  test('shows user display name', async ({ page }) => {
    await expect(page.getByText(MOCK_USER.displayName)).toBeVisible({ timeout: 10000 });
  });

  test('shows user email', async ({ page }) => {
    await expect(page.getByText(MOCK_USER.email)).toBeVisible({ timeout: 10000 });
  });

  test('shows My Posts tab', async ({ page }) => {
    await expect(page.getByTestId('tab-posts')).toBeVisible({ timeout: 8000 });
  });

  test('shows Commented Posts tab', async ({ page }) => {
    await expect(page.getByTestId('tab-commented')).toBeVisible({ timeout: 8000 });
  });

  test('can switch to Commented Posts tab', async ({ page }) => {
    await page.getByTestId('tab-commented').click();
    await expect(page.getByTestId('tab-commented')).toBeVisible();
  });

  test('shows sign out button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /sign out|logout|log out/i })).toBeVisible({ timeout: 8000 });
  });

  test('sign out button works (navigates away or shows sign-in)', async ({ page }) => {
    await page.getByRole('button', { name: /sign out|logout|log out/i }).click();
    // After signing out, should leave /profile or show sign-in prompt
    await page.waitForLoadState('domcontentloaded');
    const url = page.url();
    const showsSignIn = await page.getByText(/sign in/i).isVisible();
    expect(!url.includes('/profile') || showsSignIn).toBeTruthy();
  });
});

test.describe('Navigation — Bottom Nav', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('bottom nav is visible', async ({ page }) => {
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
  });

  test('nav-feed links to home feed', async ({ page }) => {
    await page.getByTestId('nav-feed').click();
    await expect(page).toHaveURL(/^http:\/\/localhost:\d+\/$/);
  });

  test('nav-post links to create page', async ({ page }) => {
    await page.getByTestId('nav-post').click();
    await expect(page).toHaveURL(/\/create/);
  });

  test('nav-search links to search page', async ({ page }) => {
    await page.getByTestId('nav-search').click();
    await expect(page).toHaveURL(/\/search/);
  });

  test('nav-chat links to chat page', async ({ page }) => {
    await page.getByTestId('nav-chat').click();
    await expect(page).toHaveURL(/\/chat/);
  });

  test('nav-profile links to profile page', async ({ page }) => {
    await page.getByTestId('nav-profile').click();
    await expect(page).toHaveURL(/\/profile/);
  });

  test('full round-trip navigation through all tabs', async ({ page }) => {
    const tabs = [
      { id: 'nav-search', urlPattern: /\/search/ },
      { id: 'nav-post',   urlPattern: /\/create/ },
      { id: 'nav-chat',   urlPattern: /\/chat/   },
      { id: 'nav-profile',urlPattern: /\/profile/},
      { id: 'nav-feed',   urlPattern: /localhost:\d+\/$/ },
    ];
    for (const { id, urlPattern } of tabs) {
      await page.getByTestId(id).click();
      await expect(page).toHaveURL(urlPattern, { timeout: 8000 });
    }
  });
});
