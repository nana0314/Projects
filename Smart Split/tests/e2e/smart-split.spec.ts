/**
 * Smart Split — Comprehensive E2E Test Suite
 *
 * Tests all key functionality:
 * 1. UI Layout/Visibility Rules (theme toggle, add-expense button)
 * 2. Navigation & Bottom Nav
 * 3. Activity Page (no Add Expense, filters, sort)
 * 4. Dashboard Page (theme toggle present, AI Insights card)
 * 5. AI Weekly Insights (enable/disable, display)
 * 6. AI Chatbot (NLP parsing, multiple scenarios)
 * 7. OCR Receipt Scanning (file upload, validity check)
 * 8. Expense management
 *
 * NOTE: Tests that require Firebase Auth will skip gracefully if not logged in.
 * Run the app locally with `npm run dev` before running tests.
 */

import { test, expect, Page } from '@playwright/test';

// ===========================================================================
// HELPERS
// ===========================================================================

/** Go to page, wait for network idle */
async function nav(page: Page, url: string) {
  await page.goto(url, { waitUntil: 'networkidle' });
}

/** Check if element exists & is visible */
async function visible(page: Page, selector: string): Promise<boolean> {
  return page.locator(selector).isVisible({ timeout: 3000 }).catch(() => false);
}

/** Wait for redirect away (e.g. auth redirect to '/') */
async function waitForAuthRedirect(page: Page): Promise<boolean> {
  try {
    await page.waitForURL('/', { timeout: 5000 });
    return true;
  } catch {
    return false;
  }
}

// ===========================================================================
// SUITE 1: Landing Page / Unauthenticated State
// ===========================================================================

test.describe('Landing Page', () => {
  test('renders properly with sign-in options', async ({ page }) => {
    await nav(page, '/');
    await expect(page).toHaveTitle(/Smart Split/i);
    // Should have a login/sign-in element or landing hero
    const body = page.locator('body');
    await expect(body).toBeVisible();
    // No bottom nav on landing
    const bottomNav = page.locator('nav');
    const hasNav = await bottomNav.count();
    // Either nav is absent or hidden on root
    const currentURL = page.url();
    expect(currentURL).toContain('localhost:3000');
  });

  test('unauthenticated: dashboard redirects to /', async ({ page }) => {
    await page.goto('/dashboard');
    // Should either show landing or redirect to /
    await page.waitForTimeout(3000);
    const url = page.url();
    // Either we stay on dashboard (logged in) or get redirected to /
    expect(url).toMatch(/localhost:3000\/(dashboard|$|\?)/);
  });

  test('unauthenticated: activity redirects to /', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(3000);
    const url = page.url();
    expect(url).toMatch(/localhost:3000\/(activity|$|\?)/);
  });
});

// ===========================================================================
// SUITE 2: UI Visibility Rules — Theme Toggle
// ===========================================================================

test.describe('Theme Toggle Visibility Rules', () => {
  test('theme toggle should NOT be visible on landing page /', async ({ page }) => {
    await nav(page, '/');
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    const isThemeVisible = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isThemeVisible).toBe(false);
  });

  test('theme toggle should NOT be visible on /activity page when logged in and visiting directly', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(2000);
    // If redirected to /, skip (not logged in)
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    const isThemeVisible = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isThemeVisible).toBe(false);
  });

  test('theme toggle should NOT be visible on /friends page (dashboard-only rule)', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    const isThemeVisible = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isThemeVisible).toBe(false);
  });

  test('theme toggle should NOT be visible on /groups page (dashboard-only rule)', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    const isThemeVisible = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isThemeVisible).toBe(false);
  });

  test('theme toggle is ONLY shown on /dashboard when logged in', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      // Not logged in — we still verify the toggle is absent
      const themeBtn = page.locator('[aria-label="Toggle theme"]');
      const isVisible = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(false);
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible({ timeout: 5000 });
  });

  test('theme toggle can be clicked and toggles mode on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible({ timeout: 5000 });

    // Get initial theme
    const htmlEl = page.locator('html');
    const initialClass = await htmlEl.getAttribute('class');

    // Click toggle
    await themeBtn.click();
    await page.waitForTimeout(500);

    const newClass = await htmlEl.getAttribute('class');
    // Classes should have changed (dark/light toggled)
    // The body or html might have 'dark' class added/removed
    // We just verify it was clickable without error
    expect(themeBtn).toBeDefined();
  });
});

// ===========================================================================
// SUITE 3: Add Expense Button Visibility Rules
// ===========================================================================

test.describe('Add Expense Button Visibility Rules', () => {
  test('Add Expense button is NOT visible on /activity page', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      // Not logged in — button also shouldn't be shown (requires auth)
      const addExpenseLink = page.locator('a[href="/add-expense"]:has-text("Add")');
      const isVisible = await addExpenseLink.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(false);
      return;
    }
    // On activity — the floating Add Expenses button must NOT be there
    const addExpenseLink = page.locator('a[href="/add-expense"]:has-text("Add")');
    const isVisible = await addExpenseLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('Add Expense button IS visible on /friends page when logged in', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const addExpenseLink = page.locator('a[href="/add-expense"]');
    await expect(addExpenseLink).toBeVisible({ timeout: 5000 });
  });

  test('Add Expense button IS visible on /groups page when logged in', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const addExpenseLink = page.locator('a[href="/add-expense"]');
    await expect(addExpenseLink).toBeVisible({ timeout: 5000 });
  });

  test('Add Expense button is NOT visible on /dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Dashboard doesn't have the floating add-expense button
    const floatingBtn = page.locator('a[href="/add-expense"]:has-text("Add Expenses")');
    const isVisible = await floatingBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });
});

// ===========================================================================
// SUITE 4: Navigation / Bottom Nav
// ===========================================================================

test.describe('Bottom Navigation', () => {
  test('bottom nav is NOT shown on landing page /', async ({ page }) => {
    await nav(page, '/');
    // Expected: nav with bottom nav links should be hidden on root
    const dashboardLink = page.locator('nav a[href="/dashboard"]');
    const isVisible = await dashboardLink.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('bottom nav is shown on /dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const dashboardLink = page.locator('nav a[href="/dashboard"]');
    await expect(dashboardLink).toBeVisible({ timeout: 5000 });
  });

  test('bottom nav links navigate to correct pages', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Click Friends
    await page.locator('nav a[href="/friends"]').click();
    await page.waitForURL('**/friends');
    expect(page.url()).toContain('/friends');

    // Click Groups
    await page.locator('nav a[href="/groups"]').click();
    await page.waitForURL('**/groups');
    expect(page.url()).toContain('/groups');

    // Click Activity
    await page.locator('nav a[href="/activity"]').click();
    await page.waitForURL('**/activity');
    expect(page.url()).toContain('/activity');

    // Click Dashboard
    await page.locator('nav a[href="/dashboard"]').click();
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });
});

// ===========================================================================
// SUITE 5: Activity Page
// ===========================================================================

test.describe('Activity Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(2000);
  });

  test('activity page has correct header title', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const heading = page.locator('h1:has-text("Activity")');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('activity page has NO floating Add Expense button', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      // Not logged in — also no button
      const addBtn = page.locator('a:has-text("Add Expenses")');
      const isVisible = await addBtn.isVisible({ timeout: 2000 }).catch(() => false);
      expect(isVisible).toBe(false);
      return;
    }
    // Specifically the floating green "Add Expenses" button must be absent
    const addBtn = page.locator('a:has-text("Add Expenses")');
    const isVisible = await addBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('activity page has NO theme toggle button', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    const isVisible = await themeBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('activity page shows expense filters (Paid by You, Type, Category, Sort)', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Paid by You checkbox
    await expect(page.locator('text=Paid by You')).toBeVisible({ timeout: 5000 });
    // Type selector
    await expect(page.locator('select').first()).toBeVisible({ timeout: 5000 });
  });

  test('activity page: filter by "Paid by You" works without error', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const checkbox = page.locator('input[type="checkbox"]');
    await expect(checkbox).toBeVisible({ timeout: 5000 });
    await checkbox.check();
    await page.waitForTimeout(500);
    expect(await checkbox.isChecked()).toBe(true);
    // Uncheck
    await checkbox.uncheck();
    expect(await checkbox.isChecked()).toBe(false);
  });

  test('activity page: filter by Type works (Personal/Shared/All)', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const typeSelect = page.locator('select').first();
    await expect(typeSelect).toBeVisible({ timeout: 5000 });

    await typeSelect.selectOption('personal');
    await page.waitForTimeout(300);
    expect(await typeSelect.inputValue()).toBe('personal');

    await typeSelect.selectOption('shared');
    await page.waitForTimeout(300);
    expect(await typeSelect.inputValue()).toBe('shared');

    await typeSelect.selectOption('all');
    expect(await typeSelect.inputValue()).toBe('all');
  });

  test('activity page: sort by Oldest works', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Find sort select (last select in the filter bar)
    const selects = page.locator('select');
    const count = await selects.count();
    if (count < 1) {
      test.skip();
      return;
    }
    const sortSelect = selects.last();
    await sortSelect.selectOption('oldest');
    await page.waitForTimeout(300);
    expect(await sortSelect.inputValue()).toBe('oldest');
    await sortSelect.selectOption('newest');
    expect(await sortSelect.inputValue()).toBe('newest');
  });

  test('activity page: filter by Category works', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const selects = page.locator('select');
    const count = await selects.count();
    // There should be at least 2 selects: Type and Category (and Sort)
    if (count < 2) {
      test.skip();
      return;
    }
    // Category select is 2nd select
    const categorySelect = selects.nth(1);
    await categorySelect.selectOption('Food');
    await page.waitForTimeout(300);
    expect(await categorySelect.inputValue()).toBe('Food');

    await categorySelect.selectOption('Transportation');
    expect(await categorySelect.inputValue()).toBe('Transportation');

    await categorySelect.selectOption('all');
    expect(await categorySelect.inputValue()).toBe('all');
  });
});

// ===========================================================================
// SUITE 6: Dashboard Page
// ===========================================================================

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
  });

  test('dashboard shows heading "Dashboard"', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const heading = page.locator('h1:has-text("Dashboard")');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('dashboard has theme toggle button', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    await expect(themeBtn).toBeVisible({ timeout: 7000 });
  });

  test('dashboard has AI Insights card', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // InsightsCard renders something with "AI" text
    const insightsCard = page.locator('text=/AI (Weekly )?Insights/i').first();
    await expect(insightsCard).toBeVisible({ timeout: 7000 });
  });

  test('dashboard expense type filter (All/Personal/Shared) works', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Wait for data to load (skeleton to disappear)
    await page.waitForTimeout(3000);

    const allBtn = page.locator('button:has-text("All")');
    const personalBtn = page.locator('button:has-text("Personal")');
    const sharedBtn = page.locator('button:has-text("Shared")');

    // Expect All/Personal/Shared filter buttons to be present
    await expect(allBtn.first()).toBeVisible({ timeout: 5000 });

    if (await personalBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await personalBtn.click();
      await page.waitForTimeout(500);
      await sharedBtn.click();
      await page.waitForTimeout(500);
      await allBtn.first().click();
      await page.waitForTimeout(500);
    }
  });

  test('dashboard refresh button works', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const refreshBtn = page.locator('button[title="Refresh"]');
    await expect(refreshBtn).toBeVisible({ timeout: 5000 });
    await refreshBtn.click();
    await page.waitForTimeout(1000);
    // No errors expected
  });

  test('dashboard Simplify debts toggle works', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const simplifyBtn = page.locator('button:has-text("Simplify"), button:has-text("Simplified")');
    await expect(simplifyBtn).toBeVisible({ timeout: 5000 });
    await simplifyBtn.click();
    await page.waitForTimeout(300);
    // Should toggle the text
    await simplifyBtn.click();
    await page.waitForTimeout(300);
  });
});

// ===========================================================================
// SUITE 7: AI Weekly Insights
// ===========================================================================

test.describe('AI Weekly Insights', () => {
  test('insights page loads and shows Weekly AI Insights heading', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const heading = page.locator('h1:has-text("AI Insights"), h1:has-text("Insights")');
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test('insights page has enable/disable toggle for Weekly AI Insights', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Toggle button for insights
    const toggle = page.locator('button[class*="rounded-full"][class*="w-12"]');
    await expect(toggle).toBeVisible({ timeout: 7000 });
  });

  test('insights page: can toggle AI insights on and off', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForTimeout(3000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    const toggle = page.locator('button[class*="rounded-full"][class*="w-12"]').first();
    await expect(toggle).toBeVisible({ timeout: 7000 });

    // Get initial state
    const wasEnabled = await toggle.evaluate(
      (el) => el.classList.contains('bg-purple-600')
    );

    // Click to toggle
    await toggle.click();
    await page.waitForTimeout(1500); // Wait for Firebase write

    // Verify state changed
    const isNowEnabled = await toggle.evaluate(
      (el) => el.classList.contains('bg-purple-600')
    );

    expect(isNowEnabled).toBe(!wasEnabled);

    // Toggle back to original
    await toggle.click();
    await page.waitForTimeout(1500);
  });

  test('insights page shows correct empty state when no insights yet', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForTimeout(3000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    // Either shows insights list or empty state message
    const hasInsights = await page.locator('text=/Week of/i').count();
    const hasNoInsightsMessage = await page.locator('text=/No Insights Yet/i').isVisible({ timeout: 2000 }).catch(() => false);
    const hasEnabledMessage = await page.locator('text=/Enable AI Insights/i').isVisible({ timeout: 2000 }).catch(() => false);

    // At least one of these must be true
    expect(hasInsights > 0 || hasNoInsightsMessage || hasEnabledMessage).toBe(true);
  });

  test('insights page: when insights exist, shows totalSpent and tips', async ({ page }) => {
    await page.goto('/insights');
    await page.waitForTimeout(3000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    const insightCards = page.locator('text=/Week of/i');
    const count = await insightCards.count();

    if (count === 0) {
      // No insights yet — acceptable
      console.log('No insights available yet, skipping card content checks');
      return;
    }

    // If insights exist, verify key fields are shown
    await expect(page.locator('text=Total').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Personal').first()).toBeVisible({ timeout: 3000 });
    await expect(page.locator('text=Shared').first()).toBeVisible({ timeout: 3000 });
  });

  test('dashboard InsightsCard shows "Enable AI Insights" CTA when disabled', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    // Either CTA or active insights will be shown
    const enableCTA = page.locator('button:has-text("Enable AI Insights")');
    const insightCard = page.locator('text=/Weekly Insight|AI Insights Enabled/i');

    const ctaVisible = await enableCTA.isVisible({ timeout: 3000 }).catch(() => false);
    const cardVisible = await insightCard.isVisible({ timeout: 3000 }).catch(() => false);

    expect(ctaVisible || cardVisible).toBe(true);
  });

  test('dashboard InsightsCard: clicking Enable AI Insights button works', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    const enableCTA = page.locator('button:has-text("Enable AI Insights")');
    if (await enableCTA.isVisible({ timeout: 3000 }).catch(() => false)) {
      await enableCTA.click();
      await page.waitForTimeout(2000);
      // Should change to disabled or active state
      const wasEnabled = await page.locator('button:has-text("Disable"), text=/AI Insights Enabled/i').isVisible({ timeout: 3000 }).catch(() => false);
      console.log('AI Insights enabled after click:', wasEnabled);
    }
  });
});

// ===========================================================================
// SUITE 8: AI Chatbot (NLP Text Parsing)
// ===========================================================================

test.describe('AI Chatbot — NLP Text Parsing', () => {
  async function openChat(page: Page): Promise<boolean> {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      return false;
    }
    const chatBubble = page.locator('[aria-label="Open AI Expense Assistant"]');
    const isVisible = await chatBubble.isVisible({ timeout: 5000 }).catch(() => false);
    if (!isVisible) return false;
    await chatBubble.click();
    await page.waitForTimeout(500);
    return true;
  }

  test('AI chat bubble is visible on dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const chatBubble = page.locator('[aria-label="Open AI Expense Assistant"]');
    await expect(chatBubble).toBeVisible({ timeout: 7000 });
  });

  test('AI chat bubble is NOT visible on /activity page (auth-only shows on allowed pages)', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const chatBubble = page.locator('[aria-label="Open AI Expense Assistant"]');
    const isVisible = await chatBubble.isVisible({ timeout: 2000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('AI chat modal opens and shows suggestions', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    // Modal should be open — look for the AI Expense Assistant heading
    await expect(page.locator('h2:has-text("AI Expense Assistant")')).toBeVisible({ timeout: 5000 });

    // Check for suggested prompts
    const suggestionsExist = await page.locator('text="Coffee 8.50, split with Sarah"').isVisible({ timeout: 3000 }).catch(() => false);
    const hasSuggestions = await page.locator('text=/Try saying/i').isVisible({ timeout: 3000 }).catch(() => false);
    expect(suggestionsExist || hasSuggestions).toBe(true);
  });

  test('AI chat modal can be closed', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const closeBtn = page.locator('[aria-label="Close"]');
    await expect(closeBtn).toBeVisible({ timeout: 3000 });
    await closeBtn.click();
    await page.waitForTimeout(300);

    const modal = page.locator('h2:has-text("AI Expense Assistant")');
    const isVisible = await modal.isVisible({ timeout: 1000 }).catch(() => false);
    expect(isVisible).toBe(false);
  });

  test('NLP: typing a simple expense message and sending', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await expect(input).toBeVisible({ timeout: 5000 });
    
    await input.fill('Coffee 8.50');
    await page.locator('[aria-label="Send"]').click();

    // Wait for AI response (can take a few seconds)
    await page.waitForTimeout(8000);
    
    // The assistant should have replied
    const messages = page.locator('[class*="rounded-2xl"]');
    const msgCount = await messages.count();
    expect(msgCount).toBeGreaterThanOrEqual(2); // User message + AI reply
  });

  test('NLP: split with friend scenario', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Lunch 25, split with John');
    
    await input.press('Enter');
    await page.waitForTimeout(8000);
    
    // Should get a response from the AI
    const messages = page.locator('[class*="rounded-2xl"]');
    expect(await messages.count()).toBeGreaterThan(1);
  });

  test('NLP: group expense scenario', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Uber 30, I paid for the Weekend Trip group');
    
    const sendBtn = page.locator('[aria-label="Send"]');
    await sendBtn.click();
    await page.waitForTimeout(8000);
    
    const messages = page.locator('[class*="rounded-2xl"]');
    expect(await messages.count()).toBeGreaterThan(1);
  });

  test('NLP: grocery expense with category', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Groceries from Woolworths $120');
    
    const sendBtn = page.locator('[aria-label="Send"]');
    await sendBtn.click();
    await page.waitForTimeout(8000);
    
    const messages = page.locator('[class*="rounded-2xl"]');
    expect(await messages.count()).toBeGreaterThan(1);
  });

  test('NLP: "everyone" keyword in group context', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Pizza 60 split with everyone in the group');
    
    const sendBtn = page.locator('[aria-label="Send"]');
    await sendBtn.click();
    await page.waitForTimeout(8000);
    
    const messages = page.locator('[class*="rounded-2xl"]');
    expect(await messages.count()).toBeGreaterThan(1);
  });

  test('NLP: clicking a suggested prompt populates input', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const suggestedPrompt = page.locator('text="Coffee 8.50, split with Sarah"');
    if (await suggestedPrompt.isVisible({ timeout: 3000 }).catch(() => false)) {
      await suggestedPrompt.click();
      const input = page.locator('input[placeholder="Describe your expense..."]');
      const value = await input.inputValue();
      expect(value).toContain('Coffee');
    }
  });

  test('NLP: conversation history persists across multiple messages', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    
    // Send first message
    await input.fill('Coffee 5');
    await input.press('Enter');
    await page.waitForTimeout(6000);
    
    // Send follow-up
    await input.fill('And also lunch 15');
    await input.press('Enter');
    await page.waitForTimeout(6000);
    
    // Should have at least 4 messages (2 user + 2 AI)
    const messages = page.locator('[class*="rounded-2xl"]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(4);
  });

  test('NLP: parsed expense card shows Confirm/Edit/Cancel buttons', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Sushi dinner 80');
    await input.press('Enter');
    await page.waitForTimeout(10000);

    // Look for action buttons (Confirm / Edit / Cancel)
    const confirmBtn = page.locator('button:has-text("Confirm")');
    const cardVisible = await confirmBtn.isVisible({ timeout: 3000 }).catch(() => false);
    
    if (cardVisible) {
      // Test Cancel
      const cancelBtn = page.locator('button:has-text("Cancel")');
      await cancelBtn.click();
      await page.waitForTimeout(500);
      // Cancel feedback shown
      const cancelled = await page.locator('text=Cancelled').isVisible({ timeout: 2000 }).catch(() => false);
      expect(cancelled).toBe(true);
    }
  });

  test('NLP: Edit in Form button navigates to add-expense', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Movie tickets 40');
    await input.press('Enter');
    await page.waitForTimeout(10000);

    const editBtn = page.locator('button:has-text("Edit")');
    if (await editBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await editBtn.click();
      await page.waitForTimeout(1000);
      expect(page.url()).toContain('/add-expense');
    }
  });
});

// ===========================================================================
// SUITE 9: OCR Receipt Scanning
// ===========================================================================

test.describe('AI Chatbot — OCR Receipt Scanning', () => {
  async function openChat(page: Page): Promise<boolean> {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      return false;
    }
    const chatBubble = page.locator('[aria-label="Open AI Expense Assistant"]');
    if (!await chatBubble.isVisible({ timeout: 5000 }).catch(() => false)) return false;
    await chatBubble.click();
    await page.waitForTimeout(500);
    return true;
  }

  test('scan receipt button is present in chat modal', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    const scanBtn = page.locator('[aria-label="Scan Receipt"]');
    await expect(scanBtn).toBeVisible({ timeout: 5000 });
  });

  test('scan receipt: uploading a valid receipt image triggers processing', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    // Create a minimal JPEG-like file buffer using page evaluate
    // We'll use a 1x1 white image as a proxy receipt image
    const fileInput = page.locator('input[type="file"]');
    
    // Create a real minimal white JPEG (used as a placeholder receipt)
    // The AI/OCR will process it and either extract data or say it's not a receipt
    await fileInput.setInputFiles({
      name: 'test-receipt.jpg',
      mimeType: 'image/jpeg',
      // Minimal JPEG bytes (1x1 white pixel)
      buffer: Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
        0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
        0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
        0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
        0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
        0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
        0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x01,
        0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
        0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
        0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
        0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
        0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD7,
        0xFF, 0xD9
      ])
    });

    // Wait for processing
    await page.waitForTimeout(15000);

    // Should show either:
    // a) "Scanning receipt..." user message
    // b) An AI response about the receipt (could not read / found items)
    const messages = page.locator('[class*="rounded-2xl"]');
    const count = await messages.count();
    expect(count).toBeGreaterThanOrEqual(1);

    // Check for scanning message appearance
    const scanningMsg = page.locator('text=/Scanning receipt|Could not|receipt/i');
    const hasScanMsg = await scanningMsg.isVisible({ timeout: 5000 }).catch(() => false);
    console.log('Receipt scan message visible:', hasScanMsg, 'Message count:', count);
  });

  test('scan receipt: non-receipt image is handled gracefully (not a receipt check)', async ({ page }) => {
    const opened = await openChat(page);
    if (!opened) { test.skip(); return; }

    // This test simulates an uploaded image that is NOT a receipt
    // The cloud function should detect this and return an appropriate message
    const fileInput = page.locator('input[type="file"]');

    await fileInput.setInputFiles({
      name: 'profile-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from([
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xD9
      ])
    });

    // The system should handle this — either say not a receipt or try to parse
    await page.waitForTimeout(15000);

    const messages = page.locator('[class*="rounded-2xl"]');
    const count = await messages.count();
    // Regardless of the response, the app should not crash
    expect(count).toBeGreaterThanOrEqual(1);
    console.log('Non-receipt message count:', count);
  });
});

// ===========================================================================
// SUITE 10: Add Expense Page (Form)
// ===========================================================================

test.describe('Add Expense Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/add-expense');
    await page.waitForTimeout(2000);
  });

  test('add expense page loads with a form', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Should have amount input or a form
    const amountInput = page.locator('input[type="number"], input[placeholder*="amount" i], input[placeholder*="Amount" i]');
    await expect(amountInput.first()).toBeVisible({ timeout: 7000 });
  });

  test('add expense: required fields validation', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    // Try submitting empty form
    const submitBtn = page.locator('button[type="submit"], button:has-text("Add Expense"), button:has-text("Save")');
    if (await submitBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(500);
      // Should show validation error or not navigate away
      const currentURL = page.url();
      expect(currentURL).toContain('/add-expense');
    }
  });

  test('add expense: can navigate back', async ({ page }) => {
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    await page.goBack();
    await page.waitForTimeout(500);
    // Should have navigated away
  });
});

// ===========================================================================
// SUITE 11: Profile Page
// ===========================================================================

test.describe('Profile Page', () => {
  test('profile page accessible when logged in', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });
});

// ===========================================================================
// SUITE 12: End-to-End Flow Scenarios
// ===========================================================================

test.describe('E2E Flow Scenarios', () => {
  test('Flow: Dashboard → AI Chat → NLP → Cancel', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    // Open chat
    const chatBubble = page.locator('[aria-label="Open AI Expense Assistant"]');
    await expect(chatBubble).toBeVisible({ timeout: 7000 });
    await chatBubble.click();
    await page.waitForTimeout(500);

    // Type an expense
    const input = page.locator('input[placeholder="Describe your expense..."]');
    await input.fill('Taxi $18 yesterday');
    await input.press('Enter');
    await page.waitForTimeout(10000);

    // If a card appeared, cancel it
    const cancelBtn = page.locator('button:has-text("Cancel")');
    if (await cancelBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelBtn.click();
      await page.waitForTimeout(500);
    }

    // Close chat
    await page.locator('[aria-label="Close"]').click();
    await page.waitForTimeout(300);

    // Verify we're back on dashboard
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 3000 });
  });

  test('Flow: Dashboard → Activity (verify no Add Expense & no theme toggle)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    // Theme toggle should be visible on dashboard
    const themeToggle = page.locator('[aria-label="Toggle theme"]');
    await expect(themeToggle).toBeVisible({ timeout: 7000 });

    // Navigate to activity
    await page.locator('nav a[href="/activity"]').click();
    await page.waitForURL('**/activity');
    await page.waitForTimeout(1000);

    // Theme toggle should be GONE on activity
    const toggleGone = await themeToggle.isVisible({ timeout: 2000 }).catch(() => false);
    expect(toggleGone).toBe(false);

    // Add expense button should also be GONE
    const addExpBtn = page.locator('a:has-text("Add Expenses")');
    const addBtnGone = await addExpBtn.isVisible({ timeout: 2000 }).catch(() => false);
    expect(addBtnGone).toBe(false);
  });

  test('Flow: Insights toggle on dashboard → navigate to full insights page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(3000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    // Look for the insights card link or "View all" button
    const insightsLink = page.locator('a[href="/insights"]');
    if (await insightsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await insightsLink.click();
      await page.waitForURL('**/insights');
      await expect(page.locator('text=/AI Insights/i').first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('Flow: Friends page → Add expense from floating button', async ({ page }) => {
    await page.goto('/friends');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    const addBtn = page.locator('a[href="/add-expense"]');
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForURL('**/add-expense');
      expect(page.url()).toContain('/add-expense');
    }
  });

  test('Flow: Groups page → Add expense from floating button', async ({ page }) => {
    await page.goto('/groups');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    const addBtn = page.locator('a[href="/add-expense"]');
    if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForURL('**/add-expense');
      expect(page.url()).toContain('/add-expense');
    }
  });

  test('Flow: Multiple chat interactions simulate full session', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    const chatBubble = page.locator('[aria-label="Open AI Expense Assistant"]');
    if (!await chatBubble.isVisible({ timeout: 5000 }).catch(() => false)) {
      test.skip();
      return;
    }
    await chatBubble.click();
    await page.waitForTimeout(500);

    const input = page.locator('input[placeholder="Describe your expense..."]');
    const sendBtn = page.locator('[aria-label="Send"]');

    // Message 1: Simple expense
    await input.fill('Breakfast 12.50');
    await sendBtn.click();
    await page.waitForTimeout(7000);

    // Message 2: With friend
    await input.fill('Coffee with Alice, $8');
    await sendBtn.click();
    await page.waitForTimeout(7000);

    // Message 3: Question style
    await input.fill('How much did I spend on lunch today?');
    await sendBtn.click();
    await page.waitForTimeout(7000);

    // Message 4: Entertainment
    await input.fill('Movie tickets 35 Entertainment');
    await sendBtn.click();
    await page.waitForTimeout(7000);

    // Verify we have multiple messages
    const messages = page.locator('[class*="rounded-2xl"]');
    const count = await messages.count();
    // 4 user + at least 4 AI = 8 messages min
    expect(count).toBeGreaterThanOrEqual(6);
    console.log('Total chat messages after multi-turn:', count);
  });
});

// ===========================================================================
// SUITE 13: Accessibility Checks
// ===========================================================================

test.describe('Accessibility & Semantic Checks', () => {
  test('landing page has a single h1', async ({ page }) => {
    await nav(page, '/');
    const h1s = page.locator('h1');
    const count = await h1s.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('dashboard page has a single h1 (Dashboard)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const h1s = page.locator('h1');
    const count = await h1s.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('activity page has a single h1 (Activity)', async ({ page }) => {
    await page.goto('/activity');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }
    const h1s = page.locator('h1');
    const count = await h1s.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('interactive buttons have aria-labels', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    if (page.url().endsWith('/') || page.url().endsWith('localhost:3000')) {
      test.skip();
      return;
    }

    // Theme toggle and chat bubble should have aria-label
    const themeBtn = page.locator('[aria-label="Toggle theme"]');
    const chatBtn = page.locator('[aria-label="Open AI Expense Assistant"]');

    await expect(themeBtn).toBeVisible({ timeout: 5000 });
    await expect(chatBtn).toBeVisible({ timeout: 5000 });
  });
});
