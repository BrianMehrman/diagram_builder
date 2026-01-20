/**
 * Graph API Integration Tests
 *
 * Simplified integration tests focusing on graph API endpoints
 * Tests use mocked database but validate actual API behavior
 */

import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { graphRouter } from '../../routes/graph';
import { errorHandler } from '../../middleware/error-handler';
import { generateToken } from '../../auth/jwt';
import * as graphService from '../../services/graph-service';

// Mock graph service
vi.mock('../../services/graph-service');

describe('[Integration] Graph API Endpoints', () => {
  let app: Express;
  let authToken: string;
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';

  beforeAll(() => {
    process.env.JWT_SECRET = TEST_SECRET;

    // Create Express app
    app = express();
    app.use(express.json());
    app.use('/api/graph', graphRouter);
    app.use(errorHandler);

    // Generate auth token
    authToken = generateToken({ userId: 'test-user', email: 'test@example.com' });
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/graph/:repoId', () => {
    it('should return graph data with correct structure', async () => {
      const mockGraph = {
        nodes: [
          {
            id: 'file-1',
            type: 'file',
            label: 'index.ts',
            metadata: { path: 'src/index.ts', loc: 100 },
            position: { x: 0, y: 0, z: 0 },
            lod: 0,
          },
          {
            id: 'class-1',
            type: 'class',
            label: 'App',
            metadata: { methods: 3 },
            position: { x: 1, y: 1, z: 0 },
            lod: 1,
          },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'file-1',
            target: 'class-1',
            type: 'contains',
            metadata: {},
          },
        ],
        metadata: {
          repositoryId: 'test-repo',
          totalNodes: 2,
          totalEdges: 1,
        },
      };

      vi.mocked(graphService.getFullGraph).mockResolvedValue(mockGraph);

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockGraph);
      expect(graphService.getFullGraph).toHaveBeenCalledWith('test-repo');
    });

    it('should return 404 for non-existent repository', async () => {
      vi.mocked(graphService.getFullGraph).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/graph/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('not-found');
      expect(response.body.title).toBe('Repository not found');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/graph/test-repo');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('unauthorized');
    });
  });

  describe('Graph Data Validation', () => {
    it('should return graph with all required node fields', async () => {
      const mockGraph = {
        nodes: [
          {
            id: 'test-node',
            type: 'file',
            label: 'test.ts',
            metadata: {},
            position: { x: 0, y: 0, z: 0 },
            lod: 0,
          },
        ],
        edges: [],
        metadata: {
          repositoryId: 'test-repo',
          totalNodes: 1,
          totalEdges: 0,
        },
      };

      vi.mocked(graphService.getFullGraph).mockResolvedValue(mockGraph);

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Validate node structure
      const node = response.body.nodes[0];
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('type');
      expect(node).toHaveProperty('label');
      expect(node).toHaveProperty('metadata');
      expect(node).toHaveProperty('position');
      expect(node).toHaveProperty('lod');

      // Validate position structure
      expect(node.position).toHaveProperty('x');
      expect(node.position).toHaveProperty('y');
      expect(node.position).toHaveProperty('z');
    });

    it('should return graph with all required edge fields', async () => {
      const mockGraph = {
        nodes: [
          { id: 'node-1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
          { id: 'node-2', type: 'file', label: 'b.ts', metadata: {}, lod: 0 },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'imports',
            metadata: {},
          },
        ],
        metadata: {
          repositoryId: 'test-repo',
          totalNodes: 2,
          totalEdges: 1,
        },
      };

      vi.mocked(graphService.getFullGraph).mockResolvedValue(mockGraph);

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Validate edge structure
      const edge = response.body.edges[0];
      expect(edge).toHaveProperty('id');
      expect(edge).toHaveProperty('source');
      expect(edge).toHaveProperty('target');
      expect(edge).toHaveProperty('type');
      expect(edge).toHaveProperty('metadata');
    });

    it('should validate edge references exist in nodes', async () => {
      const mockGraph = {
        nodes: [
          { id: 'node-1', type: 'file', label: 'a.ts', metadata: {}, lod: 0 },
          { id: 'node-2', type: 'file', label: 'b.ts', metadata: {}, lod: 0 },
        ],
        edges: [
          {
            id: 'edge-1',
            source: 'node-1',
            target: 'node-2',
            type: 'imports',
            metadata: {},
          },
        ],
        metadata: {
          repositoryId: 'test-repo',
          totalNodes: 2,
          totalEdges: 1,
        },
      };

      vi.mocked(graphService.getFullGraph).mockResolvedValue(mockGraph);

      const response = await request(app)
        .get('/api/graph/test-repo')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      const nodeIds = new Set(response.body.nodes.map((n: any) => n.id));
      response.body.edges.forEach((edge: any) => {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      });
    });
  });

  describe('RFC 7807 Error Format', () => {
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

    it('should return RFC 7807 format for 401 errors', async () => {
      const response = await request(app).get('/api/graph/test-repo');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });
  });
});
