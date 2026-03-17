import { test, expect } from './fixtures';

test.describe('Recipe Detail Page', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  async function navigateToRecipeDetail(page: import('@playwright/test').Page & { mockApi?: void }) {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('swipe-card')).toBeVisible({ timeout: 45_000 });
    await page.getByTestId('swipe-card').click();
    await page.getByTestId('ingredient-sheet').waitFor({ timeout: 5000 });
    await page.getByTestId('view-full-recipe').click();
    await page.waitForURL(/\/recipe\//, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
  }

  test('navigating from ingredient sheet shows full recipe', async ({ page }) => {
    await navigateToRecipeDetail(page);
    await expect(page.locator('h2').filter({ hasText: /Ingredients/ }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('recipe detail page shows hero image', async ({ page }) => {
    await navigateToRecipeDetail(page);
    const heroImage = page.locator('img').first();
    await expect(heroImage).toBeVisible({ timeout: 20_000 });
  });

  test('recipe detail page shows instructions when available', async ({ page }) => {
    await navigateToRecipeDetail(page);
    await expect(page.locator('h2').filter({ hasText: 'Instructions' }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('back button navigates away from recipe detail', async ({ page }) => {
    await navigateToRecipeDetail(page);
    await page.waitForTimeout(1000);
    await page.goBack();
    await page.waitForTimeout(1000);
    expect(page.url()).not.toMatch(/\/recipe\//);
  });

  test('recipe detail shows source attribution', async ({ page }) => {
    await navigateToRecipeDetail(page);
    await expect(page.getByText(/Powered by Spoonacular|Data from TheMealDB/)).toBeVisible({ timeout: 20_000 });
  });
});
