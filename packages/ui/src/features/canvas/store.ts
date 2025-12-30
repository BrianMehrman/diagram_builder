/**
 * Canvas Store
 *
 * Zustand store for canvas state management (camera, selection, etc.)
 */

import { create } from 'zustand';
import type { Position3D } from '../../shared/types';

/**
 * Camera state
 */
export interface CameraState {
  position: Position3D;
  target: Position3D;
  zoom: number;
}

/**
 * Canvas store state
 */
interface CanvasState {
  // Camera state
  camera: CameraState;
  setCamera: (camera: Partial<CameraState>) => void;
  setCameraPosition: (position: Position3D) => void;
  setCameraTarget: (target: Position3D) => void;
  setZoom: (zoom: number) => void;

  // Selection state
  selectedNodeId: string | null;
  selectNode: (nodeId: string | null) => void;

  // Hover state
  hoveredNodeId: string | null;
  setHoveredNode: (nodeId: string | null) => void;

  // LOD level
  lodLevel: number;
  setLodLevel: (level: number) => void;

  // Reset to defaults
  reset: () => void;
}

/**
 * Default camera state
 */
const DEFAULT_CAMERA: CameraState = {
  position: { x: 0, y: 5, z: 10 },
  target: { x: 0, y: 0, z: 0 },
  zoom: 1,
};

/**
 * Canvas store
 */
export const useCanvasStore = create<CanvasState>((set) => ({
  // Initial camera state
  camera: DEFAULT_CAMERA,

  // Camera setters
  setCamera: (camera) =>
    set((state) => ({
      camera: { ...state.camera, ...camera },
    })),

  setCameraPosition: (position) =>
    set((state) => ({
      camera: { ...state.camera, position },
    })),

  setCameraTarget: (target) =>
    set((state) => ({
      camera: { ...state.camera, target },
    })),

  setZoom: (zoom) =>
    set((state) => ({
      camera: { ...state.camera, zoom },
    })),

  // Selection state
  selectedNodeId: null,
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // Hover state
  hoveredNodeId: null,
  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  // LOD level
  lodLevel: 2,
  setLodLevel: (level) => set({ lodLevel: level }),

  // Reset
  reset: () =>
    set({
      camera: DEFAULT_CAMERA,
      selectedNodeId: null,
      hoveredNodeId: null,
      lodLevel: 2,
    }),
}));
