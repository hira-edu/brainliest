import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './specs',
  timeout: 30 * 1000,
  expect: {
    timeout: 5000,
  },
  reporter: [['list']],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      testIgnore: /practice\.spec\.ts$/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'practice',
      testMatch: /practice\.spec\.ts$/,
      fullyParallel: false,
      use: {
        ...devices['Desktop Chrome'],
      },
      workers: 1,
    },
  ],
});
