import { defineConfig, devices } from '@playwright/test';

/**
 * Smart Split - Playwright E2E Test Configuration
 * Run: npx playwright test
 * Run with UI: npx playwright test --ui
 * Run specific file: npx playwright test tests/e2e/dashboard.spec.ts
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 10_000 },
  fullyParallel: false, // Serial to avoid Firebase quota issues
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    // Larger viewport to ensure all elements visible
    viewport: { width: 390, height: 844 }, // iPhone 14 simulation
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
  // Start Next.js dev server before tests (reuses if already running)
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
