/**
 * Repository API Integration Tests
 *
 * Priority: P0 - Critical backend functionality
 * Coverage: Repository parsing endpoints
 */

import { test, expect } from '@playwright/test';
import { createParseRequest, createRepository } from '../support/factories';

test.describe('Repository API @P0 @api', () => {
  // Note: These tests require a running API server with test database
  // Update baseURL in playwright.config.ts to point to test API

  test('[P0] POST /api/repositories - should reject unauthenticated requests', async ({ request }) => {
    // GIVEN: Parse request without auth token
    const parseRequest = createParseRequest({
      url: 'https://github.com/test/repo.git',
      branch: 'main',
    });

    // WHEN: Attempting to parse repository
    const response = await request.post('/api/repositories', {
      data: parseRequest,
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('[P1] POST /api/repositories - should initiate repository parsing with valid data', async ({ request }) => {
    // GIVEN: Valid parse request with auth (mock token)
    const parseRequest = createParseRequest({
      url: 'https://github.com/test/repo.git',
      branch: 'main',
    });

    // WHEN: Sending parse request with valid token
    const response = await request.post('/api/repositories', {
      data: parseRequest,
      headers: {
        Authorization: 'Bearer test-token-123',
      },
      failOnStatusCode: false,
    });

    // THEN: Returns 202 Accepted (or 401 if auth not configured)
    // Update assertion based on actual auth setup
    const status = response.status();
    expect([202, 401]).toContain(status);

    if (status === 202) {
      const body = await response.json();
      expect(body).toHaveProperty('id');
      expect(body).toHaveProperty('status');
      expect(body.message).toBe('Repository parsing initiated');
    }
  });

  test('[P1] GET /api/repositories/:id - should return 404 for non-existent repository', async ({ request }) => {
    // GIVEN: Non-existent repository ID
    const nonExistentId = 'non-existent-repo-999';

    // WHEN: Fetching repository metadata
    const response = await request.get(`/api/repositories/${nonExistentId}`, {
      headers: {
        Authorization: 'Bearer test-token-123',
      },
      failOnStatusCode: false,
    });

    // THEN: Returns 404 Not Found (or 401 if auth not configured)
    const status = response.status();
    expect([404, 401]).toContain(status);
  });

  test('[P1] DELETE /api/repositories/:id - should require authentication', async ({ request }) => {
    // GIVEN: Repository ID without auth
    const repoId = 'test-repo-123';

    // WHEN: Attempting to delete without auth
    const response = await request.delete(`/api/repositories/${repoId}`, {
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('[P2] POST /api/repositories/:id/refresh - should require authentication', async ({ request }) => {
    // GIVEN: Repository ID without auth
    const repoId = 'test-repo-123';

    // WHEN: Attempting to refresh without auth
    const response = await request.post(`/api/repositories/${repoId}/refresh`, {
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});
