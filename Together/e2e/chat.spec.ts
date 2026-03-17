import { test, expect } from '@playwright/test';

test.describe('Chat Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/chat/');
  });

  test('shows sign-in prompt when not authenticated', async ({ page }) => {
    await expect(page.getByText(/Sign in to access chats/i)).toBeVisible();
  });
});
