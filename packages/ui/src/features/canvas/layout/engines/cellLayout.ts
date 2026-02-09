import type { LayoutEngine, LayoutConfig, LayoutResult, BoundingBox } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';

export interface CellLayoutConfig extends LayoutConfig {
  membraneRadius?: number;
  organelleSpacing?: number;
  nucleusRadius?: number;
}

/**
 * Seeded random number generator for deterministic layouts.
 * Uses the node ID as seed so the same graph always produces the same layout.
 */
function seededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i);
    hash = hash & hash;
  }
  return () => {
    hash = Math.sin(hash) * 10000;
    return hash - Math.floor(hash);
  };
}

export class CellLayoutEngine implements LayoutEngine {
  readonly type = 'cell' as const;

  layout(graph: Graph, config: CellLayoutConfig): LayoutResult {
    const positions = new Map<string, Position3D>();
    const {
      membraneRadius = 10,
      organelleSpacing = 1.5,
      nucleusRadius = 3,
    } = config;

    // Find the cell node (class or file that has children)
    const cellNode = graph.nodes.find(
      (n) => n.type === 'class' || n.type === 'file'
    );
    if (!cellNode) {
      return { positions, bounds: this.emptyBounds() };
    }

    // Get child nodes (organelles)
    const organelles = graph.nodes.filter((n) => n.parentId === cellNode.id);

    // Separate by type for positioning strategy
    const stateNodes = organelles.filter((n) => n.type === 'variable');
    const methodNodes = organelles.filter((n) =>
      ['function', 'method'].includes(n.type)
    );

    // Create seeded random for this cell
    const random = seededRandom(cellNode.id);

    // Position cell at its existing position or origin
    const cellCenter: Position3D = cellNode.position ?? { x: 0, y: 0, z: 0 };
    positions.set(cellNode.id, cellCenter);

    // Position state nodes near nucleus (center)
    this.positionNucleus(stateNodes, cellCenter, nucleusRadius, random, positions);

    // Position method nodes in outer region
    this.positionOrganelles(
      methodNodes,
      cellCenter,
      nucleusRadius + organelleSpacing,
      membraneRadius - organelleSpacing,
      random,
      positions
    );

    return {
      positions,
      bounds: this.calculateBounds(cellCenter, membraneRadius),
      metadata: {
        cellCenter,
        membraneRadius,
        nucleusRadius,
      },
    };
  }

  canHandle(graph: Graph): boolean {
    return graph.nodes.some((n) => n.parentId !== undefined);
  }

  private positionNucleus(
    nodes: GraphNode[],
    center: Position3D,
    radius: number,
    random: () => number,
    positions: Map<string, Position3D>
  ): void {
    if (nodes.length === 0) return;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    nodes.forEach((node, i) => {
      const t = i / Math.max(nodes.length - 1, 1);
      const r = radius * Math.sqrt(t) * 0.8;
      const theta = i * goldenAngle;
      const phi = Math.acos(1 - 2 * (random() * 0.3 + 0.35));

      positions.set(node.id, {
        x: center.x + r * Math.sin(phi) * Math.cos(theta),
        y: center.y + r * Math.cos(phi),
        z: center.z + r * Math.sin(phi) * Math.sin(theta),
      });
    });
  }

  private positionOrganelles(
    nodes: GraphNode[],
    center: Position3D,
    innerRadius: number,
    outerRadius: number,
    random: () => number,
    positions: Map<string, Position3D>
  ): void {
    if (nodes.length === 0) return;

    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    nodes.forEach((node, i) => {
      const t = (i + 0.5) / nodes.length;
      const r = innerRadius + (outerRadius - innerRadius) * (0.3 + t * 0.7);

      const theta = i * goldenAngle;
      const phi = Math.acos(1 - 2 * t);

      // Slight randomization for organic feel
      const jitter = 0.2;
      const rx = (random() - 0.5) * jitter * r;
      const ry = (random() - 0.5) * jitter * r;
      const rz = (random() - 0.5) * jitter * r;

      positions.set(node.id, {
        x: center.x + r * Math.sin(phi) * Math.cos(theta) + rx,
        y: center.y + r * Math.cos(phi) + ry,
        z: center.z + r * Math.sin(phi) * Math.sin(theta) + rz,
      });
    });
  }

  private calculateBounds(center: Position3D, radius: number): BoundingBox {
    return {
      min: {
        x: center.x - radius,
        y: center.y - radius,
        z: center.z - radius,
      },
      max: {
        x: center.x + radius,
        y: center.y + radius,
        z: center.z + radius,
      },
    };
  }

  private emptyBounds(): BoundingBox {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }
}
