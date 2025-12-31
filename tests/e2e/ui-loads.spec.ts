import { test, expect } from '@playwright/test';

/**
 * UI Load Tests
 *
 * Critical smoke tests to verify the UI loads successfully.
 * Addresses reported issue: "UI didn't load"
 */
test.describe('UI Load - Smoke Tests', () => {
  test('should load homepage without errors', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // GIVEN: User navigates to the application
    const response = await page.goto('/');

    // THEN: Page loads successfully
    expect(response?.status()).toBe(200);

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // THEN: No console errors occurred during load
    console.log(`Console errors detected: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }
    expect(errors).toHaveLength(0);
  });

  test('should display main application container', async ({ page }) => {
    // GIVEN: User navigates to the application
    await page.goto('/');

    // THEN: Main app container is visible
    // Note: Update selector to match your actual UI structure
    const appContainer = page.locator('#root, #app, [data-testid="app-container"]');
    await expect(appContainer).toBeVisible();
  });

  test('should load without network errors', async ({ page }) => {
    // Track failed network requests
    const failedRequests: string[] = [];

    page.on('requestfailed', (request) => {
      failedRequests.push(`${request.method()} ${request.url()}`);
    });

    // GIVEN: User navigates to the application
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: No network requests failed
    console.log(`Failed requests detected: ${failedRequests.length}`);
    if (failedRequests.length > 0) {
      console.log('Failed requests:', failedRequests);
    }
    expect(failedRequests).toHaveLength(0);
  });

  test('should have valid page title', async ({ page }) => {
    // GIVEN: User navigates to the application
    await page.goto('/');

    // THEN: Page has a non-empty title
    await expect(page).toHaveTitle(/.+/);
  });
});
