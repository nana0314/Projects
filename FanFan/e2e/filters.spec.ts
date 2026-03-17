import { test, expect } from './fixtures';

test.describe('Filter Modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('filter-button').waitFor({ timeout: 10_000 });
  });

  test('opens filter modal when filter button is clicked', async ({ page }) => {
    await page.getByTestId('filter-button').click();
    const modal = page.getByTestId('filter-modal');
    await expect(modal).toBeVisible({ timeout: 3000 });
    await expect(page.getByRole('heading', { name: 'Filters' })).toBeVisible();
  });

  test('shows Cuisine, Diet, Intolerances, and Meal Type sections', async ({ page }) => {
    await page.getByTestId('filter-button').click();
    await page.getByTestId('filter-modal').waitFor();

    await expect(page.getByText('Cuisine')).toBeVisible();
    await expect(page.getByText('Diet')).toBeVisible();
    await expect(page.getByText('Intolerances')).toBeVisible();
    await expect(page.getByText('Meal Type')).toBeVisible();
  });

  test('can select a cuisine and apply filters', async ({ page }) => {
    await page.getByTestId('filter-button').click();
    await page.getByTestId('filter-modal').waitFor();

    const japaneseButton = page.getByTestId('filter-modal').getByRole('button', { name: 'Japanese' });
    await japaneseButton.click();

    await page.getByTestId('apply-filters').click();
    await expect(page.getByTestId('filter-modal')).not.toBeVisible({ timeout: 3000 });

    const filterBtn = page.getByTestId('filter-button');
    await expect(filterBtn).toHaveClass(/bg-orange-500/);
  });

  test('reset clears all filters', async ({ page }) => {
    // Open and select a cuisine
    await page.getByTestId('filter-button').click();
    await page.getByTestId('filter-modal').waitFor();
    await page.getByTestId('filter-modal').getByRole('button', { name: 'Chinese' }).click();
    await page.getByTestId('apply-filters').click();
    await page.waitForTimeout(500);

    // Re-open and reset
    await page.getByTestId('filter-button').click();
    await page.getByTestId('filter-modal').waitFor();
    await page.getByText('Reset').click();
    await page.waitForTimeout(500);

    // Filter button should no longer be highlighted
    const filterBtn = page.getByTestId('filter-button');
    await expect(filterBtn).not.toHaveClass(/bg-orange-500/);
  });
});
