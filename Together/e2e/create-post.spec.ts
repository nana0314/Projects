import { test, expect } from '@playwright/test';
import { setupMockFirebase } from './helpers/mockFirebase';

test.describe('Create Post — Unauthenticated', () => {
  test('redirects to sign-in or shows auth prompt', async ({ page }) => {
    await page.goto('/create/');
    await page.waitForLoadState('domcontentloaded');
    const isOnCreate = page.url().includes('/create');
    const isRedirected = !isOnCreate;
    // Either redirect happened, or an auth prompt is shown
    if (isOnCreate) {
      await expect(page.getByText(/sign in/i)).toBeVisible({ timeout: 8000 });
    } else {
      expect(isRedirected).toBeTruthy();
    }
  });
});

test.describe('Create Post — English post', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/create/');
    await page.waitForSelector('[data-testid="create-post-page"]', { timeout: 15000 });
  });

  test('create post page is visible', async ({ page }) => {
    await expect(page.getByTestId('create-post-page')).toBeVisible();
  });

  test('shows all form fields', async ({ page }) => {
    await expect(page.getByTestId('post-title')).toBeVisible();
    await expect(page.getByTestId('post-body')).toBeVisible();
    await expect(page.getByTestId('post-hashtags')).toBeVisible();
  });

  test('submit button disabled when fields are empty', async ({ page }) => {
    await expect(page.getByTestId('submit-post')).toBeDisabled();
  });

  test('submit button enabled once title and body filled', async ({ page }) => {
    await page.getByRole('button', { name: 'Ride Share' }).first().click();
    await page.getByTestId('post-title').fill('Test post title');
    await page.getByTestId('post-body').fill('Test post body');
    await expect(page.getByTestId('submit-post')).toBeEnabled({ timeout: 5000 });
  });

  test('can select a topic/header', async ({ page }) => {
    await page.getByRole('button', { name: 'Bundle Split' }).click();
    await expect(page.getByRole('button', { name: 'Bundle Split' })).toHaveClass(/bg-brand|ring|selected|active|text-white/);
  });

  test('visibility toggle defaults to public', async ({ page }) => {
    await expect(page.getByText(/public/i).first()).toBeVisible();
  });

  test('can toggle visibility to private', async ({ page }) => {
    await page.getByTestId('visibility-toggle').click();
    await expect(page.getByText(/Only you can see this/i).first()).toBeVisible();
  });

  test('can type bold markdown in body', async ({ page }) => {
    const body = page.getByTestId('post-body');
    await body.click();
    await body.fill('**Bold departure point**');
    await expect(body).toHaveValue('**Bold departure point**');
  });

  test('creates English post (no error shown)', async ({ page }) => {
    await page.getByRole('button', { name: 'Ride Share' }).first().click();
    await page.getByTestId('post-title').fill('Anyone going to Cambridge station?');
    await page.getByTestId('post-body').fill('Looking to split an Uber from City Centre at 5pm.');
    await page.getByTestId('post-hashtags').fill('#cambridge #rideshare #uber');
    await page.getByTestId('submit-post').click();
    await expect(page.getByText(/Failed to create/i)).not.toBeVisible({ timeout: 10000 });
  });

  test('creates post with multiple hashtags', async ({ page }) => {
    await page.getByRole('button', { name: 'Bundle Split' }).first().click();
    await page.getByTestId('post-title').fill('Splitting Costco membership');
    await page.getByTestId('post-body').fill('£25/year, split two ways = £12.50 each.');
    await page.getByTestId('post-hashtags').fill('#costco #bundle #savings');
    await page.getByTestId('submit-post').click();
    await expect(page.getByText(/Failed to create/i)).not.toBeVisible({ timeout: 10000 });
  });
});

test.describe('Create Post — Chinese post', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/create/');
    await page.waitForSelector('[data-testid="create-post-page"]', { timeout: 15000 });
  });

  test('can fill Chinese title', async ({ page }) => {
    await page.getByTestId('post-title').fill('有人一起去剑桥火车站吗？');
    await expect(page.getByTestId('post-title')).toHaveValue('有人一起去剑桥火车站吗？');
  });

  test('can fill Chinese body', async ({ page }) => {
    await page.getByTestId('post-body').fill('下午五点从市中心出发，想拼车去剑桥站。');
    await expect(page.getByTestId('post-body')).toHaveValue('下午五点从市中心出发，想拼车去剑桥站。');
  });

  test('creates Chinese post (no error shown)', async ({ page }) => {
    await page.getByRole('button', { name: 'Ride Share' }).first().click();
    await page.getByTestId('post-title').fill('有人一起去剑桥火车站吗？');
    await page.getByTestId('post-body').fill('下午五点从市中心出发，想拼车去剑桥站。');
    await page.getByTestId('post-hashtags').fill('#剑桥 #拼车');
    await page.getByTestId('submit-post').click();
    await expect(page.getByText(/Failed to create/i)).not.toBeVisible({ timeout: 10000 });
  });

  test('creates mixed English/Chinese post (no error shown)', async ({ page }) => {
    await page.getByRole('button', { name: 'Ride Share' }).first().click();
    await page.getByTestId('post-title').fill('Cambridge 剑桥 — 拼车 Ride Share');
    await page.getByTestId('post-body').fill('Going to Cambridge station 剑桥火车站 at 5pm. **Departure: City Centre 市中心.**');
    await page.getByTestId('post-hashtags').fill('#cambridge #剑桥 #rideshare #拼车');
    await page.getByTestId('submit-post').click();
    await expect(page.getByText(/Failed to create/i)).not.toBeVisible({ timeout: 10000 });
  });
});
