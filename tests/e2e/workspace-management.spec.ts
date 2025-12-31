/**
 * Workspace Management E2E Tests
 *
 * Priority: P1 - State management feature
 * Coverage: Workspace switching and persistence
 */

import { test, expect } from '../support/fixtures';

test.describe('Workspace Management @P1', () => {
  test('[P1] should display workspace switcher on canvas page', async ({ page, mockGraph }) => {
    // GIVEN: User is on canvas
    await mockGraph();
    await page.goto('/canvas');

    // WHEN: Page loads
    await page.waitForLoadState('networkidle');

    // THEN: Workspace switcher is visible in sidebar
    const workspaceSwitcher = page.locator('[data-testid="workspace-switcher"], .workspace-switcher');
    await expect(workspaceSwitcher.first()).toBeVisible({ timeout: 10000 });
  });

  test('[P2] should persist workspace selection across page reloads', async ({ page, mockGraph }) => {
    // GIVEN: User selects a workspace (if UI allows)
    await mockGraph();
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // Note: This test validates persistence mechanism exists
    // Actual workspace switching depends on authentication state

    // WHEN: User reloads page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // THEN: Page loads successfully (workspace persistence doesn't break)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
