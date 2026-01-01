/**
 * Integration tests for Repository Parsing Endpoints
 *
 * Tests the following endpoints:
 * - POST /api/repositories - Parse new repository
 * - GET /api/repositories/:id - Get repository metadata
 * - DELETE /api/repositories/:id - Delete repository
 * - POST /api/repositories/:id/refresh - Re-parse repository
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { repositoriesRouter } from './repositories';
import { errorHandler } from '../middleware/error-handler';
import { generateToken } from '../auth/jwt';

// Mock data store for repositories
const mockRepositories = new Map<string, Record<string, unknown>>();

// Mock Neo4j
vi.mock('../database/query-utils', () => {
  return {
    runQuery: vi.fn(async (query: string, params: Record<string, unknown>) => {
      // Mock CREATE Repository
      if (query.includes('CREATE (r:Repository')) {
        const id = params.id as string;
        mockRepositories.set(id, {
          id,
          name: params.name,
          url: params.url,
          path: params.path,
          branch: params.branch,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          status: params.status || 'completed'
        });
        return [];
      }

      // Mock CREATE IVM nodes
      if (query.includes('CREATE (n:')) {
        // Store IVM nodes (simplified - just acknowledge creation)
        return [];
      }

      // Mock CREATE IVM edges/relationships
      if (query.includes('CREATE (source)-[')) {
        // Store IVM edges (simplified - just acknowledge creation)
        return [];
      }

      // Mock MATCH Repository for GET
      if (query.includes('MATCH (r:Repository {id: $id})') && !query.includes('DETACH DELETE')) {
        const id = params.id as string;
        const repo = mockRepositories.get(id);
        if (!repo) {
          return [];
        }
        return [{
          r: repo,
          fileCount: 5,
          nodeCount: 25
        }];
      }

      // Mock DETACH DELETE
      if (query.includes('DETACH DELETE')) {
        const id = params.id as string;
        mockRepositories.delete(id);
        return [];
      }

      return [];
    }),
    getQueryStats: vi.fn(() => ({ totalQueries: 0 })),
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

// Mock parser package
vi.mock('@diagram-builder/parser', () => ({
  loadRepository: vi.fn().mockResolvedValue({
    files: ['/test/file1.ts', '/test/file2.ts'],
    metadata: { type: 'local', name: 'test-repo' },
  }),
  buildDependencyGraph: vi.fn().mockReturnValue({
    getNodes: () => [
      { id: 'file1', type: 'file', name: 'file1.ts', metadata: {} },
      { id: 'func1', type: 'function', name: 'testFunc', metadata: {} },
    ],
    getEdges: () => [
      { source: 'func1', target: 'file1', type: 'contains', metadata: {} },
    ],
  }),
  convertToIVM: vi.fn().mockReturnValue({
    nodes: [
      { id: 'file1', type: 'file', name: 'file1.ts', metadata: {} },
      { id: 'func1', type: 'function', name: 'testFunc', metadata: {} },
    ],
    edges: [
      { source: 'func1', target: 'file1', type: 'contains', metadata: {} },
    ],
    metadata: { name: 'test-repo', version: '1.0.0' },
  }),
  cloneRepository: vi.fn().mockResolvedValue({
    localPath: '/tmp/test-repo',
    branch: 'main',
  }),
}));

// Mock file system operations
vi.mock('fs/promises', () => ({
  access: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn().mockResolvedValue('export function test() {}'),
  constants: { R_OK: 4 },
}));

describe('Repository Parsing Endpoints', () => {
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
    app.use('/api/repositories', repositoriesRouter);
    app.use(errorHandler);

    // Generate a valid JWT token for authenticated requests
    authToken = generateToken({ userId: 'test-user-123', email: 'test@example.com' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    // Clear mock repository store before each test
    mockRepositories.clear();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated POST /api/repositories', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .send({ path: '/test/repo' });

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 for unauthenticated GET /api/repositories/:id', async () => {
      const response = await request(app)
        .get('/api/repositories/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated DELETE /api/repositories/:id', async () => {
      const response = await request(app)
        .delete('/api/repositories/test-id');

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST /api/repositories/:id/refresh', async () => {
      const response = await request(app)
        .post('/api/repositories/test-id/refresh');

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/repositories', () => {
    it('should parse repository with valid path', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ path: '/test/repo' });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body.message).toBe('Repository parsing initiated');
    });

    it('should parse repository with valid URL', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'https://github.com/test/repo.git' });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    });

    it('should accept optional branch parameter', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ path: '/test/repo', branch: 'develop' });

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 400 when neither url nor path is provided', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
    });

    it('should return 400 when both url and path are provided', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          url: 'https://github.com/test/repo.git',
          path: '/test/repo'
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
    });

    it('should return 400 for invalid URL format', async () => {
      const response = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ url: 'not-a-valid-url' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/repositories/:id', () => {
    let createdRepoId: string;

    beforeEach(async () => {
      // Create a repository first
      const createResponse = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ path: '/test/existing-repo' });

      createdRepoId = createResponse.body.id;
    });

    it('should return repository metadata for existing repository', async () => {
      const response = await request(app)
        .get(`/api/repositories/${createdRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', createdRepoId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('lastUpdated');
      expect(response.body).toHaveProperty('fileCount');
      expect(response.body).toHaveProperty('nodeCount');
      expect(response.body).toHaveProperty('status');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .get('/api/repositories/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
      expect(response.body.title).toBe('Repository not found');
    });
  });

  describe('DELETE /api/repositories/:id', () => {
    let createdRepoId: string;

    beforeEach(async () => {
      // Create a repository first
      const createResponse = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ path: '/test/repo-to-delete' });

      createdRepoId = createResponse.body.id;
    });

    it('should delete existing repository', async () => {
      const response = await request(app)
        .delete(`/api/repositories/${createdRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .delete('/api/repositories/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
    });

    it('should invalidate cache after deletion', async () => {
      const { invalidatePattern } = await import('../cache/cache-utils');

      await request(app)
        .delete(`/api/repositories/${createdRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify cache invalidation was called
      expect(invalidatePattern).toHaveBeenCalled();
    });
  });

  describe('POST /api/repositories/:id/refresh', () => {
    let createdRepoId: string;

    beforeEach(async () => {
      // Create a repository first
      const createResponse = await request(app)
        .post('/api/repositories')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ path: '/test/repo-to-refresh' });

      createdRepoId = createResponse.body.id;
    });

    it('should refresh existing repository', async () => {
      const response = await request(app)
        .post(`/api/repositories/${createdRepoId}/refresh`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(202);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
      expect(response.body.message).toBe('Repository refresh initiated');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .post('/api/repositories/00000000-0000-4000-8000-000000000000/refresh')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
    });
  });

  describe('RFC 7807 Error Format', () => {
    it('should return RFC 7807 format for validation errors', async () => {
      const response = await request(app)
        .post('/api/repositories')
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
        .get('/api/repositories/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
    });

    it('should return RFC 7807 format for authentication errors', async () => {
      const response = await request(app)
        .get('/api/repositories/test-id');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });
  });
});
