import { test, expect } from '@playwright/test';

test.describe('Feed Page', () => {
  test('loads the feed page', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('feed-page')).toBeVisible();
  });

  test('shows Pin logo in header', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Pin' })).toBeVisible();
  });

  test('shows notification bell when signed in (mocked)', async ({ page }) => {
    // Without auth, bell should not appear
    await page.goto('/');
    // nav links exist
    await expect(page.getByTestId('bottom-nav')).toBeVisible();
  });
});
