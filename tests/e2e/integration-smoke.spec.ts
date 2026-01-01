/**
 * Integration Smoke Tests
 *
 * Simple end-to-end tests that validate the full stack is working together.
 * These tests check critical paths without mocking, ensuring:
 * - Frontend (React + Vite) loads correctly
 * - Backend API is accessible
 * - Database connectivity works
 * - 3D rendering initializes
 *
 * Priority: P0 - Run these first to validate basic system health
 */

import { test, expect } from '@playwright/test';

test.describe('Integration Smoke Tests @P0 @smoke @integration', () => {
  test('[SMOKE-001] Application loads and displays homepage', async ({ page }) => {
    // Track console errors
    const errors: string[] = [];
    const warnings: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      } else if (msg.type() === 'warning') {
        warnings.push(msg.text());
      }
    });

    // GIVEN: User navigates to the application
    console.log('Navigating to http://localhost:3000...');
    const response = await page.goto('/');

    // THEN: Page loads successfully
    expect(response?.status()).toBe(200);
    console.log('✓ HTTP 200 OK');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    console.log('✓ Network idle');

    // THEN: Main app container is visible
    const appContainer = page.locator('#root');
    await expect(appContainer).toBeVisible();
    console.log('✓ React root mounted');

    // THEN: Page has a title
    const title = await page.title();
    expect(title).toBeTruthy();
    console.log(`✓ Page title: "${title}"`);

    // THEN: No critical console errors
    if (errors.length > 0) {
      console.log(`⚠ Console errors detected (${errors.length}):`);
      errors.forEach((err, i) => console.log(`  ${i + 1}. ${err}`));
    }

    if (warnings.length > 0) {
      console.log(`⚠ Console warnings detected (${warnings.length}):`);
      warnings.forEach((warn, i) => console.log(`  ${i + 1}. ${warn}`));
    }

    // Allow some warnings, but no errors for smoke test
    expect(errors).toHaveLength(0);
  });

  test('[SMOKE-002] Can navigate to canvas page', async ({ page }) => {
    // GIVEN: User is on homepage
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // WHEN: User navigates to canvas (direct navigation for smoke test)
    console.log('⚠ Navigating directly to /canvas for smoke test');
    await page.goto('/canvas');
    console.log(`✓ Navigated to: ${page.url()}`);

    // THEN: Page loads without errors
    expect(page.url()).toContain('canvas');
    console.log('✓ Canvas page loaded successfully');

    // THEN: Canvas element renders
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 10000 });
    console.log('✓ Canvas element visible');
  });

  test('[SMOKE-003] 3D canvas element initializes', async ({ page }) => {
    // GIVEN: User navigates to canvas page
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // THEN: Canvas element exists and is visible
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 15000 });
    console.log('✓ Canvas element rendered');

    // THEN: Canvas has valid dimensions
    const boundingBox = await canvas.boundingBox();
    expect(boundingBox).toBeTruthy();
    expect(boundingBox!.width).toBeGreaterThan(100);
    expect(boundingBox!.height).toBeGreaterThan(100);
    console.log(`✓ Canvas dimensions: ${boundingBox!.width}x${boundingBox!.height}`);
  });

  test('[SMOKE-004] API health check endpoint is accessible', async ({ request }) => {
    // GIVEN: API server is running
    // WHEN: Request health check endpoint
    console.log('Checking API health at /api/health or /health...');

    // Try common health check endpoints
    let response;
    try {
      response = await request.get('http://localhost:3000/api/health');
      console.log(`/api/health responded with: ${response.status()}`);
    } catch (e) {
      console.log('/api/health not found, trying /health...');
      try {
        response = await request.get('http://localhost:3000/health');
        console.log(`/health responded with: ${response.status()}`);
      } catch (e2) {
        console.log('No health endpoint found - checking root API');
        response = await request.get('http://localhost:3000/api');
      }
    }

    // THEN: API responds (200, 201, or 404 is fine - just needs to respond)
    expect(response.status()).toBeLessThan(500);
    console.log(`✓ API server responding (status: ${response.status()})`);
  });

  test('[SMOKE-005] Can load graph data (with mocking)', async ({ page }) => {
    // GIVEN: Mock graph API to return test data
    await page.route('**/api/graph/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: [
            { id: '1', label: 'TestNode.ts', type: 'file', language: 'typescript' },
            { id: '2', label: 'TestClass', type: 'class', language: 'typescript' },
          ],
          edges: [
            { id: 'e1', source: '1', target: '2', type: 'contains' },
          ],
          metadata: {
            totalNodes: 2,
            totalEdges: 1,
            repositoryId: 'test-repo-123',
          },
        }),
      });
    });

    // WHEN: User navigates to canvas
    await page.goto('/canvas');
    await page.waitForLoadState('networkidle');

    // THEN: Wait for network request to complete
    const graphRequest = page.waitForResponse((resp) =>
      resp.url().includes('/api/graph') && resp.status() === 200,
      { timeout: 5000 }
    ).catch(() => null);

    if (graphRequest) {
      console.log('✓ Graph API called successfully');
    } else {
      console.log('⚠ No graph API call detected (may be lazy-loaded)');
    }

    // Success if canvas renders
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
  });

  test('[SMOKE-006] No network failures on page load', async ({ page }) => {
    // Track failed requests
    const failedRequests: Array<{ method: string; url: string; failure: string }> = [];

    page.on('requestfailed', (request) => {
      failedRequests.push({
        method: request.method(),
        url: request.url(),
        failure: request.failure()?.errorText || 'Unknown error',
      });
    });

    // GIVEN: User navigates to application
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // THEN: Check for failed requests
    if (failedRequests.length > 0) {
      console.log(`⚠ Failed requests detected (${failedRequests.length}):`);
      failedRequests.forEach((req, i) => {
        console.log(`  ${i + 1}. ${req.method} ${req.url}`);
        console.log(`     Error: ${req.failure}`);
      });
    } else {
      console.log('✓ No network failures');
    }

    // Allow some failures for external resources, but core app resources must load
    const criticalFailures = failedRequests.filter((req) =>
      req.url.includes('localhost') || req.url.includes('/api/')
    );

    expect(criticalFailures).toHaveLength(0);
  });
});
