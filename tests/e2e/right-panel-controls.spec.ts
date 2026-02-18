/**
 * Right Panel Controls E2E Tests
 *
 * Validates that the RightPanel city visualization controls
 * (Layout, Atmosphere, Edges sections) render and respond to interaction.
 *
 * Priority: P1 - Core UI controls for Epic 10 features
 */

import { test, expect } from '../support/fixtures'

test.describe('Right Panel Controls @P1', () => {
  test.beforeEach(async ({ page, testWorkspace, mockGraph }) => {
    // Mock codebases endpoint
    await page.route(`**/api/workspaces/${testWorkspace.id}/codebases`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ codebases: [] }),
      })
    })

    // Mock graph data
    await mockGraph({
      metadata: {
        totalNodes: 20,
        totalEdges: 10,
        repositoryId: 'test-repo-controls',
      },
    })

    // Navigate to workspace
    await page.goto(`/workspace/${testWorkspace.id}`)
    await page.waitForLoadState('networkidle')

    // Open the right panel
    await page.locator('[data-testid="toggle-right-panel"]').click()
    await page.waitForTimeout(350) // Wait for slide-in animation
  })

  // ── Right Panel opens ────────────────────────────────────────────
  test('[P1] should open right panel with Tools header', async ({ page }) => {
    const panel = page.locator('[data-testid="right-panel"]')
    await expect(panel).toBeVisible()
    await expect(panel.getByRole('heading', { name: 'Tools' })).toBeVisible()
  })

  // ── Layout section ───────────────────────────────────────────────
  test('[P1] should display density slider', async ({ page }) => {
    const slider = page.locator('[data-testid="density-slider"]')
    await expect(slider).toBeVisible()
    await expect(slider).toHaveAttribute('type', 'range')
  })

  test('[P1] should display height encoding selector with default value', async ({ page }) => {
    const selector = page.locator('[data-testid="height-encoding-selector"]')
    await expect(selector).toBeVisible()

    const select = selector.locator('select')
    await expect(select).toBeVisible()
    await expect(select).toHaveValue('methodCount')
  })

  test('[P1] should change height encoding selection', async ({ page }) => {
    const select = page.locator('[data-testid="height-encoding-selector"] select')
    await select.selectOption('complexity')
    await expect(select).toHaveValue('complexity')

    await select.selectOption('loc')
    await expect(select).toHaveValue('loc')
  })

  test('[P1] should display all height encoding options', async ({ page }) => {
    const options = page.locator('[data-testid="height-encoding-selector"] select option')
    await expect(options).toHaveCount(5)
    await expect(options.nth(0)).toHaveText('Method Count')
    await expect(options.nth(1)).toHaveText('Dependencies')
    await expect(options.nth(2)).toHaveText('Lines of Code')
    await expect(options.nth(3)).toHaveText('Complexity')
    await expect(options.nth(4)).toHaveText('Change Frequency')
  })

  // ── Atmosphere section ───────────────────────────────────────────
  test('[P1] should display atmosphere toggle panel with all checkboxes', async ({ page }) => {
    const panel = page.locator('[data-testid="atmosphere-toggle-panel"]')
    await expect(panel).toBeVisible()

    // All four checkboxes should be present and unchecked by default
    for (const key of ['cranes', 'lighting', 'smog', 'deprecated']) {
      const checkbox = page.locator(`[data-testid="atmosphere-toggle-${key}"]`)
      await expect(checkbox).toBeVisible()
      await expect(checkbox).not.toBeChecked()
    }
  })

  test('[P1] should toggle atmosphere indicators on and off', async ({ page }) => {
    const smog = page.locator('[data-testid="atmosphere-toggle-smog"]')

    // Toggle on
    await smog.check()
    await expect(smog).toBeChecked()

    // Toggle off
    await smog.uncheck()
    await expect(smog).not.toBeChecked()
  })

  test('[P1] should toggle atmosphere indicators independently', async ({ page }) => {
    // Check cranes and deprecated
    await page.locator('[data-testid="atmosphere-toggle-cranes"]').check()
    await page.locator('[data-testid="atmosphere-toggle-deprecated"]').check()

    // Verify only those two are checked
    await expect(page.locator('[data-testid="atmosphere-toggle-cranes"]')).toBeChecked()
    await expect(page.locator('[data-testid="atmosphere-toggle-lighting"]')).not.toBeChecked()
    await expect(page.locator('[data-testid="atmosphere-toggle-smog"]')).not.toBeChecked()
    await expect(page.locator('[data-testid="atmosphere-toggle-deprecated"]')).toBeChecked()
  })

  // ── Edges section ────────────────────────────────────────────────
  test('[P1] should display edge tier controls', async ({ page }) => {
    const controls = page.locator('[data-testid="edge-tier-controls"]')
    await expect(controls).toBeVisible()

    // Both edge tier checkboxes should be present and checked by default
    const crossDistrict = page.locator('[data-testid="edge-tier-toggle-crossDistrict"]')
    const inheritance = page.locator('[data-testid="edge-tier-toggle-inheritance"]')
    await expect(crossDistrict).toBeVisible()
    await expect(crossDistrict).toBeChecked()
    await expect(inheritance).toBeVisible()
    await expect(inheritance).toBeChecked()
  })

  test('[P1] should toggle edge tiers off and on', async ({ page }) => {
    const crossDistrict = page.locator('[data-testid="edge-tier-toggle-crossDistrict"]')

    // Toggle off
    await crossDistrict.uncheck()
    await expect(crossDistrict).not.toBeChecked()

    // Toggle back on
    await crossDistrict.check()
    await expect(crossDistrict).toBeChecked()
  })

  test('[P1] should display transit map button in off state by default', async ({ page }) => {
    const button = page.locator('[data-testid="transit-map-toggle"]')
    await expect(button).toBeVisible()
    await expect(button).toHaveText('Transit Map')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  test('[P1] should toggle transit map mode on and off', async ({ page }) => {
    const button = page.locator('[data-testid="transit-map-toggle"]')

    // Toggle on
    await button.click()
    await expect(button).toHaveText('Transit Map ON')
    await expect(button).toHaveAttribute('aria-pressed', 'true')

    // Toggle off
    await button.click()
    await expect(button).toHaveText('Transit Map')
    await expect(button).toHaveAttribute('aria-pressed', 'false')
  })

  // ── Panel close ──────────────────────────────────────────────────
  test('[P1] should close right panel via close button', async ({ page }) => {
    const closeBtn = page.locator('[data-testid="right-panel"] button[aria-label="Close tools panel"]')
    await closeBtn.click()
    await page.waitForTimeout(350) // Animation

    // Panel should slide out (translate-x-full)
    const panel = page.locator('[data-testid="right-panel"]')
    await expect(panel).toHaveAttribute('aria-hidden', 'true')
  })
})
