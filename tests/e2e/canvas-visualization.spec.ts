/**
 * 3D Canvas Visualization E2E Tests
 *
 * Priority: P0 - Critical product functionality
 * Coverage: Core 3D visualization features
 */

import { test, expect } from '../support/fixtures'
import { createGraph } from '../support/factories'

test.describe('3D Canvas Visualization @P0 @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Mock codebases endpoint for controlled test data
    await page.route('**/api/workspaces/*/codebases', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ codebases: [] }),
      })
    })
  })

  test('[P0] should load workspace with canvas', async ({
    page,
    testWorkspace,
    mockGraph,
  }) => {
    // GIVEN: Graph with specific node/edge counts
    await mockGraph({
      metadata: {
        totalNodes: 25,
        totalEdges: 15,
        repositoryId: 'test-repo-123',
      },
    })

    // WHEN: User navigates to workspace
    await page.goto(`/workspace/${testWorkspace.id}`)

    // THEN: Workspace header is visible
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible()
  })

  test('[P0] should render workspace without errors', async ({
    page,
    testWorkspace,
    mockGraph,
  }) => {
    // GIVEN: Valid graph data
    await mockGraph()

    // Track errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // WHEN: User navigates to workspace
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForLoadState('networkidle')

    // THEN: No page errors occurred
    expect(errors).toHaveLength(0)

    // THEN: Workspace loads
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible()
  })

  test('[P2] should display export button', async ({
    page,
    testWorkspace,
    mockGraph,
  }) => {
    // GIVEN: User is on workspace page
    await mockGraph()
    await page.goto(`/workspace/${testWorkspace.id}`)

    // WHEN: Page loads and user opens right panel
    await page.waitForLoadState('networkidle')
    await page.locator('[data-testid="toggle-right-panel"]').click()
    await page.waitForTimeout(300) // Animation

    // THEN: Export button is visible
    const exportButton = page.locator('[data-testid="export-button"]')
    await expect(exportButton).toBeVisible()
  })
})
