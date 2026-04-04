/**
 * Test Fixtures for Diagram Builder
 *
 * This file exports a custom test instance with auto-cleanup fixtures.
 * Pattern: Pure function → fixture → mergeTests composition
 */
import { test as base, Page, APIRequestContext } from '@playwright/test'
import { createGraph, createRepository, createViewpoint } from '../factories'
import type { Graph, Repository, Viewpoint } from '../factories'

const API_BASE_URL = 'http://localhost:8741/api'

/** Shape returned by POST /api/workspaces */
export interface Workspace {
  id: string
  name: string
  description: string
  ownerId: string
  repositories: unknown[]
  members: unknown[]
  settings: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

// Type definition for custom fixtures
type TestFixtures = {
  /**
   * Creates a real workspace via the API before each test and deletes it afterward.
   * Exposes the workspace object (id, name, etc.) for use in tests.
   */
  testWorkspace: Workspace

  /**
   * Mock graph data fixture
   * Intercepts /api/graph requests and returns mock data
   */
  mockGraph: (graph?: Partial<Graph>) => Promise<Graph>

  /**
   * Mock repository data fixture
   * Intercepts /api/repositories requests and returns mock data
   */
  mockRepository: (repo?: Partial<Repository>) => Promise<Repository>

  /**
   * Network interceptor fixture
   * Provides helpers for mocking API responses
   */
  networkMock: {
    interceptRoute: (url: string, response: unknown) => Promise<void>
    waitForRoute: (url: string) => Promise<Response>
  }

  /**
   * Mock export fixture
   * Intercepts all /api/export/** routes and returns format-appropriate mock responses
   */
  mockExport: () => Promise<void>
}

/**
 * Extended test with custom fixtures
 *
 * Usage:
 *   import { test, expect } from '../support/fixtures';
 *
 *   test('my test', async ({ page, mockGraph }) => {
 *     const graph = await mockGraph({ metadata: { totalNodes: 50 } });
 *     await page.goto('/canvas');
 *     // ...
 *   });
 */
export const test = base.extend<TestFixtures>({
  /**
   * Real workspace created via API — cleaned up after each test
   */
  testWorkspace: async ({ request }, use) => {
    const response = await request.post(`${API_BASE_URL}/workspaces`, {
      data: { name: `E2E Test ${Date.now()}` },
    })

    if (!response.ok()) {
      throw new Error(
        `Failed to create test workspace: ${response.status()} ${await response.text()}`
      )
    }

    const workspace = (await response.json()) as Workspace
    await use(workspace)

    // Cleanup: delete workspace (ignore errors — best effort)
    await request.delete(`${API_BASE_URL}/workspaces/${workspace.id}`).catch(() => {})
  },

  /**
   * Mock graph data - intercepts graph API calls
   */
  mockGraph: async ({ page }, use) => {
    const setupMock = async (overrides: Partial<Graph> = {}) => {
      const graph = createGraph(10, 5, overrides)

      // Network-first: Intercept BEFORE navigation
      await page.route('**/api/graph/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(graph),
        })
      })

      return graph
    }

    await use(setupMock)

    // Cleanup: Unroute all
    await page.unrouteAll()
  },

  /**
   * Mock repository data - intercepts repository API calls
   */
  mockRepository: async ({ page }, use) => {
    const setupMock = async (overrides: Partial<Repository> = {}) => {
      const repository = createRepository(overrides)

      // Network-first: Intercept BEFORE navigation
      await page.route('**/api/repositories/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(repository),
        })
      })

      return repository
    }

    await use(setupMock)

    // Cleanup: Unroute all
    await page.unrouteAll()
  },

  /**
   * Mock export - intercepts all /api/export/** routes
   */
  mockExport: async ({ page }, use) => {
    const setupMock = async () => {
      await page.route('**/api/export/plantuml', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: '@startuml\ntitle Test\ncomponent A\n@enduml\n',
            filename: 'diagram.puml',
            mimeType: 'text/x-plantuml',
            extension: 'puml',
            stats: { nodeCount: 5, edgeCount: 3, duration: 10, size: 42 },
          }),
        })
      })
      await page.route('**/api/export/mermaid', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: 'flowchart TD\n  A[Start] --> B[End]\n',
            filename: 'diagram.mmd',
            mimeType: 'text/x-mermaid',
            extension: 'mmd',
            stats: { nodeCount: 5, edgeCount: 3, duration: 10, size: 38 },
          }),
        })
      })
      await page.route('**/api/export/drawio', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: '<mxfile><diagram name="Test"><mxGraphModel/></diagram></mxfile>',
            filename: 'diagram.drawio',
            mimeType: 'application/vnd.jgraph.mxfile',
            extension: 'drawio',
            stats: { nodeCount: 5, edgeCount: 3, duration: 10, size: 65 },
          }),
        })
      })
      await page.route('**/api/export/gltf', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: JSON.stringify({
              asset: { version: '2.0' },
              scenes: [],
              nodes: [],
              meshes: [],
            }),
            filename: 'diagram.gltf',
            mimeType: 'model/gltf+json',
            extension: 'gltf',
            stats: { nodeCount: 5, edgeCount: 3, duration: 10, size: 80 },
          }),
        })
      })
      await page.route('**/api/export/image', async (route) => {
        const postData = route.request().postDataJSON() as { format?: string } | null
        const isSVG = postData?.format === 'svg'
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: isSVG
              ? '<svg xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="40"/></svg>'
              : '',
            filename: isSVG ? 'diagram.svg' : 'diagram.png',
            mimeType: isSVG ? 'image/svg+xml' : 'image/png',
            extension: isSVG ? 'svg' : 'png',
            stats: { nodeCount: 5, edgeCount: 3, duration: 10, size: 100 },
          }),
        })
      })
    }
    await use(setupMock)
    await page.unrouteAll()
  },

  /**
   * Network mock helper - provides generic interception utilities
   */
  networkMock: async ({ page }, use) => {
    const interceptedRoutes = new Map<string, unknown>()

    const interceptRoute = async (url: string, response: unknown) => {
      await page.route(url, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        })
      })
      interceptedRoutes.set(url, response)
    }

    const waitForRoute = async (url: string) => {
      return page.waitForResponse((resp) => resp.url().includes(url) && resp.status() === 200)
    }

    await use({ interceptRoute, waitForRoute })

    // Cleanup: Clear all intercepted routes
    await page.unrouteAll()
    interceptedRoutes.clear()
  },
})

export { expect } from '@playwright/test'
