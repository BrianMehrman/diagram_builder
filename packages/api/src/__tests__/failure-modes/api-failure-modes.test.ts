/**
 * API Failure Mode Tests
 *
 * Tests error handling and failure scenarios for API endpoints
 * Story: 6-4-end-to-end-integration-testing (Task 7)
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { graphRouter } from '../../routes/graph';
import { workspacesRouter } from '../../routes/workspaces';
import { errorHandler } from '../../middleware/error-handler';
import { generateToken } from '../../auth/jwt';
import * as graphService from '../../services/graph-service';

// Mock services
vi.mock('../../services/graph-service');
vi.mock('../../database/query-utils', () => ({
  runQuery: vi.fn().mockResolvedValue([]),
  getQueryStats: vi.fn(() => ({ totalQueries: 0 })),
}));

describe('[Failure Modes] API Error Handling', () => {
  let app: Express;
  let authToken: string;
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/graph', graphRouter);
    app.use('/api/workspaces', workspacesRouter);
    app.use(errorHandler);

    // Generate auth token
    authToken = generateToken({ userId: 'test-user', email: 'test@example.com' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication Failures', () => {
    it('should return 401 for missing authorization header', async () => {
      const response = await request(app).get('/api/graph/test-repo');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('unauthorized');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('detail');
    });

    it('should return 401 for invalid token format', async () => {
      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', 'Bearer invalid-token-format');

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 for malformed bearer token', async () => {
      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', 'NotBearer some-token');

      expect(response.status).toBe(401);
    });

    it('should return 401 for expired token', async () => {
      // Generate token that expires immediately
      const expiredToken = generateToken(
        { userId: 'test-user', email: 'test@example.com' },
        '0s' // Expires immediately
      );

      // Wait a bit to ensure expiration
      await new Promise((resolve) => setTimeout(resolve, 100));

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
    });
  });

  describe('Not Found Failures', () => {
    it('should return 404 for non-existent repository', async () => {
      vi.mocked(graphService.getFullGraph).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/graph/non-existent-repo-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('not-found');
      expect(response.body).toHaveProperty('title', 'Repository not found');
      expect(response.body).toHaveProperty('detail');
    });

    it('should return 404 for invalid route', async () => {
      const response = await request(app)
        .get('/api/graph')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('Validation Failures', () => {
    it('should return 400 for workspace creation without name', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('validation');
      expect(response.body).toHaveProperty('detail');
      expect(response.body.detail).toContain('name');
    });

    it('should return 400 for workspace name exceeding max length', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('100 characters');
    });

    it('should return 400 for empty workspace name after trimming', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('name is required');
    });
  });

  describe('Service Layer Failures', () => {
    it('should handle database connection errors gracefully', async () => {
      vi.mocked(graphService.getFullGraph).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 500);
    });

    it('should handle service timeouts gracefully', async () => {
      vi.mocked(graphService.getFullGraph).mockRejectedValue(
        new Error('Request timeout')
      );

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
    });

    it('should handle malformed graph data from service', async () => {
      // Return invalid graph structure
      vi.mocked(graphService.getFullGraph).mockResolvedValue({
        nodes: null as any,
        edges: undefined as any,
      });

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      // Should still return a response (may be 200 with malformed data or 500)
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Malformed Request Failures', () => {
    it('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      // Can be 400 (client error) or 500 (parse error), both are valid
      expect([400, 500]).toContain(response.status);
    });

    it('should handle missing Content-Type header', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send('name=test');

      // Should still process or return appropriate error
      expect([200, 201, 400, 415]).toContain(response.status);
    });
  });

  describe('RFC 7807 Error Format Compliance', () => {
    it('should return RFC 7807 format for 400 errors', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail');
    });

    it('should return RFC 7807 format for 401 errors', async () => {
      const response = await request(app).get('/api/graph/test-repo');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });

    it('should return RFC 7807 format for 404 errors', async () => {
      vi.mocked(graphService.getFullGraph).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/graph/missing')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('detail');
    });

    it('should return RFC 7807 format for 500 errors', async () => {
      vi.mocked(graphService.getFullGraph).mockRejectedValue(
        new Error('Internal error')
      );

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 500);
    });
  });

  describe('Edge Case Failures', () => {
    it('should handle very large repository IDs', async () => {
      const largeId = 'a'.repeat(10000);
      vi.mocked(graphService.getFullGraph).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/graph/${largeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Should handle gracefully (404 or 414)
      expect([404, 414, 500]).toContain(response.status);
    });

    it('should handle special characters in repository ID', async () => {
      const specialId = 'test<>repo&id=123';
      vi.mocked(graphService.getFullGraph).mockResolvedValue(null);

      const response = await request(app)
        .get(`/api/graph/${encodeURIComponent(specialId)}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect([200, 404]).toContain(response.status);
    });

    it('should handle concurrent requests without race conditions', async () => {
      vi.mocked(graphService.getFullGraph).mockResolvedValue({
        nodes: [{ id: '1', type: 'file', label: 'test', metadata: {}, lod: 0 }],
        edges: [],
        metadata: { repositoryId: 'test', totalNodes: 1, totalEdges: 0 },
      });

      // Send 10 concurrent requests
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get('/api/graph/test-repo')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      // All should succeed
      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });
    });
  });
});
