/**
 * Workspace Store
 *
 * State management for workspace configuration and multi-codebase support
 */

import { create } from 'zustand';
import type { Workspace, WorkspaceSettings, Repository } from '../../shared/types';

export interface CreateWorkspaceData {
  name: string;
  description?: string;
  repositories?: string[];
  settings?: Partial<WorkspaceSettings>;
}

interface WorkspaceState {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  repositories: Record<string, Repository>;

  // Actions
  createWorkspace: (data: CreateWorkspaceData) => Workspace;
  updateWorkspace: (id: string, data: Partial<Workspace>) => void;
  deleteWorkspace: (id: string) => void;
  setCurrentWorkspace: (id: string | null) => void;
  loadWorkspaces: (workspaces: Workspace[]) => void;
  addRepository: (workspaceId: string, repository: Repository) => void;
  removeRepository: (workspaceId: string, repositoryId: string) => void;
  updateRepository: (repositoryId: string, data: Partial<Repository>) => void;
  reset: () => void;
}

const DEFAULT_SETTINGS: WorkspaceSettings = {
  defaultLodLevel: 2,
  autoRefresh: false,
  collaborationEnabled: false,
};

const INITIAL_STATE = {
  workspaces: [],
  currentWorkspaceId: null,
  repositories: {},
};

/**
 * Generate unique workspace ID
 */
function generateWorkspaceId(): string {
  return `workspace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Workspace store
 */
export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...INITIAL_STATE,

  createWorkspace: (data: CreateWorkspaceData) => {
    const now = new Date().toISOString();
    const workspace: Workspace = {
      id: generateWorkspaceId(),
      name: data.name,
      ownerId: 'current-user', // Would come from auth in real app
      repositories: data.repositories || [],
      members: [],
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      createdAt: now,
      updatedAt: now,
      ...(data.description && { description: data.description }),
    };

    set((state) => ({
      workspaces: [...state.workspaces, workspace],
    }));

    return workspace;
  },

  updateWorkspace: (id: string, data: Partial<Workspace>) => {
    set((state) => ({
      workspaces: state.workspaces.map((w) =>
        w.id === id
          ? { ...w, ...data, updatedAt: new Date().toISOString() }
          : w
      ),
    }));
  },

  deleteWorkspace: (id: string) => {
    set((state) => ({
      workspaces: state.workspaces.filter((w) => w.id !== id),
      currentWorkspaceId: state.currentWorkspaceId === id ? null : state.currentWorkspaceId,
    }));
  },

  setCurrentWorkspace: (id: string | null) => {
    if (id) {
      const workspace = get().workspaces.find((w) => w.id === id);
      if (workspace) {
        set({ currentWorkspaceId: id });
        // Update last accessed time
        get().updateWorkspace(id, { lastAccessedAt: new Date().toISOString() });
      }
    } else {
      set({ currentWorkspaceId: null });
    }
  },

  loadWorkspaces: (workspaces: Workspace[]) => {
    set({ workspaces });
  },

  addRepository: (workspaceId: string, repository: Repository) => {
    set((state) => ({
      repositories: {
        ...state.repositories,
        [repository.id]: repository,
      },
      workspaces: state.workspaces.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              repositories: [...w.repositories, repository.id],
              updatedAt: new Date().toISOString(),
            }
          : w
      ),
    }));
  },

  removeRepository: (workspaceId: string, repositoryId: string) => {
    set((state) => {
      const { [repositoryId]: removed, ...rest } = state.repositories;
      return {
        repositories: rest,
        workspaces: state.workspaces.map((w) =>
          w.id === workspaceId
            ? {
                ...w,
                repositories: w.repositories.filter((id) => id !== repositoryId),
                updatedAt: new Date().toISOString(),
              }
            : w
        ),
      };
    });
  },

  updateRepository: (repositoryId: string, data: Partial<Repository>) => {
    set((state) => {
      const existing = state.repositories[repositoryId];
      if (!existing) return state;

      return {
        repositories: {
          ...state.repositories,
          [repositoryId]: {
            ...existing,
            ...data,
          },
        },
      };
    });
  },

  reset: () => {
    set(INITIAL_STATE);
  },
}));
