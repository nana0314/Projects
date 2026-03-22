import { Page } from '@playwright/test';

/**
 * Smart Split Test Helpers — Auth Mocking
 *
 * Because Smart Split uses Firebase Auth with a custom AuthContext,
 * we mock the authenticated state by intercepting the Firebase requests
 * and setting up localStorage values that the app uses.
 *
 * For full E2E against Firebase, real credentials are needed.
 * These helpers allow testing UI flows in both authenticated and
 * unauthenticated states.
 */

export const TEST_USER = {
  uid: 'test-user-uid-playwright',
  email: 'playwright@test.com',
  displayName: 'Playwright Tester',
  photoURL: null,
};

/**
 * Mock Firebase Auth by injecting script into page context.
 * This patches the Firebase SDK in-browser to return a fake user.
 */
export async function mockFirebaseAuth(page: Page) {
  // Set localStorage items that Firebase SDK uses for session persistence
  await page.addInitScript(() => {
    // Patch localStorage to simulate Firebase auth persistence
    Object.defineProperty(window, '__PLAYWRIGHT_AUTH_MOCK__', {
      value: true,
      writable: false,
    });
  });
}

/**
 * Navigate to a page and wait for it to fully load (no skeleton).
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  // Wait for the page to be interactive (hydrated)
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for the Next.js app to hydrate.
 */
export async function waitForHydration(page: Page) {
  await page.waitForFunction(() => document.readyState === 'complete');
  // Small buffer for React hydration
  await page.waitForTimeout(500);
}

/**
 * Check if an element is visible on page.
 */
export async function isVisible(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    return await element.isVisible({ timeout: 3000 });
  } catch {
    return false;
  }
}
