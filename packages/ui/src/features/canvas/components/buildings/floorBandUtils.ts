/**
 * Floor Band Utilities
 *
 * Height calculation, visibility colors, vertex color application,
 * and method child map builder for class-like buildings.
 */

import * as THREE from 'three';
import { FLOOR_HEIGHT, getBuildingHeight } from '../../views/cityViewUtils';
import type { GraphNode } from '../../../../shared/types';

/**
 * RGB triplets for method visibility floor bands.
 */
export const VISIBILITY_COLORS: Record<string, [number, number, number]> = {
  public: [0.6, 0.8, 1.0],
  private: [0.3, 0.3, 0.35],
  protected: [0.8, 0.7, 0.4],
  static: [0.6, 0.8, 1.0],
};

/** Default color for methods with no visibility set */
const DEFAULT_VISIBILITY: [number, number, number] = [0.6, 0.8, 1.0];

/**
 * Calculate building height using log scale based on method count.
 * Falls back to depth-based height when methodCount is 0 or undefined.
 */
export function getLogScaledHeight(methodCount: number | undefined, depth: number | undefined): number {
  if (methodCount !== undefined && methodCount > 0) {
    return Math.max(Math.log2(methodCount + 1), 1) * FLOOR_HEIGHT;
  }
  return getBuildingHeight(depth);
}

/**
 * Number of visible floor bands. Minimum 1 ("lobby" floor).
 */
export function getFloorCount(methodCount: number | undefined): number {
  return Math.max(methodCount ?? 0, 1);
}

/**
 * Apply per-floor visibility-based vertex colors to a geometry.
 *
 * Works with box, cone, and cylinder geometries — all use Y axis for height.
 * Vertices are mapped to floor indices based on their Y position.
 */
export function applyFloorBandColors(
  geometry: THREE.BufferGeometry,
  floorCount: number,
  visibilities: Array<string | undefined>,
  totalHeight: number,
): void {
  const posAttr = geometry.getAttribute('position');
  if (!posAttr) return;

  const count = posAttr.count;
  const colors = new Float32Array(count * 3);
  const halfHeight = totalHeight / 2;

  for (let i = 0; i < count; i++) {
    const y = posAttr.getY(i);
    // Map y from [-halfHeight, halfHeight] to floor index [0, floorCount-1]
    const normalized = (y + halfHeight) / totalHeight;
    const floorIndex = Math.min(
      Math.floor(normalized * floorCount),
      floorCount - 1,
    );

    const vis = visibilities[floorIndex];
    const rgb = (vis !== undefined ? VISIBILITY_COLORS[vis] : undefined) ?? DEFAULT_VISIBILITY;
    colors[i * 3] = rgb[0]!;
    colors[i * 3 + 1] = rgb[1]!;
    colors[i * 3 + 2] = rgb[2]!;
  }

  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
}

/**
 * Extract method count from a GraphNode.
 *
 * Checks (in order): explicit methodCount field, metadata.methods (number or array length).
 * Returns 0 when no method data is available.
 */
export function getMethodCount(node: GraphNode): number {
  if (node.methodCount !== undefined && node.methodCount > 0) return node.methodCount;
  const metaMethods = node.metadata?.methods;
  if (typeof metaMethods === 'number') return metaMethods;
  if (Array.isArray(metaMethods)) return metaMethods.length;
  return 0;
}

/**
 * Build a map from parent class ID to child method nodes.
 */
export function buildMethodChildMap(nodes: GraphNode[]): Map<string, GraphNode[]> {
  const map = new Map<string, GraphNode[]>();
  for (const node of nodes) {
    if (node.type === 'method' && node.parentId) {
      const existing = map.get(node.parentId);
      if (existing) {
        existing.push(node);
      } else {
        map.set(node.parentId, [node]);
      }
    }
  }
  return map;
}
