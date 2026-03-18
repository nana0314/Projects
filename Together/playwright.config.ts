import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 2,
  reporter: 'html',
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npx next dev -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 120000,
    env: {
      NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyABPfGInmgOCx5JBcw7E2s9GKID8FZl8Dk',
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'ping-51b68.firebaseapp.com',
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'ping-51b68',
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: 'ping-51b68.firebasestorage.app',
      NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '389292577130',
      NEXT_PUBLIC_FIREBASE_APP_ID: '1:389292577130:web:6fecf7d4ee6c6714c71513',
    },
  },
});
