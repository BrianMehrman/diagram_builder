/**
 * Codebase Pipeline Integration Tests
 *
 * Full integration tests for the complete pipeline:
 * POST /api/workspaces/:id/codebases → parse → Neo4j → GET /api/graph/:repoId
 *
 * These tests use REAL Neo4j (not mocked) and REAL file systems to validate
 * the entire import flow works correctly.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import path from 'path';
import app from '../../index';
import { generateToken } from '../../auth/jwt';
import { getDriver } from '../../database/neo4j-config';
import type { IVMGraph } from '@diagram-builder/core';

describe('[Integration] Codebase Import Pipeline', () => {
  let authToken: string;
  let testWorkspaceId: string;
  let testUserId: string;

  // Test fixtures paths
  const FIXTURES_DIR = path.join(__dirname, '../../../../../tests/fixtures/repositories');
  const SMALL_TS_REPO = path.join(FIXTURES_DIR, 'small-ts-repo');

  beforeAll(async () => {
    // Generate auth token
    testUserId = 'test-pipeline-user';
    authToken = generateToken({ userId: testUserId, email: 'pipeline@test.com' });

    // Create a test workspace
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Pipeline Test Workspace',
        description: 'Test workspace for integration tests',
      });

    expect(workspaceRes.status).toBe(201);
    testWorkspaceId = workspaceRes.body.id;
  });

  afterAll(async () => {
    // Clean up test data from Neo4j
    const session = getDriver().session();
    try {
      // Delete all test repositories and related nodes
      await session.run(
        `
        MATCH (r:Repository)
        WHERE r.id STARTS WITH 'test-' OR r.name CONTAINS 'test'
        DETACH DELETE r
        `
      );
    } finally {
      await session.close();
    }

    // Close Neo4j driver
    await getDriver().close();
  });

  const cleanupTestData = async () => {
    const session = getDriver().session();
    try {
      // Delete all repositories and related nodes that match our test fixture path
      await session.run(
        `
        MATCH (n)
        WHERE n.id CONTAINS '/tests/fixtures/repositories/'
           OR (n:Repository AND n.name = 'small-ts-repo')
        DETACH DELETE n
        `
      );
    } finally {
      await session.close();
    }
  };

  beforeEach(cleanupTestData);
  afterEach(cleanupTestData);

  describe('POST /api/workspaces/:workspaceId/codebases', () => {
    it('should import a local codebase successfully', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('codebaseId');
      expect(response.body).toHaveProperty('workspaceId', testWorkspaceId);
      expect(response.body).toHaveProperty('source', SMALL_TS_REPO);
      expect(response.body).toHaveProperty('type', 'local');
      expect(response.body).toHaveProperty('status');
      expect(['pending', 'processing', 'completed']).toContain(response.body.status);
    });

    it('should return validation error for missing source', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'local',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('validation-error');
    });

    it('should return validation error for invalid type', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('validation-error');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('unauthorized');
    });
  });

  describe('Full Pipeline Integration', () => {
    it('should complete full import → parse → store → retrieve flow', async () => {
      // Step 1: Import codebase
      const importRes = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        });

      expect(importRes.status).toBe(201);
      const codebaseId = importRes.body.codebaseId;

      // Step 2: Wait for processing to complete
      let codebase: any;
      let attempts = 0;
      const maxAttempts = 30; // 30 seconds timeout

      while (attempts < maxAttempts) {
        const statusRes = await request(app)
          .get(`/api/workspaces/${testWorkspaceId}/codebases/${codebaseId}`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(statusRes.status).toBe(200);
        codebase = statusRes.body;

        if (codebase.status === 'completed') {
          break;
        }

        if (codebase.status === 'failed') {
          throw new Error(`Codebase import failed: ${codebase.error}`);
        }

        // Wait 1 second before next check
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      // Verify completion
      expect(codebase.status).toBe('completed');
      expect(codebase).toHaveProperty('repositoryId');

      const repositoryId = codebase.repositoryId;

      // Step 3: Retrieve graph data
      const graphRes = await request(app)
        .get(`/api/graph/${repositoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(graphRes.status).toBe(200);
      expect(graphRes.body).toHaveProperty('nodes');
      expect(graphRes.body).toHaveProperty('edges');
      expect(graphRes.body).toHaveProperty('metadata');

      const graph: IVMGraph = graphRes.body;

      // Step 4: Validate graph quality
      expect(graph.nodes.length).toBeGreaterThan(0);

      // Validate node structure
      graph.nodes.forEach((node) => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('label');
        expect(node).toHaveProperty('metadata');
        expect(node).toHaveProperty('position');
        expect(node).toHaveProperty('lod');

        // Validate 3D coordinates
        expect(node.position).toHaveProperty('x');
        expect(node.position).toHaveProperty('y');
        expect(node.position).toHaveProperty('z');
        expect(typeof node.position.x).toBe('number');
        expect(typeof node.position.y).toBe('number');
        expect(typeof node.position.z).toBe('number');
      });

      // Validate edge structure (if edges exist)
      if (graph.edges.length > 0) {
        graph.edges.forEach((edge) => {
          expect(edge).toHaveProperty('id');
          expect(edge).toHaveProperty('source');
          expect(edge).toHaveProperty('target');
          expect(edge).toHaveProperty('type');
          expect(edge).toHaveProperty('metadata');
        });

        // Validate edge references
        const nodeIds = new Set(graph.nodes.map((n) => n.id));
        graph.edges.forEach((edge) => {
          expect(nodeIds.has(edge.source)).toBe(true);
          expect(nodeIds.has(edge.target)).toBe(true);
        });
      }

      // Validate metadata
      expect(graph.metadata).toHaveProperty('repositoryId', repositoryId);
      expect(graph.metadata.totalNodes).toBe(graph.nodes.length);
      expect(graph.metadata.totalEdges).toBe(graph.edges.length);
    }, 60000); // 60 second timeout for full pipeline

    it('should handle multiple concurrent imports', async () => {
      // Import same repo twice concurrently
      const [import1, import2] = await Promise.all([
        request(app)
          .post(`/api/workspaces/${testWorkspaceId}/codebases`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            source: SMALL_TS_REPO,
            type: 'local',
          }),
        request(app)
          .post(`/api/workspaces/${testWorkspaceId}/codebases`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            source: SMALL_TS_REPO,
            type: 'local',
          }),
      ]);

      expect(import1.status).toBe(201);
      expect(import2.status).toBe(201);
      expect(import1.body.codebaseId).not.toBe(import2.body.codebaseId);
    });
  });

  describe('GET /api/graph/:repoId', () => {
    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .get('/api/graph/non-existent-repo-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('not-found');
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/graph/test-repo-id');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return RFC 7807 error format', async () => {
      const response = await request(app)
        .get('/api/graph/non-existent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
      expect(response.body).toHaveProperty('detail');
    });
  });

  describe('Codebase Status Tracking', () => {
    it('should track status transitions correctly', async () => {
      // Import codebase
      const importRes = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        });

      const codebaseId = importRes.body.codebaseId;

      // Check initial status
      const initialStatus = importRes.body.status;
      expect(['pending', 'processing']).toContain(initialStatus);

      // Wait for completion
      let finalStatus: string = initialStatus;
      let attempts = 0;

      while (attempts < 30 && finalStatus !== 'completed' && finalStatus !== 'failed') {
        const statusRes = await request(app)
          .get(`/api/workspaces/${testWorkspaceId}/codebases/${codebaseId}`)
          .set('Authorization', `Bearer ${authToken}`);

        finalStatus = statusRes.body.status;
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempts++;
      }

      expect(finalStatus).toBe('completed');
    }, 60000);
  });
});
