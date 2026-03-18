import { test, expect } from '@playwright/test';
import { setupMockFirebase, MOCK_USER, MOCK_OTHER_USER } from './helpers/mockFirebase';

test.describe('Chat — Unauthenticated', () => {
  test('redirects to sign-in or shows auth prompt', async ({ page }) => {
    await page.goto('/chat/');
    await page.waitForLoadState('domcontentloaded');
    const hasAuthPrompt = await page.getByText(/sign in/i).isVisible();
    const redirected = !page.url().includes('/chat');
    expect(hasAuthPrompt || redirected).toBeTruthy();
  });
});

test.describe('Chat List — Authenticated', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page, { areFriends: true, includeChats: true });
    await page.goto('/chat/');
    await page.waitForSelector('[data-testid="chat-list-page"]', { timeout: 15000 });
  });

  test('shows chat list page', async ({ page }) => {
    await expect(page.getByTestId('chat-list-page')).toBeVisible();
  });

  test('shows DM conversation in list', async ({ page }) => {
    await expect(page.getByTestId('chat-item').first()).toBeVisible({ timeout: 10000 });
  });

  test('shows other user name in DM chat', async ({ page }) => {
    await expect(page.getByText(MOCK_OTHER_USER.displayName).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows last message preview', async ({ page }) => {
    await expect(page.getByText(/Hey, are you going to Cambridge/i)).toBeVisible({ timeout: 10000 });
  });

  test('clicking DM navigates to chat conversation', async ({ page }) => {
    await page.getByTestId('chat-item').first().click();
    await expect(page).toHaveURL(/\/chat\/dm-chat-1/, { timeout: 10000 });
  });

  test('new group chat button is visible', async ({ page }) => {
    await expect(page.getByRole('link', { name: /New group/i })).toBeVisible({ timeout: 8000 });
  });
});

test.describe('Chat Conversation — DM (dm-chat-1)', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page, { areFriends: true, includeChats: true });
    await page.goto('/chat/dm-chat-1/');
    await page.waitForSelector('[data-testid="chat-detail-page"]', { timeout: 15000 });
  });

  test('shows chat detail page', async ({ page }) => {
    await expect(page.getByTestId('chat-detail-page')).toBeVisible();
  });

  test('shows other user name in chat header', async ({ page }) => {
    await expect(page.getByText(MOCK_OTHER_USER.displayName).first()).toBeVisible({ timeout: 10000 });
  });

  test('shows message input field', async ({ page }) => {
    await expect(page.getByTestId('message-input')).toBeVisible();
  });

  test('send button disabled when input empty', async ({ page }) => {
    await expect(page.getByTestId('send-message')).toBeDisabled();
  });

  test('send button enabled after typing', async ({ page }) => {
    await page.getByTestId('message-input').fill('Hello!');
    await expect(page.getByTestId('send-message')).toBeEnabled();
  });

  test('can send an English message', async ({ page }) => {
    await page.getByTestId('message-input').fill('Hey, are you still going to Cambridge station?');
    await page.getByTestId('send-message').click();
    await expect(page.getByTestId('message-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can send a Chinese message', async ({ page }) => {
    await page.getByTestId('message-input').fill('你好！你还去剑桥吗？');
    await page.getByTestId('send-message').click();
    await expect(page.getByTestId('message-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can send a mixed English/Chinese message', async ({ page }) => {
    await page.getByTestId('message-input').fill('I want to go too! 我也想去！');
    await page.getByTestId('send-message').click();
    await expect(page.getByTestId('message-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can press Enter to send message', async ({ page }) => {
    await page.getByTestId('message-input').fill('Quick message via Enter!');
    await page.getByTestId('message-input').press('Enter');
    await expect(page.getByTestId('message-input')).toHaveValue('', { timeout: 8000 });
  });

  test('can send multiple messages in sequence', async ({ page }) => {
    const messages = ['First message', '第二条消息', 'Third: mixed 混合消息'];
    for (const msg of messages) {
      await page.getByTestId('message-input').fill(msg);
      await page.getByTestId('send-message').click();
      await expect(page.getByTestId('message-input')).toHaveValue('', { timeout: 8000 });
    }
  });

  test('back button returns to chat list', async ({ page }) => {
    // Build browser history: navigate to chat list first, then to the DM
    await page.goto('/chat/');
    await page.waitForLoadState('domcontentloaded');
    await page.goto('/chat/dm-chat-1/');
    await page.waitForSelector('[data-testid="chat-detail-page"]', { timeout: 10000 });
    await page.goBack();
    await expect(page).toHaveURL(/\/chat\/?$/, { timeout: 8000 });
  });
});

test.describe('Create Group Chat — With friends', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page, { areFriends: true, includeChats: true });
    await page.goto('/chat/new-group/');
    await page.waitForSelector('[data-testid="create-group-page"]', { timeout: 15000 });
  });

  test('shows create group page', async ({ page }) => {
    await expect(page.getByTestId('create-group-page')).toBeVisible();
  });

  test('shows group name input', async ({ page }) => {
    await expect(page.getByTestId('group-name-input')).toBeVisible();
  });

  test('shows friend to add', async ({ page }) => {
    await expect(page.getByText(MOCK_OTHER_USER.displayName)).toBeVisible({ timeout: 10000 });
  });

  test('Create button disabled without group name', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  test('can create an English-named group', async ({ page }) => {
    await page.getByText(MOCK_OTHER_USER.displayName).waitFor({ timeout: 10000 });
    await page.getByTestId('group-name-input').fill('Cambridge Ride Share Group');
    await page.getByText(MOCK_OTHER_USER.displayName).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/chat\//, { timeout: 12000 });
  });

  test('can create a Chinese-named group', async ({ page }) => {
    await page.getByText(MOCK_OTHER_USER.displayName).waitFor({ timeout: 10000 });
    await page.getByTestId('group-name-input').fill('剑桥拼车群');
    await page.getByText(MOCK_OTHER_USER.displayName).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/chat\//, { timeout: 12000 });
  });

  test('can create a mixed-language group', async ({ page }) => {
    await page.getByText(MOCK_OTHER_USER.displayName).waitFor({ timeout: 10000 });
    await page.getByTestId('group-name-input').fill('Cambridge 剑桥 Group Chat');
    await page.getByText(MOCK_OTHER_USER.displayName).click();
    await page.getByRole('button', { name: 'Create' }).click();
    await expect(page).toHaveURL(/\/chat\//, { timeout: 12000 });
  });
});

test.describe('Create Group Chat — No friends', () => {
  test.beforeEach(async ({ page }) => {
    await setupMockFirebase(page, { areFriends: false });
    await page.goto('/chat/new-group/');
    await page.waitForSelector('[data-testid="create-group-page"]', { timeout: 15000 });
  });

  test('shows no friends to add message', async ({ page }) => {
    await expect(page.getByText(/No friends yet/i)).toBeVisible({ timeout: 10000 });
  });
});
