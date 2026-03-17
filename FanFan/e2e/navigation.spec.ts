import { test, expect } from './fixtures';

test.describe('Navigation', () => {
  test('navigates between Discover, Packs, and Profile', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('discovery-page')).toBeVisible({ timeout: 15_000 });

    // Go to Packs
    await page.getByTestId('nav-packs').click();
    await page.waitForURL(/\/packs/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Meal Packs' })).toBeVisible();

    // Go to Profile
    await page.getByTestId('nav-profile').click();
    await page.waitForURL(/\/profile/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: 'Profile' })).toBeVisible();

    // Go back to Discover
    await page.getByTestId('nav-discover').click();
    await page.waitForURL('/', { timeout: 10_000 });
    await expect(page.getByTestId('discovery-page')).toBeVisible();
  });

  test('active tab is highlighted on Discover page', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('nav-discover')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('nav-discover')).toHaveClass(/text-orange-500/);
  });

  test('active tab is highlighted on Packs page', async ({ page }) => {
    await page.goto('/packs/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('nav-packs')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('nav-packs')).toHaveClass(/text-orange-500/);
  });

  test('active tab is highlighted on Profile page', async ({ page }) => {
    await page.goto('/profile/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('nav-profile')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('nav-profile')).toHaveClass(/text-orange-500/);
  });
});
