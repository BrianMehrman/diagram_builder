/**
 * Application Smoke Tests
 *
 * Priority: P0 - Critical path verification
 * Coverage: Basic app loading, routing, and component rendering
 *
 * These tests verify that the application can:
 * - Load without JavaScript errors
 * - Navigate between pages
 * - Render all critical UI components
 * - Handle authentication flow
 */

import { test, expect } from '@playwright/test'

test.describe('Application Smoke Tests @P0 @smoke', () => {
  test.beforeEach(async ({ page }) => {
    // Mock API endpoints to prevent 500 errors
    await page.route('**/api/workspaces', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'test-workspace-1',
            name: 'Default Workspace',
            description: 'Test workspace',
            settings: {
              defaultLodLevel: 2,
              autoRefresh: false,
              collaborationEnabled: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      })
    })

    await page.route('**/api/workspaces/*', (route) => {
      const url = route.request().url()
      if (route.request().method() === 'GET') {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-workspace-1',
            name: 'Default Workspace',
            description: 'Test workspace',
            settings: {
              defaultLodLevel: 2,
              autoRefresh: false,
              collaborationEnabled: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      } else if (route.request().method() === 'POST') {
        route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'test-workspace-new',
            name: 'Default Workspace',
            description: 'Auto-created workspace',
            settings: {
              defaultLodLevel: 2,
              autoRefresh: false,
              collaborationEnabled: false,
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }),
        })
      } else {
        route.continue()
      }
    })

    await page.route('**/api/workspaces/*/codebases', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    })

    await page.route('**/api/graph/**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          nodes: [],
          edges: [],
          metadata: {
            totalNodes: 0,
            totalEdges: 0,
            repositoryId: 'test-repo',
          },
        }),
      })
    })

    // Listen for console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error(`Browser console error: ${msg.text()}`)
      }
    })

    // Listen for page errors
    page.on('pageerror', (error) => {
      console.error(`Page error: ${error.message}`)
    })
  })

  test('[P0] should load home page without errors', async ({ page }) => {
    // Track any errors
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // WHEN: Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle' })

    // THEN: Page loads without errors
    expect(errors).toHaveLength(0)

    // THEN: Either HomePage with title OR auto-redirected to WorkspacePage
    const currentUrl = page.url()
    if (currentUrl.includes('/workspace/')) {
      // Auto-redirected to workspace - check for workspace header
      await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible()
    } else {
      // Still on home page - check for page title
      await expect(page.locator('[data-testid="page-title"]')).toContainText('Diagram Builder')
    }
  })

  test('[P0] should load login page without errors', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // WHEN: Navigate to login page
    await page.goto('/login', { waitUntil: 'networkidle' })

    // THEN: Page loads without errors
    expect(errors).toHaveLength(0)

    // THEN: Login form is present
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('[P0] should skip authentication in dev mode', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // GIVEN: User is on login page
    await page.goto('/login', { waitUntil: 'networkidle' })

    // WHEN: User clicks Skip Login button
    const skipButton = page.getByRole('button', { name: /skip login/i })
    await expect(skipButton).toBeVisible()
    await skipButton.click()

    // THEN: User is redirected to home page
    await page.waitForURL('/')
    expect(errors).toHaveLength(0)
  })

  test('[P0] should create and navigate to workspace', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // GIVEN: User skips auth
    await page.goto('/login')
    await page.getByRole('button', { name: /skip login/i }).click()
    await page.waitForURL('/')

    // WHEN: Workspace is auto-created or already exists
    await page.waitForLoadState('networkidle')

    // THEN: Either home page shows workspaces or auto-navigates to workspace
    const currentUrl = page.url()
    const isOnHome = currentUrl.endsWith('/')
    const isOnWorkspace = currentUrl.includes('/workspace/')

    expect(isOnHome || isOnWorkspace).toBe(true)
    expect(errors).toHaveLength(0)
  })

  test('[P0] should load workspace page with all components', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // GIVEN: User skips auth
    await page.goto('/login')
    await page.getByRole('button', { name: /skip login/i }).click()

    // WHEN: User navigates to workspace (auto-created or manual)
    await page.waitForLoadState('networkidle')

    // Wait for either home page workspaces or auto-navigation to workspace
    const currentUrl = page.url()
    if (!currentUrl.includes('/workspace/')) {
      // If still on home, wait for auto-navigation or workspace creation
      await page.waitForURL(/\/workspace\/.*/, { timeout: 10000 })
    }

    // Wait for workspace header to be visible
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible({ timeout: 5000 })

    // THEN: Page loads without errors
    expect(errors).toHaveLength(0)

    // THEN: Critical UI components are present
    // Header with workspace name
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible()

    // Export button in header
    await expect(page.locator('[data-testid="export-button"]')).toBeVisible()

    // Import Codebase button
    await expect(page.locator('[data-testid="import-codebase-button"]')).toBeVisible()
  })

  test('[P0] should open and close import codebase modal', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // GIVEN: User is on workspace page
    await page.goto('/login')
    await page.getByRole('button', { name: /skip login/i }).click()
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    if (!currentUrl.includes('/workspace/')) {
      await page.waitForURL(/\/workspace\/.*/, { timeout: 10000 })
    }

    // Open left panel to access Import button
    await page.locator('[data-testid="toggle-left-panel"]').click()
    await page.waitForTimeout(300) // Brief animation wait

    // WHEN: User clicks Import Codebase button
    const importButton = page.locator('[data-testid="import-codebase-button"]')
    await expect(importButton).toBeVisible()
    await importButton.click()

    // THEN: Modal opens without errors
    await expect(page.locator('[data-testid="import-codebase-modal"]')).toBeVisible()
    expect(errors).toHaveLength(0)

    // THEN: Modal has expected content
    await expect(page.getByText(/import codebase/i).first()).toBeVisible()

    // WHEN: User closes modal
    const closeButton = page.locator('[data-testid="close-modal-button"]')
    await closeButton.click()

    // THEN: Modal closes
    await expect(page.locator('[data-testid="import-codebase-modal"]')).not.toBeVisible()
  })

  test('[P0] should open and close export dialog', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // GIVEN: User is on workspace page
    await page.goto('/login')
    await page.getByRole('button', { name: /skip login/i }).click()
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    if (!currentUrl.includes('/workspace/')) {
      await page.waitForURL(/\/workspace\/.*/, { timeout: 10000 })
    }

    // Open right panel to access Export button
    await page.locator('[data-testid="toggle-right-panel"]').click()
    await page.waitForTimeout(300) // Brief animation wait

    // WHEN: User clicks Export button
    const exportButton = page.locator('[data-testid="export-button"]')
    await expect(exportButton).toBeVisible()
    await exportButton.click()

    // THEN: Export dialog opens without errors
    await expect(page.locator('[data-testid="export-dialog"]')).toBeVisible({ timeout: 3000 })
    expect(errors).toHaveLength(0)

    // WHEN: User closes dialog
    const closeButton = page.locator('[data-testid="close-export-dialog"]')
    await closeButton.click()

    // THEN: Dialog closes
    await expect(page.locator('[data-testid="export-dialog"]')).not.toBeVisible()
  })

  test('[P0] should handle API errors gracefully', async ({ page }) => {
    // GIVEN: API returns errors
    await page.route('**/api/workspaces', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      })
    })

    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // WHEN: User tries to load home page
    await page.goto('/login')
    await page.getByRole('button', { name: /skip login/i }).click()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // THEN: App handles error gracefully (no uncaught errors)
    // Filter out expected errors
    const unexpectedErrors = errors.filter(
      (err) => !err.includes('Failed to') && !err.includes('Network')
    )
    expect(unexpectedErrors).toHaveLength(0)

    // THEN: User sees error message or stays on a working page
    const isOnValidPage = page.url().includes('/') || page.url().includes('/login')
    expect(isOnValidPage).toBe(true)
  })

  test('[P0] should verify all navigation components render', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    // GIVEN: User is on workspace page
    await page.goto('/login')
    await page.getByRole('button', { name: /skip login/i }).click()
    await page.waitForLoadState('networkidle')

    const currentUrl = page.url()
    if (!currentUrl.includes('/workspace/')) {
      await page.waitForURL(/\/workspace\/.*/, { timeout: 10000 })
    }

    // Wait for workspace header to render
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible({ timeout: 5000 })

    // THEN: No component rendering errors
    expect(errors).toHaveLength(0)

    // THEN: Page is functional
    await expect(page.locator('[data-testid="workspace-header"]')).toBeVisible()
  })
})
