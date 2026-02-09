/**
 * Nested Type Utilities
 *
 * Finds child nodes (inner classes, nested enums, etc.) for building
 * rooftop garden rendering. Uses parentId relationships from the
 * containment analyzer.
 */

import type { GraphNode } from '../../../../shared/types';

/** Node types that represent nested type definitions */
const NESTED_TYPE_KINDS = new Set<GraphNode['type']>([
  'class',
  'interface',
  'enum',
  'abstract_class',
]);

/**
 * Build a lookup map of parentId → child nodes for nested types.
 *
 * Only includes children whose type is a class-level nested type
 * (class, interface, enum, abstract_class). Methods and functions
 * are excluded — they're shown in X-Ray mode instead.
 *
 * Returns an empty map if no parentId relationships exist in the graph.
 */
export function buildNestedTypeMap(
  nodes: GraphNode[],
): Map<string, GraphNode[]> {
  const map = new Map<string, GraphNode[]>();

  for (const node of nodes) {
    if (!node.parentId) continue;
    if (!NESTED_TYPE_KINDS.has(node.type)) continue;

    const existing = map.get(node.parentId);
    if (existing) {
      existing.push(node);
    } else {
      map.set(node.parentId, [node]);
    }
  }

  return map;
}

/**
 * Recursively collect nesting depth for a node and its children.
 *
 * Returns an array of tiers, where each tier contains the child nodes
 * at that nesting level. Maximum depth is controlled by the caller.
 *
 * @param nodeId - The root node to start from
 * @param nestedMap - Map from buildNestedTypeMap
 * @param maxTiers - Maximum tiers to collect (default 3)
 * @returns Array of tiers, each containing the child nodes at that depth
 */
export function collectNestingTiers(
  nodeId: string,
  nestedMap: Map<string, GraphNode[]>,
  maxTiers: number = 3,
): GraphNode[][] {
  const tiers: GraphNode[][] = [];
  let currentParentIds = [nodeId];

  for (let tier = 0; tier < maxTiers; tier++) {
    const tierNodes: GraphNode[] = [];
    const nextParentIds: string[] = [];

    for (const parentId of currentParentIds) {
      const children = nestedMap.get(parentId);
      if (children) {
        tierNodes.push(...children);
        nextParentIds.push(...children.map((n) => n.id));
      }
    }

    if (tierNodes.length === 0) break;
    tiers.push(tierNodes);
    currentParentIds = nextParentIds;
  }

  return tiers;
}

/**
 * Count remaining nested children beyond the max tier depth.
 * Used to display a "+N" badge on the topmost tier.
 */
export function countOverflowChildren(
  lastTierNodeIds: string[],
  nestedMap: Map<string, GraphNode[]>,
): number {
  let count = 0;
  let currentIds = lastTierNodeIds;

  while (currentIds.length > 0) {
    const nextIds: string[] = [];
    for (const id of currentIds) {
      const children = nestedMap.get(id);
      if (children) {
        count += children.length;
        nextIds.push(...children.map((n) => n.id));
      }
    }
    currentIds = nextIds;
  }

  return count;
}
