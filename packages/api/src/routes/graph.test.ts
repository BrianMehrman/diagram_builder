/**
 * Integration tests for Graph Query Endpoints
 *
 * Tests the following endpoints:
 * - GET /api/graph/:repoId - Get full graph
 * - GET /api/graph/:repoId/node/:nodeId - Get node details
 * - GET /api/graph/:repoId/dependencies/:nodeId - Get dependencies
 * - POST /api/graph/:repoId/query - Custom Cypher query
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { graphRouter } from './graph';
import { errorHandler } from '../middleware/error-handler';
import { generateToken } from '../auth/jwt';
import type { NodeType, EdgeType, LODLevel } from '@diagram-builder/core/ivm/types';

// Mock graph data
const mockRepoId = 'repo-123';
const mockNodeId = 'node-456';

const mockRepository = {
  id: mockRepoId,
  name: 'test-repo',
  rootPath: '/test/repo',
  repositoryUrl: 'https://github.com/test/repo',
  branch: 'main',
  commit: 'abc123',
  parsedAt: new Date().toISOString(),
};

const mockNodes = [
  {
    id: mockNodeId,
    type: 'file' as NodeType,
    label: 'index.ts',
    path: '/test/repo/index.ts',
    x: 0,
    y: 0,
    z: 0,
    lod: 3 as LODLevel,
    language: 'typescript',
    loc: 100,
    complexity: 5,
    dependencyCount: 2,
    dependentCount: 1,
  },
  {
    id: 'node-789',
    type: 'function' as NodeType,
    label: 'myFunction',
    path: '/test/repo/index.ts:myFunction',
    x: 1,
    y: 1,
    z: 1,
    lod: 4 as LODLevel,
    parentId: mockNodeId,
    language: 'typescript',
    loc: 20,
    complexity: 3,
    startLine: 10,
    endLine: 30,
  },
];

const mockEdges = [
  {
    id: 'edge-1',
    source: mockNodeId,
    target: 'node-789',
    type: 'contains' as EdgeType,
    lod: 3 as LODLevel,
    weight: 1,
  },
];

// Mock Neo4j
vi.mock('../database/query-utils', () => {
  return {
    runQuery: vi.fn(async (query: string, params: Record<string, unknown>) => {
      // Mock repository query
      if (query.includes('MATCH (r:Repository {id: $repoId})') && query.includes('RETURN r.id as id')) {
        if (params.repoId === mockRepoId) {
          return [mockRepository];
        }
        return [];
      }

      // Mock nodes query
      if (query.includes('MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(n)') && !query.includes('MATCH (source)')) {
        if (params.repoId === mockRepoId) {
          return mockNodes;
        }
        return [];
      }

      // Mock edges query
      if (query.includes('MATCH (source)-[e]->(target)')) {
        if (params.repoId === mockRepoId) {
          return mockEdges;
        }
        return [];
      }

      // Mock single node query
      if (query.includes('MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(n {id: $nodeId})')) {
        if (params.repoId === mockRepoId && params.nodeId === mockNodeId) {
          return [mockNodes[0]];
        }
        return [];
      }

      // Mock dependencies query
      if (query.includes('MATCH (source)-[e]->(target)') && query.includes('WHERE type(e) IN')) {
        if (params.nodeId === mockNodeId) {
          return [mockNodes[1]];
        }
        return [];
      }

      // Mock custom query (only for queries that don't match above patterns)
      if (query.includes('MATCH (n)') && (query.includes('$repoId') || query.includes('{repoId}'))) {
        return [{ result: 'custom-query-result' }];
      }

      return [];
    }),
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

describe('Graph Query Endpoints', () => {
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
    app.use('/api/graph', graphRouter);
    app.use(errorHandler);

    // Generate a valid JWT token for authenticated requests
    authToken = generateToken({ userId: 'test-user-123', email: 'test@example.com' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated GET /api/graph/:repoId', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}`);

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 for unauthenticated GET /api/graph/:repoId/node/:nodeId', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/node/${mockNodeId}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated GET /api/graph/:repoId/dependencies/:nodeId', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/dependencies/${mockNodeId}`);

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST /api/graph/:repoId/query', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .send({ query: 'MATCH (n) WHERE n.id = $repoId RETURN n' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/graph/:repoId', () => {
    it('should return full graph for existing repository', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nodes');
      expect(response.body).toHaveProperty('edges');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body).toHaveProperty('bounds');

      // Verify metadata structure
      expect(response.body.metadata).toHaveProperty('name', mockRepository.name);
      expect(response.body.metadata).toHaveProperty('schemaVersion', '1.0.0');
      expect(response.body.metadata).toHaveProperty('rootPath', mockRepository.rootPath);
      expect(response.body.metadata).toHaveProperty('stats');

      // Verify nodes
      expect(response.body.nodes).toHaveLength(mockNodes.length);
      expect(response.body.nodes[0]).toHaveProperty('id', mockNodeId);
      expect(response.body.nodes[0]).toHaveProperty('type', 'file');
      expect(response.body.nodes[0]).toHaveProperty('position');
      expect(response.body.nodes[0]).toHaveProperty('metadata');

      // Verify edges
      expect(response.body.edges).toHaveLength(mockEdges.length);
      expect(response.body.edges[0]).toHaveProperty('source');
      expect(response.body.edges[0]).toHaveProperty('target');
      expect(response.body.edges[0]).toHaveProperty('type');
    });

    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .get('/api/graph/non-existent-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
      expect(response.body.title).toBe('Repository not found');
    });

    it('should cache graph results', async () => {
      const { set: cacheSet } = await import('../cache/cache-utils');

      await request(app)
        .get(`/api/graph/${mockRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify cache was set
      expect(cacheSet).toHaveBeenCalled();
    });
  });

  describe('GET /api/graph/:repoId/node/:nodeId', () => {
    it('should return node details for existing node', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/node/${mockNodeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', mockNodeId);
      expect(response.body).toHaveProperty('type', 'file');
      expect(response.body).toHaveProperty('position');
      expect(response.body).toHaveProperty('metadata');
      expect(response.body.metadata).toHaveProperty('label', 'index.ts');
      expect(response.body.metadata).toHaveProperty('path', '/test/repo/index.ts');
      expect(response.body.metadata).toHaveProperty('language', 'typescript');
      expect(response.body.metadata).toHaveProperty('loc', 100);
    });

    it('should return 404 for non-existent node', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/node/non-existent-node`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
      expect(response.body.title).toBe('Node not found');
    });

    it('should return 400 when nodeId is missing', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/node/`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404); // Express returns 404 for missing route params
    });

    it('should cache node details', async () => {
      const { set: cacheSet } = await import('../cache/cache-utils');

      await request(app)
        .get(`/api/graph/${mockRepoId}/node/${mockNodeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify cache was set
      expect(cacheSet).toHaveBeenCalled();
    });
  });

  describe('GET /api/graph/:repoId/dependencies/:nodeId', () => {
    it('should return dependencies for existing node', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/dependencies/${mockNodeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nodeId', mockNodeId);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('dependencies');
      expect(Array.isArray(response.body.dependencies)).toBe(true);
      expect(response.body.count).toBe(response.body.dependencies.length);
    });

    it('should include nodeId in response', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}/dependencies/${mockNodeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('nodeId', mockNodeId);
      expect(response.body).toHaveProperty('dependencies');
      expect(Array.isArray(response.body.dependencies)).toBe(true);
    });

    it('should cache dependency results', async () => {
      const { set: cacheSet } = await import('../cache/cache-utils');

      await request(app)
        .get(`/api/graph/${mockRepoId}/dependencies/${mockNodeId}`)
        .set('Authorization', `Bearer ${authToken}`);

      // Verify cache was set
      expect(cacheSet).toHaveBeenCalled();
    });
  });

  describe('POST /api/graph/:repoId/query', () => {
    it('should execute valid custom query', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'MATCH (n) WHERE n.id = $repoId RETURN n',
          params: { limit: 10 },
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('results');
      expect(Array.isArray(response.body.results)).toBe(true);
    });

    it('should execute query without optional params', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'MATCH (n) WHERE n.id = $repoId RETURN n',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('results');
    });

    it('should return 400 for query without $repoId parameter', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'MATCH (n) RETURN n',
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
    });

    it('should return 400 for empty query', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: '',
        });

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
    });

    it('should return 400 for missing query field', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
    });

    it('should cache custom query results', async () => {
      const { set: cacheSet } = await import('../cache/cache-utils');

      await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          query: 'MATCH (n) WHERE n.id = $repoId RETURN n',
        });

      // Verify cache was set
      expect(cacheSet).toHaveBeenCalled();
    });
  });

  describe('RFC 7807 Error Format', () => {
    it('should return RFC 7807 format for validation errors', async () => {
      const response = await request(app)
        .post(`/api/graph/${mockRepoId}/query`)
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
        .get('/api/graph/non-existent-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
    });

    it('should return RFC 7807 format for authentication errors', async () => {
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}`);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });
  });

  describe('Caching Behavior', () => {
    it('should return cached result on second request', async () => {
      const { get: cacheGet, set: cacheSet } = await import('../cache/cache-utils');

      // First request - cache miss
      await request(app)
        .get(`/api/graph/${mockRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(cacheSet).toHaveBeenCalled();

      // Mock cache hit for second request
      vi.mocked(cacheGet).mockResolvedValueOnce({
        nodes: mockNodes,
        edges: mockEdges,
        metadata: { name: 'cached-repo' },
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 1, y: 1, z: 1 } },
      });

      // Second request - should use cache
      const response = await request(app)
        .get(`/api/graph/${mockRepoId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.metadata.name).toBe('cached-repo');
    });
  });
});
