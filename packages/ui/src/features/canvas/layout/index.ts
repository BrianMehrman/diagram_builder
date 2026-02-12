// Types
export type {
  BoundingBox,
  LayoutResult,
  LayoutConfig,
  LayoutEngine,
  BlockLayout,
  DistrictLayout,
  HierarchicalLayoutResult,
  ExternalZoneLayout,
} from './types';

// Hierarchical helpers
export { flattenHierarchicalLayout } from './hierarchicalUtils';

// Registry
export { LayoutRegistry, layoutRegistry } from './registry';

// BoundingBox helpers
export {
  boundsCenter,
  boundsSize,
  boundsContains,
  mergeBounds,
  boundsFromPositions,
} from './bounds';

// Engines
export { CityLayoutEngine } from './engines/cityLayout';
export type { CityLayoutConfig } from './engines/cityLayout';
export { BuildingLayoutEngine } from './engines/buildingLayout';
export type { BuildingLayoutConfig } from './engines/buildingLayout';
export { CellLayoutEngine } from './engines/cellLayout';
export type { CellLayoutConfig } from './engines/cellLayout';
export { RadialCityLayoutEngine } from './engines/radialCityLayout';
export type { RadialCityLayoutConfig } from './engines/radialCityLayout';

// Block layout utilities
export {
  calculateBlockFootprint,
  placeChildrenInGrid,
  buildFileBlockHierarchy,
  positionBlocksInArc,
} from './engines/blockLayoutUtils';

// Proximity refinement utilities
export { refineDistrictProximity, hashSeed, createSeededRng } from './engines/proximityRefinement';
