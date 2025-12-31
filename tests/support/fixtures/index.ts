/**
 * Test Fixtures for Diagram Builder
 *
 * This file exports a custom test instance with auto-cleanup fixtures.
 * Pattern: Pure function → fixture → mergeTests composition
 */
import { test as base, Page, APIRequestContext } from '@playwright/test';
import { createGraph, createRepository, createViewpoint } from '../factories';
import type { Graph, Repository, Viewpoint } from '../factories';

// Type definition for custom fixtures
type TestFixtures = {
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
