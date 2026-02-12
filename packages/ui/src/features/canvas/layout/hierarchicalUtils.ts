import type { Position3D } from '../../../shared/types';
import type { HierarchicalLayoutResult } from './types';

/**
 * Flatten a hierarchical layout result into a single Map<string, Position3D>.
 *
 * Resolves block children to absolute positions (block.position + child.localPosition)
 * and merges all districts, blocks, external zones, and pre-existing positions into
 * a unified position map consumable by the existing rendering pipeline.
 */
export function flattenHierarchicalLayout(
  result: HierarchicalLayoutResult,
): Map<string, Position3D> {
  const map = new Map<string, Position3D>(result.positions);

  for (const district of result.districts) {
    for (const block of district.blocks) {
      map.set(block.fileId, block.position);

      for (const child of block.children) {
        map.set(child.nodeId, {
          x: block.position.x + child.localPosition.x,
          y: block.position.y + child.localPosition.y,
          z: block.position.z + child.localPosition.z,
        });
      }
    }
  }

  for (const zone of result.externalZones) {
    for (const node of zone.nodes) {
      map.set(node.nodeId, node.position);
    }
  }

  return map;
}
