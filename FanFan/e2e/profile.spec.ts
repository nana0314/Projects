import { test, expect } from './fixtures';

test.describe('Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile/');
  });

  test('shows Profile heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();
  });

  test('shows sign-in button when not authenticated', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Sign in with Google' })).toBeVisible();
  });

  test('shows Default Filters section', async ({ page }) => {
    await expect(page.getByText('Default Filters')).toBeVisible();
  });

  test('shows Cuisines, Diet, Intolerances, Meal Type filter sections', async ({ page }) => {
    await expect(page.getByText('Cuisines')).toBeVisible();
    await expect(page.getByText('Diet')).toBeVisible();
    await expect(page.getByText('Intolerances')).toBeVisible();
    await expect(page.getByText('Meal Type')).toBeVisible();
  });

  test('can toggle a cuisine filter in profile', async ({ page }) => {
    const btn = page.getByRole('button', { name: 'Italian' }).first();
    await btn.click();
    await expect(btn).toHaveClass(/bg-orange-500/);

    // Toggle off
    await btn.click();
    await expect(btn).not.toHaveClass(/bg-orange-500/);
  });

  test('shows app version at the bottom', async ({ page }) => {
    await expect(page.getByText('FanFan v1.0')).toBeVisible();
  });

  test('shows API attribution', async ({ page }) => {
    await expect(page.getByText('Powered by Spoonacular & TheMealDB')).toBeVisible();
  });
});
