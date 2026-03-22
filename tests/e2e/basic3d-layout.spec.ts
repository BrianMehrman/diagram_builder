/**
 * Basic3D Layout E2E Tests
 *
 * Priority: P1 - Core functionality for Phase 6 Basic3D layout
 * Coverage: Layout switching, rendering, and store integration
 *
 * Note: These tests interact with the workspace page which requires
 * a running API server (port 4000) and dev server (port 3000).
 * The `data-testid="active-layout"` hidden div in Canvas3D reflects
 * the active layout from the Zustand store.
 */

import { test, expect } from '../support/fixtures'

test.describe('Basic3D Layout @P1', () => {
  test.beforeEach(async ({ page, testWorkspace, mockGraph }) => {
    // Mock codebases endpoint
    await page.route(`**/api/workspaces/${testWorkspace.id}/codebases`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ codebases: [] }),
      })
    })

    // Mock graph with enough nodes to exercise layout
    await mockGraph({
      metadata: {
        totalNodes: 15,
        totalEdges: 8,
        repositoryId: 'test-repo-basic3d',
      },
    })

    // Navigate to workspace
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForLoadState('networkidle')

    // Open the right panel so layout switcher is accessible
    await page.locator('[data-testid="toggle-right-panel"]').click()
    await page.waitForTimeout(350) // Wait for slide-in animation
  })

  // ── Layout switcher ───────────────────────────────────────────────

  test('[P1] should switch layout to basic3d via layout switcher', async ({ page }) => {
    // GIVEN: Right panel is open with layout switcher visible
    const switcher = page.locator('[data-testid="layout-switcher"]')
    await expect(switcher).toBeVisible()

    // WHEN: User clicks the Basic 3D button
    await page.locator('[data-testid="layout-switcher-basic3d"]').click()
    await page.waitForTimeout(200)

    // THEN: The active-layout DOM indicator reflects basic3d
    const indicator = page.locator('[data-testid="active-layout"]')
    await expect(indicator).toHaveAttribute('data-value', 'basic3d')

    // THEN: The city button is NOT pressed
    const cityBtn = page.locator('[data-testid="layout-switcher-city"]')
    await expect(cityBtn).toHaveAttribute('aria-pressed', 'false')

    // THEN: The basic3d button IS pressed
    const basic3dBtn = page.locator('[data-testid="layout-switcher-basic3d"]')
    await expect(basic3dBtn).toHaveAttribute('aria-pressed', 'true')
  })

  test('[P1] should switch back to city layout from basic3d', async ({ page }) => {
    // GIVEN: User switches to basic3d first
    await page.locator('[data-testid="layout-switcher-basic3d"]').click()
    await page.waitForTimeout(200)

    // Verify basic3d is active
    await expect(page.locator('[data-testid="active-layout"]')).toHaveAttribute(
      'data-value',
      'basic3d'
    )

    // WHEN: User switches back to city
    await page.locator('[data-testid="layout-switcher-city"]').click()
    await page.waitForTimeout(200)

    // THEN: Active layout is city
    await expect(page.locator('[data-testid="active-layout"]')).toHaveAttribute('data-value', 'city')

    // THEN: City button is pressed, basic3d is not
    await expect(page.locator('[data-testid="layout-switcher-city"]')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
    await expect(page.locator('[data-testid="layout-switcher-basic3d"]')).toHaveAttribute(
      'aria-pressed',
      'false'
    )
  })

  test('[P1] should default to city layout on page load', async ({ page }) => {
    // THEN: Default layout is city (before any switching)
    const indicator = page.locator('[data-testid="active-layout"]')
    await expect(indicator).toHaveAttribute('data-value', 'city')

    // THEN: City button is pressed by default
    await expect(page.locator('[data-testid="layout-switcher-city"]')).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  // ── LOD controls in basic3d mode ─────────────────────────────────

  test('[P1] should show LOD controls accessible when in basic3d mode', async ({ page }) => {
    // WHEN: User switches to basic3d layout
    await page.locator('[data-testid="layout-switcher-basic3d"]').click()
    await page.waitForTimeout(200)

    // THEN: LOD controls are still visible in the right panel
    // The LOD buttons are aria-labeled as "LOD N: <description>"
    const lod0Button = page.locator('[aria-label="LOD 0: Files only"]')
    await expect(lod0Button).toBeVisible()

    // THEN: Can interact with LOD controls (click LOD level 2)
    const lod2Button = page.locator('[aria-label="LOD 2: + Functions"]')
    await expect(lod2Button).toBeVisible()
    await lod2Button.click()

    // THEN: No page errors after LOD change in basic3d mode
    // (Verified implicitly — if click throws, test fails)
  })

  // ── window.__canvasStore integration ─────────────────────────────

  test('[P1] should expose canvasStore on window for E2E access', async ({ page }) => {
    // THEN: window.__canvasStore is set by Canvas3D component
    const storeExists = await page.evaluate(() => typeof window.__canvasStore === 'function')
    expect(storeExists).toBe(true)

    // THEN: Store returns valid state
    const activeLayout = await page.evaluate(() => window.__canvasStore?.().activeLayout)
    expect(activeLayout).toBe('city')

    // WHEN: Switching layout via store action
    await page.locator('[data-testid="layout-switcher-basic3d"]').click()
    await page.waitForTimeout(200)

    // THEN: Store reflects new layout
    const newLayout = await page.evaluate(() => window.__canvasStore?.().activeLayout)
    expect(newLayout).toBe('basic3d')
  })

  // ── Page renders without errors ───────────────────────────────────

  test('[P1] should render basic3d layout without page errors', async ({ page }) => {
    // Track page errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // WHEN: User switches to basic3d
    await page.locator('[data-testid="layout-switcher-basic3d"]').click()
    await page.waitForTimeout(500) // Wait for layout to render

    // THEN: No page errors occurred during layout switch
    expect(errors).toHaveLength(0)

    // THEN: DOM indicator still reflects basic3d
    await expect(page.locator('[data-testid="active-layout"]')).toHaveAttribute(
      'data-value',
      'basic3d'
    )
  })
})
