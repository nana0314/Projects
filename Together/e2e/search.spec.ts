import { test, expect } from '@playwright/test';
import { setupMockFirebase } from './helpers/mockFirebase';

test.describe('Search — UI (no auth required)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/search/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows search input', async ({ page }) => {
    await expect(page.getByTestId('search-input')).toBeVisible();
  });

  test('shows Search button', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test('search button disabled when input empty', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Search' })).toBeDisabled();
  });

  test('search button enabled when typing', async ({ page }) => {
    await page.getByTestId('search-input').fill('cambridge');
    await expect(page.getByRole('button', { name: 'Search' })).toBeEnabled();
  });

  test('shows search tips or placeholder text', async ({ page }) => {
    const hint = page.getByText(/hashtag|keyword|tip|search|#/i).first();
    await expect(hint).toBeVisible({ timeout: 5000 });
  });

  test('clear button appears after typing', async ({ page }) => {
    await page.getByTestId('search-input').fill('test');
    await expect(page.getByTestId('clear-search-btn')).toBeVisible();
  });

  test('clear button resets input', async ({ page }) => {
    await page.getByTestId('search-input').fill('test');
    await page.getByTestId('clear-search-btn').click();
    await expect(page.getByTestId('search-input')).toHaveValue('');
  });
});

test.describe('Search — English keyword search', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/search/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('English keyword "cambridge" shows post', async ({ page }) => {
    await page.getByTestId('search-input').fill('cambridge');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('hashtag #rideshare returns ride share post', async ({ page }) => {
    await page.getByTestId('search-input').fill('#rideshare');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('keyword "uber" returns relevant post', async ({ page }) => {
    await page.getByTestId('search-input').fill('uber');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('hashtag #bundle returns bundle split post', async ({ page }) => {
    await page.getByTestId('search-input').fill('#bundle');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('unknown keyword shows no results message', async ({ page }) => {
    await page.getByTestId('search-input').fill('xyzzy123notfound');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText(/no result|not found|no post/i)).toBeVisible({ timeout: 10000 });
  });

  test('pressing Enter triggers search', async ({ page }) => {
    await page.getByTestId('search-input').fill('cambridge');
    await page.getByTestId('search-input').press('Enter');
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Search — Chinese keyword search', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/search/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('Chinese keyword "剑桥" returns Chinese post', async ({ page }) => {
    await page.getByTestId('search-input').fill('剑桥');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText(/有人一起去剑桥/)).toBeVisible({ timeout: 15000 });
  });

  test('Chinese keyword "拼车" returns ride share post', async ({ page }) => {
    await page.getByTestId('search-input').fill('拼车');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('Chinese hashtag #剑桥 returns Chinese post', async ({ page }) => {
    await page.getByTestId('search-input').fill('#剑桥');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('mixed Chinese + English keyword search', async ({ page }) => {
    await page.getByTestId('search-input').fill('cambridge 剑桥');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('mixed hashtag and keyword search', async ({ page }) => {
    await page.getByTestId('search-input').fill('rideshare 拼车');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByTestId('post-card').first()).toBeVisible({ timeout: 15000 });
  });

  test('clicking a search result navigates to post detail', async ({ page }) => {
    await page.getByTestId('search-input').fill('cambridge');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByTestId('post-card').first().waitFor({ timeout: 15000 });
    await page.getByTestId('post-card').first().click();
    await expect(page).toHaveURL(/\/post\//);
  });
});
