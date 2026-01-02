/**
 * Integration tests for Workspace Endpoints
 *
 * Tests the following endpoints:
 * - POST /api/workspaces - Create workspace
 * - GET /api/workspaces - List user's workspaces
 * - GET /api/workspaces/:id - Get workspace
 * - PUT /api/workspaces/:id - Update workspace
 * - DELETE /api/workspaces/:id - Delete workspace
 * - POST /api/workspaces/:id/members - Add member
 * - DELETE /api/workspaces/:id/members/:userId - Remove member
 * - PUT /api/workspaces/:id/members/:userId - Update member role
 */

import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express, { Express } from 'express';
import { workspacesRouter } from './workspaces';
import { errorHandler } from '../middleware/error-handler';
import { generateToken } from '../auth/jwt';
import * as cacheUtils from '../cache/cache-utils';

// Mock data store for workspaces
const mockWorkspaces = new Map<string, Record<string, unknown>>();

// Mock data store for codebases
const mockCodebases = new Map<string, Record<string, unknown>>();

// Mock Neo4j
vi.mock('../database/query-utils', () => {
  return {
    runQuery: vi.fn(async (query: string, params: Record<string, unknown>) => {
      // Mock CREATE Workspace
      if (query.includes('CREATE (w:Workspace')) {
        const id = params.id as string;
        mockWorkspaces.set(id, {
          id,
          name: params.name,
          description: params.description,
          ownerId: params.ownerId,
          repositories: JSON.parse(params.repositories as string),
          members: JSON.parse(params.members as string),
          settings: JSON.parse(params.settings as string),
          sessionState: JSON.parse(params.sessionState as string),
          createdAt: params.createdAt,
          updatedAt: params.updatedAt,
        });
        return [];
      }

      // Mock GET workspace
      if (query.includes('MATCH (w:Workspace {id: $id})') && !query.includes('SET w')) {
        const id = params.id as string;
        const workspace = mockWorkspaces.get(id);
        if (!workspace) {
          return [];
        }
        // Return as JSON strings (like Neo4j would)
        return [{
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          ownerId: workspace.ownerId,
          repositories: JSON.stringify(workspace.repositories),
          members: JSON.stringify(workspace.members),
          settings: JSON.stringify(workspace.settings),
          sessionState: JSON.stringify(workspace.sessionState),
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          lastAccessedAt: null,
        }];
      }

      // Mock list user workspaces
      if (query.includes('WHERE w.ownerId = $userId OR $userId IN')) {
        const userId = params.userId as string;
        const userWorkspaces = Array.from(mockWorkspaces.values()).filter((w) => {
          if (w.ownerId === userId) return true;
          // Members are already parsed in the mock store
          const members = w.members as unknown as Array<{ userId: string }>;
          return members.some(m => m.userId === userId);
        });

        return userWorkspaces.map(w => ({
          id: w.id,
          name: w.name,
          description: w.description,
          ownerId: w.ownerId,
          repositories: JSON.stringify(w.repositories),
          members: JSON.stringify(w.members),
          settings: JSON.stringify(w.settings),
          sessionState: JSON.stringify(w.sessionState),
          createdAt: w.createdAt,
          updatedAt: w.updatedAt,
          lastAccessedAt: null,
        }));
      }

      // Mock SET w.lastAccessedAt (non-blocking update)
      if (query.includes('SET w.lastAccessedAt')) {
        const id = params.id as string;
        const workspace = mockWorkspaces.get(id);
        if (workspace && params.lastAccessedAt) {
          workspace.lastAccessedAt = params.lastAccessedAt;
          mockWorkspaces.set(id, workspace);
        }
        return [];
      }

      // Mock SET (update)
      if (query.includes('SET w.') || query.includes('SET ${')) {
        const id = params.id as string;
        const workspace = mockWorkspaces.get(id);
        if (!workspace) {
          return [];
        }

        const updated = { ...workspace };
        if (params.name !== undefined) updated.name = params.name;
        if (params.description !== undefined) updated.description = params.description;
        if (params.repositories !== undefined) {
          // Params come as JSON strings, parse them for storage
          updated.repositories = JSON.parse(params.repositories as string);
        }
        if (params.settings !== undefined) {
          updated.settings = JSON.parse(params.settings as string);
        }
        if (params.sessionState !== undefined) {
          updated.sessionState = JSON.parse(params.sessionState as string);
        }
        if (params.members !== undefined) {
          updated.members = JSON.parse(params.members as string);
        }
        updated.updatedAt = params.updatedAt || new Date().toISOString();

        mockWorkspaces.set(id, updated);

        return [];
      }

      // Mock DELETE
      if (query.includes('DETACH DELETE') && !query.includes('Codebase')) {
        const id = params.id as string;
        mockWorkspaces.delete(id);
        return [];
      }

      // Mock CREATE Codebase
      if (query.includes('CREATE (c:Codebase')) {
        const id = params.id as string;
        mockCodebases.set(id, {
          id,
          workspaceId: params.workspaceId,
          source: params.source,
          type: params.type,
          branch: params.branch || null,
          status: params.status || 'pending',
          error: params.error || null,
          repositoryId: params.repositoryId || null,
          importedAt: params.importedAt || new Date().toISOString(),
          updatedAt: params.updatedAt || new Date().toISOString(),
        });
        return [];
      }

      // Mock GET codebases by workspace
      if (query.includes('MATCH (w:Workspace') && query.includes('[:CONTAINS]->(c:Codebase)')) {
        const workspaceId = params.workspaceId as string;
        const workspaceCodebases = Array.from(mockCodebases.values()).filter(
          (c) => c.workspaceId === workspaceId
        );

        return workspaceCodebases.map(c => ({
          id: c.id,
          workspaceId: c.workspaceId,
          source: c.source,
          type: c.type,
          branch: c.branch,
          status: c.status,
          error: c.error,
          repositoryId: c.repositoryId,
          importedAt: c.importedAt,
          updatedAt: c.updatedAt,
        }));
      }

      // Mock GET codebase by ID
      if (query.includes('MATCH (c:Codebase {id: $codebaseId})') && !query.includes('DETACH DELETE')) {
        const codebaseId = params.codebaseId as string;
        const codebase = mockCodebases.get(codebaseId);
        if (!codebase) {
          return [];
        }
        return [{
          id: codebase.id,
          workspaceId: codebase.workspaceId,
          source: codebase.source,
          type: codebase.type,
          branch: codebase.branch,
          status: codebase.status,
          error: codebase.error,
          repositoryId: codebase.repositoryId,
          importedAt: codebase.importedAt,
          updatedAt: codebase.updatedAt,
        }];
      }

      // Mock UPDATE codebase status
      if (query.includes('SET c.status') || query.includes('SET c.error')) {
        const codebaseId = params.codebaseId as string;
        const codebase = mockCodebases.get(codebaseId);
        if (!codebase) {
          return [];
        }

        const updated = { ...codebase };
        if (params.status !== undefined) updated.status = params.status;
        if (params.error !== undefined) updated.error = params.error;
        if (params.repositoryId !== undefined) updated.repositoryId = params.repositoryId;
        updated.updatedAt = new Date().toISOString();

        mockCodebases.set(codebaseId, updated);
        return [];
      }

      // Mock DELETE Codebase
      if (query.includes('MATCH (c:Codebase') && query.includes('DETACH DELETE')) {
        const codebaseId = params.codebaseId as string;
        const codebase = mockCodebases.get(codebaseId);
        if (!codebase) {
          return [];
        }
        mockCodebases.delete(codebaseId);
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

describe('Workspace Endpoints', () => {
  let app: Express;
  let authToken: string;
  let authToken2: string;
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
  let originalEnv: NodeJS.ProcessEnv;

  beforeAll(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = TEST_SECRET;

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/workspaces', workspacesRouter);
    app.use(errorHandler);

    // Generate JWT tokens for two different users
    authToken = generateToken({ userId: 'user-123', email: 'user1@example.com' });
    authToken2 = generateToken({ userId: 'user-456', email: 'user2@example.com' });
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  beforeEach(() => {
    mockWorkspaces.clear();
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated POST /api/workspaces', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .send({ name: 'Test Workspace' });

      expect(response.status).toBe(401);
      expect(response.body.type).toContain('unauthorized');
    });

    it('should return 401 for unauthenticated GET /api/workspaces', async () => {
      const response = await request(app).get('/api/workspaces');
      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated GET /api/workspaces/:id', async () => {
      const response = await request(app).get('/api/workspaces/test-id');
      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated PUT /api/workspaces/:id', async () => {
      const response = await request(app)
        .put('/api/workspaces/test-id')
        .send({ name: 'Updated' });
      expect(response.status).toBe(401);
    });

    it('should return 401 for unauthenticated DELETE /api/workspaces/:id', async () => {
      const response = await request(app).delete('/api/workspaces/test-id');
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/workspaces', () => {
    it('should create workspace with valid name', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'My Workspace' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name', 'My Workspace');
      expect(response.body).toHaveProperty('ownerId', 'user-123');
      expect(response.body).toHaveProperty('members');
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0]).toMatchObject({
        userId: 'user-123',
        role: 'owner',
      });
      expect(response.body).toHaveProperty('repositories', []);
      expect(response.body).toHaveProperty('settings', {});
      expect(response.body).toHaveProperty('sessionState', {});
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });

    it('should create workspace with optional fields', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Full Workspace',
          description: 'A workspace with all fields',
          repositories: ['repo-1', 'repo-2'],
          settings: { theme: 'dark', autoSave: true },
        });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Full Workspace');
      expect(response.body.description).toBe('A workspace with all fields');
      expect(response.body.repositories).toEqual(['repo-1', 'repo-2']);
      expect(response.body.settings).toEqual({ theme: 'dark', autoSave: true });
    });

    it('should create workspace with sessionState', async () => {
      const sessionState = {
        currentCamera: { x: 10, y: 20, z: 30 },
        selectedNodes: ['node1', 'node2'],
        filters: { language: 'typescript' },
      };

      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Workspace with Session',
          sessionState,
        });

      expect(response.status).toBe(201);
      expect(response.body.sessionState).toEqual(sessionState);
    });

    it('should trim workspace name', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '  Trimmed Workspace  ' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Trimmed Workspace');
    });

    it('should return 400 when name is missing', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.type).toContain('validation');
      expect(response.body.detail).toContain('name is required');
    });

    it('should return 400 when name is empty after trimming', async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('name is required');
    });

    it('should return 400 when name exceeds 100 characters', async () => {
      const longName = 'a'.repeat(101);
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: longName });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('100 characters or less');
    });
  });

  describe('GET /api/workspaces', () => {
    let workspace1Id: string;
    let workspace2Id: string;

    beforeEach(async () => {
      // Create two workspaces for user 1
      const res1 = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Workspace 1' });
      workspace1Id = res1.body.id;

      const res2 = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Workspace 2' });
      workspace2Id = res2.body.id;

      // Create one workspace for user 2
      await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken2}`)
        .send({ name: 'User 2 Workspace' });
    });

    it('should list all workspaces for authenticated user', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body).toHaveProperty('workspaces');
      expect(response.body.workspaces).toHaveLength(2);
      expect(response.body.workspaces[0]).toHaveProperty('id');
      expect(response.body.workspaces[0]).toHaveProperty('name');
    });

    it('should only show workspaces where user is a member', async () => {
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(1);
      expect(response.body.workspaces[0].name).toBe('User 2 Workspace');
    });

    it('should return empty list for user with no workspaces', async () => {
      const newUserToken = generateToken({ userId: 'new-user', email: 'new@example.com' });
      const response = await request(app)
        .get('/api/workspaces')
        .set('Authorization', `Bearer ${newUserToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.workspaces).toEqual([]);
    });
  });

  describe('GET /api/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Workspace' });
      workspaceId = response.body.id;
    });

    it('should return workspace for member', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', workspaceId);
      expect(response.body).toHaveProperty('name', 'Test Workspace');
      expect(response.body).toHaveProperty('members');
    });

    it('should return 403 for non-member', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(403);
      expect(response.body.type).toContain('forbidden');
      expect(response.body.detail).toContain('do not have permission');
    });

    it('should return 404 for non-existent workspace', async () => {
      const response = await request(app)
        .get('/api/workspaces/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
      expect(response.body.title).toBe('Workspace not found');
    });
  });

  describe('PUT /api/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Original Name',
          description: 'Original Description',
          repositories: ['repo-1'],
          settings: { theme: 'light' },
        });
      workspaceId = response.body.id;
    });

    it('should update workspace name', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated Name' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Name');
      expect(response.body.description).toBe('Original Description');
    });

    it('should update workspace description', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ description: 'New Description' });

      expect(response.status).toBe(200);
      expect(response.body.description).toBe('New Description');
    });

    it('should update workspace repositories', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ repositories: ['repo-1', 'repo-2', 'repo-3'] });

      expect(response.status).toBe(200);
      expect(response.body.repositories).toEqual(['repo-1', 'repo-2', 'repo-3']);
    });

    it('should update workspace settings', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ settings: { theme: 'dark', autoSave: true } });

      expect(response.status).toBe(200);
      expect(response.body.settings).toEqual({ theme: 'dark', autoSave: true });
    });

    it('should update workspace sessionState', async () => {
      const sessionState = {
        currentCamera: { x: 5, y: 10, z: 15 },
        selectedNodes: ['node-a', 'node-b'],
      };

      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ sessionState });

      expect(response.status).toBe(200);
      expect(response.body.sessionState).toEqual(sessionState);
    });

    it('should update multiple fields at once', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name',
          description: 'New Description',
          repositories: ['repo-2'],
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('New Name');
      expect(response.body.description).toBe('New Description');
      expect(response.body.repositories).toEqual(['repo-2']);
    });

    it('should trim updated workspace name', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '  Trimmed  ' });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Trimmed');
    });

    it('should return 400 when name is empty', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: '   ' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('cannot be empty');
    });

    it('should return 400 when name exceeds 100 characters', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'a'.repeat(101) });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('100 characters or less');
    });

    it('should return 404 when workspace not found', async () => {
      const response = await request(app)
        .put('/api/workspaces/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
    });
  });

  describe('DELETE /api/workspaces/:id', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Delete' });
      workspaceId = response.body.id;
    });

    it('should delete workspace', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);
    });

    it('should return 404 when workspace not found', async () => {
      const response = await request(app)
        .delete('/api/workspaces/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.type).toContain('not-found');
    });

    it('should invalidate cache after deletion', async () => {
      const invalidate = vi.mocked(cacheUtils.invalidate);
      invalidate.mockClear(); // Clear any previous calls

      await request(app)
        .delete(`/api/workspaces/${workspaceId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(invalidate).toHaveBeenCalled();
    });
  });

  describe('POST /api/workspaces/:id/members', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Shared Workspace' });
      workspaceId = response.body.id;
    });

    it('should add member with admin role', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-456', role: 'admin' });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('members');
      expect(response.body.members).toHaveLength(2);
      expect(response.body.members[1]).toMatchObject({
        userId: 'user-456',
        role: 'admin',
      });
    });

    it('should add member with editor role', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-789', role: 'editor' });

      expect(response.status).toBe(201);
      expect(response.body.members[1].role).toBe('editor');
    });

    it('should add member with viewer role', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-789', role: 'viewer' });

      expect(response.status).toBe(201);
      expect(response.body.members[1].role).toBe('viewer');
    });

    it('should return 400 when userId is missing', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('User ID is required');
    });

    it('should return 400 when role is missing', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-456' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('Valid role is required');
    });

    it('should return 400 when role is invalid', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-456', role: 'superadmin' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('admin, editor, or viewer');
    });
  });

  describe('DELETE /api/workspaces/:id/members/:userId', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Shared Workspace' });
      workspaceId = response.body.id;

      // Add a member
      await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-456', role: 'editor' });
    });

    it('should remove member', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${workspaceId}/members/user-456`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('members');
      expect(response.body.members).toHaveLength(1);
      expect(response.body.members[0].userId).toBe('user-123');
    });
  });

  describe('PUT /api/workspaces/:id/members/:userId', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Shared Workspace' });
      workspaceId = response.body.id;

      // Add a member
      await request(app)
        .post(`/api/workspaces/${workspaceId}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ userId: 'user-456', role: 'viewer' });
    });

    it('should update member role from viewer to editor', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}/members/user-456`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'editor' });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('members');
      const member = response.body.members.find((m: { userId: string }) => m.userId === 'user-456');
      expect(member.role).toBe('editor');
    });

    it('should update member role from viewer to admin', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}/members/user-456`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'admin' });

      expect(response.status).toBe(200);
      const member = response.body.members.find((m: { userId: string }) => m.userId === 'user-456');
      expect(member.role).toBe('admin');
    });

    it('should return 400 when role is missing', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}/members/user-456`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('Valid role is required');
    });

    it('should return 400 when role is invalid', async () => {
      const response = await request(app)
        .put(`/api/workspaces/${workspaceId}/members/user-456`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ role: 'invalid' });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('admin, editor, or viewer');
    });
  });

  describe('POST /api/workspaces/:workspaceId/codebases', () => {
    let workspaceId: string;

    beforeEach(async () => {
      const response = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Workspace' });
      workspaceId = response.body.id;
    });

    it('should import a local codebase', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: '/path/to/local/repo',
          type: 'local',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('codebaseId');
      expect(response.body).toHaveProperty('workspaceId', workspaceId);
      expect(response.body).toHaveProperty('source', '/path/to/local/repo');
      expect(response.body).toHaveProperty('type', 'local');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('importedAt');
    });

    it('should import a Git repository', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: 'https://github.com/user/repo.git',
          type: 'git',
          branch: 'main',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('codebaseId');
      expect(response.body).toHaveProperty('source', 'https://github.com/user/repo.git');
      expect(response.body).toHaveProperty('type', 'git');
      expect(response.body).toHaveProperty('branch', 'main');
      expect(response.body).toHaveProperty('status', 'pending');
    });

    it('should return 400 when source is missing', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'local',
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('Source');
    });

    it('should return 400 when type is missing', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: '/path/to/repo',
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('Type');
    });

    it('should return 400 when type is invalid', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: '/path/to/repo',
          type: 'invalid',
        });

      expect(response.status).toBe(400);
      expect(response.body.detail).toContain('local or git');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .send({
          source: '/path/to/repo',
          type: 'local',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/workspaces/:workspaceId/codebases', () => {
    let workspaceId: string;
    let codebase1Id: string;
    let codebase2Id: string;

    beforeEach(async () => {
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Workspace' });
      workspaceId = workspaceResponse.body.id;

      // Create two codebases
      const codebase1Response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: '/path/1', type: 'local' });
      codebase1Id = codebase1Response.body.codebaseId;

      const codebase2Response = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: 'https://github.com/user/repo.git', type: 'git' });
      codebase2Id = codebase2Response.body.codebaseId;
    });

    it('should list all codebases in workspace', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('count', 2);
      expect(response.body).toHaveProperty('codebases');
      expect(response.body.codebases).toHaveLength(2);
    });

    it('should return empty array for workspace with no codebases', async () => {
      // Create new empty workspace
      const emptyWorkspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Empty Workspace' });

      const response = await request(app)
        .get(`/api/workspaces/${emptyWorkspaceResponse.body.id}/codebases`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.count).toBe(0);
      expect(response.body.codebases).toHaveLength(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}/codebases`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/workspaces/:workspaceId/codebases/:codebaseId', () => {
    let workspaceId: string;
    let codebaseId: string;

    beforeEach(async () => {
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Workspace' });
      workspaceId = workspaceResponse.body.id;

      const codebaseResponse = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: '/path/to/repo', type: 'local' });
      codebaseId = codebaseResponse.body.codebaseId;
    });

    it('should get a specific codebase', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}/codebases/${codebaseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('codebaseId', codebaseId);
      expect(response.body).toHaveProperty('workspaceId', workspaceId);
      expect(response.body).toHaveProperty('source', '/path/to/repo');
    });

    it('should return 404 for non-existent codebase', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}/codebases/00000000-0000-4000-8000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get(`/api/workspaces/${workspaceId}/codebases/${codebaseId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/workspaces/:workspaceId/codebases/:codebaseId', () => {
    let workspaceId: string;
    let codebaseId: string;

    beforeEach(async () => {
      const workspaceResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Test Workspace' });
      workspaceId = workspaceResponse.body.id;

      const codebaseResponse = await request(app)
        .post(`/api/workspaces/${workspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ source: '/path/to/repo', type: 'local' });
      codebaseId = codebaseResponse.body.codebaseId;
    });

    it('should delete a codebase', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${workspaceId}/codebases/${codebaseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await request(app)
        .get(`/api/workspaces/${workspaceId}/codebases/${codebaseId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent codebase', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${workspaceId}/codebases/00000000-0000-4000-8000-000000000000`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete(`/api/workspaces/${workspaceId}/codebases/${codebaseId}`);

      expect(response.status).toBe(401);
    });
  });

  describe('RFC 7807 Error Format', () => {
    it('should return RFC 7807 format for validation errors', async () => {
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

    it('should return RFC 7807 format for not found errors', async () => {
      const response = await request(app)
        .get('/api/workspaces/00000000-0000-4000-8000-000000000000')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 404);
    });

    it('should return RFC 7807 format for forbidden errors', async () => {
      // Create workspace as user 1
      const createResponse = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Private Workspace' });

      // Try to access as user 2
      const response = await request(app)
        .get(`/api/workspaces/${createResponse.body.id}`)
        .set('Authorization', `Bearer ${authToken2}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 403);
    });

    it('should return RFC 7807 format for authentication errors', async () => {
      const response = await request(app)
        .get('/api/workspaces');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('type');
      expect(response.body).toHaveProperty('title');
      expect(response.body).toHaveProperty('status', 401);
    });
  });
});
