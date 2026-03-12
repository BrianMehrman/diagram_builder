/**
 * Export Functionality E2E Tests
 *
 * Priority: P2 - Output feature
 * Coverage: Export dialog and export formats
 */

import { test, expect } from '../support/fixtures'

test.describe('Export Functionality @P2', () => {
  test('[P2] should open export dialog when export button is clicked', async ({
    page,
    mockGraph,
  }) => {
    // GIVEN: User is on canvas
    await mockGraph()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    // WHEN: User clicks Export button
    const exportButton = page.getByRole('button', { name: /export/i })
    await exportButton.click()

    // THEN: Export dialog is visible
    const exportDialog = page.locator('[data-testid="export-dialog"]')
    await expect(exportDialog).toBeVisible({ timeout: 5000 })
  })

  test('[P2] should close export dialog when close button is clicked', async ({
    page,
    mockGraph,
  }) => {
    // GIVEN: Export dialog is open
    await mockGraph()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByRole('button', { name: /export/i })
    await exportButton.click()

    const exportDialog = page.locator('[data-testid="export-dialog"]')
    await expect(exportDialog).toBeVisible()

    // WHEN: User clicks close button
    const closeButton = page.getByRole('button', { name: /close|cancel/i }).last()
    await closeButton.click()

    // THEN: Dialog is closed
    await expect(exportDialog).not.toBeVisible()
  })

  test('[P2] should display export format options', async ({ page, mockGraph }) => {
    // GIVEN: Export dialog is open
    await mockGraph()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByRole('button', { name: /export/i })
    await exportButton.click()

    const exportDialog = page.locator('[data-testid="export-dialog"]')
    await expect(exportDialog).toBeVisible()

    // THEN: Export format options are visible
    // Note: Update selectors based on actual export dialog structure
    const formatOptions = page.locator('[data-testid="export-format"], select, input[type="radio"]')
    const optionsCount = await formatOptions.count()

    // Verify at least one format option exists
    expect(optionsCount).toBeGreaterThan(0)
  })

  test('[P2] should show all 6 export formats in the dialog', async ({
    page,
    mockGraph,
    mockExport,
  }) => {
    // GIVEN: Export dialog is open
    await mockGraph()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByRole('button', { name: /export/i })
    await exportButton.click()

    const exportDialog = page.locator('[data-testid="export-dialog"]')
    await expect(exportDialog).toBeVisible()

    // THEN: All 6 format options are visible
    await expect(page.locator('[data-testid="export-format-plantuml"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-format-mermaid"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-format-drawio"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-format-gltf"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-format-svg"]')).toBeVisible()
    await expect(page.locator('[data-testid="export-format-png"]')).toBeVisible()
  })

  test('[P2] should trigger export API call when submit button is clicked', async ({
    page,
    mockGraph,
    mockExport,
  }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await mockExport()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByRole('button', { name: /export/i })
    await exportButton.click()

    const exportDialog = page.locator('[data-testid="export-dialog"]')
    await expect(exportDialog).toBeVisible()

    // WHEN: User selects the mermaid format and clicks submit
    await page.locator('[data-testid="export-format-mermaid"]').click()

    const submitButton = page.locator('[data-testid="export-submit-button"]')
    await expect(submitButton).toBeVisible()
    await expect(submitButton).toBeEnabled()

    const responsePromise = page.waitForResponse('**/api/export/mermaid')
    await submitButton.click()

    // THEN: The export API was called
    const response = await responsePromise
    expect(response.status()).toBe(200)
  })

  test('[P2] should show LOD level control in export dialog', async ({
    page,
    mockGraph,
    mockExport,
  }) => {
    // GIVEN: Export dialog is open
    await mockGraph()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const exportButton = page.getByRole('button', { name: /export/i })
    await exportButton.click()

    const exportDialog = page.locator('[data-testid="export-dialog"]')
    await expect(exportDialog).toBeVisible()

    // THEN: The LOD level select control is visible
    const lodSelect = page.locator('[data-testid="lod-level-select"]')
    await expect(lodSelect).toBeVisible()
  })
})
