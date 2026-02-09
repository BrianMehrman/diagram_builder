import type { LayoutEngine, LayoutConfig, LayoutResult, BoundingBox } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';

/**
 * Building layout configuration
 */
export interface BuildingLayoutConfig extends LayoutConfig {
  /** Height of each floor (default 4) */
  floorHeight?: number;
  /** Size of each room (default 2) */
  roomSize?: number;
  /** Spacing between rooms (default 1) */
  roomSpacing?: number;
  /** Padding around the building walls (default 2) */
  wallPadding?: number;
}

/**
 * Building layout engine positions a file's children as floors and rooms.
 *
 * - File = building
 * - Classes = separate floors, stacked vertically
 * - File-level functions = rooms on ground floor
 * - Rooms arranged in a grid within each floor
 * - Deterministic via alphabetical sorting
 */
export class BuildingLayoutEngine implements LayoutEngine {
  readonly type = 'building';

  layout(graph: Graph, config: BuildingLayoutConfig = {}): LayoutResult {
    const positions = new Map<string, Position3D>();
    const {
      floorHeight = 4,
      roomSize = 2,
      roomSpacing = 1,
      wallPadding = 2,
    } = config;

    // Find the file node (building)
    const fileNode = graph.nodes.find((n) => n.type === 'file' && !n.isExternal);
    if (!fileNode) {
      return {
        positions,
        bounds: { min: { x: 0, y: 0, z: 0 }, max: { x: 0, y: 0, z: 0 } },
      };
    }

    // Building origin from file node's position or default
    const origin = fileNode.position ?? { x: 0, y: 0, z: 0 };
    positions.set(fileNode.id, { ...origin });

    // Get direct children of the file
    const children = graph.nodes.filter((n) => n.parentId === fileNode.id);
    const classes = children
      .filter((n) => n.type === 'class')
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
    const fileLevelItems = children
      .filter((n) => n.type !== 'class')
      .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));

    let currentFloor = 0;
    let maxWidth = 0;
    let maxDepthZ = 0;

    // Ground floor: file-level functions/variables
    if (fileLevelItems.length > 0) {
      const floorResult = this.layoutFloor(
        fileLevelItems, origin, currentFloor * floorHeight, roomSize, roomSpacing
      );
      for (const [id, pos] of floorResult.positions) {
        positions.set(id, pos);
      }
      maxWidth = Math.max(maxWidth, floorResult.width);
      maxDepthZ = Math.max(maxDepthZ, floorResult.depth);
      currentFloor++;
    }

    // Upper floors: one per class
    for (const classNode of classes) {
      const floorY = currentFloor * floorHeight;

      // Position class node at floor level
      positions.set(classNode.id, {
        x: origin.x,
        y: origin.y + floorY,
        z: origin.z,
      });

      // Layout class children (methods) as rooms on this floor
      const classChildren = graph.nodes
        .filter((n) => n.parentId === classNode.id)
        .sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));

      if (classChildren.length > 0) {
        const floorResult = this.layoutFloor(
          classChildren, origin, floorY, roomSize, roomSpacing
        );
        for (const [id, pos] of floorResult.positions) {
          positions.set(id, pos);
        }
        maxWidth = Math.max(maxWidth, floorResult.width);
        maxDepthZ = Math.max(maxDepthZ, floorResult.depth);
      }

      currentFloor++;
    }

    const totalHeight = currentFloor * floorHeight;

    const bounds: BoundingBox = {
      min: {
        x: origin.x - wallPadding,
        y: origin.y,
        z: origin.z - wallPadding,
      },
      max: {
        x: origin.x + Math.max(maxWidth, roomSize) + wallPadding,
        y: origin.y + totalHeight,
        z: origin.z + Math.max(maxDepthZ, roomSize) + wallPadding,
      },
    };

    return {
      positions,
      bounds,
      metadata: {
        floorCount: currentFloor,
        floorHeight,
        buildingWidth: maxWidth + wallPadding * 2,
        buildingDepth: maxDepthZ + wallPadding * 2,
        totalHeight,
        floors: classes.map((c, i) => ({
          classId: c.id,
          floorIndex: fileLevelItems.length > 0 ? i + 1 : i,
          y: (fileLevelItems.length > 0 ? i + 1 : i) * floorHeight,
        })),
      },
    };
  }

  canHandle(graph: Graph): boolean {
    return graph.nodes.some(
      (n) => n.parentId !== undefined && (n.type === 'class' || n.type === 'function')
    );
  }

  /**
   * Lays out nodes in a grid on a single floor.
   */
  private layoutFloor(
    nodes: GraphNode[],
    origin: Position3D,
    floorY: number,
    roomSize: number,
    roomSpacing: number
  ): { positions: Map<string, Position3D>; width: number; depth: number } {
    const positions = new Map<string, Position3D>();
    const gridSize = Math.max(1, Math.ceil(Math.sqrt(nodes.length)));
    const spacing = roomSize + roomSpacing;

    for (let i = 0; i < nodes.length; i++) {
      const col = i % gridSize;
      const row = Math.floor(i / gridSize);

      positions.set(nodes[i].id, {
        x: origin.x + col * spacing + roomSize / 2,
        y: origin.y + floorY + roomSize / 2,
        z: origin.z + row * spacing + roomSize / 2,
      });
    }

    return {
      positions,
      width: gridSize * spacing,
      depth: Math.ceil(nodes.length / gridSize) * spacing,
    };
  }
}
