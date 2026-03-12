/**
 * Export Download Flow E2E Tests
 *
 * Priority: P1 - Core export feature
 * Coverage: Full download trigger and content validation for all 6 export formats
 *
 * Note: The download mechanism in ExportDialog uses URL.createObjectURL + a synthetic
 * anchor click with a `download` attribute. Playwright captures this as a download event.
 * Since Task 3 (mockExport fixture) may not be merged yet, inline page.route() mocks
 * are used here directly.
 */

import { test, expect } from '../support/fixtures'
import path from 'path'
import fs from 'fs'
import os from 'os'

// ---------------------------------------------------------------------------
// Mock response bodies keyed by format
// ---------------------------------------------------------------------------

const MOCK_EXPORT_CONTENT: Record<string, string> = {
  plantuml: '@startuml\nclass Node {\n  +id: String\n}\n@enduml',
  mermaid: 'flowchart TD\n  A --> B',
  drawio: '<mxfile version="14.0.0"><diagram>test</diagram></mxfile>',
  gltf: JSON.stringify({ asset: { version: '2.0' }, scene: 0, scenes: [], nodes: [] }),
  png: 'PNG_PLACEHOLDER',
  svg: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"></svg>',
}

const MOCK_EXPORT_FILENAMES: Record<string, string> = {
  plantuml: 'export.puml',
  mermaid: 'export.mmd',
  drawio: 'export.drawio',
  gltf: 'export.gltf',
  png: 'export.png',
  svg: 'export.svg',
}

const MOCK_EXPORT_MIME_TYPES: Record<string, string> = {
  plantuml: 'text/x-plantuml',
  mermaid: 'text/x-mermaid',
  drawio: 'application/vnd.jgraph.mxfile',
  gltf: 'model/gltf+json',
  png: 'image/png',
  svg: 'image/svg+xml',
}

/**
 * Build a mock ExportResult JSON response for a given format.
 */
function buildMockExportResponse(format: string): string {
  const content = MOCK_EXPORT_CONTENT[format] ?? ''
  return JSON.stringify({
    content,
    mimeType: MOCK_EXPORT_MIME_TYPES[format] ?? 'text/plain',
    extension: path.extname(MOCK_EXPORT_FILENAMES[format] ?? 'export.txt').slice(1),
    filename: MOCK_EXPORT_FILENAMES[format] ?? 'export.txt',
    stats: {
      nodeCount: 10,
      edgeCount: 5,
      duration: 42,
      size: content.length,
    },
  })
}

/**
 * Set up inline page.route() mocks for all export API endpoints.
 * This covers the case where the mockExport fixture from Task 3 is not yet merged.
 */
async function setupExportRouteMocks(page: import('@playwright/test').Page): Promise<void> {
  // Text-based formats: individual endpoints
  for (const format of ['plantuml', 'mermaid', 'drawio', 'gltf']) {
    await page.route(`**/api/export/${format}`, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: buildMockExportResponse(format),
      })
    })
  }

  // PNG and SVG share the /api/export/image endpoint; the format is passed in the body
  await page.route('**/api/export/image', (route) => {
    // Read the request body to determine which image format was requested
    const requestBody = route.request().postDataJSON() as { format?: string } | null
    const format = requestBody?.format ?? 'png'
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: buildMockExportResponse(format),
    })
  })
}

// ---------------------------------------------------------------------------
// triggerExport helper
// ---------------------------------------------------------------------------

type ExportFormat = 'plantuml' | 'mermaid' | 'drawio' | 'gltf' | 'png' | 'svg'

/**
 * Opens the export dialog, selects a format, triggers the export, waits for the
 * download event, saves the file to /tmp, and returns the saved file path.
 */
async function triggerExport(
  page: import('@playwright/test').Page,
  format: ExportFormat
): Promise<string> {
  // Step 1: Open the export dialog
  const exportButton = page.getByRole('button', { name: /export/i })
  await exportButton.click()

  const exportDialog = page.locator('[data-testid="export-dialog"]')
  await expect(exportDialog).toBeVisible({ timeout: 5000 })

  // Step 2: Select the desired format via its data-testid
  const formatButton = page.locator(`[data-testid="export-format-${format}"]`)
  await formatButton.click()

  // Step 3: Click the Export (submit) button to trigger the API call
  const submitButton = page.locator('[data-testid="export-submit-button"]')
  await submitButton.click()

  // Step 4: Wait for export to complete — the "Download" button appears after success
  const downloadButton = page.getByRole('button', { name: /^download$/i })
  await expect(downloadButton).toBeVisible({ timeout: 15000 })

  // Step 5: Set up the download listener BEFORE clicking the download button
  const downloadPromise = page.waitForEvent('download', { timeout: 15000 })
  await downloadButton.click()
  const download = await downloadPromise

  // Step 6: Save the downloaded file to the OS temp directory
  const destPath = `${os.tmpdir()}/test-export-${format}-${Date.now()}`
  await download.saveAs(destPath)

  return destPath
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test.describe('Export Download Flow @P1', () => {
  test('[P1] should download valid PlantUML file', async ({ page, mockGraph }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await setupExportRouteMocks(page)

    // WHEN: User navigates to canvas and triggers PlantUML export
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const filePath = await triggerExport(page, 'plantuml')

    // THEN: Downloaded file has valid PlantUML content
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toMatch(/^@startuml/)
      expect(content).toMatch(/@enduml/)
    } finally {
      fs.unlinkSync(filePath)
    }
  })

  test('[P1] should download valid Mermaid file', async ({ page, mockGraph }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await setupExportRouteMocks(page)

    // WHEN: User navigates to canvas and triggers Mermaid export
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const filePath = await triggerExport(page, 'mermaid')

    // THEN: Downloaded file has valid Mermaid diagram syntax
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toMatch(/flowchart|graph|classDiagram|C4/)
    } finally {
      fs.unlinkSync(filePath)
    }
  })

  test('[P1] should download valid Draw.io file', async ({ page, mockGraph }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await setupExportRouteMocks(page)

    // WHEN: User navigates to canvas and triggers Draw.io export
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const filePath = await triggerExport(page, 'drawio')

    // THEN: Downloaded file contains valid Draw.io XML structure
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toMatch(/<mxfile/)
    } finally {
      fs.unlinkSync(filePath)
    }
  })

  test('[P1] should download valid GLTF file', async ({ page, mockGraph }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await setupExportRouteMocks(page)

    // WHEN: User navigates to canvas and triggers GLTF export
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const filePath = await triggerExport(page, 'gltf')

    // THEN: Downloaded file is valid JSON with GLTF 2.0 asset version
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      const parsed = JSON.parse(content) as { asset?: { version?: string } }
      expect(parsed.asset?.version).toBe('2.0')
    } finally {
      fs.unlinkSync(filePath)
    }
  })

  test('[P1] should download valid SVG file', async ({ page, mockGraph }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await setupExportRouteMocks(page)

    // WHEN: User navigates to canvas and triggers SVG export
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const filePath = await triggerExport(page, 'svg')

    // THEN: Downloaded file contains valid SVG markup
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      expect(content).toMatch(/<svg/)
      expect(content).toMatch(/<\/svg>/)
    } finally {
      fs.unlinkSync(filePath)
    }
  })

  test('[P1] should download PNG file with non-zero size', async ({ page, mockGraph }) => {
    // GIVEN: Graph data and export API are mocked
    await mockGraph()
    await setupExportRouteMocks(page)

    // WHEN: User navigates to canvas and triggers PNG export
    await page.goto('/canvas')
    await page.waitForLoadState('networkidle')

    const filePath = await triggerExport(page, 'png')

    // THEN: Downloaded file exists and has non-zero size
    try {
      const stats = fs.statSync(filePath)
      expect(stats.size).toBeGreaterThan(0)
    } finally {
      fs.unlinkSync(filePath)
    }
  })
})
