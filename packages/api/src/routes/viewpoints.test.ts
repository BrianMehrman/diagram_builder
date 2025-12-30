/**
 * Integration tests for Viewpoint Management Endpoints
 *
 * Tests the following endpoints:
 * - POST /api/viewpoints - Create viewpoint
 * - GET /api/viewpoints/:id - Get viewpoint
 * - PUT /api/viewpoints/:id - Update viewpoint
 * - DELETE /api/viewpoints/:id - Delete viewpoint
 * - POST /api/viewpoints/:id/share - Generate share URL
 * - GET /api/viewpoints/share/:token - Get viewpoint by share token
 * - GET /api/viewpoints/repository/:repositoryId - List viewpoints
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { viewpointsRouter } from './viewpoints';
import { errorHandler } from '../middleware/error-handler';
import { generateToken } from '../auth/jwt';
import type { Viewpoint } from '../types/viewpoint';

// Mock data
const mockRepoId = 'repo-123';
const mockViewpointId = 'viewpoint-456';
const mockUserId = 'user-789';
const mockShareToken = 'share-token-abc';

const mockViewpoint: Viewpoint = {
  id: mockViewpointId,
  repositoryId: mockRepoId,
  name: 'Test Viewpoint',
  description: 'A test viewpoint',
  camera: {
    position: { x: 0, y: 0, z: 10 },
    target: { x: 0, y: 0, z: 0 },
    fov: 75,
    zoom: 1,
  },
  filters: {
    nodeTypes: ['file', 'class'],
    maxLod: 4,
  },
  annotations: [
    {
      id: 'annotation-1',
      type: 'note',
      target: { nodeId: 'node-1' },
      content: 'Important note',
      color: '#ff0000',
      createdAt: new Date().toISOString(),
      createdBy: mockUserId,
    },
  ],
  createdBy: mockUserId,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Mock viewpoint store
const mockViewpoints = new Map<string, Viewpoint>();

// Mock Neo4j
vi.mock('../database/query-utils', () => {
  return {
    runQuery: vi.fn(async (query: string, params: Record<string, unknown>) => {
      // Mock CREATE viewpoint
      if (query.includes('CREATE (v:Viewpoint')) {
        const createdBy = typeof params.createdBy === 'string'
          ? params.createdBy
          : (params.createdBy as Record<string, unknown>)?.userId as string || 'unknown';

        const viewpoint: Viewpoint = {
          id: params.id as string,
          repositoryId: params.repositoryId as string,
          name: params.name as string,
          description: params.description as string | undefined,
          camera: JSON.parse(params.camera as string),
          filters: params.filters ? JSON.parse(params.filters as string) : undefined,
          annotations: params.annotations ? JSON.parse(params.annotations as string) : undefined,
          createdBy,
          createdAt: params.createdAt as string,
          updatedAt: params.updatedAt as string,
          isPublic: false,
        };
        mockViewpoints.set(params.id as string, viewpoint);
        return [{ v: viewpoint }];
      }

      // Mock MATCH viewpoint by ID
      if (query.includes('MATCH (v:Viewpoint {id: $id})') && !query.includes('SET')) {
        const viewpoint = mockViewpoints.get(params.id as string);
        if (!viewpoint) return [];
        return [{
          id: viewpoint.id,
          repositoryId: viewpoint.repositoryId,
          name: viewpoint.name,
          description: viewpoint.description || null,
          camera: JSON.stringify(viewpoint.camera),
          filters: viewpoint.filters ? JSON.stringify(viewpoint.filters) : null,
          annotations: viewpoint.annotations ? JSON.stringify(viewpoint.annotations) : null,
          createdBy: viewpoint.createdBy,
          createdAt: viewpoint.createdAt,
          updatedAt: viewpoint.updatedAt,
          shareToken: viewpoint.shareToken || null,
          isPublic: viewpoint.isPublic || null,
        }];
      }

      // Mock GENERATE SHARE TOKEN
      if (query.includes('SET v.shareToken')) {
        const viewpoint = mockViewpoints.get(params.id as string);
        if (!viewpoint) return [];

        const updated = {
          ...viewpoint,
          shareToken: params.shareToken as string,
          isPublic: true,
        };

        mockViewpoints.set(params.id as string, updated as Viewpoint);
        return [{ v: updated }];
      }

      // Mock UPDATE viewpoint
      if (query.includes('SET') && query.includes('v.updatedAt')) {
        const viewpoint = mockViewpoints.get(params.id as string);
        if (!viewpoint) return [];

        const updated = {
          ...viewpoint,
          ...(params.name && { name: params.name as string }),
          ...(params.description !== undefined && { description: params.description as string }),
          ...(params.camera && { camera: JSON.parse(params.camera as string) }),
          ...(params.filters !== undefined && { filters: params.filters ? JSON.parse(params.filters as string) : undefined }),
          ...(params.annotations !== undefined && { annotations: params.annotations ? JSON.parse(params.annotations as string) : undefined }),
          ...(params.isPublic !== undefined && { isPublic: params.isPublic as boolean }),
          ...(params.shareToken && { shareToken: params.shareToken as string }),
          updatedAt: params.updatedAt as string,
        };

        mockViewpoints.set(params.id as string, updated as Viewpoint);
        return [{ v: updated }];
      }

      // Mock DELETE viewpoint
      if (query.includes('DETACH DELETE')) {
        mockViewpoints.delete(params.id as string);
        return [];
      }

      // Mock GET by share token
      if (query.includes('shareToken: $shareToken')) {
        for (const viewpoint of mockViewpoints.values()) {
          if (viewpoint.shareToken === params.shareToken && viewpoint.isPublic) {
            return [{
              id: viewpoint.id,
              repositoryId: viewpoint.repositoryId,
              name: viewpoint.name,
              description: viewpoint.description || null,
              camera: JSON.stringify(viewpoint.camera),
              filters: viewpoint.filters ? JSON.stringify(viewpoint.filters) : null,
              annotations: viewpoint.annotations ? JSON.stringify(viewpoint.annotations) : null,
              createdBy: viewpoint.createdBy,
              createdAt: viewpoint.createdAt,
              updatedAt: viewpoint.updatedAt,
              shareToken: viewpoint.shareToken,
              isPublic: viewpoint.isPublic,
            }];
          }
        }
        return [];
      }

      // Mock LIST viewpoints
      if (query.includes('repositoryId: $repositoryId')) {
        const results = Array.from(mockViewpoints.values())
          .filter(v => v.repositoryId === params.repositoryId)
          .filter(v => !params.userId || v.createdBy === params.userId)
          .map(viewpoint => ({
            id: viewpoint.id,
            repositoryId: viewpoint.repositoryId,
            name: viewpoint.name,
            description: viewpoint.description || null,
            camera: JSON.stringify(viewpoint.camera),
            filters: viewpoint.filters ? JSON.stringify(viewpoint.filters) : null,
            annotations: viewpoint.annotations ? JSON.stringify(viewpoint.annotations) : null,
            createdBy: viewpoint.createdBy,
            createdAt: viewpoint.createdAt,
            updatedAt: viewpoint.updatedAt,
            shareToken: viewpoint.shareToken || null,
            isPublic: viewpoint.isPublic || null,
          }));
        return results;
      }

      return [];
    }),
    runTransaction: vi.fn(),
  };
});

// Mock cache utilities
vi.mock('../cache/cache-utils', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  invalidate: vi.fn().mockResolvedValue(undefined),
  invalidatePattern: vi.fn().mockResolvedValue(undefined),
  DEFAULT_CACHE_TTL: 300,
}));

describe('Viewpoint Management Endpoints', () => {
  let app: Express;
  let authToken: string;
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = TEST_SECRET;

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/viewpoints', viewpointsRouter);
    app.use(errorHandler);

    // Generate a valid JWT token for authenticated requests
    authToken = generateToken(mockUserId);
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Clear mock viewpoint store before each test
    mockViewpoints.clear();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated POST /api/viewpoints', async () => {
      const response = await request(app)
        .post('/api/viewpoints')
        .send({ name: 'Test' });

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 for unauthenticated GET /api/viewpoints/:id', async () => {
      const response = await request(app)
        .get(`/api/viewpoints/${mockViewpointId}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated PUT /api/viewpoints/:id', async () => {
      const response = await request(app)
        .put(`/api/viewpoints/${mockViewpointId}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated DELETE /api/viewpoints/:id', async () => {
      const response = await request(app)
        .delete(`/api/viewpoints/${mockViewpointId}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST /api/viewpoints/:id/share', async () => {
      const response = await request(app)
        .post(`/api/viewpoints/${mockViewpointId}/share`);

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/viewpoints', () => {
    it('should create a viewpoint with valid data', async () => {
      const response = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'My Viewpoint',
          description: 'Test description',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
          filters: {
            nodeTypes: ['file'],
          },
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'My Viewpoint');
      expect(response.body).toHaveProperty('repositoryId', mockRepoId);
      expect(response.body).toHaveProperty('camera');
      expect(response.body).toHaveProperty('createdBy', mockUserId);
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test',
          // Missing repositoryId and camera
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
    });

    it('should return 400 for invalid camera data', async () => {
      const response = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Test',
          camera: {
            position: { x: 0, y: 0 }, // Missing z
            target: { x: 0, y: 0, z: 0 },
          },
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/viewpoints/:id', () => {
    beforeEach(async () => {
      // Create a viewpoint first
      await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Test Viewpoint',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
        });
    });

    it('should return viewpoint for owner', async () => {
      const viewpointId = Array.from(mockViewpoints.keys())[0];

      const response = await request(app)
        .get(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', viewpointId);
      expect(response.body).toHaveProperty('name', 'Test Viewpoint');
    });

    it('should return 404 for non-existent viewpoint', async () => {
      const response = await request(app)
        .get('/api/viewpoints/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
    });

    it('should return 403 for non-owner accessing private viewpoint', async () => {
      const viewpointId = Array.from(mockViewpoints.keys())[0];
      const otherUserToken = generateToken('other-user');

      const response = await request(app)
        .get(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
      expect(response.body.type).toContain('forbidden');
    });
  });

  describe('PUT /api/viewpoints/:id', () => {
    let viewpointId: string;

    beforeEach(async () => {
      // Create a viewpoint first
      const createResponse = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Test Viewpoint',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
        });

      viewpointId = createResponse.body.id;
    });

    it('should update viewpoint name', async () => {
      const response = await request(app)
        .put(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should update multiple fields', async () => {
      const response = await request(app)
        .put(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          description: 'New description',
          isPublic: true,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('name', 'Updated Name');
      expect(response.body).toHaveProperty('description', 'New description');
      expect(response.body).toHaveProperty('isPublic', true);
    });

    it('should return 404 for non-existent viewpoint', async () => {
      const response = await request(app)
        .put('/api/viewpoints/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated',
        });

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-owner trying to update', async () => {
      const otherUserToken = generateToken('other-user');

      const response = await request(app)
        .put(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${otherUserToken}`)
        .send({
          name: 'Hacked',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/viewpoints/:id', () => {
    let viewpointId: string;

    beforeEach(async () => {
      // Create a viewpoint first
      const createResponse = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Test Viewpoint',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
        });

      viewpointId = createResponse.body.id;
    });

    it('should delete viewpoint', async () => {
      const response = await request(app)
        .delete(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent viewpoint', async () => {
      const response = await request(app)
        .delete('/api/viewpoints/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-owner trying to delete', async () => {
      const otherUserToken = generateToken('other-user');

      const response = await request(app)
        .delete(`/api/viewpoints/${viewpointId}`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/viewpoints/:id/share', () => {
    let viewpointId: string;

    beforeEach(async () => {
      // Create a viewpoint first
      const createResponse = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Test Viewpoint',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
        });

      viewpointId = createResponse.body.id;
    });

    it('should generate share token', async () => {
      const response = await request(app)
        .post(`/api/viewpoints/${viewpointId}/share`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('shareToken');
      expect(response.body).toHaveProperty('shareUrl');
      expect(response.body.shareUrl).toContain('/viewpoints/share/');
    });

    it('should return 404 for non-existent viewpoint', async () => {
      const response = await request(app)
        .post('/api/viewpoints/non-existent-id/share')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 for non-owner trying to share', async () => {
      const otherUserToken = generateToken('other-user');

      const response = await request(app)
        .post(`/api/viewpoints/${viewpointId}/share`)
        .set('Authorization', `Bearer ${otherUserToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('GET /api/viewpoints/share/:token', () => {
    let viewpointId: string;
    let shareToken: string;

    beforeEach(async () => {
      // Create a viewpoint and generate share token
      const createResponse = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Shared Viewpoint',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
        });

      viewpointId = createResponse.body.id;

      const shareResponse = await request(app)
        .post(`/api/viewpoints/${viewpointId}/share`)
        .set('Authorization', `Bearer ${authToken}`);

      shareToken = shareResponse.body.shareToken;
    });

    it('should return viewpoint by share token without authentication', async () => {
      const response = await request(app)
        .get(`/api/viewpoints/share/${shareToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', viewpointId);
      expect(response.body).toHaveProperty('name', 'Shared Viewpoint');
      expect(response.body).toHaveProperty('isPublic', true);
    });

    it('should return 404 for invalid share token', async () => {
      const response = await request(app)
        .get('/api/viewpoints/share/invalid-token');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/viewpoints/repository/:repositoryId', () => {
    beforeEach(async () => {
      // Create multiple viewpoints
      await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Viewpoint 1',
          camera: {
            position: { x: 0, y: 0, z: 10 },
            target: { x: 0, y: 0, z: 0 },
          },
        });

      await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repositoryId: mockRepoId,
          name: 'Viewpoint 2',
          camera: {
            position: { x: 5, y: 5, z: 15 },
            target: { x: 0, y: 0, z: 0 },
          },
        });
    });

    it('should list all viewpoints for a repository', async () => {
      const response = await request(app)
        .get(`/api/viewpoints/repository/${mockRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body).toHaveProperty('viewpoints');
      expect(response.body.viewpoints).toHaveLength(2);
    });

    it('should return empty array for repository with no viewpoints', async () => {
      const response = await request(app)
        .get('/api/viewpoints/repository/empty-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.viewpoints).toHaveLength(0);
    });
  });

  describe('RFC 7807 Error Format', () => {
    it('should return RFC 7807 format for validation errors', async () => {
      const response = await request(app)
        .post('/api/viewpoints')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 400);
      expect(response.body).toHaveProperty('detail');
    });

    it('should return RFC 7807 format for not found errors', async () => {
      const response = await request(app)
        .get('/api/viewpoints/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
    });

    it('should return RFC 7807 format for authentication errors', async () => {
      const response = await request(app)
        .post('/api/viewpoints')
        .send({});

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });
  });
});
