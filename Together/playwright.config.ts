import { defineConfig, devices } from '@playwright/test';

/** Production or preview URL for smoke tests; omit for local dev. */
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000';

const isRemoteBase =
  Boolean(process.env.PLAYWRIGHT_BASE_URL) &&
  !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(baseURL);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  reporter: 'html',
  timeout: 45000,
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Local only: Next.js loads Firebase keys from Together/.env.local
  webServer: isRemoteBase
    ? undefined
    : {
        command: 'npx next dev -p 3000',
        url: 'http://localhost:3000',
        reuseExistingServer: true,
        timeout: 120000,
      },
});
