import { test, expect } from '@playwright/test';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile/');
  });

  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await expect(page.getByText(/Sign in to view your profile/i)).toBeVisible();
  });

  test('google sign in button is present', async ({ page }) => {
    await expect(page.getByRole('button', { name: /Continue with Google/i })).toBeVisible();
  });
});
