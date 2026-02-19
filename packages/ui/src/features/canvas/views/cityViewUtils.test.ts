/**
 * City View Utility Tests
 *
 * Tests for pure utility functions used by the CityView renderer.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDirectoryColor,
  getBuildingHeight,
  getMethodBasedHeight,
  getEncodedHeight,
  getContainmentHeight,
  getFootprintScale,
  buildIncomingEdgeCounts,
  getDirectoryFromLabel,
  sortMethodsByVisibility,
  getLodTransition,
  isBaseClass,
  detectBaseClasses,
  classifyEdgeRouting,
  computeUndergroundGroundOpacity,
  METHOD_ROOM_COLORS,
  ROOM_LOD_THRESHOLD,
  COLOR_PALETTE,
  FLOOR_HEIGHT,
  METHOD_ROOM_HEIGHT,
  BUILDING_PADDING,
  BUILDING_Y_OFFSET,
  UNDERGROUND_GROUND_OPACITY,
  SURFACE_GROUND_OPACITY,
  resetDirectoryColors,
} from './cityViewUtils';

describe('cityViewUtils', () => {
  beforeEach(() => {
    resetDirectoryColors();
  });

  describe('getDirectoryFromLabel', () => {
    it('should extract directory from path with slashes', () => {
      expect(getDirectoryFromLabel('src/components/Button.tsx')).toBe(
        'src/components'
      );
    });

    it('should return "root" for files without directory', () => {
      expect(getDirectoryFromLabel('index.ts')).toBe('root');
    });

    it('should handle deeply nested paths', () => {
      expect(
        getDirectoryFromLabel('src/features/canvas/views/CityView.tsx')
      ).toBe('src/features/canvas/views');
    });

    it('should handle single directory level', () => {
      expect(getDirectoryFromLabel('src/index.ts')).toBe('src');
    });
  });

  describe('getDirectoryColor', () => {
    it('should return a color string', () => {
      const color = getDirectoryColor('src/utils');
      expect(typeof color).toBe('string');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should return same color for same directory', () => {
      const color1 = getDirectoryColor('src/utils');
      const color2 = getDirectoryColor('src/utils');
      expect(color1).toBe(color2);
    });

    it('should return different colors for different directories', () => {
      const color1 = getDirectoryColor('src/utils');
      const color2 = getDirectoryColor('src/features');
      // Different directories should get different colors (at least initially)
      expect(color1).not.toBe(color2);
    });

    it('should cycle through palette when many directories used', () => {
      const colors: string[] = [];
      for (let i = 0; i < COLOR_PALETTE.length + 1; i++) {
        colors.push(getDirectoryColor(`dir-${i}`));
      }
      // After cycling, should wrap around
      expect(colors[COLOR_PALETTE.length]).toBe(colors[0]);
    });

    it('should return color from the palette', () => {
      const color = getDirectoryColor('src/models');
      expect(COLOR_PALETTE).toContain(color);
    });
  });

  describe('getBuildingHeight', () => {
    it('should return minimum height for depth 0', () => {
      expect(getBuildingHeight(0)).toBeGreaterThan(0);
    });

    it('should return greater height for greater depth', () => {
      const h0 = getBuildingHeight(0);
      const h2 = getBuildingHeight(2);
      expect(h2).toBeGreaterThan(h0);
    });

    it('should handle undefined depth', () => {
      const height = getBuildingHeight(undefined);
      expect(height).toBeGreaterThan(0);
    });

    it('should scale linearly with depth', () => {
      const h1 = getBuildingHeight(1);
      const h2 = getBuildingHeight(2);
      const h3 = getBuildingHeight(3);
      // Differences should be equal (linear scaling)
      expect(h2 - h1).toBeCloseTo(h3 - h2, 5);
    });
  });

  describe('getMethodBasedHeight', () => {
    it('returns log-scaled height for positive methodCount', () => {
      const h = getMethodBasedHeight(5, 0);
      expect(h).toBeCloseTo(Math.log2(6) * FLOOR_HEIGHT);
    });

    it('returns depth-based height when methodCount is undefined', () => {
      expect(getMethodBasedHeight(undefined, 2)).toBe(getBuildingHeight(2));
    });

    it('returns depth-based height when methodCount is 0', () => {
      expect(getMethodBasedHeight(0, 1)).toBe(getBuildingHeight(1));
    });

    it('returns at least 1 * FLOOR_HEIGHT for 1 method', () => {
      // log2(2) = 1
      expect(getMethodBasedHeight(1, 0)).toBeCloseTo(FLOOR_HEIGHT);
    });

    it('grows sub-linearly', () => {
      const h10 = getMethodBasedHeight(10, 0);
      const h100 = getMethodBasedHeight(100, 0);
      // 10x more methods should NOT produce 10x more height
      expect(h100 / h10).toBeLessThan(3);
    });
  });

  describe('getContainmentHeight', () => {
    it('returns minimum 1-floor height for zero methods', () => {
      const h = getContainmentHeight(0);
      expect(h).toBe(1 * METHOD_ROOM_HEIGHT + BUILDING_PADDING);
    });

    it('scales linearly with method count', () => {
      const h5 = getContainmentHeight(5);
      const h10 = getContainmentHeight(10);
      expect(h10 - h5).toBeCloseTo(5 * METHOD_ROOM_HEIGHT);
    });

    it('returns correct height for 1 method', () => {
      expect(getContainmentHeight(1)).toBe(1 * METHOD_ROOM_HEIGHT + BUILDING_PADDING);
    });

    it('returns correct height for many methods', () => {
      expect(getContainmentHeight(20)).toBe(20 * METHOD_ROOM_HEIGHT + BUILDING_PADDING);
    });

    it('height is always positive', () => {
      expect(getContainmentHeight(0)).toBeGreaterThan(0);
    });
  });

  describe('getFootprintScale', () => {
    it('returns 1.0 when no metric data is available', () => {
      const node = { methodCount: 0, depth: 0, metadata: {} };
      expect(getFootprintScale(node, { encoding: 'loc' })).toBe(1.0);
    });

    it('returns 1.0 for methodCount encoding with zero methods', () => {
      const node = { methodCount: 0, depth: 0, metadata: {} };
      expect(getFootprintScale(node, { encoding: 'methodCount' })).toBe(1.0);
    });

    it('returns > 1.0 for positive metric values', () => {
      const node = { methodCount: 10, depth: 0, metadata: {} };
      expect(getFootprintScale(node, { encoding: 'methodCount' })).toBeGreaterThan(1.0);
    });

    it('is capped at 2.0', () => {
      const node = { methodCount: 10000, depth: 0, metadata: { loc: 100000, complexity: 10000 } };
      expect(getFootprintScale(node, { encoding: 'loc' })).toBeLessThanOrEqual(2.0);
    });

    it('uses incomingEdgeCount for dependencies encoding', () => {
      const node = { methodCount: 0, depth: 0, metadata: {} };
      const scale = getFootprintScale(node, { encoding: 'dependencies', incomingEdgeCount: 20 });
      expect(scale).toBeGreaterThan(1.0);
    });

    it('uses complexity metadata', () => {
      const node = { methodCount: 0, depth: 0, metadata: { complexity: 15 } };
      const scale = getFootprintScale(node, { encoding: 'complexity' });
      expect(scale).toBeGreaterThan(1.0);
    });

    it('uses churn metadata', () => {
      const node = { methodCount: 0, depth: 0, metadata: { churn: 30 } };
      const scale = getFootprintScale(node, { encoding: 'churn' });
      expect(scale).toBeGreaterThan(1.0);
    });
  });

  describe('BUILDING_Y_OFFSET', () => {
    it('is positive (buildings sit above ground)', () => {
      expect(BUILDING_Y_OFFSET).toBeGreaterThan(0);
    });
  });

  describe('getEncodedHeight', () => {
    const baseNode = { methodCount: 5, depth: 2, metadata: {} };

    it('delegates to getMethodBasedHeight for methodCount encoding', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'methodCount' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses incoming edge count for dependencies encoding', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies', incomingEdgeCount: 10 });
      expect(h).toBeCloseTo(Math.log2(11) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when dependencies count is 0', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies', incomingEdgeCount: 0 });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('falls back to methodCount when incomingEdgeCount is undefined', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses loc metadata for loc encoding', () => {
      const node = { ...baseNode, metadata: { loc: 500 } };
      const h = getEncodedHeight(node, { encoding: 'loc' });
      expect(h).toBeCloseTo(Math.log2(500 / 50 + 1) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when loc is 0 or missing', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'loc' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses complexity metadata for complexity encoding', () => {
      const node = { ...baseNode, metadata: { complexity: 15 } };
      const h = getEncodedHeight(node, { encoding: 'complexity' });
      expect(h).toBeCloseTo(Math.log2(16) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when complexity is 0 or missing', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'complexity' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('uses churn metadata for churn encoding', () => {
      const node = { ...baseNode, metadata: { churn: 20 } };
      const h = getEncodedHeight(node, { encoding: 'churn' });
      expect(h).toBeCloseTo(Math.log2(21) * FLOOR_HEIGHT);
    });

    it('falls back to methodCount when churn is 0 or missing', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'churn' });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });

    it('returns at least 1 * FLOOR_HEIGHT for any positive metric', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'dependencies', incomingEdgeCount: 1 });
      expect(h).toBeGreaterThanOrEqual(FLOOR_HEIGHT);
    });

    it('handles unknown encoding by falling back to methodCount', () => {
      const h = getEncodedHeight(baseNode, { encoding: 'unknown' as never });
      expect(h).toBe(getMethodBasedHeight(5, 2));
    });
  });

  describe('sortMethodsByVisibility', () => {
    it('sorts public before protected before private', () => {
      const methods = [
        { name: 'c', visibility: 'private' },
        { name: 'b', visibility: 'protected' },
        { name: 'a', visibility: 'public' },
      ];
      const sorted = sortMethodsByVisibility(methods);
      expect(sorted[0]!.visibility).toBe('public');
      expect(sorted[1]!.visibility).toBe('protected');
      expect(sorted[2]!.visibility).toBe('private');
    });

    it('preserves source order within the same visibility tier', () => {
      const methods = [
        { name: 'first', visibility: 'public' },
        { name: 'second', visibility: 'public' },
        { name: 'third', visibility: 'public' },
      ];
      const sorted = sortMethodsByVisibility(methods);
      expect(sorted[0]!.name).toBe('first');
      expect(sorted[1]!.name).toBe('second');
      expect(sorted[2]!.name).toBe('third');
    });

    it('treats undefined visibility as public', () => {
      const methods = [
        { name: 'private-one', visibility: 'private' as string | undefined },
        { name: 'no-vis', visibility: undefined },
      ];
      const sorted = sortMethodsByVisibility(methods);
      expect(sorted[0]!.name).toBe('no-vis');
      expect(sorted[1]!.name).toBe('private-one');
    });

    it('handles all-public methods without reordering', () => {
      const methods = [
        { name: 'a', visibility: 'public' },
        { name: 'b', visibility: 'public' },
      ];
      const sorted = sortMethodsByVisibility(methods);
      expect(sorted.map((m) => m.name)).toEqual(['a', 'b']);
    });

    it('does not mutate the input array', () => {
      const methods = [
        { name: 'z', visibility: 'private' },
        { name: 'a', visibility: 'public' },
      ];
      const original = [...methods];
      sortMethodsByVisibility(methods);
      expect(methods[0]!.name).toBe(original[0]!.name);
      expect(methods[1]!.name).toBe(original[1]!.name);
    });

    it('handles mixed visibility with multiple per tier', () => {
      const methods = [
        { name: 'pub1', visibility: 'public' },
        { name: 'priv1', visibility: 'private' },
        { name: 'prot1', visibility: 'protected' },
        { name: 'pub2', visibility: 'public' },
        { name: 'priv2', visibility: 'private' },
      ];
      const sorted = sortMethodsByVisibility(methods);
      const names = sorted.map((m) => m.name);
      // Publics first, in original order
      expect(names[0]).toBe('pub1');
      expect(names[1]).toBe('pub2');
      // Protected next
      expect(names[2]).toBe('prot1');
      // Privates last, in original order
      expect(names[3]).toBe('priv1');
      expect(names[4]).toBe('priv2');
    });

    it('returns empty array for empty input', () => {
      expect(sortMethodsByVisibility([])).toEqual([]);
    });
  });

  describe('getLodTransition', () => {
    it('returns showRooms=false and bandOpacity=1 at LOD 1 (city zoom)', () => {
      const result = getLodTransition(1);
      expect(result.showRooms).toBe(false);
      expect(result.bandOpacity).toBe(1);
      expect(result.roomOpacity).toBe(0);
    });

    it('returns showRooms=false and bandOpacity=1 at LOD 2 (district zoom)', () => {
      const result = getLodTransition(2);
      expect(result.showRooms).toBe(false);
      expect(result.bandOpacity).toBe(1);
      expect(result.roomOpacity).toBe(0);
    });

    it('begins transition at ROOM_LOD_THRESHOLD - 0.5', () => {
      const result = getLodTransition(ROOM_LOD_THRESHOLD - 0.5);
      expect(result.showRooms).toBe(false);
      expect(result.bandOpacity).toBeCloseTo(1);
      expect(result.roomOpacity).toBeCloseTo(0);
    });

    it('is mid-way through transition at LOD 2.75', () => {
      const result = getLodTransition(2.75);
      expect(result.showRooms).toBe(true);
      expect(result.bandOpacity).toBeCloseTo(0.5);
      expect(result.roomOpacity).toBeCloseTo(0.5);
    });

    it('completes transition at ROOM_LOD_THRESHOLD (LOD 3)', () => {
      const result = getLodTransition(ROOM_LOD_THRESHOLD);
      expect(result.showRooms).toBe(true);
      expect(result.bandOpacity).toBeCloseTo(0);
      expect(result.roomOpacity).toBeCloseTo(1);
    });

    it('stays fully in room mode above LOD 3', () => {
      const result = getLodTransition(4);
      expect(result.showRooms).toBe(true);
      expect(result.bandOpacity).toBe(0);
      expect(result.roomOpacity).toBe(1);
    });

    it('bandOpacity + roomOpacity = 1 throughout transition', () => {
      for (const lod of [2.5, 2.6, 2.7, 2.8, 2.9, 3.0]) {
        const { bandOpacity, roomOpacity } = getLodTransition(lod);
        expect(bandOpacity + roomOpacity).toBeCloseTo(1);
      }
    });

    it('clamps at 0 below LOD 0', () => {
      const result = getLodTransition(-1);
      expect(result.bandOpacity).toBe(1);
      expect(result.roomOpacity).toBe(0);
    });
  });

  describe('METHOD_ROOM_COLORS', () => {
    it('has distinct colors for each visibility tier', () => {
      expect(METHOD_ROOM_COLORS.public).not.toBe(METHOD_ROOM_COLORS.protected);
      expect(METHOD_ROOM_COLORS.protected).not.toBe(METHOD_ROOM_COLORS.private);
      expect(METHOD_ROOM_COLORS.public).not.toBe(METHOD_ROOM_COLORS.private);
    });

    it('has distinct accent color for constructor', () => {
      expect(METHOD_ROOM_COLORS.constructor).not.toBe(METHOD_ROOM_COLORS.public);
      expect(METHOD_ROOM_COLORS.constructor).not.toBe(METHOD_ROOM_COLORS.private);
    });

    it('has distinct accent color for static', () => {
      expect(METHOD_ROOM_COLORS.static).not.toBe(METHOD_ROOM_COLORS.public);
      expect(METHOD_ROOM_COLORS.static).not.toBe(METHOD_ROOM_COLORS.protected);
      expect(METHOD_ROOM_COLORS.static).not.toBe(METHOD_ROOM_COLORS.private);
    });

    it('all colors are valid hex strings', () => {
      for (const color of Object.values(METHOD_ROOM_COLORS)) {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe('isBaseClass', () => {
    it('returns true when a class has a subclass extending it (extends edge)', () => {
      const edges = [{ source: 'Dog', target: 'Animal', type: 'extends' }];
      expect(isBaseClass('Animal', edges)).toBe(true);
    });

    it('returns false for a class with no subclasses', () => {
      const edges = [{ source: 'Dog', target: 'Animal', type: 'extends' }];
      expect(isBaseClass('Dog', edges)).toBe(false);
    });

    it('returns true when a class implements an interface (implements edge)', () => {
      const edges = [{ source: 'MyService', target: 'IService', type: 'implements' }];
      expect(isBaseClass('IService', edges)).toBe(true);
    });

    it('returns true for inherits edge type (IVM/UI canonical name)', () => {
      const edges = [{ source: 'Child', target: 'Parent', type: 'inherits' }];
      expect(isBaseClass('Parent', edges)).toBe(true);
    });

    it('returns true for mid-chain class that is both parent and child', () => {
      // B extends A, C extends B — B is a base class (target of C→B)
      const edges = [
        { source: 'B', target: 'A', type: 'extends' },
        { source: 'C', target: 'B', type: 'extends' },
      ];
      expect(isBaseClass('B', edges)).toBe(true);
      expect(isBaseClass('A', edges)).toBe(true);
      expect(isBaseClass('C', edges)).toBe(false);
    });

    it('returns false when only non-inheritance edges exist', () => {
      const edges = [
        { source: 'A', target: 'B', type: 'calls' },
        { source: 'A', target: 'B', type: 'imports' },
        { source: 'A', target: 'B', type: 'contains' },
      ];
      expect(isBaseClass('B', edges)).toBe(false);
    });

    it('returns false for empty edges array', () => {
      expect(isBaseClass('Animal', [])).toBe(false);
    });

    it('works with cross-namespace node IDs (AC-5)', () => {
      const edges = [
        { source: 'pkg-a::ChildClass', target: 'pkg-b::BaseClass', type: 'extends' },
      ];
      expect(isBaseClass('pkg-b::BaseClass', edges)).toBe(true);
      expect(isBaseClass('pkg-a::ChildClass', edges)).toBe(false);
    });
  });

  describe('detectBaseClasses — chain and diamond inheritance (Story 11-7)', () => {
    it('A→B→C chain: A and B are base classes, C is not', () => {
      const edges = [
        { source: 'B', target: 'A', type: 'extends' },
        { source: 'C', target: 'B', type: 'extends' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('A')).toBe(true);
      expect(result.has('B')).toBe(true);  // mid-chain
      expect(result.has('C')).toBe(false); // leaf subclass only
    });

    it('A→B→C→D chain: A, B, C are base classes, D is not', () => {
      const edges = [
        { source: 'B', target: 'A', type: 'extends' },
        { source: 'C', target: 'B', type: 'extends' },
        { source: 'D', target: 'C', type: 'extends' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('A')).toBe(true);
      expect(result.has('B')).toBe(true);
      expect(result.has('C')).toBe(true);
      expect(result.has('D')).toBe(false);
    });

    it('diamond inheritance: A→B, A→C, B→D, C→D — A, B, C are base; D is not', () => {
      // D extends B and C; B and C both extend A
      const edges = [
        { source: 'B', target: 'A', type: 'extends' },
        { source: 'C', target: 'A', type: 'extends' },
        { source: 'D', target: 'B', type: 'extends' },
        { source: 'D', target: 'C', type: 'extends' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('A')).toBe(true); // root base
      expect(result.has('B')).toBe(true); // mid-chain
      expect(result.has('C')).toBe(true); // mid-chain
      expect(result.has('D')).toBe(false); // leaf only
    });

    it('interface implemented by multiple classes is a base class', () => {
      const edges = [
        { source: 'ServiceA', target: 'ILogger', type: 'implements' },
        { source: 'ServiceB', target: 'ILogger', type: 'implements' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('ILogger')).toBe(true);
      expect(result.has('ServiceA')).toBe(false);
      expect(result.has('ServiceB')).toBe(false);
    });

    it('mixed chain: class extends base that implements interface', () => {
      // IBase ← BaseClass ← Child (via extends)
      // IBase ← BaseClass (via implements)
      const edges = [
        { source: 'BaseClass', target: 'IBase', type: 'implements' },
        { source: 'Child', target: 'BaseClass', type: 'extends' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('IBase')).toBe(true);    // interface implemented by BaseClass
      expect(result.has('BaseClass')).toBe(true); // extended by Child
      expect(result.has('Child')).toBe(false);
    });
  });

  describe('detectBaseClasses', () => {
    it('returns empty set for empty edges', () => {
      expect(detectBaseClasses([])).toEqual(new Set());
    });

    it('includes all targets of extends edges', () => {
      const edges = [
        { source: 'Dog', target: 'Animal', type: 'extends' },
        { source: 'Cat', target: 'Animal', type: 'extends' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('Animal')).toBe(true);
      expect(result.size).toBe(1);
    });

    it('includes targets of implements edges', () => {
      const edges = [
        { source: 'MyService', target: 'IService', type: 'implements' },
        { source: 'OtherService', target: 'IService', type: 'implements' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('IService')).toBe(true);
    });

    it('includes targets of inherits edges', () => {
      const edges = [{ source: 'B', target: 'A', type: 'inherits' }];
      expect(detectBaseClasses(edges).has('A')).toBe(true);
    });

    it('excludes non-inheritance edge targets', () => {
      const edges = [
        { source: 'A', target: 'B', type: 'calls' },
        { source: 'A', target: 'C', type: 'imports' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.size).toBe(0);
    });

    it('identifies mid-chain class as base class', () => {
      const edges = [
        { source: 'B', target: 'A', type: 'extends' },
        { source: 'C', target: 'B', type: 'extends' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('A')).toBe(true);
      expect(result.has('B')).toBe(true);
      expect(result.has('C')).toBe(false);
    });

    it('handles mixed edge types in single pass', () => {
      const edges = [
        { source: 'Dog', target: 'Animal', type: 'extends' },
        { source: 'Dog', target: 'IRunnable', type: 'implements' },
        { source: 'Dog', target: 'Handler', type: 'calls' },
      ];
      const result = detectBaseClasses(edges);
      expect(result.has('Animal')).toBe(true);
      expect(result.has('IRunnable')).toBe(true);
      expect(result.has('Handler')).toBe(false);
    });
  });

  describe('buildIncomingEdgeCounts', () => {
    it('returns empty map for empty edges array', () => {
      const counts = buildIncomingEdgeCounts([]);
      expect(counts.size).toBe(0);
    });

    it('counts single edge to a target', () => {
      const counts = buildIncomingEdgeCounts([{ target: 'A' }]);
      expect(counts.get('A')).toBe(1);
    });

    it('accumulates multiple edges to the same target', () => {
      const counts = buildIncomingEdgeCounts([
        { target: 'A' },
        { target: 'A' },
        { target: 'A' },
      ]);
      expect(counts.get('A')).toBe(3);
    });

    it('tracks different targets independently', () => {
      const counts = buildIncomingEdgeCounts([
        { target: 'A' },
        { target: 'B' },
        { target: 'A' },
        { target: 'C' },
      ]);
      expect(counts.get('A')).toBe(2);
      expect(counts.get('B')).toBe(1);
      expect(counts.get('C')).toBe(1);
    });

    it('returns undefined for nodes with no incoming edges', () => {
      const counts = buildIncomingEdgeCounts([{ target: 'A' }]);
      expect(counts.get('B')).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Story 11-9: classifyEdgeRouting
  // ─────────────────────────────────────────────────────────────────────────

  describe('classifyEdgeRouting', () => {
    // Underground — structural edges

    it('imports edge routes underground', () => {
      expect(classifyEdgeRouting('imports')).toBe('underground');
    });

    it('depends_on edge routes underground', () => {
      expect(classifyEdgeRouting('depends_on')).toBe('underground');
    });

    it('inherits edge routes underground', () => {
      expect(classifyEdgeRouting('inherits')).toBe('underground');
    });

    it('extends edge routes underground', () => {
      expect(classifyEdgeRouting('extends')).toBe('underground');
    });

    it('implements edge routes underground', () => {
      expect(classifyEdgeRouting('implements')).toBe('underground');
    });

    it('contains edge routes underground', () => {
      expect(classifyEdgeRouting('contains')).toBe('underground');
    });

    it('unknown edge type defaults to underground', () => {
      expect(classifyEdgeRouting('unknown_type')).toBe('underground');
      expect(classifyEdgeRouting('')).toBe('underground');
    });

    // Overhead — runtime edges

    it('calls edge routes overhead', () => {
      expect(classifyEdgeRouting('calls')).toBe('overhead');
    });

    it('composes edge routes overhead', () => {
      expect(classifyEdgeRouting('composes')).toBe('overhead');
    });

    // Case insensitivity

    it('is case-insensitive for overhead edge types', () => {
      expect(classifyEdgeRouting('CALLS')).toBe('overhead');
      expect(classifyEdgeRouting('Calls')).toBe('overhead');
      expect(classifyEdgeRouting('COMPOSES')).toBe('overhead');
    });

    it('is case-insensitive for underground edge types', () => {
      expect(classifyEdgeRouting('IMPORTS')).toBe('underground');
      expect(classifyEdgeRouting('Imports')).toBe('underground');
      expect(classifyEdgeRouting('INHERITS')).toBe('underground');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Story 11-10: computeUndergroundGroundOpacity
  // ─────────────────────────────────────────────────────────────────────────

  describe('computeUndergroundGroundOpacity', () => {
    it('returns SURFACE_GROUND_OPACITY (1.0) when underground is hidden', () => {
      expect(computeUndergroundGroundOpacity(false)).toBe(SURFACE_GROUND_OPACITY);
      expect(computeUndergroundGroundOpacity(false)).toBe(1.0);
    });

    it('returns UNDERGROUND_GROUND_OPACITY when underground is visible', () => {
      expect(computeUndergroundGroundOpacity(true)).toBe(UNDERGROUND_GROUND_OPACITY);
    });

    it('underground opacity is less than surface opacity (semi-transparent)', () => {
      expect(UNDERGROUND_GROUND_OPACITY).toBeLessThan(SURFACE_GROUND_OPACITY);
    });

    it('underground opacity is a positive value greater than 0', () => {
      expect(UNDERGROUND_GROUND_OPACITY).toBeGreaterThan(0);
    });

    it('toggles between two distinct opacity values', () => {
      const hidden = computeUndergroundGroundOpacity(false);
      const visible = computeUndergroundGroundOpacity(true);
      expect(hidden).not.toBe(visible);
    });
  });
});
