import { test, expect } from '@playwright/test';
import { setupMockFirebase, setupE2EDataOnly, MOCK_POSTS, MOCK_COMMENTS, MOCK_OTHER_USER } from './helpers/mockFirebase';

test.describe('Post Detail — English post (post-test-1)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/post/post-test-1/');
    await page.waitForLoadState('domcontentloaded');
    // Wait for 'main' which only renders after the post is fully loaded (not during loading skeleton)
    await page.waitForSelector('[data-testid="post-detail-page"] main', { timeout: 20000 });
  });

  test('renders post detail page', async ({ page }) => {
    await expect(page.getByTestId('post-detail-page')).toBeVisible({ timeout: 20000 });
  });

  test('shows post title', async ({ page }) => {
    await expect(page.getByText(/Anyone heading to Cambridge station/).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows Ride Share header badge', async ({ page }) => {
    await expect(page.getByText('Ride Share').first()).toBeVisible();
  });

  test('renders bold markdown in body', async ({ page }) => {
    await expect(page.locator('strong').filter({ hasText: /Departure/ })).toBeVisible();
  });

  test('shows hashtag links', async ({ page }) => {
    await expect(page.getByText('#cambridge')).toBeVisible();
    await expect(page.getByText('#rideshare')).toBeVisible();
  });

  test('clicking hashtag navigates to search', async ({ page }) => {
    await page.getByText('#cambridge').first().click();
    await expect(page).toHaveURL(/\/search/);
  });

  test('shows author name', async ({ page }) => {
    await expect(page.getByText(MOCK_POSTS[0].authorName).first()).toBeVisible();
  });

  test('shows existing comment', async ({ page }) => {
    await expect(page.getByTestId('comment').first()).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(MOCK_COMMENTS[0].body)).toBeVisible();
  });

  test('comment input is visible when signed in', async ({ page }) => {
    await expect(page.getByTestId('comment-input')).toBeVisible();
  });

  test('submit comment disabled when empty', async ({ page }) => {
    await expect(page.getByTestId('submit-comment')).toBeDisabled();
  });

  test('submit comment enabled after typing', async ({ page }) => {
    await page.getByTestId('comment-input').fill('Sounds good!');
    await expect(page.getByTestId('submit-comment')).toBeEnabled();
  });

  test('can submit an English comment', async ({ page }) => {
    await page.getByTestId('comment-input').fill('I can join you at 5pm!');
    await page.getByTestId('submit-comment').click();
    await expect(page.getByTestId('comment-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can submit a Chinese comment', async ({ page }) => {
    await page.getByTestId('comment-input').fill('我也要去，我们一起拼车吧！');
    await page.getByTestId('submit-comment').click();
    await expect(page.getByTestId('comment-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can reply to a comment', async ({ page }) => {
    // Wait for comment to be visible first
    await page.getByTestId('comment').first().waitFor({ timeout: 10000 });
    // Use getByRole to specifically target the Reply button (not the "1 Reply" heading)
    await page.getByRole('button', { name: 'Reply' }).first().click();
    await expect(page.getByText(/Replying to @/)).toBeVisible({ timeout: 5000 });
    await page.getByTestId('comment-input').fill('Great, see you there!');
    await page.getByTestId('submit-comment').click();
    await expect(page.getByTestId('comment-input')).toHaveValue('', { timeout: 8000 });
  });

  test('back button navigates away', async ({ page }) => {
    await page.goBack();
    await expect(page).not.toHaveURL('/post/post-test-1/');
  });

  test('no delete button (not the author)', async ({ page }) => {
    await expect(page.getByTestId('delete-post-btn')).not.toBeVisible();
  });
});

test.describe('Post Detail — Chinese post (post-cn-1)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/post/post-cn-1/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('[data-testid="post-detail-page"] main', { timeout: 20000 });
  });

  test('shows Chinese post title', async ({ page }) => {
    await expect(page.getByText('有人一起去剑桥火车站吗？').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows Chinese body text', async ({ page }) => {
    await expect(page.getByText(/下午五点从市中心出发/)).toBeVisible();
  });

  test('shows Chinese hashtags', async ({ page }) => {
    await expect(page.getByText('#剑桥')).toBeVisible();
    await expect(page.getByText('#拼车')).toBeVisible();
  });

  test('can submit a Chinese comment on Chinese post', async ({ page }) => {
    await page.getByTestId('comment-input').fill('我也想去！几点出发？');
    await page.getByTestId('submit-comment').click();
    await expect(page.getByTestId('comment-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can submit mixed language comment', async ({ page }) => {
    await page.getByTestId('comment-input').fill('I can join! 我可以一起去！');
    await page.getByTestId('submit-comment').click();
    await expect(page.getByTestId('comment-input')).toHaveValue('', { timeout: 8000 });
  });
});

test.describe('Post Detail — Unauthenticated (can still read)', () => {
  test('shows post content without sign in', async ({ page }) => {
    await setupE2EDataOnly(page);
    await page.goto('/post/post-test-1/');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('post-detail-page')).toBeVisible({ timeout: 15000 });
  });
});
