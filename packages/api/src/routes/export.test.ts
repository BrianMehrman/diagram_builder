/**
 * Integration tests for Export Endpoints
 *
 * Tests the following endpoints:
 * - POST /api/export/plantuml - Export as PlantUML
 * - POST /api/export/mermaid - Export as Mermaid
 * - POST /api/export/drawio - Export as Draw.io
 * - POST /api/export/gltf - Export as GLTF
 * - POST /api/export/image - Export as PNG or SVG
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { exportRouter } from './export';
import { errorHandler } from '../middleware/error-handler';
import { generateToken } from '../auth/jwt';

// Mock graph service
vi.mock('../services/graph-service', () => ({
  getFullGraph: vi.fn(async (repoId: string) => {
    if (repoId === '00000000-0000-4000-8000-000000000000') {
      return null;
    }
    return {
      nodes: [
        { id: 'file1', type: 'file', name: 'file1.ts', lod: 0, metadata: { path: '/src/file1.ts', language: 'typescript' } },
        { id: 'func1', type: 'function', name: 'testFunc', lod: 1, metadata: { path: '/src/file1.ts' } },
        { id: 'class1', type: 'class', name: 'TestClass', lod: 2, metadata: { path: '/src/file1.ts' } },
      ],
      edges: [
        { source: 'func1', target: 'file1', type: 'contains', metadata: {} },
        { source: 'class1', target: 'file1', type: 'contains', metadata: {} },
      ],
      metadata: { name: 'test-repo', version: '1.0.0' },
    };
  }),
}));

describe('Export Endpoints', () => {
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
    app.use('/api/export', exportRouter);
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
    it('should return 401 for unauthenticated POST /api/export/plantuml', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .send({ repoId: 'test-id' });

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 for unauthenticated POST /api/export/mermaid', async () => {
      const response = await request(app)
        .post('/api/export/mermaid')
        .send({ repoId: 'test-id' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST /api/export/drawio', async () => {
      const response = await request(app)
        .post('/api/export/drawio')
        .send({ repoId: 'test-id' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST /api/export/gltf', async () => {
      const response = await request(app)
        .post('/api/export/gltf')
        .send({ repoId: 'test-id' });

      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated POST /api/export/image', async () => {
      const response = await request(app)
        .post('/api/export/image')
        .send({ repoId: 'test-id', format: 'png' });

      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/export/plantuml', () => {
    it('should export graph as PlantUML', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('mimeType', 'text/x-plantuml');
      expect(response.body).toHaveProperty('extension', 'puml');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.stats).toHaveProperty('nodeCount', 3);
      expect(response.body.stats).toHaveProperty('edgeCount', 2);
      expect(response.body.content).toContain('@startuml');
      expect(response.body.content).toContain('@enduml');
    });

    it('should accept optional lodLevel parameter', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', lodLevel: 1 });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(2); // LOD 0 and 1 nodes only
    });

    it('should accept optional filters parameter', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { nodeTypes: ['file'] }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(1); // Only file node
    });

    it('should return 400 when repoId is missing', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
      expect(response.body.detail).toContain('Repository ID is required');
    });

    it('should return 404 when repository not found', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: '00000000-0000-4000-8000-000000000000' });

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
      expect(response.body.title).toBe('Repository not found');
    });
  });

  describe('POST /api/export/mermaid', () => {
    it('should export graph as Mermaid', async () => {
      const response = await request(app)
        .post('/api/export/mermaid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('mimeType', 'text/plain');
      expect(response.body).toHaveProperty('extension', 'md');
      expect(response.body.content).toContain('flowchart TD');
    });

    it('should return 404 when repository not found', async () => {
      const response = await request(app)
        .post('/api/export/mermaid')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: '00000000-0000-4000-8000-000000000000' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/export/drawio', () => {
    it('should export graph as Draw.io XML', async () => {
      const response = await request(app)
        .post('/api/export/drawio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('mimeType', 'application/xml');
      expect(response.body).toHaveProperty('extension', 'drawio');
      expect(response.body.content).toContain('<mxfile>');
      expect(response.body.content).toContain('</mxfile>');
    });

    it('should return 404 when repository not found', async () => {
      const response = await request(app)
        .post('/api/export/drawio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: '00000000-0000-4000-8000-000000000000' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/export/gltf', () => {
    it('should export graph as GLTF 3D model', async () => {
      const response = await request(app)
        .post('/api/export/gltf')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('mimeType', 'model/gltf+json');
      expect(response.body).toHaveProperty('extension', 'gltf');

      const gltfContent = JSON.parse(response.body.content);
      expect(gltfContent).toHaveProperty('asset');
      expect(gltfContent.asset).toHaveProperty('version', '2.0');
    });

    it('should return 404 when repository not found', async () => {
      const response = await request(app)
        .post('/api/export/gltf')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: '00000000-0000-4000-8000-000000000000' });

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/export/image', () => {
    it('should export graph as SVG', async () => {
      const response = await request(app)
        .post('/api/export/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', format: 'svg' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('filename');
      expect(response.body).toHaveProperty('mimeType', 'image/svg+xml');
      expect(response.body).toHaveProperty('extension', 'svg');
      expect(response.body.content).toContain('<svg');
      expect(response.body.content).toContain('</svg>');
    });

    it('should export graph as PNG', async () => {
      const response = await request(app)
        .post('/api/export/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', format: 'png' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('mimeType', 'image/png');
      expect(response.body).toHaveProperty('extension', 'png');
    });

    it('should return 400 when format is missing', async () => {
      const response = await request(app)
        .post('/api/export/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('Format is required');
    });

    it('should return 400 when format is invalid', async () => {
      const response = await request(app)
        .post('/api/export/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', format: 'jpg' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('must be either "png" or "svg"');
    });

    it('should return 404 when repository not found', async () => {
      const response = await request(app)
        .post('/api/export/image')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: '00000000-0000-4000-8000-000000000000', format: 'svg' });

      expect(response.status).toBe(404);
    });
  });

  describe('LOD Filtering', () => {
    it('should filter nodes by LOD level 0', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', lodLevel: 0 });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(1); // Only LOD 0 node
    });

    it('should filter nodes by LOD level 1', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', lodLevel: 1 });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(2); // LOD 0 and 1 nodes
    });

    it('should include all nodes at LOD level 5', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: 'test-repo-id', lodLevel: 5 });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(3); // All nodes
    });
  });

  describe('Graph Filters', () => {
    it('should filter by node types', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { nodeTypes: ['file', 'function'] }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(2); // file and function only
    });

    it('should filter by edge types', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { edgeTypes: ['contains'] }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.edgeCount).toBe(2); // both edges are contains
    });

    it('should filter by languages', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { languages: ['typescript'] }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(1); // Only file with typescript language
    });

    it('should filter by path pattern', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { pathPattern: '/src/.*' }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(3); // All nodes match /src/
    });

    it('should filter by visible nodes', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { visibleNodes: ['file1', 'func1'] }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(2); // Only specified nodes
    });

    it('should filter by hidden nodes', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          repoId: 'test-repo-id',
          filters: { hiddenNodes: ['class1'] }
        });

      expect(response.status).toBe(200);
      expect(response.body.stats.nodeCount).toBe(2); // All except class1
    });
  });

  describe('RFC 7807 Error Format', () => {
    it('should return RFC 7807 format for validation errors', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
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
        .post('/api/export/plantuml')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repoId: '00000000-0000-4000-8000-000000000000' });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
    });

    it('should return RFC 7807 format for authentication errors', async () => {
      const response = await request(app)
        .post('/api/export/plantuml')
        .send({ repoId: 'test-id' });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });
  });
});
