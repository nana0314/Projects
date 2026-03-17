import { test, expect } from '@playwright/test';

test.describe('Search Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/search/');
  });

  test('renders search input', async ({ page }) => {
    const input = page.getByTestId('search-input');
    await expect(input).toBeVisible();
  });

  test('shows tips when no query entered', async ({ page }) => {
    await expect(page.getByText('Tips')).toBeVisible();
  });

  test('shows hashtag mode hint when # is typed', async ({ page }) => {
    await page.getByTestId('search-input').fill('#cambridge');
    await expect(page.getByText(/exact hashtag/)).toBeVisible();
  });

  test('shows keyword mode hint for plain text', async ({ page }) => {
    await page.getByTestId('search-input').fill('cambridge uber');
    await expect(page.getByText('Searching by keywords (English + 中文)')).toBeVisible();
  });

  test('can clear the search input', async ({ page }) => {
    await page.getByTestId('search-input').fill('test query');
    await page.getByRole('button', { name: '' }).last().click();
    // After clear, tips should show
    await expect(page.getByText('Tips')).toBeVisible();
  });
});
