import { test, expect } from './fixtures';

test.describe('Meal Packs (localStorage mode)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('swipe-stack').waitFor({ timeout: 30_000 });
  });

  test('save button opens the Add to Pack sheet with "Create new Meal Pack"', async ({ page }) => {
    await page.getByTestId('btn-save').click();
    const sheet = page.getByTestId('add-to-pack-sheet');
    await expect(sheet).toBeVisible({ timeout: 3000 });
    await expect(page.getByTestId('create-pack-label')).toHaveText('Create new Meal Pack');
  });

  test('can create a new Meal Pack from the save sheet', async ({ page }) => {
    await page.getByTestId('btn-save').click();
    await page.getByTestId('add-to-pack-sheet').waitFor();

    await page.getByText('Create new Meal Pack').click();
    const input = page.getByPlaceholder('Pack name...');
    await expect(input).toBeVisible();

    await input.fill('My Test Pack');
    await page.getByRole('button', { name: 'Add' }).click();

    await expect(page.getByText('My Test Pack')).toBeVisible({ timeout: 3000 });
  });

  test('can create a pack and save a recipe (auto-selected on create)', async ({ page }) => {
    await page.getByTestId('btn-save').click();
    await page.getByTestId('add-to-pack-sheet').waitFor();

    // Create a new pack — it becomes auto-selected
    await page.getByText('Create new Meal Pack').click();
    await page.getByPlaceholder('Pack name...').fill('Favorites');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    // Pack is auto-selected after creation, so Done should be enabled
    const doneBtn = page.getByRole('button', { name: 'Done' });
    await expect(doneBtn).toBeEnabled({ timeout: 3000 });
    await doneBtn.click();
    await page.waitForTimeout(300);

    await expect(page.getByTestId('add-to-pack-sheet')).not.toBeVisible();
  });

  test('saved pack appears on the Packs page', async ({ page }) => {
    // Create a pack and save (auto-selected)
    await page.getByTestId('btn-save').click();
    await page.getByTestId('add-to-pack-sheet').waitFor();
    await page.getByText('Create new Meal Pack').click();
    await page.getByPlaceholder('Pack name...').fill('Dinner Ideas');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Done' }).click();
    await page.waitForTimeout(500);

    // Navigate to Packs page
    await page.getByTestId('nav-packs').click();
    await page.waitForURL(/\/packs/);
    await expect(page.getByText('Dinner Ideas')).toBeVisible({ timeout: 5000 });
  });

  test('can open a pack and see the saved recipe', async ({ page }) => {
    const recipeTitle = await page.getByTestId('swipe-card').locator('h2').textContent();

    // Create a pack and save (auto-selected)
    await page.getByTestId('btn-save').click();
    await page.getByTestId('add-to-pack-sheet').waitFor();
    await page.getByText('Create new Meal Pack').click();
    await page.getByPlaceholder('Pack name...').fill('Quick Meals');
    await page.getByRole('button', { name: 'Add' }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: 'Done' }).click();
    await page.waitForTimeout(500);

    // Navigate to Packs page and open the pack
    await page.getByTestId('nav-packs').click();
    await page.waitForURL(/\/packs/);
    await page.getByText('Quick Meals').click();
    await page.waitForTimeout(1000);

    if (recipeTitle) {
      await expect(page.getByText(recipeTitle)).toBeVisible({ timeout: 5000 });
    }
  });
});
