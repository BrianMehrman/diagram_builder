import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Diagram Builder
 *
 * Test framework for E2E testing of the 3D codebase visualization UI.
 * Performance requirements: 60fps rendering, <100ms interaction latency.
 */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/packages/**', // Exclude workspace packages (vitest tests)

  // Parallelization
  fullyParallel: true,
  workers: process.env.CI ? 1 : undefined,

  // Retries (CI only)
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  // Timeouts
  timeout: 60 * 1000, // Test timeout: 60s
  expect: {
    timeout: 15 * 1000, // Assertion timeout: 15s
  },

  // Test execution settings
  use: {
    // Base URL from environment or default to local dev server
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Action and navigation timeouts
    actionTimeout: 15 * 1000, // 15s for user interactions
    navigationTimeout: 30 * 1000, // 30s for page loads

    // Failure artifacts (only on failure to minimize storage)
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  // Test reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],

  // Browser projects
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Dev server: Auto-start disabled - start manually with `npm run dev`
  // To enable auto-start, uncomment below and ensure PORT=4000 in .env
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120 * 1000,
  //   stdout: 'pipe',
  //   stderr: 'pipe',
  // },
});
