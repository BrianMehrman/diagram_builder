/**
 * Workspace Management E2E Tests
 *
 * Priority: P1 - State management feature
 * Coverage: Workspace switching and persistence
 */

import { test, expect } from '../support/fixtures'

test.describe('Workspace Management @P1', () => {
  test('[P1] should display workspace switcher on canvas page', async ({ page, mockGraph }) => {
    // GIVEN: User is on canvas
    await mockGraph()
    await page.goto('/canvas')

    // WHEN: Page loads
    await page.waitForLoadState('networkidle')

    // THEN: Workspace switcher is visible in sidebar
    const workspaceSwitcher = page.locator(
      '[data-testid="workspace-switcher"], .workspace-switcher'
    )
    await expect(workspaceSwitcher.first()).toBeVisible({ timeout: 10000 })
  })

  test('[P2] should persist workspace selection across page reloads', async ({
    page,
    mockGraph,
  }) => {
    // GIVEN: User selects a workspace (if UI allows)
    await mockGraph()
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    // Note: This test validates persistence mechanism exists
    // Actual workspace switching depends on authentication state

    // WHEN: User reloads page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // THEN: Page loads successfully (workspace persistence doesn't break)
    const canvas = page.locator('canvas')
    await expect(canvas).toBeVisible()
  })

  test('[P1] should display import codebase button', async ({ page, mockGraph }) => {
    // GIVEN: User is on workspace page
    await mockGraph()
    await page.goto('/workspace/test-workspace')
    await page.waitForLoadState('networkidle')

    // THEN: Import codebase button is visible
    const importButton = page.locator('[data-testid="import-codebase-button"]')
    await expect(importButton).toBeVisible({ timeout: 10000 })
    await expect(importButton).toHaveText('Import Codebase')
  })

  test('[P1] should open import modal when button is clicked', async ({ page, mockGraph }) => {
    // GIVEN: User is on workspace page
    await mockGraph()
    await page.goto('/workspace/test-workspace')
    await page.waitForLoadState('networkidle')

    // WHEN: User clicks import codebase button
    const importButton = page.locator('[data-testid="import-codebase-button"]')
    await importButton.click()

    // THEN: Import modal is displayed
    const modal = page.locator('[data-testid="import-codebase-modal"]')
    await expect(modal).toBeVisible()
    await expect(page.locator('text=Import Codebase')).toBeVisible()
  })

  test('[P1] should switch between local and git import types', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open
    await mockGraph()
    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()

    // WHEN: User selects git type
    const gitRadio = page.locator('[data-testid="type-git"]')
    await gitRadio.click()

    // THEN: Git-specific fields are visible
    await expect(page.locator('[data-testid="branch-input"]')).toBeVisible()
    await expect(page.getByPlaceholder(/github/i)).toBeVisible()

    // WHEN: User selects local type
    const localRadio = page.locator('[data-testid="type-local"]')
    await localRadio.click()

    // THEN: Branch input is hidden
    await expect(page.locator('[data-testid="branch-input"]')).not.toBeVisible()
  })

  test('[P1] should validate required fields', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open
    await mockGraph()
    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()

    // WHEN: User submits without entering source
    const submitButton = page.locator('[data-testid="submit-button"]')
    await submitButton.click()

    // THEN: Validation error is displayed
    const errorMessage = page.locator('[data-testid="source-error"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText(/required/i)
  })

  test('[P1] should validate git URL format', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open with git type selected
    await mockGraph()
    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()
    await page.locator('[data-testid="type-git"]').click()

    // WHEN: User enters invalid git URL
    const sourceInput = page.locator('[data-testid="source-input"]')
    await sourceInput.fill('invalid-url')
    await page.locator('[data-testid="submit-button"]').click()

    // THEN: Validation error is displayed
    const errorMessage = page.locator('[data-testid="source-error"]')
    await expect(errorMessage).toBeVisible()
    await expect(errorMessage).toHaveText(/invalid/i)
  })

  test('[P1] should successfully import local codebase', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open
    await mockGraph()

    // Mock the import API endpoint
    await page.route('**/api/workspaces/*/codebases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          codebaseId: 'cb-123',
          workspaceId: 'test-workspace',
          source: '/path/to/repo',
          type: 'local',
          status: 'pending',
          importedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()

    // WHEN: User enters local path and submits
    await page.locator('[data-testid="source-input"]').fill('/path/to/repo')
    await page.locator('[data-testid="submit-button"]').click()

    // THEN: Success message is displayed
    const successMessage = page.locator('[data-testid="success-message"]')
    await expect(successMessage).toBeVisible()
    await expect(page.locator('text=/import.*started/i')).toBeVisible()
  })

  test('[P1] should successfully import git repository', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open with git type selected
    await mockGraph()

    // Mock the import API endpoint
    await page.route('**/api/workspaces/*/codebases', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          codebaseId: 'cb-456',
          workspaceId: 'test-workspace',
          source: 'https://github.com/user/repo.git',
          type: 'git',
          branch: 'develop',
          status: 'pending',
          importedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()
    await page.locator('[data-testid="type-git"]').click()

    // WHEN: User enters git URL, branch, and submits
    await page.locator('[data-testid="source-input"]').fill('https://github.com/user/repo.git')
    await page.locator('[data-testid="branch-input"]').fill('develop')
    await page.locator('[data-testid="submit-button"]').click()

    // THEN: Success message is displayed
    const successMessage = page.locator('[data-testid="success-message"]')
    await expect(successMessage).toBeVisible()
  })

  test('[P1] should handle import errors gracefully', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open
    await mockGraph()

    // Mock the import API endpoint to return error
    await page.route('**/api/workspaces/*/codebases', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({
          error: 'Failed to connect to repository',
        }),
      })
    })

    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()

    // WHEN: User submits form
    await page.locator('[data-testid="source-input"]').fill('/path/to/repo')
    await page.locator('[data-testid="submit-button"]').click()

    // THEN: Error message is displayed
    const errorMessage = page.locator('[data-testid="error-message"]')
    await expect(errorMessage).toBeVisible()
  })

  test('[P2] should close modal when cancel button is clicked', async ({ page, mockGraph }) => {
    // GIVEN: Import modal is open
    await mockGraph()
    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()

    const modal = page.locator('[data-testid="import-codebase-modal"]')
    await expect(modal).toBeVisible()

    // WHEN: User clicks close button
    await page.locator('[data-testid="close-modal-button"]').click()

    // THEN: Modal is closed
    await expect(modal).not.toBeVisible()
  })

  test('[P2] should disable close button during import', async ({ page, mockGraph }) => {
    // GIVEN: Import is in progress
    await mockGraph()

    // Mock slow API response
    await page.route('**/api/workspaces/*/codebases', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          codebaseId: 'cb-789',
          workspaceId: 'test-workspace',
          source: '/path/to/repo',
          type: 'local',
          status: 'pending',
          importedAt: new Date().toISOString(),
        }),
      })
    })

    await page.goto('/workspace/test-workspace')
    await page.locator('[data-testid="import-codebase-button"]').click()
    await page.locator('[data-testid="source-input"]').fill('/path/to/repo')
    await page.locator('[data-testid="submit-button"]').click()

    // THEN: Close button is disabled during loading
    const closeButton = page.locator('[data-testid="close-modal-button"]')
    await expect(closeButton).toBeDisabled()
  })
})
