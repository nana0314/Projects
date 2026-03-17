import { test, expect } from './fixtures';

test.describe('Discovery Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('renders the FanFan header and app title', async ({ page }) => {
    await expect(page.getByTestId('app-title')).toHaveText('FanFan');
    await expect(page.getByText('Swipe to discover recipes')).toBeVisible();
  });

  test('loads and displays a recipe card', async ({ page }) => {
    const swipeStack = page.getByTestId('swipe-stack');
    await expect(swipeStack).toBeVisible({ timeout: 30_000 });
    const card = page.getByTestId('swipe-card');
    await expect(card).toBeVisible();
  });

  test('shows the daily inspiration card', async ({ page }) => {
    const daily = page.getByTestId('daily-inspiration');
    await expect(daily).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("Today's Inspiration")).toBeVisible();
  });

  test('shows the filter button', async ({ page }) => {
    await expect(page.getByTestId('filter-button')).toBeVisible();
  });

  test('shows the bottom navigation bar with three tabs', async ({ page }) => {
    const nav = page.getByTestId('bottom-nav');
    await expect(nav).toBeVisible();
    await expect(page.getByTestId('nav-discover')).toBeVisible();
    await expect(page.getByTestId('nav-packs')).toBeVisible();
    await expect(page.getByTestId('nav-profile')).toBeVisible();
  });

  test('recipe card shows the recipe title inside it', async ({ page }) => {
    const card = page.getByTestId('swipe-card');
    await expect(card).toBeVisible({ timeout: 30_000 });
    const title = card.locator('h2');
    const text = await title.textContent({ timeout: 5000 });
    expect(text?.length).toBeGreaterThan(0);
  });

  test('shows queue count below the swipe area', async ({ page }) => {
    await page.getByTestId('swipe-stack').waitFor({ timeout: 30_000 });
    const queueText = page.getByText(/recipes in queue/i);
    await expect(queueText).toBeVisible({ timeout: 15_000 });
  });
});
