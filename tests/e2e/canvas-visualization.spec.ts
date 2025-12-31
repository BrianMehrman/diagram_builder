/**
 * 3D Canvas Visualization E2E Tests
 *
 * Priority: P0 - Critical product functionality
 * Coverage: Core 3D visualization features
 */

import { test, expect } from '../support/fixtures';
import { createGraph } from '../support/factories';

test.describe('3D Canvas Visualization @P0 @smoke', () => {
  test('[P0] should load canvas with graph data and display statistics', async ({ page, mockGraph }) => {
    // GIVEN: Graph with specific node/edge counts
    const graph = await mockGraph({
      metadata: {
        totalNodes: 25,
        totalEdges: 15,
        repositoryId: 'test-repo-123',
      },
    });

    // WHEN: User navigates to canvas
    await page.goto('/canvas');

    // THEN: Statistics display correct counts
    await expect(page.getByText('25 nodes, 15 edges')).toBeVisible();
  });

  test('[P0] should render 3D canvas element without errors', async ({ page, mockGraph }) => {
    // GIVEN: Valid graph data
    await mockGraph();

    // WHEN: User navigates to canvas
    await page.goto('/canvas');

    // THEN: Canvas element is visible (no crash)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // THEN: No console errors occurred
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('[P1] should display camera controls', async ({ page, mockGraph }) => {
    // GIVEN: User is on canvas page
    await mockGraph();
    await page.goto('/canvas');

    // WHEN: Page loads
    await page.waitForLoadState('networkidle');

    // THEN: Camera controls are visible
    // Note: Update selectors to match actual UI structure
    const cameraControls = page.locator('[data-testid="camera-controls"], .camera-controls');
    await expect(cameraControls.first()).toBeVisible({ timeout: 10000 });
  });

  test('[P1] should display LOD (Level of Detail) controls', async ({ page, mockGraph }) => {
    // GIVEN: User is on canvas page
    await mockGraph();
    await page.goto('/canvas');

    // WHEN: Page loads
    await page.waitForLoadState('networkidle');

    // THEN: LOD controls are visible
    const lodControls = page.locator('[data-testid="lod-controls"], .lod-controls');
    await expect(lodControls.first()).toBeVisible({ timeout: 10000 });
  });

  test('[P1] should handle navigation back to home', async ({ page, mockGraph }) => {
    // GIVEN: User is on canvas page
    await mockGraph();
    await page.goto('/canvas');

    // WHEN: User clicks "Back" link
    await page.click('text=← Back');

    // THEN: User is redirected to home page
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('heading', { name: 'Diagram Builder' })).toBeVisible();
  });

  test('[P2] should display export button', async ({ page, mockGraph }) => {
    // GIVEN: User is on canvas page
    await mockGraph();
    await page.goto('/canvas');

    // WHEN: Page loads
    await page.waitForLoadState('networkidle');

    // THEN: Export button is visible
    const exportButton = page.getByRole('button', { name: /export/i });
    await expect(exportButton).toBeVisible();
  });
});
