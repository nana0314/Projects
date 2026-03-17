import { test, expect } from './fixtures';

test.describe('Swipe Actions (Desktop Buttons)', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page.getByTestId('swipe-card')).toBeVisible({ timeout: 45_000 });
  });

  test('action buttons are visible on desktop viewport', async ({ page }) => {
    await expect(page.getByTestId('action-buttons')).toBeVisible();
    await expect(page.getByTestId('btn-skip')).toBeVisible();
    await expect(page.getByTestId('btn-save')).toBeVisible();
    await expect(page.getByTestId('btn-undo')).toBeVisible();
  });

  test('skip button advances to next recipe', async ({ page }) => {
    const card = page.getByTestId('swipe-card');
    const titleBefore = await card.locator('h2').textContent();

    await page.getByTestId('btn-skip').click();
    await page.waitForTimeout(500);

    const titleAfter = await page.getByTestId('swipe-card').locator('h2').textContent();
    expect(titleAfter).not.toBe(titleBefore);
  });

  test('undo button is initially disabled', async ({ page }) => {
    await expect(page.getByTestId('btn-undo')).toBeDisabled();
  });

  test('save button opens the Add to Pack sheet', async ({ page }) => {
    await page.getByTestId('btn-save').click();
    const sheet = page.getByTestId('add-to-pack-sheet');
    await expect(sheet).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('Save to Meal Pack')).toBeVisible();
  });

  test('clicking card opens ingredient sheet', async ({ page }) => {
    await page.getByTestId('swipe-card').click();
    const sheet = page.getByTestId('ingredient-sheet');
    await expect(sheet).toBeVisible({ timeout: 3000 });
    await expect(page.getByText(/Ingredients \(/)).toBeVisible();
  });

  test('mouse drag left skips recipe', async ({ page }) => {
    const card = page.getByTestId('swipe-card');
    const titleBefore = await card.locator('h2').textContent();
    const box = await card.boundingBox();
    if (!box) throw new Error('Card not visible');

    const startX = box.x + box.width / 2;
    const startY = box.y + box.height / 2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    for (let i = 0; i < 10; i++) {
      await page.mouse.move(startX - (i + 1) * 20, startY, { steps: 2 });
    }
    await page.mouse.up();
    await page.waitForTimeout(600);

    const titleAfter = await page.getByTestId('swipe-card').locator('h2').textContent();
    expect(titleAfter).not.toBe(titleBefore);
  });
});
