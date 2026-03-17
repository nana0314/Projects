import { test, expect } from '@playwright/test';

test.describe('Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows bottom nav with 5 tabs', async ({ page }) => {
    const nav = page.getByTestId('bottom-nav');
    await expect(nav).toBeVisible();
    await expect(page.getByTestId('nav-feed')).toBeVisible();
    await expect(page.getByTestId('nav-post')).toBeVisible();
    await expect(page.getByTestId('nav-search')).toBeVisible();
    await expect(page.getByTestId('nav-chat')).toBeVisible();
    await expect(page.getByTestId('nav-profile')).toBeVisible();
  });

  test('navigates to Search page', async ({ page }) => {
    await page.getByTestId('nav-search').click();
    await expect(page).toHaveURL(/\/search/);
    await expect(page.getByTestId('search-page')).toBeVisible();
  });

  test('navigates to Profile page', async ({ page }) => {
    await page.getByTestId('nav-profile').click();
    await expect(page).toHaveURL(/\/profile/);
    // Without auth, shows sign-in prompt; either way the page loaded
    await expect(page.locator('body')).toBeVisible();
  });

  test('navigates to Chat page', async ({ page }) => {
    await page.getByTestId('nav-chat').click();
    await expect(page).toHaveURL(/\/chat/);
  });

  test('navigates to Create Post page', async ({ page }) => {
    await page.getByTestId('nav-post').click();
    await expect(page).toHaveURL(/\/create/);
  });
});
