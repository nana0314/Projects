import { test, expect } from './fixtures';

test.describe('Ingredient Sheet', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    const card = page.getByTestId('swipe-card');
    await expect(card).toBeVisible({ timeout: 45_000 });
  });

  test('tapping a recipe card opens the ingredient sheet', async ({ page }) => {
    await page.getByTestId('swipe-card').click();
    const sheet = page.getByTestId('ingredient-sheet');
    await expect(sheet).toBeVisible({ timeout: 5000 });
  });

  test('ingredient sheet shows the recipe title', async ({ page }) => {
    const recipeTitle = await page.getByTestId('swipe-card').locator('h2').textContent();
    await page.getByTestId('swipe-card').click();

    const sheetTitle = page.getByTestId('ingredient-title');
    await expect(sheetTitle).toBeVisible();
    if (recipeTitle) {
      await expect(sheetTitle).toHaveText(recipeTitle);
    }
  });

  test('ingredient sheet shows list of ingredients', async ({ page }) => {
    await page.getByTestId('swipe-card').click();
    await page.getByTestId('ingredient-sheet').waitFor();

    const ingredientsList = page.getByTestId('ingredient-sheet').locator('li');
    await expect(ingredientsList.first()).toBeVisible({ timeout: 3000 });
    const count = await ingredientsList.count();
    expect(count).toBeGreaterThan(0);
  });

  test('"View Full Recipe" button navigates to recipe detail page', async ({ page }) => {
    await page.getByTestId('swipe-card').click();
    await page.getByTestId('ingredient-sheet').waitFor();

    await page.getByTestId('view-full-recipe').click();
    await page.waitForURL(/\/recipe\//, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h2').filter({ hasText: /Ingredients/ }).first()).toBeVisible({ timeout: 20_000 });
  });

  test('ingredient sheet has a save to pack button', async ({ page }) => {
    await page.getByTestId('swipe-card').click();
    await page.getByTestId('ingredient-sheet').waitFor();

    const saveBtn = page.getByTestId('ingredient-sheet').getByTitle('Save to Meal Pack');
    await expect(saveBtn).toBeVisible();
  });
});
