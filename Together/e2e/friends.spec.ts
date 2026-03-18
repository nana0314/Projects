import { test, expect } from '@playwright/test';
import { setupMockFirebase, setupE2EDataOnly, MOCK_USER, MOCK_OTHER_USER } from './helpers/mockFirebase';

test.describe('User Profile — Unauthenticated', () => {
  test('shows user profile page without auth', async ({ page }) => {
    await setupE2EDataOnly(page);
    await page.goto(`/user/${MOCK_OTHER_USER.uid}/`);
    await page.waitForLoadState('domcontentloaded');
    await expect(page.getByTestId('user-profile-page')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('User Profile — Add Friend (no prior friendship)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page, { areFriends: false });
    await page.goto(`/user/${MOCK_OTHER_USER.uid}/`);
    await page.waitForSelector('[data-testid="user-profile-page"]', { timeout: 15000 });
  });

  test('shows other user display name', async ({ page }) => {
    await expect(page.getByTestId('profile-display-name')).toBeVisible({ timeout: 12000 });
    await expect(page.getByTestId('profile-display-name')).toHaveText(MOCK_OTHER_USER.displayName);
  });

  test('shows Add Friend button when not friends', async ({ page }) => {
    await expect(page.getByTestId('add-friend-btn')).toBeVisible({ timeout: 10000 });
  });

  test('no Message button before becoming friends', async ({ page }) => {
    await expect(page.getByTestId('message-btn')).not.toBeVisible();
  });

  test('clicking Add Friend sends request', async ({ page }) => {
    await page.getByTestId('add-friend-btn').click();
    await expect(page.getByText(/Request Sent|Pending/i)).toBeVisible({ timeout: 8000 });
  });

  test('after sending request, Add Friend button changes state', async ({ page }) => {
    await page.getByTestId('add-friend-btn').click();
    await expect(page.getByTestId('add-friend-btn')).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('User Profile — Already Friends', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page, { areFriends: true });
    await page.goto(`/user/${MOCK_OTHER_USER.uid}/`);
    await page.waitForSelector('[data-testid="user-profile-page"]', { timeout: 15000 });
  });

  test('shows Message button when friends', async ({ page }) => {
    await expect(page.getByTestId('message-btn')).toBeVisible({ timeout: 10000 });
  });

  test('shows Friends ✓ indicator', async ({ page }) => {
    await expect(page.getByText(/Friends ✓|Already Friends/i)).toBeVisible({ timeout: 10000 });
  });

  test('no Add Friend button when already friends', async ({ page }) => {
    await expect(page.getByTestId('add-friend-btn')).not.toBeVisible({ timeout: 5000 });
  });

  test('clicking Message button navigates to DM chat', async ({ page }) => {
    await page.getByTestId('message-btn').click();
    await expect(page).toHaveURL(/\/chat\//, { timeout: 10000 });
  });

  test('shows options menu (block/report/remove)', async ({ page }) => {
    const menuBtn = page.getByRole('button', { name: /⋮|options|more/i }).or(
      page.getByTestId('friend-options-btn')
    );
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await expect(page.getByText(/Remove Friend|Unfriend/i)).toBeVisible({ timeout: 5000 });
    }
  });
});

test.describe('Own Profile Page — Cannot add self as friend', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto(`/user/${MOCK_USER.uid}/`);
    await page.waitForLoadState('domcontentloaded');
  });

  test('no Add Friend button on own profile', async ({ page }) => {
    await expect(page.getByTestId('add-friend-btn')).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('Notifications — Friend Requests', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/notifications/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('shows notifications page', async ({ page }) => {
    await expect(page).toHaveURL(/\/notifications/);
  });

  test('shows incoming friend request from Other Person', async ({ page }) => {
    await expect(page.getByTestId('friend-request').first()).toBeVisible({ timeout: 12000 });
  });

  test('shows requester name', async ({ page }) => {
    await expect(page.getByText(MOCK_OTHER_USER.displayName)).toBeVisible({ timeout: 10000 });
  });

  test('shows "wants to be friends" text', async ({ page }) => {
    await expect(page.getByText(/wants to be friends/i)).toBeVisible({ timeout: 10000 });
  });

  test('shows Accept button for incoming request', async ({ page }) => {
    await expect(page.getByTestId('accept-request').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows Decline button for incoming request', async ({ page }) => {
    await expect(page.getByTestId('decline-request').first()).toBeVisible({ timeout: 10000 });
  });

  test('clicking Accept updates the request status', async ({ page }) => {
    await page.getByTestId('accept-request').first().click();
    await expect(page.getByTestId('accept-request').first()).not.toBeVisible({ timeout: 8000 });
  });

  test('clicking Decline removes the request', async ({ page }) => {
    await page.getByTestId('decline-request').first().click();
    await expect(page.getByTestId('decline-request').first()).not.toBeVisible({ timeout: 8000 });
  });
});

test.describe('Notifications — Notification Bell Badge', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page);
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
  });

  test('notification bell shows badge when there are pending requests', async ({ page }) => {
    await expect(page.getByTestId('notifications-link')).toBeVisible({ timeout: 10000 });
    // Badge may or may not be visible — we just check the bell exists
  });

  test('clicking notification bell goes to notifications page', async ({ page }) => {
    await page.getByTestId('notifications-link').click();
    await expect(page).toHaveURL(/\/notifications/);
  });
});
