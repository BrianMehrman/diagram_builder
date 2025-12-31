import { test, expect } from '../support/fixtures';

/**
 * Example Test Suite
 *
 * Demonstrates Playwright test patterns and best practices.
 * Replace with actual feature tests as you develop.
 */
test.describe('Example Tests - Delete When Ready', () => {
  test('should demonstrate basic page interaction', async ({ page }) => {
    // GIVEN: User is on the homepage
    await page.goto('/');

    // WHEN: User interacts with an element
    // Note: Replace with actual selectors from your UI
    // Prefer data-testid attributes for stability
    // Example: await page.click('[data-testid="upload-button"]');

    // THEN: Expected result occurs
    // Example: await expect(page.locator('[data-testid="upload-modal"]')).toBeVisible();
  });

  test('should demonstrate Given-When-Then structure', async ({ page }) => {
    // GIVEN: Setup test preconditions
    await page.goto('/');

    // WHEN: Execute the behavior being tested
    // Single action per test (atomic)

    // THEN: Verify expected outcome
    // One assertion per test (when possible)
  });

  test('should demonstrate network interception', async ({ page }) => {
    // CRITICAL: Intercept routes BEFORE navigation (network-first pattern)
    await page.route('**/api/example', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Mocked response' }),
      })
    );

    // NOW navigate
    await page.goto('/');

    // Verify mocked response is used
    // Example: await expect(page.locator('[data-testid="message"]')).toHaveText('Mocked response');
  });
});

/**
 * Best Practices Reference
 *
 * 1. Use data-testid attributes for selectors
 *    - Stable across UI changes
 *    - Example: <button data-testid="submit-button">Submit</button>
 *
 * 2. Follow Given-When-Then structure
 *    - GIVEN: Setup preconditions
 *    - WHEN: Execute action
 *    - THEN: Verify outcome
 *
 * 3. One assertion per test (atomic tests)
 *    - Easier to debug failures
 *    - Clear failure messages
 *
 * 4. Network-first pattern
 *    - Intercept routes BEFORE page.goto()
 *    - Prevents race conditions
 *
 * 5. Use fixtures for setup/teardown
 *    - Auto-cleanup (no manual cleanup in tests)
 *    - Composable (fixtures can use other fixtures)
 *
 * 6. No hard waits (page.waitForTimeout)
 *    - Use explicit waits (waitForSelector, waitForURL, etc.)
 *    - Deterministic tests
 */
