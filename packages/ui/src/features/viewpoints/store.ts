/**
 * Viewpoint Store
 *
 * State management for saved viewpoints
 */

import { create } from 'zustand';
import type { Viewpoint } from '../../shared/types';

export interface CreateViewpointData {
  name: string;
  description?: string;
  cameraPosition: { x: number; y: number; z: number };
  cameraTarget: { x: number; y: number; z: number };
  filters?: {
    lodLevel?: number;
    nodeTypes?: string[];
    edgeTypes?: string[];
  };
  annotations?: Array<{
    nodeId: string;
    text: string;
  }>;
}

interface ViewpointState {
  viewpoints: Viewpoint[];
  activeViewpointId: string | null;

  // Actions
  createViewpoint: (data: CreateViewpointData) => Viewpoint;
  deleteViewpoint: (id: string) => void;
  updateViewpoint: (id: string, data: Partial<Viewpoint>) => void;
  setActiveViewpoint: (id: string | null) => void;
  loadViewpoints: (viewpoints: Viewpoint[]) => void;
  reset: () => void;
}

const INITIAL_STATE = {
  viewpoints: [],
  activeViewpointId: null,
};

/**
 * Generate unique viewpoint ID
 */
function generateViewpointId(): string {
  return `viewpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Viewpoint store
 */
export const useViewpointStore = create<ViewpointState>((set) => ({
  ...INITIAL_STATE,

  createViewpoint: (data: CreateViewpointData) => {
    const now = new Date().toISOString();
    const viewpoint: Viewpoint = {
      id: generateViewpointId(),
      createdAt: now,
      updatedAt: now,
      ...data,
    };

    set((state) => ({
      viewpoints: [...state.viewpoints, viewpoint],
    }));

    return viewpoint;
  },

  deleteViewpoint: (id: string) => {
    set((state) => ({
      viewpoints: state.viewpoints.filter((v) => v.id !== id),
      activeViewpointId: state.activeViewpointId === id ? null : state.activeViewpointId,
    }));
  },

  updateViewpoint: (id: string, data: Partial<Viewpoint>) => {
    set((state) => ({
      viewpoints: state.viewpoints.map((v) =>
        v.id === id ? { ...v, ...data } : v
      ),
    }));
  },

  setActiveViewpoint: (id: string | null) => {
    set({ activeViewpointId: id });
  },

  loadViewpoints: (viewpoints: Viewpoint[]) => {
    set({ viewpoints });
  },

  reset: () => {
    set(INITIAL_STATE);
  },
}));
