/**
 * Floor Band Utilities Tests
 */

import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import {
  getLogScaledHeight,
  getFloorCount,
  VISIBILITY_COLORS,
  applyFloorBandColors,
  buildMethodChildMap,
} from './floorBandUtils';
import { FLOOR_HEIGHT } from '../../views/cityViewUtils';
import type { GraphNode } from '../../../../shared/types';

function makeNode(overrides: Partial<GraphNode> & { type: GraphNode['type'] }): GraphNode {
  return {
    id: 'n-1',
    label: 'Test',
    metadata: {},
    lod: 1,
    ...overrides,
  };
}

describe('getLogScaledHeight', () => {
  it('returns depth-based height when methodCount is 0', () => {
    const h = getLogScaledHeight(0, 2);
    // getBuildingHeight(2) = (2+1)*FLOOR_HEIGHT
    expect(h).toBe(3 * FLOOR_HEIGHT);
  });

  it('returns depth-based height when methodCount is undefined', () => {
    const h = getLogScaledHeight(undefined, 1);
    expect(h).toBe(2 * FLOOR_HEIGHT);
  });

  it('returns log-scaled height for 1 method', () => {
    const h = getLogScaledHeight(1, 0);
    // log2(2) = 1, max(1,1) = 1 => 1 * FLOOR_HEIGHT
    expect(h).toBeCloseTo(1 * FLOOR_HEIGHT);
  });

  it('returns log-scaled height for 5 methods', () => {
    const h = getLogScaledHeight(5, 0);
    expect(h).toBeCloseTo(Math.log2(6) * FLOOR_HEIGHT);
  });

  it('returns log-scaled height for 10 methods', () => {
    const h = getLogScaledHeight(10, 0);
    expect(h).toBeCloseTo(Math.log2(11) * FLOOR_HEIGHT);
  });

  it('returns log-scaled height for 30 methods', () => {
    const h = getLogScaledHeight(30, 0);
    expect(h).toBeCloseTo(Math.log2(31) * FLOOR_HEIGHT);
  });

  it('returns log-scaled height for 100 methods', () => {
    const h = getLogScaledHeight(100, 0);
    expect(h).toBeCloseTo(Math.log2(101) * FLOOR_HEIGHT);
  });

  it('grows sub-linearly compared to linear scaling', () => {
    const linear100 = 100 * FLOOR_HEIGHT;
    const log100 = getLogScaledHeight(100, 0);
    expect(log100).toBeLessThan(linear100);
  });
});

describe('getFloorCount', () => {
  it('returns 1 for undefined methodCount', () => {
    expect(getFloorCount(undefined)).toBe(1);
  });

  it('returns 1 for 0 methods', () => {
    expect(getFloorCount(0)).toBe(1);
  });

  it('returns methodCount when positive', () => {
    expect(getFloorCount(5)).toBe(5);
    expect(getFloorCount(10)).toBe(10);
  });
});

describe('VISIBILITY_COLORS', () => {
  it('has entries for public, private, protected, static', () => {
    expect(VISIBILITY_COLORS.public).toEqual([0.6, 0.8, 1.0]);
    expect(VISIBILITY_COLORS.private).toEqual([0.3, 0.3, 0.35]);
    expect(VISIBILITY_COLORS.protected).toEqual([0.8, 0.7, 0.4]);
    expect(VISIBILITY_COLORS.static).toEqual([0.6, 0.8, 1.0]);
  });
});

describe('applyFloorBandColors', () => {
  it('adds color attribute to a box geometry', () => {
    const geo = new THREE.BoxGeometry(2, 6, 2, 1, 3, 1);
    const visibilities = ['public', 'private', 'protected'];

    applyFloorBandColors(geo, 3, visibilities, 6);

    const colorAttr = geo.getAttribute('color');
    expect(colorAttr).toBeDefined();
    expect(colorAttr.count).toBe(geo.getAttribute('position').count);
  });

  it('assigns correct colors based on vertex Y position', () => {
    // Simple geometry: 2 height segments, 2 floors
    const geo = new THREE.BoxGeometry(1, 4, 1, 1, 2, 1);
    const visibilities = ['private', 'public'];

    applyFloorBandColors(geo, 2, visibilities, 4);

    const colorAttr = geo.getAttribute('color');
    const posAttr = geo.getAttribute('position');

    // Check that vertices in the bottom half get private colors
    // and top half get public colors
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i);
      const r = colorAttr.getX(i);
      const g = colorAttr.getY(i);
      const b = colorAttr.getZ(i);

      if (y < 0) {
        // Bottom half — private
        expect(r).toBeCloseTo(0.3);
        expect(g).toBeCloseTo(0.3);
        expect(b).toBeCloseTo(0.35);
      } else {
        // Top half — public
        expect(r).toBeCloseTo(0.6);
        expect(g).toBeCloseTo(0.8);
        expect(b).toBeCloseTo(1.0);
      }
    }
  });

  it('handles single floor (all same color)', () => {
    const geo = new THREE.BoxGeometry(1, 3, 1, 1, 1, 1);
    applyFloorBandColors(geo, 1, ['protected'], 3);

    const colorAttr = geo.getAttribute('color');
    for (let i = 0; i < colorAttr.count; i++) {
      expect(colorAttr.getX(i)).toBeCloseTo(0.8);
      expect(colorAttr.getY(i)).toBeCloseTo(0.7);
      expect(colorAttr.getZ(i)).toBeCloseTo(0.4);
    }
  });

  it('uses default color for undefined visibility', () => {
    const geo = new THREE.BoxGeometry(1, 3, 1, 1, 1, 1);
    applyFloorBandColors(geo, 1, [undefined], 3);

    const colorAttr = geo.getAttribute('color');
    // Default is public-like [0.6, 0.8, 1.0]
    expect(colorAttr.getX(0)).toBeCloseTo(0.6);
    expect(colorAttr.getY(0)).toBeCloseTo(0.8);
    expect(colorAttr.getZ(0)).toBeCloseTo(1.0);
  });
});

describe('buildMethodChildMap', () => {
  it('returns empty map for no nodes', () => {
    const map = buildMethodChildMap([]);
    expect(map.size).toBe(0);
  });

  it('groups method nodes by parentId', () => {
    const nodes = [
      makeNode({ id: 'c1', type: 'class' }),
      makeNode({ id: 'm1', type: 'method', parentId: 'c1' }),
      makeNode({ id: 'm2', type: 'method', parentId: 'c1' }),
      makeNode({ id: 'm3', type: 'method', parentId: 'c2' }),
    ];
    const map = buildMethodChildMap(nodes);
    expect(map.get('c1')?.length).toBe(2);
    expect(map.get('c2')?.length).toBe(1);
  });

  it('ignores non-method nodes', () => {
    const nodes = [
      makeNode({ id: 'c1', type: 'class', parentId: 'f1' }),
      makeNode({ id: 'v1', type: 'variable', parentId: 'c1' }),
    ];
    const map = buildMethodChildMap(nodes);
    expect(map.size).toBe(0);
  });

  it('ignores methods without parentId', () => {
    const nodes = [
      makeNode({ id: 'm1', type: 'method' }),
    ];
    const map = buildMethodChildMap(nodes);
    expect(map.size).toBe(0);
  });
});
