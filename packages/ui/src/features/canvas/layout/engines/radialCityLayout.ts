import type { LayoutEngine, LayoutConfig, LayoutResult } from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';
import { boundsFromPositions } from '../bounds';
import {
  calculateRingRadius,
  assignDistrictArcs,
  positionNodesInArc,
  calculateEntryPointPosition,
  distributeDistrictsAcrossRings,
} from './radialLayoutUtils';

/**
 * Metadata for a single district arc in the radial layout.
 * Consumed by DistrictGround component for rendering ground planes.
 */
export interface DistrictArcMetadata {
  /** District identifier (directory path) */
  id: string;
  /** Start angle of the arc in radians */
  arcStart: number;
  /** End angle of the arc in radians */
  arcEnd: number;
  /** Inner radius of the arc segment */
  innerRadius: number;
  /** Outer radius of the arc segment */
  outerRadius: number;
  /** Depth ring this arc sits on */
  ringDepth: number;
  /** Number of nodes in this district segment */
  nodeCount: number;
}

/**
 * Configuration for the radial city layout engine.
 */
export interface RadialCityLayoutConfig extends LayoutConfig {
  /** Distance between concentric depth rings (default 20) */
  ringSpacing?: number;
  /** Angular gap between adjacent district arcs in radians (default 0.05) */
  arcPadding?: number;
  /** Gap between districts on the same ring (default 5) — reserved for future refinement */
  districtGap?: number;
  /** Spacing between buildings within an arc (default 2) */
  buildingSpacing?: number;
  /** Radius of the center area for entry-point nodes (default 10) */
  centerRadius?: number;
  /** Layout density multiplier (default 1.0) — scales spacing values */
  density?: number;
}

/**
 * Radial city layout engine positions file-level nodes in concentric rings.
 *
 * - Entry-point nodes (depth 0) are placed at the center
 * - Each depth level forms a ring at increasing radius
 * - Files are grouped by directory (districts) and assigned arc segments
 * - External library nodes are positioned at the outermost ring
 * - Deterministic output via alphabetical sorting
 */
export class RadialCityLayoutEngine implements LayoutEngine {
  readonly type = 'radial-city';

  layout(graph: Graph, config: RadialCityLayoutConfig = {}): LayoutResult {
    const {
      ringSpacing = 20,
      arcPadding = 0.05,
      buildingSpacing = 2,
      centerRadius = 10,
      density = 1.0,
    } = config;

    // Apply density scaling to all spacing values
    const effectiveRingSpacing = ringSpacing * density;
    const effectiveCenterRadius = centerRadius * density;
    const effectiveBuildingSpacing = buildingSpacing * density;

    const positions = new Map<string, Position3D>();

    // Separate file nodes: internal vs external
    const fileNodes = graph.nodes.filter(
      (n) => n.type === 'file' && !n.isExternal
    );
    const externalNodes = graph.nodes.filter((n) => n.isExternal === true);

    // Find entry points (depth 0) and deeper nodes
    const entryNodes = fileNodes.filter((n) => (n.depth ?? 0) === 0);
    const deeperNodes = fileNodes.filter((n) => (n.depth ?? 0) > 0);

    // Position entry points at center
    const entryPositions = calculateEntryPointPosition(
      entryNodes.map((n) => ({ id: n.id })),
      { centerRadius: effectiveCenterRadius },
    );
    for (const ep of entryPositions) {
      positions.set(ep.id, ep.position);
    }

    // Group deeper nodes by directory (districts)
    const districts = this.groupByDirectory(deeperNodes);

    // Build nodeDepths map for distribution
    const nodeDepths = new Map<string, number>();
    for (const node of deeperNodes) {
      nodeDepths.set(node.id, node.depth ?? 0);
    }

    // Distribute districts across rings
    const districtNodes = Array.from(districts.entries()).map(([id, nodes]) => ({
      id,
      nodeIds: nodes.map((n) => n.id),
    }));

    const ringAssignments = distributeDistrictsAcrossRings(
      districtNodes,
      nodeDepths,
      { centerRadius: effectiveCenterRadius, ringSpacing: effectiveRingSpacing },
    );

    // Group ring assignments by depth for arc assignment
    const assignmentsByDepth = new Map<number, typeof ringAssignments>();
    for (const assignment of ringAssignments) {
      const depth = assignment.ringDepth;
      if (!assignmentsByDepth.has(depth)) assignmentsByDepth.set(depth, []);
      assignmentsByDepth.get(depth)!.push(assignment);
    }

    // For each depth ring, assign arcs and position nodes
    const districtArcs: DistrictArcMetadata[] = [];

    for (const [depth, assignments] of assignmentsByDepth) {
      const districtDescriptors = assignments.map((a) => ({
        id: a.districtId,
        nodeCount: a.nodeIds.length,
      }));

      const arcs = assignDistrictArcs(districtDescriptors, depth, { arcPadding });
      const radius = calculateRingRadius(depth, {
        centerRadius: effectiveCenterRadius,
        ringSpacing: effectiveRingSpacing,
      });
      const halfRing = effectiveRingSpacing / 2;

      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i]!;
        const assignment = assignments[i]!;
        const nodeRefs = assignment.nodeIds.map((id) => ({ id }));

        const positioned = positionNodesInArc(
          nodeRefs,
          arc.arcStart,
          arc.arcEnd,
          radius,
          { buildingSpacing: effectiveBuildingSpacing },
        );

        for (const pn of positioned) {
          positions.set(pn.id, pn.position);
        }

        // Collect district arc metadata for ground plane rendering
        districtArcs.push({
          id: arc.id,
          arcStart: arc.arcStart,
          arcEnd: arc.arcEnd,
          innerRadius: Math.max(0, radius - halfRing),
          outerRadius: radius + halfRing,
          ringDepth: depth,
          nodeCount: assignment.nodeIds.length,
        });
      }
    }

    // Position external nodes at outermost ring
    if (externalNodes.length > 0) {
      const maxDepth = Math.max(
        0,
        ...fileNodes.map((n) => n.depth ?? 0),
      );
      const externalRingDepth = maxDepth + 1;
      const externalRadius = calculateRingRadius(externalRingDepth, {
        centerRadius: effectiveCenterRadius,
        ringSpacing: effectiveRingSpacing,
      });

      const sorted = [...externalNodes].sort((a, b) =>
        (a.label ?? '').localeCompare(b.label ?? '')
      );
      const angleStep = (2 * Math.PI) / sorted.length;

      for (let i = 0; i < sorted.length; i++) {
        const angle = i * angleStep;
        positions.set(sorted[i]!.id, {
          x: Math.cos(angle) * externalRadius,
          y: 0,
          z: Math.sin(angle) * externalRadius,
        });
      }
    }

    // Compute bounding box
    const allPositions = Array.from(positions.values());
    const bounds = boundsFromPositions(allPositions);

    // Compute metadata
    const depthSet = new Set(fileNodes.map((n) => n.depth ?? 0));

    return {
      positions,
      bounds,
      metadata: {
        districtCount: districts.size,
        ringCount: depthSet.size,
        externalCount: externalNodes.length,
        entryPointCount: entryNodes.length,
        districtArcs,
      },
    };
  }

  canHandle(graph: Graph): boolean {
    return graph.nodes.some((n) => n.type === 'file');
  }

  /**
   * Groups file nodes by their containing directory.
   * Sorted alphabetically for deterministic output.
   */
  private groupByDirectory(nodes: GraphNode[]): Map<string, GraphNode[]> {
    const groups = new Map<string, GraphNode[]>();

    for (const node of nodes) {
      const filePath = (node.metadata?.path as string) ?? node.label ?? '';
      const dir = this.extractDirectory(filePath);

      if (!groups.has(dir)) groups.set(dir, []);
      groups.get(dir)!.push(node);
    }

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
