import type {
  LayoutEngine,
  LayoutConfig,
  HierarchicalLayoutResult,
  BlockLayout,
  DistrictLayout,
  ExternalZoneLayout,
} from '../types';
import type { Graph, GraphNode, Position3D } from '../../../../shared/types';
import { boundsFromPositions } from '../bounds';
import {
  calculateRingRadius,
  assignDistrictArcs,
  positionNodesInArc,
  calculateEntryPointPosition,
  distributeDistrictsAcrossRings,
} from './radialLayoutUtils';
import {
  calculateBlockFootprint,
  placeChildrenInGrid,
  buildFileBlockHierarchy,
  createCompoundBlock,
  positionBlocksInArc,
} from './blockLayoutUtils';
import { refineDistrictProximity, hashSeed } from './proximityRefinement';

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
 * Metadata for an infrastructure zone arc on the outermost ring.
 */
export interface InfrastructureZoneMetadata {
  /** Infrastructure type identifier */
  type: string;
  /** Start angle of the zone arc in radians */
  arcStart: number;
  /** End angle of the zone arc in radians */
  arcEnd: number;
  /** Number of nodes in this zone */
  nodeCount: number;
}

/**
 * Fixed zone order for consistent positioning across re-renders.
 * Zones appear in this order clockwise around the outermost ring.
 */
const ZONE_ORDER = [
  'database',
  'api',
  'queue',
  'cache',
  'auth',
  'logging',
  'filesystem',
  'general',
] as const;

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
  /** Spacing between building centers within an arc (default 6) — must exceed widest building */
  buildingSpacing?: number;
  /** Radius of the center area for entry-point nodes (default 10) */
  centerRadius?: number;
  /** Layout density multiplier (default 1.0) — scales spacing values */
  density?: number;
}

/**
 * Radial city layout engine with two-phase hierarchical layout.
 *
 * Phase A: File nodes are placed as blocks on concentric rings by depth.
 *          Entry-point file nodes (depth 0) are placed at the center.
 *          Files are grouped by directory (districts) and assigned arc segments.
 *
 * Phase B: Non-file internal nodes (classes, methods, functions) are placed
 *          inside their parent file blocks via grid layout.
 *
 * External library nodes are positioned at the outermost ring.
 * Output is a HierarchicalLayoutResult with districts and externalZones.
 */
export class RadialCityLayoutEngine implements LayoutEngine {
  readonly type = 'radial-city';

  layout(graph: Graph, config: RadialCityLayoutConfig = {}): HierarchicalLayoutResult {
    const {
      ringSpacing = 20,
      arcPadding = 0.05,
      buildingSpacing = 6,
      centerRadius = 10,
      density = 1.0,
    } = config;

    // Apply density scaling to all spacing values
    const effectiveRingSpacing = ringSpacing * density;
    const effectiveCenterRadius = centerRadius * density;
    const effectiveBuildingSpacing = buildingSpacing * density;

    const positions = new Map<string, Position3D>();

    // === Separate nodes by role ===
    const internalNodes = graph.nodes.filter((n) => !n.isExternal);
    const externalNodes = graph.nodes.filter((n) => n.isExternal === true);
    const fileNodes = internalNodes.filter((n) => n.type === 'file');
    const nonFileNodes = internalNodes.filter((n) => n.type !== 'file');

    // === Compute effective depth for file nodes ===
    const hasAnyDepth = fileNodes.some((n) => n.depth !== undefined && n.depth > 0);
    const effectiveDepths = new Map<string, number>();

    if (hasAnyDepth) {
      for (const n of fileNodes) {
        effectiveDepths.set(n.id, n.depth ?? 0);
      }
    } else {
      const paths = fileNodes.map((n) => {
        const p = (n.metadata?.path as string) ?? n.label ?? '';
        return { id: n.id, segments: p.split('/').filter(Boolean) };
      });
      if (paths.length > 0) {
        const minSegments = Math.min(...paths.map((p) => p.segments.length));
        for (const p of paths) {
          effectiveDepths.set(p.id, Math.max(0, p.segments.length - minSegments));
        }
      }
    }

    // Find entry-point file nodes (depth 0) and deeper file nodes
    const entryFileNodes = fileNodes.filter((n) => (effectiveDepths.get(n.id) ?? 0) === 0);
    const deeperFileNodes = fileNodes.filter((n) => (effectiveDepths.get(n.id) ?? 0) > 0);

    // Position entry-point files at center
    const entryPositions = calculateEntryPointPosition(
      entryFileNodes.map((n) => ({ id: n.id })),
      { centerRadius: effectiveCenterRadius },
    );
    for (const ep of entryPositions) {
      positions.set(ep.id, ep.position);
    }

    // Group deeper file nodes by directory (districts)
    const dirGroups = groupByDirectory(deeperFileNodes);

    // Build nodeDepths map for distribution
    const nodeDepths = new Map<string, number>();
    for (const node of deeperFileNodes) {
      nodeDepths.set(node.id, effectiveDepths.get(node.id) ?? 0);
    }

    // Distribute districts across rings
    const districtNodes = Array.from(dirGroups.entries()).map(([id, nodes]) => ({
      id,
      nodeIds: nodes.map((n) => n.id),
    }));

    const ringAssignments = distributeDistrictsAcrossRings(
      districtNodes,
      nodeDepths,
      { centerRadius: effectiveCenterRadius, ringSpacing: effectiveRingSpacing },
    );

    // Group ring assignments by depth
    const assignmentsByDepth = new Map<number, typeof ringAssignments>();
    for (const assignment of ringAssignments) {
      const depth = assignment.ringDepth;
      if (!assignmentsByDepth.has(depth)) assignmentsByDepth.set(depth, []);
      assignmentsByDepth.get(depth)!.push(assignment);
    }

    // Pre-compute actual radii per ring with footprint-aware expansion
    const sortedDepths = [...assignmentsByDepth.keys()].sort((a, b) => a - b);
    const actualRadii = new Map<number, number>();
    let radiusOffset = 0;

    for (const depth of sortedDepths) {
      const assignments = assignmentsByDepth.get(depth)!;
      const totalNodesOnRing = assignments.reduce((sum, a) => sum + a.nodeIds.length, 0);

      const baseRadius = calculateRingRadius(depth, {
        centerRadius: effectiveCenterRadius,
        ringSpacing: effectiveRingSpacing,
      }) + radiusOffset;

      // Use total footprint widths for minimum radius calculation
      const minRadius = (totalNodesOnRing * effectiveBuildingSpacing) / (2 * Math.PI);
      const actualRadius = Math.max(baseRadius, minRadius);

      if (actualRadius > baseRadius) {
        radiusOffset += actualRadius - baseRadius;
      }

      actualRadii.set(depth, actualRadius);
    }

    // === Build file-block hierarchy for all internal non-file nodes ===
    const allInternalForHierarchy = [...fileNodes, ...nonFileNodes];
    const { fileBlocks, orphans, cycleBreaks: _cycleBreaks } =
      buildFileBlockHierarchy(allInternalForHierarchy);

    // === Phase A: Position file blocks on rings ===
    const districtLayouts: DistrictLayout[] = [];
    const districtArcs: DistrictArcMetadata[] = [];

    for (const [depth, assignments] of assignmentsByDepth) {
      const districtDescriptors = assignments.map((a) => ({
        id: a.districtId,
        nodeCount: a.nodeIds.length,
      }));

      const arcs = assignDistrictArcs(districtDescriptors, depth, { arcPadding });
      const radius = actualRadii.get(depth)!;
      const halfRing = effectiveRingSpacing / 2;

      for (let i = 0; i < arcs.length; i++) {
        const arc = arcs[i]!;
        const assignment = assignments[i]!;

        // Check if this district qualifies for compound merging (1-3 files)
        const isCompound = assignment.nodeIds.length <= 3 && assignment.nodeIds.length >= 1;

        let blocks: BlockLayout[];

        if (isCompound && assignment.nodeIds.length <= 3) {
          // Create compound block for small districts
          const districtFileNodes = assignment.nodeIds
            .map((id) => graph.nodes.find((n) => n.id === id))
            .filter((n): n is GraphNode => n !== undefined);

          const compoundPos: Position3D = {
            x: Math.cos((arc.arcStart + arc.arcEnd) / 2) * radius,
            y: 0,
            z: Math.sin((arc.arcStart + arc.arcEnd) / 2) * radius,
          };

          const compound = createCompoundBlock(districtFileNodes, fileBlocks, compoundPos);
          blocks = [compound];

          // Set file node positions to compound center
          for (const fileId of assignment.nodeIds) {
            positions.set(fileId, compoundPos);
          }
        } else {
          // Build individual blocks with footprint-aware placement
          const blockDescriptors = assignment.nodeIds.map((id) => {
            const children = fileBlocks.get(id) ?? [];
            const childTypes = children.map((c) => c.type);
            const footprint = calculateBlockFootprint(children.length, childTypes);
            return { id, footprint };
          });

          const positioned = positionBlocksInArc(
            blockDescriptors,
            arc.arcStart,
            arc.arcEnd,
            radius,
          );

          blocks = positioned.map((p) => {
            const children = fileBlocks.get(p.id) ?? [];
            const childTypes = children.map((c) => c.type);
            const footprint = calculateBlockFootprint(children.length, childTypes);
            const placedChildren = placeChildrenInGrid(children, footprint);

            positions.set(p.id, p.position);

            return {
              fileId: p.id,
              position: p.position,
              footprint,
              children: placedChildren,
              isMerged: false,
            };
          });
        }

        // Proximity refinement
        const seed = hashSeed(assignment.nodeIds);
        blocks = refineDistrictProximity(blocks, graph.edges, seed);

        // Update positions after refinement
        for (const block of blocks) {
          if (!block.isMerged) {
            positions.set(block.fileId, block.position);
          } else {
            // For merged blocks, update all constituent file positions
            for (const fileId of assignment.nodeIds) {
              positions.set(fileId, block.position);
            }
          }
        }

        // Phase B: Place children inside blocks and publish absolute positions
        for (const block of blocks) {
          for (const child of block.children) {
            positions.set(child.nodeId, {
              x: block.position.x + child.localPosition.x,
              y: block.position.y + child.localPosition.y,
              z: block.position.z + child.localPosition.z,
            });
          }
        }

        // Handle orphan nodes for this district
        const districtOrphans = orphans.filter((o) => {
          // Check if orphan's parentId chain leads to a node in this district
          return assignment.nodeIds.some((fid) => {
            const children = fileBlocks.get(fid);
            return children?.some((c) => c.id === o.id);
          });
        });

        // Remaining orphans for this district — create homeless block
        const unassignedOrphans = orphans.filter((o) => {
          // Orphans not assigned to any file block
          for (const [, children] of fileBlocks) {
            if (children.some((c) => c.id === o.id)) return false;
          }
          return true;
        });

        // Filter to orphans that belong to this district (by directory)
        const districtDir = assignment.districtId;
        const districtOrphanNodes = unassignedOrphans.filter((o) => {
          const path = (o.metadata?.path as string) ?? o.label ?? '';
          const dir = extractDirectory(path);
          return dir === districtDir;
        });

        if (districtOrphanNodes.length > 0 || districtOrphans.length > 0) {
          const allOrphansForDistrict = [...districtOrphanNodes];
          if (allOrphansForDistrict.length > 0) {
            const orphanTypes = allOrphansForDistrict.map((o) => o.type);
            const orphanFootprint = calculateBlockFootprint(
              allOrphansForDistrict.length,
              orphanTypes,
            );
            const orphanChildren = placeChildrenInGrid(
              allOrphansForDistrict,
              orphanFootprint,
            );

            // Position orphan block at the end of the arc
            const orphanAngle = arc.arcEnd - 0.01;
            const orphanPos: Position3D = {
              x: Math.cos(orphanAngle) * radius,
              y: 0,
              z: Math.sin(orphanAngle) * radius,
            };

            const orphanBlock: BlockLayout = {
              fileId: `${assignment.districtId}/__orphans__`,
              position: orphanPos,
              footprint: orphanFootprint,
              children: orphanChildren,
              isMerged: false,
            };

            blocks.push(orphanBlock);

            // Publish orphan child positions
            for (const child of orphanChildren) {
              positions.set(child.nodeId, {
                x: orphanPos.x + child.localPosition.x,
                y: orphanPos.y + child.localPosition.y,
                z: orphanPos.z + child.localPosition.z,
              });
            }
          }
        }

        // Record district arc metadata
        districtArcs.push({
          id: arc.id,
          arcStart: arc.arcStart,
          arcEnd: arc.arcEnd,
          innerRadius: Math.max(0, radius - halfRing),
          outerRadius: radius + halfRing,
          ringDepth: depth,
          nodeCount: assignment.nodeIds.length,
        });

        districtLayouts.push({
          id: assignment.districtId,
          arc: {
            id: arc.id,
            arcStart: arc.arcStart,
            arcEnd: arc.arcEnd,
            innerRadius: Math.max(0, radius - halfRing),
            outerRadius: radius + halfRing,
            ringDepth: depth,
            nodeCount: assignment.nodeIds.length,
          },
          blocks,
          isCompound: isCompound && assignment.nodeIds.length <= 3,
        });
      }
    }

    // Handle entry-point files as blocks (Phase B for center-placed files)
    for (const entryFile of entryFileNodes) {
      const children = fileBlocks.get(entryFile.id) ?? [];
      if (children.length > 0) {
        const childTypes = children.map((c) => c.type);
        const footprint = calculateBlockFootprint(children.length, childTypes);
        const placedChildren = placeChildrenInGrid(children, footprint);
        const filePos = positions.get(entryFile.id) ?? { x: 0, y: 0, z: 0 };

        for (const child of placedChildren) {
          positions.set(child.nodeId, {
            x: filePos.x + child.localPosition.x,
            y: filePos.y + child.localPosition.y,
            z: filePos.z + child.localPosition.z,
          });
        }
      }
    }

    // Handle global orphans (not assigned to any district)
    const globalOrphans = orphans.filter((o) => {
      // Check if already positioned
      return !positions.has(o.id);
    });
    for (const orphan of globalOrphans) {
      // Place global orphans near the origin
      positions.set(orphan.id, { x: 0, y: 0, z: 0 });
    }

    // === Position external nodes at outermost ring ===
    const externalZoneLayouts: ExternalZoneLayout[] = [];
    const infrastructureZones: InfrastructureZoneMetadata[] = [];

    if (externalNodes.length > 0) {
      const maxDepth = Math.max(
        0,
        ...fileNodes.map((n) => effectiveDepths.get(n.id) ?? 0),
      );
      const externalRingDepth = maxDepth + 1;
      const baseExternalRadius = calculateRingRadius(externalRingDepth, {
        centerRadius: effectiveCenterRadius,
        ringSpacing: effectiveRingSpacing,
      }) + radiusOffset;
      const minExternalRadius = (externalNodes.length * effectiveBuildingSpacing) / (2 * Math.PI);
      const externalRadius = Math.max(baseExternalRadius, minExternalRadius);

      // Group external nodes by infrastructure type
      const zoneGroups = new Map<string, GraphNode[]>();
      for (const node of externalNodes) {
        const infraType = (node.metadata?.infrastructureType as string) ?? 'general';
        if (!zoneGroups.has(infraType)) zoneGroups.set(infraType, []);
        zoneGroups.get(infraType)!.push(node);
      }

      // Build ordered zone list
      const orderedZones: Array<{ type: string; nodes: GraphNode[] }> = [];
      for (const zoneType of ZONE_ORDER) {
        const nodes = zoneGroups.get(zoneType);
        if (nodes && nodes.length > 0) {
          orderedZones.push({ type: zoneType, nodes });
        }
      }
      for (const [zoneType, nodes] of [...zoneGroups.entries()].sort(([a], [b]) => a.localeCompare(b))) {
        if (!ZONE_ORDER.includes(zoneType as typeof ZONE_ORDER[number])) {
          orderedZones.push({ type: zoneType, nodes });
        }
      }

      // Assign arc segments proportionally with gaps between zones
      const zonePadding = arcPadding * 2;
      const totalZonePadding = zonePadding * orderedZones.length;
      const usableArc = Math.max(0, 2 * Math.PI - totalZonePadding);
      const totalExternalNodes = externalNodes.length;

      let currentAngle = 0;
      for (const zone of orderedZones) {
        const sortedNodes = [...zone.nodes].sort((a, b) =>
          (a.label ?? '').localeCompare(b.label ?? ''),
        );

        const proportion = sortedNodes.length / totalExternalNodes;
        const zoneArcSize = proportion * usableArc;
        const zoneArcStart = currentAngle;
        const zoneArcEnd = currentAngle + zoneArcSize;

        const positioned = positionNodesInArc(
          sortedNodes.map((n) => ({ id: n.id })),
          zoneArcStart,
          zoneArcEnd,
          externalRadius,
          { buildingSpacing: effectiveBuildingSpacing },
        );

        const zoneNodes: { nodeId: string; position: Position3D }[] = [];
        for (const pn of positioned) {
          positions.set(pn.id, pn.position);
          zoneNodes.push({ nodeId: pn.id, position: pn.position });
        }

        infrastructureZones.push({
          type: zone.type,
          arcStart: zoneArcStart,
          arcEnd: zoneArcEnd,
          nodeCount: sortedNodes.length,
        });

        externalZoneLayouts.push({
          zoneMetadata: {
            type: zone.type,
            arcStart: zoneArcStart,
            arcEnd: zoneArcEnd,
            nodeCount: sortedNodes.length,
          },
          nodes: zoneNodes,
        });

        currentAngle += zoneArcSize + zonePadding;
      }
    }

    // Compute bounding box
    const allPositions = Array.from(positions.values());
    const bounds = boundsFromPositions(allPositions);

    // Compute metadata
    const depthSet = new Set(fileNodes.map((n) => effectiveDepths.get(n.id) ?? 0));

    return {
      positions,
      bounds,
      metadata: {
        districtCount: dirGroups.size,
        ringCount: depthSet.size,
        externalCount: externalNodes.length,
        entryPointCount: entryFileNodes.length,
        districtArcs,
        infrastructureZones,
      },
      districts: districtLayouts,
      externalZones: externalZoneLayouts,
    };
  }

  canHandle(graph: Graph): boolean {
    return graph.nodes.length > 0;
  }
}

/**
 * Groups nodes by their containing directory.
 * Sorted alphabetically for deterministic output.
 */
function groupByDirectory(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const groups = new Map<string, GraphNode[]>();

  for (const node of nodes) {
    const filePath = (node.metadata?.path as string) ?? node.label ?? '';
    const dir = extractDirectory(filePath);

    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir)!.push(node);
  }

  return new Map(
    [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)),
  );
}

/**
 * Extracts the directory portion from a file path.
 */
function extractDirectory(filePath: string): string {
  const lastSlash = filePath.lastIndexOf('/');
  return lastSlash >= 0 ? filePath.substring(0, lastSlash) : 'root';
}
