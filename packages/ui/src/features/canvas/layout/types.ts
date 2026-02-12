import type { Graph, Position3D } from '../../../shared/types';
import type {
  DistrictArcMetadata,
  InfrastructureZoneMetadata,
} from './engines/radialCityLayout';

/**
 * Axis-aligned bounding box in 3D space
 */
export interface BoundingBox {
  min: Position3D;
  max: Position3D;
}

/**
 * Result of a layout computation
 */
export interface LayoutResult {
  /** Computed position for each node by ID */
  positions: Map<string, Position3D>;
  /** Bounding box enclosing all positioned nodes */
  bounds: BoundingBox;
  /** Optional engine-specific metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for layout engines
 */
export interface LayoutConfig {
  /** Spacing between nodes (default varies by engine) */
  spacing?: number;
  /** Global scale multiplier (default 1) */
  scale?: number;
  /** Origin point for the layout (default {0,0,0}) */
  origin?: Position3D;
  /** Engine-specific configuration */
  [key: string]: unknown;
}

/**
 * Interface that all layout engines must implement.
 *
 * Layout engines take a graph and configuration, and produce
 * 3D positions for each node. Three engines are planned:
 * - City layout (files as buildings on a grid)
 * - Building layout (classes as floors/rooms)
 * - Cell layout (methods as organelles)
 */
export interface LayoutEngine {
  /** Unique identifier for this engine (e.g., 'city', 'building', 'cell') */
  readonly type: string;

  /**
   * Compute 3D positions for all nodes in the graph.
   *
   * @param graph - The graph to layout
   * @param config - Layout configuration
   * @returns Layout result with positions and bounds
   */
  layout(graph: Graph, config: LayoutConfig): LayoutResult;

  /**
   * Determine whether this engine can handle the given graph.
   * Used by the registry for auto-selection.
   *
   * @param graph - The graph to evaluate
   * @returns True if this engine is suitable
   */
  canHandle(graph: Graph): boolean;
}

/** Layout of a single file block within a district */
export interface BlockLayout {
  fileId: string;
  position: Position3D;
  footprint: { width: number; depth: number };
  children: { nodeId: string; localPosition: Position3D }[];
  isMerged: boolean;
}

/** Layout of a district containing file blocks */
export interface DistrictLayout {
  id: string;
  arc: DistrictArcMetadata;
  blocks: BlockLayout[];
  isCompound: boolean;
}

/** Layout of an external infrastructure zone */
export interface ExternalZoneLayout {
  zoneMetadata: InfrastructureZoneMetadata;
  nodes: { nodeId: string; position: Position3D }[];
}

/** Extended layout result with hierarchical structure */
export interface HierarchicalLayoutResult extends LayoutResult {
  districts: DistrictLayout[];
  externalZones: ExternalZoneLayout[];
}
