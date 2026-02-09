/**
 * Cluster Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import { shouldCluster, createClusterMetadata } from './clusterUtils';
import type { Position3D } from '../../../../shared/types';

describe('shouldCluster', () => {
  it('returns false when nodeCount is below threshold', () => {
    expect(shouldCluster(5, 20)).toBe(false);
  });

  it('returns false when nodeCount equals threshold', () => {
    expect(shouldCluster(20, 20)).toBe(false);
  });

  it('returns true when nodeCount exceeds threshold', () => {
    expect(shouldCluster(21, 20)).toBe(true);
  });

  it('handles threshold of 0', () => {
    expect(shouldCluster(1, 0)).toBe(true);
  });

  it('handles nodeCount of 0', () => {
    expect(shouldCluster(0, 20)).toBe(false);
  });
});

describe('createClusterMetadata', () => {
  it('computes centroid from node positions', () => {
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 10, y: 0, z: 10 }],
    ]);

    const result = createClusterMetadata('src', ['a', 'b'], positions);

    expect(result.center.x).toBe(5);
    expect(result.center.y).toBe(0);
    expect(result.center.z).toBe(5);
  });

  it('computes bounding size from positions', () => {
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 8, y: 3, z: 6 }],
    ]);

    const result = createClusterMetadata('src', ['a', 'b'], positions);

    expect(result.size.width).toBe(8);
    expect(result.size.depth).toBe(6);
    expect(result.size.height).toBe(3);
  });

  it('ensures minimum size of 1', () => {
    const positions = new Map<string, Position3D>([
      ['a', { x: 5, y: 0, z: 5 }],
    ]);

    const result = createClusterMetadata('src', ['a'], positions);

    expect(result.size.width).toBe(1);
    expect(result.size.depth).toBe(1);
    expect(result.size.height).toBe(1);
  });

  it('returns node metadata', () => {
    const positions = new Map<string, Position3D>([
      ['a', { x: 0, y: 0, z: 0 }],
      ['b', { x: 1, y: 0, z: 1 }],
      ['c', { x: 2, y: 0, z: 2 }],
    ]);

    const result = createClusterMetadata('lib', ['a', 'b', 'c'], positions);

    expect(result.districtId).toBe('lib');
    expect(result.nodeCount).toBe(3);
    expect(result.nodeIds).toEqual(['a', 'b', 'c']);
  });

  it('handles empty positions gracefully', () => {
    const positions = new Map<string, Position3D>();

    const result = createClusterMetadata('empty', ['a', 'b'], positions);

    expect(result.center).toEqual({ x: 0, y: 0, z: 0 });
    expect(result.size).toEqual({ width: 1, depth: 1, height: 1 });
    expect(result.nodeCount).toBe(2);
  });

  it('skips nodes without positions', () => {
    const positions = new Map<string, Position3D>([
      ['a', { x: 10, y: 0, z: 10 }],
    ]);

    const result = createClusterMetadata('partial', ['a', 'b'], positions);

    expect(result.center).toEqual({ x: 10, y: 0, z: 10 });
    expect(result.nodeCount).toBe(2);
  });
});
