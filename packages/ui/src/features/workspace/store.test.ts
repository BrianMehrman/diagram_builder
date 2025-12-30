/**
 * Workspace Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from './store';

describe('useWorkspaceStore', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it('initializes with empty state', () => {
    const { workspaces, currentWorkspaceId, repositories } =
      useWorkspaceStore.getState();

    expect(workspaces).toEqual([]);
    expect(currentWorkspaceId).toBeNull();
    expect(repositories).toEqual({});
  });

  it('creates a new workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test Workspace',
      description: 'Test description',
    });

    expect(workspace.id).toBeDefined();
    expect(workspace.name).toBe('Test Workspace');
    expect(workspace.description).toBe('Test description');
    expect(workspace.ownerId).toBe('current-user');
    expect(workspace.repositories).toEqual([]);
    expect(workspace.members).toEqual([]);
    expect(workspace.settings.defaultLodLevel).toBe(2);
    expect(workspace.createdAt).toBeDefined();
  });

  it('adds workspace to store on creation', () => {
    useWorkspaceStore.getState().createWorkspace({ name: 'Test' });

    const { workspaces } = useWorkspaceStore.getState();
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].name).toBe('Test');
  });

  it('creates workspace without description', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test Workspace',
    });

    expect(workspace.description).toBeUndefined();
  });

  it('creates workspace with custom settings', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
      settings: {
        defaultLodLevel: 3,
        autoRefresh: true,
        collaborationEnabled: true,
      },
    });

    expect(workspace.settings.defaultLodLevel).toBe(3);
    expect(workspace.settings.autoRefresh).toBe(true);
    expect(workspace.settings.collaborationEnabled).toBe(true);
  });

  it('updates a workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Original Name',
    });

    useWorkspaceStore.getState().updateWorkspace(workspace.id, {
      name: 'Updated Name',
    });

    const { workspaces } = useWorkspaceStore.getState();
    expect(workspaces[0].name).toBe('Updated Name');
    expect(workspaces[0].updatedAt).toBeDefined();
  });

  it('deletes a workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    useWorkspaceStore.getState().deleteWorkspace(workspace.id);

    const { workspaces } = useWorkspaceStore.getState();
    expect(workspaces).toHaveLength(0);
  });

  it('sets current workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    useWorkspaceStore.getState().setCurrentWorkspace(workspace.id);

    const { currentWorkspaceId } = useWorkspaceStore.getState();
    expect(currentWorkspaceId).toBe(workspace.id);
  });

  it('updates lastAccessedAt when setting current workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    useWorkspaceStore.getState().setCurrentWorkspace(workspace.id);

    const { workspaces } = useWorkspaceStore.getState();
    expect(workspaces[0].lastAccessedAt).toBeDefined();
  });

  it('clears current workspace when deleting active workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    useWorkspaceStore.getState().setCurrentWorkspace(workspace.id);
    useWorkspaceStore.getState().deleteWorkspace(workspace.id);

    const { currentWorkspaceId } = useWorkspaceStore.getState();
    expect(currentWorkspaceId).toBeNull();
  });

  it('loads workspaces', () => {
    const workspaces = [
      {
        id: 'ws-1',
        name: 'Workspace 1',
        ownerId: 'user1',
        repositories: [],
        members: [],
        settings: {
          defaultLodLevel: 2,
          autoRefresh: false,
          collaborationEnabled: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'ws-2',
        name: 'Workspace 2',
        ownerId: 'user1',
        repositories: [],
        members: [],
        settings: {
          defaultLodLevel: 2,
          autoRefresh: false,
          collaborationEnabled: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    useWorkspaceStore.getState().loadWorkspaces(workspaces);

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(2);
    expect(state.workspaces[0].name).toBe('Workspace 1');
  });

  it('adds repository to workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    const repository = {
      id: 'repo-1',
      name: 'test-repo',
      branch: 'main',
      nodeCount: 100,
      edgeCount: 50,
      status: 'ready' as const,
    };

    useWorkspaceStore.getState().addRepository(workspace.id, repository);

    const { workspaces, repositories } = useWorkspaceStore.getState();
    expect(workspaces[0].repositories).toContain('repo-1');
    expect(repositories['repo-1']).toEqual(repository);
  });

  it('removes repository from workspace', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    const repository = {
      id: 'repo-1',
      name: 'test-repo',
      branch: 'main',
      nodeCount: 100,
      edgeCount: 50,
      status: 'ready' as const,
    };

    useWorkspaceStore.getState().addRepository(workspace.id, repository);
    useWorkspaceStore.getState().removeRepository(workspace.id, 'repo-1');

    const { workspaces, repositories } = useWorkspaceStore.getState();
    expect(workspaces[0].repositories).not.toContain('repo-1');
    expect(repositories['repo-1']).toBeUndefined();
  });

  it('updates repository', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test',
    });

    const repository = {
      id: 'repo-1',
      name: 'test-repo',
      branch: 'main',
      nodeCount: 100,
      edgeCount: 50,
      status: 'ready' as const,
    };

    useWorkspaceStore.getState().addRepository(workspace.id, repository);
    useWorkspaceStore.getState().updateRepository('repo-1', {
      nodeCount: 150,
    });

    const { repositories } = useWorkspaceStore.getState();
    expect(repositories['repo-1'].nodeCount).toBe(150);
  });

  it('resets store', () => {
    useWorkspaceStore.getState().createWorkspace({ name: 'Test' });
    useWorkspaceStore.getState().reset();

    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toEqual([]);
    expect(state.currentWorkspaceId).toBeNull();
    expect(state.repositories).toEqual({});
  });
});
