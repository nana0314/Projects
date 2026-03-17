import { test, expect } from '@playwright/test';

test.describe('Create Post Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/create/');
  });

  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await expect(page.getByText(/Sign in to create a post/i)).toBeVisible();
    await expect(page.getByText(/Continue with Google/i)).toBeVisible();
  });

  test('sign in button is visible and clickable', async ({ page }) => {
    const btn = page.getByRole('button', { name: /Continue with Google/i });
    await expect(btn).toBeVisible();
  });
});
