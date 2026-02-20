import type { GraphNode, Position3D } from '../../../../shared/types';
import type { BlockLayout } from '../types';
import { BUILDING_Y_OFFSET } from '../../views/cityViewUtils';

/**
 * Calculate the footprint (width x depth) of a file block based on child count and types.
 *
 * Classes and interfaces weight 1.5x, all other types weight 1.0x.
 * Footprint formula: clamp(ceil(sqrt(weightedCount)) * 2 + 2, 4, 20)
 */
export function calculateBlockFootprint(
  childCount: number,
  childTypes: GraphNode['type'][],
): { width: number; depth: number } {
  if (childCount === 0) {
    return { width: 4, depth: 4 };
  }

  let weightedCount = 0;
  for (const t of childTypes) {
    weightedCount += t === 'class' || t === 'interface' || t === 'abstract_class' ? 1.5 : 1.0;
  }

  const size = Math.min(20, Math.max(4, Math.ceil(Math.sqrt(weightedCount)) * 2 + 2));
  return { width: size, depth: size };
}

/**
 * Place child nodes in a grid within the block's footprint.
 *
 * Grid dimensions: ceil(sqrt(n)) x ceil(sqrt(n)).
 * Children are sorted alphabetically by ID for deterministic output.
 * Each child's localPosition is relative to the block center, within footprint bounds.
 */
export function placeChildrenInGrid(
  children: GraphNode[],
  footprint: { width: number; depth: number },
): { nodeId: string; localPosition: Position3D }[] {
  if (children.length === 0) return [];

  const sorted = [...children].sort((a, b) => a.id.localeCompare(b.id));
  const gridSize = Math.ceil(Math.sqrt(sorted.length));

  const cellW = footprint.width / gridSize;
  const cellD = footprint.depth / gridSize;

  return sorted.map((child, i) => {
    const col = i % gridSize;
    const row = Math.floor(i / gridSize);

    // Position relative to block center
    const localX = (col + 0.5) * cellW - footprint.width / 2;
    const localZ = (row + 0.5) * cellD - footprint.depth / 2;

    return {
      nodeId: child.id,
      localPosition: { x: localX, y: BUILDING_Y_OFFSET, z: localZ },
    };
  });
}

/**
 * Build file-block hierarchy by separating file nodes from their child nodes.
 *
 * Walks parentId chains with a visited set to detect cycles.
 * Orphans are nodes whose parentId is missing or doesn't reference a file node.
 */
export function buildFileBlockHierarchy(nodes: GraphNode[]): {
  fileBlocks: Map<string, GraphNode[]>;
  orphans: GraphNode[];
  cycleBreaks: string[];
} {
  const fileBlocks = new Map<string, GraphNode[]>();
  const orphans: GraphNode[] = [];
  const cycleBreaks: string[] = [];

  // Index all nodes by ID
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Identify file nodes
  const fileNodeIds = new Set<string>();
  for (const node of nodes) {
    if (node.type === 'file') {
      fileNodeIds.add(node.id);
      // Initialize empty children arrays for all file nodes
      if (!fileBlocks.has(node.id)) {
        fileBlocks.set(node.id, []);
      }
    }
  }

  // Assign non-file nodes to their parent file blocks
  for (const node of nodes) {
    if (node.type === 'file') continue;

    if (!node.parentId) {
      orphans.push(node);
      continue;
    }

    // Walk parentId chain to find the owning file node
    const visited = new Set<string>();
    let currentId: string | undefined = node.parentId;
    let foundFileId: string | undefined;

    while (currentId) {
      if (visited.has(currentId)) {
        // Cycle detected
        cycleBreaks.push(node.id);
        break;
      }
      visited.add(currentId);

      if (fileNodeIds.has(currentId)) {
        foundFileId = currentId;
        break;
      }

      const parent = nodeMap.get(currentId);
      currentId = parent?.parentId;
    }

    if (foundFileId) {
      fileBlocks.get(foundFileId)!.push(node);
    } else if (!cycleBreaks.includes(node.id)) {
      orphans.push(node);
    } else {
      // Cycle-broken nodes become orphans
      orphans.push(node);
    }
  }

  return { fileBlocks, orphans, cycleBreaks };
}

/**
 * Merge 1-3 file nodes into a single compound block.
 *
 * All children from the constituent files are combined.
 * isMerged is set to true.
 */
export function createCompoundBlock(
  files: GraphNode[],
  childrenByFile: Map<string, GraphNode[]>,
  position: Position3D,
): BlockLayout {
  const allChildren: GraphNode[] = [];
  const sortedFiles = [...files].sort((a, b) => a.id.localeCompare(b.id));

  for (const file of sortedFiles) {
    const children = childrenByFile.get(file.id) ?? [];
    allChildren.push(...children);
  }

  const childTypes = allChildren.map((c) => c.type);
  const footprint = calculateBlockFootprint(allChildren.length, childTypes);
  const placedChildren = placeChildrenInGrid(allChildren, footprint);

  return {
    fileId: sortedFiles.map((f) => f.id).join('+'),
    position,
    footprint,
    children: placedChildren,
    isMerged: true,
  };
}

/**
 * Position blocks along an arc segment, allocating angular space proportional to footprint width.
 *
 * Wider blocks receive more angular space to prevent overlap.
 */
export function positionBlocksInArc(
  blocks: { id: string; footprint: { width: number; depth: number } }[],
  arcStart: number,
  arcEnd: number,
  radius: number,
): { id: string; position: Position3D }[] {
  if (blocks.length === 0) return [];

  const arcSpan = arcEnd - arcStart;
  const totalWidth = blocks.reduce((sum, b) => sum + b.footprint.width, 0);

  // If only one block, center it in the arc
  if (blocks.length === 1) {
    const angle = arcStart + arcSpan / 2;
    const effectiveRadius = Math.max(radius, 0.1);
    return [{
      id: blocks[0]!.id,
      position: {
        x: Math.cos(angle) * effectiveRadius,
        y: 0,
        z: Math.sin(angle) * effectiveRadius,
      },
    }];
  }

  const effectiveRadius = Math.max(radius, 0.1);

  return blocks.map((block, i) => {
    // Proportion of arc based on footprint width
    const widthBefore = blocks.slice(0, i).reduce((s, b) => s + b.footprint.width, 0);
    const centerOffset = widthBefore + block.footprint.width / 2;
    const proportion = centerOffset / totalWidth;
    const angle = arcStart + proportion * arcSpan;

    return {
      id: block.id,
      position: {
        x: Math.cos(angle) * effectiveRadius,
        y: 0,
        z: Math.sin(angle) * effectiveRadius,
      },
    };
  });
}
