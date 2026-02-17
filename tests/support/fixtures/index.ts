/**
 * Test Fixtures for Diagram Builder
 *
 * This file exports a custom test instance with auto-cleanup fixtures.
 * Pattern: Pure function → fixture → mergeTests composition
 */
import { test as base, Page, APIRequestContext } from '@playwright/test';
import { createGraph, createRepository, createViewpoint } from '../factories';
import type { Graph, Repository, Viewpoint } from '../factories';

const API_BASE_URL = 'http://localhost:4000/api';

/** Shape returned by POST /api/workspaces */
export interface Workspace {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  repositories: unknown[];
  members: unknown[];
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// Type definition for custom fixtures
type TestFixtures = {
  /**
   * Creates a real workspace via the API before each test and deletes it afterward.
   * Exposes the workspace object (id, name, etc.) for use in tests.
   */
  testWorkspace: Workspace;

  /**
   * Mock graph data fixture
   * Intercepts /api/graph requests and returns mock data
   */
  mockGraph: (graph?: Partial<Graph>) => Promise<Graph>;

  /**
   * Mock repository data fixture
   * Intercepts /api/repositories requests and returns mock data
   */
  mockRepository: (repo?: Partial<Repository>) => Promise<Repository>;

  /**
   * Network interceptor fixture
   * Provides helpers for mocking API responses
   */
  networkMock: {
    interceptRoute: (url: string, response: unknown) => Promise<void>;
    waitForRoute: (url: string) => Promise<Response>;
  };
};

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
    });

    if (!response.ok()) {
      throw new Error(`Failed to create test workspace: ${response.status()} ${await response.text()}`);
    }

    const workspace = (await response.json()) as Workspace;
    await use(workspace);

    // Cleanup: delete workspace (ignore errors — best effort)
    await request.delete(`${API_BASE_URL}/workspaces/${workspace.id}`).catch(() => {});
  },

  /**
   * Mock graph data - intercepts graph API calls
   */
  mockGraph: async ({ page }, use) => {
    let mockData: Graph | null = null;

    const setupMock = async (overrides: Partial<Graph> = {}) => {
      const graph = createGraph(10, 5, overrides);
      mockData = graph;

      // Network-first: Intercept BEFORE navigation
      await page.route('**/api/graph/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(graph),
        });
      });

      return graph;
    };

    await use(setupMock);

    // Cleanup: Unroute all
    await page.unrouteAll();
  },

  /**
   * Mock repository data - intercepts repository API calls
   */
  mockRepository: async ({ page }, use) => {
    let mockData: Repository | null = null;

    const setupMock = async (overrides: Partial<Repository> = {}) => {
      const repository = createRepository(overrides);
      mockData = repository;

      // Network-first: Intercept BEFORE navigation
      await page.route('**/api/repositories/**', (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(repository),
        });
      });

      return repository;
    };

    await use(setupMock);

    // Cleanup: Unroute all
    await page.unrouteAll();
  },

  /**
   * Network mock helper - provides generic interception utilities
   */
  networkMock: async ({ page }, use) => {
    const interceptedRoutes = new Map<string, unknown>();

    const interceptRoute = async (url: string, response: unknown) => {
      await page.route(url, (route) => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(response),
        });
      });
      interceptedRoutes.set(url, response);
    };

    const waitForRoute = async (url: string) => {
      return page.waitForResponse((resp) => resp.url().includes(url) && resp.status() === 200);
    };

    await use({ interceptRoute, waitForRoute });

    // Cleanup: Clear all intercepted routes
    await page.unrouteAll();
    interceptedRoutes.clear();
  },
});

export { expect } from '@playwright/test';
