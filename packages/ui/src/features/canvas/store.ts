/**
 * Canvas Store
 *
 * Zustand store for canvas state management (camera, selection, etc.)
 */

import { create } from 'zustand';
import type { Position3D, GraphNode } from '../../shared/types';

/**
 * Camera state
 */
export interface CameraState {
  position: Position3D;
  target: Position3D;
  zoom: number;
}

/**
 * Control mode
 */
export type ControlMode = 'orbit' | 'fly';

/**
 * View mode for city-to-cell navigation
 */
export type ViewMode = 'city' | 'building' | 'cell';

/**
 * Layer name for visibility toggling
 */
export type LayerName = 'aboveGround' | 'underground';

/**
 * Layer visibility state
 */
export interface VisibleLayers {
  aboveGround: boolean;
  underground: boolean;
}

/**
 * Height encoding metric for building height
 */
export type HeightEncoding = 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn';

/**
 * City version feature flag
 */
export type CityVersion = 'v1' | 'v2';

/**
 * Atmosphere overlay toggles
 */
export interface AtmosphereOverlays {
  cranes: boolean;
  smog: boolean;
  lighting: boolean;
  deprecated: boolean;
}

/**
 * Edge tier visibility toggles
 */
export interface EdgeTierVisibility {
  crossDistrict: boolean;
  inheritance: boolean;
}

/**
 * City settings namespace — forward-planned state for Phases 1-4
 */
export interface CitySettings {
  heightEncoding: HeightEncoding;
  transitMapMode: boolean;
  atmosphereOverlays: AtmosphereOverlays;
  edgeTierVisibility: EdgeTierVisibility;
  cityVersion: CityVersion;
}

/**
 * Atmosphere overlay key
 */
export type AtmosphereOverlayKey = keyof AtmosphereOverlays;

/**
 * Edge tier key
 */
export type EdgeTierKey = keyof EdgeTierVisibility;

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

  // Control mode
  controlMode: ControlMode;
  setControlMode: (mode: ControlMode) => void;
  toggleControlMode: () => void;

  // Selection state
  selectedNodeId: string | null;
  selectNode: (nodeId: string | null) => void;

  // Hover state
  hoveredNodeId: string | null;
  setHoveredNode: (nodeId: string | null) => void;

  // Highlighted node state (for arrival feedback)
  highlightedNodeId: string | null;
  setHighlightedNode: (nodeId: string | null) => void;

  // Flight state (for breadcrumb updates during flight)
  isFlying: boolean;
  flightTargetNodeId: string | null;
  setFlightState: (isFlying: boolean, targetNodeId?: string | null) => void;

  // LOD level
  lodLevel: number;
  setLodLevel: (level: number) => void;

  // View mode (city-to-cell navigation)
  viewMode: ViewMode;
  focusedNodeId: string | null;
  focusHistory: string[];
  setViewMode: (mode: ViewMode, focusedNodeId?: string) => void;
  enterNode: (nodeId: string, nodeType: GraphNode['type']) => void;
  exitToParent: () => void;
  resetToCity: () => void;

  // Pending camera flight — set by any component, consumed by WorkspacePage
  pendingFlyToNodeId: string | null;
  requestFlyToNode: (nodeId: string | null) => void;

  // Layout positions (computed by view renderers)
  layoutPositions: Map<string, Position3D>;
  setLayoutPositions: (positions: Map<string, Position3D>) => void;

  // X-ray mode
  isXRayMode: boolean;
  xrayOpacity: number;
  toggleXRay: () => void;

  // Underground mode
  isUndergroundMode: boolean;
  toggleUnderground: () => void;

  // Flow animation (underground tunnel particles)
  showFlowAnimation: boolean;
  toggleFlowAnimation: () => void;

  // Layout density (radial layout spacing multiplier)
  layoutDensity: number;
  setLayoutDensity: (density: number) => void;

  // Layer visibility
  visibleLayers: VisibleLayers;
  toggleLayer: (layer: LayerName) => void;

  // City settings (forward-planned state for Phases 1-4)
  citySettings: CitySettings;
  setCityVersion: (version: CityVersion) => void;
  setHeightEncoding: (encoding: HeightEncoding) => void;
  toggleTransitMapMode: () => void;
  toggleAtmosphereOverlay: (key: AtmosphereOverlayKey) => void;
  toggleEdgeTierVisibility: (key: EdgeTierKey) => void;

  // Reset to defaults
  reset: () => void;
}

/**
 * Default city settings
 */
const DEFAULT_CITY_SETTINGS: CitySettings = {
  heightEncoding: 'methodCount',
  transitMapMode: false,
  atmosphereOverlays: {
    cranes: false,
    smog: false,
    lighting: false,
    deprecated: false,
  },
  edgeTierVisibility: {
    crossDistrict: true,
    inheritance: true,
  },
  cityVersion: 'v1',
};

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

  // Control mode
  controlMode: 'orbit',
  setControlMode: (mode) => set({ controlMode: mode }),
  toggleControlMode: () =>
    set((state) => ({
      controlMode: state.controlMode === 'orbit' ? 'fly' : 'orbit',
    })),

  // Selection state
  selectedNodeId: null,
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  // Hover state
  hoveredNodeId: null,
  setHoveredNode: (nodeId) => set({ hoveredNodeId: nodeId }),

  // Highlighted node state (for arrival feedback)
  highlightedNodeId: null,
  setHighlightedNode: (nodeId) => set({ highlightedNodeId: nodeId }),

  // Flight state (for breadcrumb updates during flight)
  isFlying: false,
  flightTargetNodeId: null,
  setFlightState: (isFlying, targetNodeId = null) =>
    set({ isFlying, flightTargetNodeId: targetNodeId }),

  // LOD level (default to 1 = city level; LOD calculator drives up on zoom)
  lodLevel: 1,
  setLodLevel: (level) => set({ lodLevel: level }),

  // View mode (city-to-cell navigation)
  viewMode: 'city' as ViewMode,
  focusedNodeId: null,
  focusHistory: [] as string[],

  setViewMode: (mode, focusedNodeId) =>
    set({ viewMode: mode, focusedNodeId: focusedNodeId ?? null }),

  enterNode: (nodeId, nodeType) => {
    let newMode: ViewMode;
    if (nodeType === 'file') {
      newMode = 'building';
    } else if (nodeType === 'class') {
      newMode = 'cell';
    } else {
      return; // Can't enter this node type
    }

    set((state) => ({
      viewMode: newMode,
      focusedNodeId: nodeId,
      focusHistory: state.focusedNodeId
        ? [...state.focusHistory, state.focusedNodeId]
        : state.focusHistory,
    }));
  },

  exitToParent: () =>
    set((state) => {
      if (state.focusHistory.length === 0) {
        return {
          viewMode: 'city' as ViewMode,
          focusedNodeId: null,
          focusHistory: [],
        };
      }

      const parentId = state.focusHistory[state.focusHistory.length - 1] ?? null;
      return {
        viewMode: parentId ? ('building' as ViewMode) : ('city' as ViewMode),
        focusedNodeId: parentId,
        focusHistory: state.focusHistory.slice(0, -1),
      };
    }),

  resetToCity: () =>
    set({
      viewMode: 'city' as ViewMode,
      focusedNodeId: null,
      focusHistory: [],
    }),

  // Pending camera flight
  pendingFlyToNodeId: null,
  requestFlyToNode: (nodeId) => set({ pendingFlyToNodeId: nodeId }),

  // Layout positions (computed by view renderers)
  layoutPositions: new Map<string, Position3D>(),
  setLayoutPositions: (positions) => set({ layoutPositions: positions }),

  // X-ray mode
  isXRayMode: false,
  xrayOpacity: 0.05,
  toggleXRay: () => set((state) => ({ isXRayMode: !state.isXRayMode })),

  // Underground mode
  isUndergroundMode: false,
  toggleUnderground: () =>
    set((state) => ({ isUndergroundMode: !state.isUndergroundMode })),

  // Flow animation
  showFlowAnimation: false,
  toggleFlowAnimation: () =>
    set((state) => ({ showFlowAnimation: !state.showFlowAnimation })),

  // Layout density (radial layout spacing multiplier)
  layoutDensity: 1.0,
  setLayoutDensity: (density) => set({ layoutDensity: density }),

  // Layer visibility
  visibleLayers: { aboveGround: true, underground: true },
  toggleLayer: (layer) =>
    set((state) => {
      const updated = { ...state.visibleLayers, [layer]: !state.visibleLayers[layer] };
      // Sync underground layer with existing isUndergroundMode for backwards compatibility
      if (layer === 'underground') {
        return { visibleLayers: updated, isUndergroundMode: updated.underground };
      }
      return { visibleLayers: updated };
    }),

  // City settings
  citySettings: { ...DEFAULT_CITY_SETTINGS },
  setCityVersion: (version) =>
    set((state) => ({
      citySettings: { ...state.citySettings, cityVersion: version },
    })),
  setHeightEncoding: (encoding) =>
    set((state) => ({
      citySettings: { ...state.citySettings, heightEncoding: encoding },
    })),
  toggleTransitMapMode: () =>
    set((state) => ({
      citySettings: { ...state.citySettings, transitMapMode: !state.citySettings.transitMapMode },
    })),
  toggleAtmosphereOverlay: (key) =>
    set((state) => ({
      citySettings: {
        ...state.citySettings,
        atmosphereOverlays: {
          ...state.citySettings.atmosphereOverlays,
          [key]: !state.citySettings.atmosphereOverlays[key],
        },
      },
    })),
  toggleEdgeTierVisibility: (key) =>
    set((state) => ({
      citySettings: {
        ...state.citySettings,
        edgeTierVisibility: {
          ...state.citySettings.edgeTierVisibility,
          [key]: !state.citySettings.edgeTierVisibility[key],
        },
      },
    })),

  // Reset
  reset: () =>
    set({
      camera: DEFAULT_CAMERA,
      controlMode: 'orbit',
      selectedNodeId: null,
      hoveredNodeId: null,
      highlightedNodeId: null,
      isFlying: false,
      flightTargetNodeId: null,
      pendingFlyToNodeId: null,
      lodLevel: 1,
      viewMode: 'city' as ViewMode,
      focusedNodeId: null,
      focusHistory: [],
      layoutPositions: new Map<string, Position3D>(),
      isXRayMode: false,
      xrayOpacity: 0.05,
      isUndergroundMode: false,
      showFlowAnimation: false,
      layoutDensity: 1.0,
      visibleLayers: { aboveGround: true, underground: true },
      citySettings: { ...DEFAULT_CITY_SETTINGS },
    }),
}));
