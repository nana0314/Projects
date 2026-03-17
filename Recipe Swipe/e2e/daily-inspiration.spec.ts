import { test, expect } from './fixtures';

test.describe('Daily Inspiration Card', () => {
  test('shows a daily inspiration recipe', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('daily-inspiration');
    await expect(card).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Today's Inspiration")).toBeVisible();
  });

  test('daily card shows a recipe title and image', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('daily-inspiration');
    await expect(card).toBeVisible({ timeout: 20_000 });

    const image = card.locator('img');
    await expect(image).toBeVisible();

    const title = card.locator('h3');
    await expect(title).not.toBeEmpty();
  });

  test('clicking "View Recipe" link navigates to recipe detail', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('daily-inspiration');
    await expect(card).toBeVisible({ timeout: 20_000 });

    await card.getByText('View Recipe').click();
    await page.waitForURL(/\/recipe\//, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /Ingredients/ })).toBeVisible({ timeout: 15_000 });
  });

  test('daily card has a save-to-pack bookmark button', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('daily-inspiration');
    await expect(card).toBeVisible({ timeout: 20_000 });

    const saveBtn = card.getByTitle('Save to Meal Pack');
    await expect(saveBtn).toBeVisible();
  });

  test('daily card save button opens the Add to Pack sheet', async ({ page }) => {
    await page.goto('/');
    const card = page.getByTestId('daily-inspiration');
    await expect(card).toBeVisible({ timeout: 20_000 });

    await card.getByTitle('Save to Meal Pack').click();
    await expect(page.getByTestId('add-to-pack-sheet')).toBeVisible({ timeout: 3000 });
  });
});
