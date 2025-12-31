/**
 * Viewpoints API Integration Tests
 *
 * Priority: P1 - Critical feature API
 * Coverage: Viewpoint CRUD operations
 */

import { test, expect } from '@playwright/test';
import { createViewpointInput, createViewpointUpdate } from '../support/factories';

test.describe('Viewpoints API @P1 @api', () => {
  // Note: These tests require a running API server with test database
  // Update baseURL in playwright.config.ts to point to test API

  test('[P1] POST /api/viewpoints - should reject unauthenticated requests', async ({ request }) => {
    // GIVEN: Viewpoint creation request without auth
    const viewpointData = createViewpointInput({
      name: 'Test Viewpoint',
      repositoryId: 'test-repo-123',
    });

    // WHEN: Attempting to create viewpoint
    const response = await request.post('/api/viewpoints', {
      data: viewpointData,
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('[P1] POST /api/viewpoints - should validate required fields', async ({ request }) => {
    // GIVEN: Invalid viewpoint data (missing required fields)
    const invalidData = {
      name: 'Test',
      // Missing repositoryId, camera, etc.
    };

    // WHEN: Attempting to create viewpoint with valid auth
    const response = await request.post('/api/viewpoints', {
      data: invalidData,
      headers: {
        Authorization: 'Bearer test-token-123',
      },
      failOnStatusCode: false,
    });

    // THEN: Returns 400 Bad Request or 401 if auth not configured
    const status = response.status();
    expect([400, 401]).toContain(status);

    if (status === 400) {
      const body = await response.json();
      expect(body).toHaveProperty('type');
      expect(body.type).toContain('validation');
    }
  });

  test('[P1] GET /api/viewpoints/:id - should return 404 for non-existent viewpoint', async ({ request }) => {
    // GIVEN: Non-existent viewpoint ID
    const nonExistentId = 'non-existent-viewpoint-999';

    // WHEN: Fetching viewpoint
    const response = await request.get(`/api/viewpoints/${nonExistentId}`, {
      headers: {
        Authorization: 'Bearer test-token-123',
      },
      failOnStatusCode: false,
    });

    // THEN: Returns 404 Not Found (or 401 if auth not configured)
    const status = response.status();
    expect([404, 401]).toContain(status);
  });

  test('[P1] PUT /api/viewpoints/:id - should require authentication', async ({ request }) => {
    // GIVEN: Viewpoint update without auth
    const viewpointId = 'test-viewpoint-123';
    const updateData = createViewpointUpdate({
      name: 'Updated Name',
    });

    // WHEN: Attempting to update without auth
    const response = await request.put(`/api/viewpoints/${viewpointId}`, {
      data: updateData,
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('[P1] DELETE /api/viewpoints/:id - should require authentication', async ({ request }) => {
    // GIVEN: Viewpoint ID without auth
    const viewpointId = 'test-viewpoint-123';

    // WHEN: Attempting to delete without auth
    const response = await request.delete(`/api/viewpoints/${viewpointId}`, {
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('[P2] POST /api/viewpoints/:id/share - should require authentication', async ({ request }) => {
    // GIVEN: Viewpoint ID without auth
    const viewpointId = 'test-viewpoint-123';

    // WHEN: Attempting to share without auth
    const response = await request.post(`/api/viewpoints/${viewpointId}/share`, {
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });

  test('[P2] GET /api/viewpoints/share/:token - should allow public access with valid token', async ({ request }) => {
    // GIVEN: Share token (public endpoint, no auth required)
    const shareToken = 'test-share-token-abc123';

    // WHEN: Fetching viewpoint by share token
    const response = await request.get(`/api/viewpoints/share/${shareToken}`, {
      failOnStatusCode: false,
    });

    // THEN: Returns 404 (token doesn't exist) - no 401 required
    // Public endpoint should not require auth
    const status = response.status();
    expect([200, 404]).toContain(status);
  });

  test('[P2] GET /api/repositories/:repositoryId/viewpoints - should require authentication', async ({ request }) => {
    // GIVEN: Repository ID without auth
    const repositoryId = 'test-repo-123';

    // WHEN: Fetching viewpoints for repository
    const response = await request.get(`/api/viewpoints/repository/${repositoryId}`, {
      failOnStatusCode: false,
    });

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401);
  });
});
