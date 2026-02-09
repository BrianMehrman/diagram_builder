import type { LayoutEngine, LayoutConfig, LayoutResult } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';
import { boundsFromPositions } from '../bounds';

/**
 * City layout configuration
 */
export interface CityLayoutConfig extends LayoutConfig {
  /** Size of each building footprint (default 2) */
  buildingSize?: number;
  /** Width of streets between buildings (default 1) */
  streetWidth?: number;
  /** Height per abstraction depth level (default 3) */
  floorHeight?: number;
  /** Gap between directory neighborhoods (default 5) */
  neighborhoodGap?: number;
  /** Radius of the external libraries ring (default 50) */
  externalRingRadius?: number;
}

/**
 * City layout engine positions file-level nodes as buildings on a 2D grid.
 *
 * - Files are arranged on the X-Z plane in a grid pattern
 * - Y position = abstraction depth * floorHeight (deeper = taller)
 * - Files grouped by directory (neighborhoods) with gaps between groups
 * - External libraries positioned in a ring around the city
 * - Deterministic output via alphabetical sorting
 */
export class CityLayoutEngine implements LayoutEngine {
  readonly type = 'city';

  layout(graph: Graph, config: CityLayoutConfig = {}): LayoutResult {
    const {
      buildingSize = 2,
      streetWidth = 1,
      floorHeight = 3,
      neighborhoodGap = 5,
      externalRingRadius = 50,
    } = config;

    const positions = new Map<string, Position3D>();

    // Separate internal file nodes from external nodes
    const fileNodes = graph.nodes.filter(
      (n) => n.type === 'file' && !n.isExternal
    );
    const externalNodes = graph.nodes.filter((n) => n.isExternal === true);

    // Group files by directory (neighborhoods)
    const neighborhoods = this.groupByDirectory(fileNodes);

    // Layout neighborhoods on the X-Z grid
    const gridSpacing = buildingSize + streetWidth;
    let offsetX = 0;

    for (const [, nodes] of neighborhoods) {
      const sorted = [...nodes].sort((a, b) => (a.label ?? '').localeCompare(b.label ?? ''));
      const gridSize = Math.max(1, Math.ceil(Math.sqrt(sorted.length)));

      for (let i = 0; i < sorted.length; i++) {
        const node = sorted[i];
        const col = i % gridSize;
        const row = Math.floor(i / gridSize);
        const depth = node.depth ?? 0;

        positions.set(node.id, {
          x: offsetX + col * gridSpacing,
          y: depth * floorHeight,
          z: row * gridSpacing,
        });
      }

      offsetX += gridSize * gridSpacing + neighborhoodGap;
    }

    // Layout external libraries in a ring
    if (externalNodes.length > 0) {
      const sorted = [...externalNodes].sort((a, b) =>
        (a.label ?? '').localeCompare(b.label ?? '')
      );
      const angleStep = (2 * Math.PI) / sorted.length;

      for (let i = 0; i < sorted.length; i++) {
        const angle = i * angleStep;
        positions.set(sorted[i].id, {
          x: Math.cos(angle) * externalRingRadius,
          y: 0,
          z: Math.sin(angle) * externalRingRadius,
        });
      }
    }

    // Compute bounding box
    const allPositions = Array.from(positions.values());
    const bounds = boundsFromPositions(allPositions);

    return {
      positions,
      bounds,
      metadata: {
        buildingSize,
        floorHeight,
        neighborhoodCount: neighborhoods.size,
        externalCount: externalNodes.length,
        groundPlane: {
          y: 0,
          width: bounds.max.x - bounds.min.x,
          depth: bounds.max.z - bounds.min.z,
        },
      },
    };
  }

  canHandle(graph: Graph): boolean {
    return graph.nodes.some((n) => n.type === 'file');
  }

  /**
   * Groups file nodes by their containing directory.
   * Uses metadata.path if available, falls back to label.
   * Sorted alphabetically by directory name for determinism.
   */
  private groupByDirectory(nodes: GraphNode[]): Map<string, GraphNode[]> {
    const groups = new Map<string, GraphNode[]>();

    for (const node of nodes) {
      const filePath = (node.metadata?.path as string) ?? node.label ?? '';
      const dir = this.extractDirectory(filePath);

      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(node);
    }

    // Sort directories alphabetically for deterministic layout
    return new Map(
      [...groups.entries()].sort(([a], [b]) => a.localeCompare(b))
    );
  }

  /**
   * Extracts the directory portion from a file path.
   */
  private extractDirectory(filePath: string): string {
    const lastSlash = filePath.lastIndexOf('/');
    return lastSlash >= 0 ? filePath.substring(0, lastSlash) : 'root';
  }
}
