import { describe, it, expect } from 'vitest';
import {
  calculateRingRadius,
  assignDistrictArcs,
  positionNodesInArc,
  calculateEntryPointPosition,
  distributeDistrictsAcrossRings,
} from './radialLayoutUtils';

describe('radialLayoutUtils', () => {
  describe('calculateRingRadius', () => {
    it('should return centerRadius when depth is 0', () => {
      expect(calculateRingRadius(0, { centerRadius: 10, ringSpacing: 20 })).toBe(10);
    });

    it('should return centerRadius + depth * ringSpacing', () => {
      expect(calculateRingRadius(1, { centerRadius: 10, ringSpacing: 20 })).toBe(30);
      expect(calculateRingRadius(2, { centerRadius: 10, ringSpacing: 20 })).toBe(50);
      expect(calculateRingRadius(3, { centerRadius: 5, ringSpacing: 15 })).toBe(50);
    });

    it('should handle zero centerRadius', () => {
      expect(calculateRingRadius(1, { centerRadius: 0, ringSpacing: 10 })).toBe(10);
    });

    it('should handle zero ringSpacing', () => {
      expect(calculateRingRadius(5, { centerRadius: 10, ringSpacing: 0 })).toBe(10);
    });
  });

  describe('assignDistrictArcs', () => {
    it('should assign full circle to single district', () => {
      const districts = [{ id: 'src', nodeCount: 5 }];
      const result = assignDistrictArcs(districts, 1, { arcPadding: 0 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('src');
      expect(result[0].arcStart).toBeCloseTo(0);
      expect(result[0].arcEnd).toBeCloseTo(2 * Math.PI);
    });

    it('should divide arc proportionally by node count', () => {
      const districts = [
        { id: 'a', nodeCount: 3 },
        { id: 'b', nodeCount: 1 },
      ];
      const result = assignDistrictArcs(districts, 1, { arcPadding: 0 });

      expect(result).toHaveLength(2);
      // District 'a' has 3/4 of the total nodes, should get ~3/4 of the arc
      const arcA = result[0].arcEnd - result[0].arcStart;
      const arcB = result[1].arcEnd - result[1].arcStart;
      expect(arcA / arcB).toBeCloseTo(3, 0);
    });

    it('should apply arcPadding between districts', () => {
      const districts = [
        { id: 'a', nodeCount: 5 },
        { id: 'b', nodeCount: 5 },
      ];
      const withPadding = assignDistrictArcs(districts, 1, { arcPadding: 0.1 });
      const noPadding = assignDistrictArcs(districts, 1, { arcPadding: 0 });

      // With padding, usable arc should be less
      const usableWithPadding =
        (withPadding[0].arcEnd - withPadding[0].arcStart) +
        (withPadding[1].arcEnd - withPadding[1].arcStart);
      const usableNoPadding =
        (noPadding[0].arcEnd - noPadding[0].arcStart) +
        (noPadding[1].arcEnd - noPadding[1].arcStart);

      expect(usableWithPadding).toBeLessThan(usableNoPadding);
    });

    it('should return empty array for empty districts', () => {
      const result = assignDistrictArcs([], 1, { arcPadding: 0 });
      expect(result).toHaveLength(0);
    });

    it('should produce contiguous arc segments', () => {
      const districts = [
        { id: 'a', nodeCount: 2 },
        { id: 'b', nodeCount: 3 },
        { id: 'c', nodeCount: 1 },
      ];
      const result = assignDistrictArcs(districts, 1, { arcPadding: 0.05 });

      // Each segment start should follow previous end + padding
      for (let i = 1; i < result.length; i++) {
        expect(result[i].arcStart).toBeGreaterThanOrEqual(result[i - 1].arcEnd);
      }
    });
  });

  describe('positionNodesInArc', () => {
    it('should position single node at arc midpoint', () => {
      const nodes = [{ id: 'n1' }];
      const result = positionNodesInArc(nodes, 0, Math.PI / 2, 10, { buildingSpacing: 1 });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('n1');
      // Should be at the midpoint angle (PI/4) at radius 10
      const expectedAngle = Math.PI / 4;
      expect(result[0].position.x).toBeCloseTo(Math.cos(expectedAngle) * 10, 1);
      expect(result[0].position.z).toBeCloseTo(Math.sin(expectedAngle) * 10, 1);
      expect(result[0].position.y).toBe(0);
    });

    it('should distribute multiple nodes evenly across arc', () => {
      const nodes = [{ id: 'n1' }, { id: 'n2' }, { id: 'n3' }];
      const result = positionNodesInArc(nodes, 0, Math.PI, 10, { buildingSpacing: 1 });

      expect(result).toHaveLength(3);
      // All nodes should be at radius 10 from origin
      for (const r of result) {
        const dist = Math.sqrt(r.position.x ** 2 + r.position.z ** 2);
        expect(dist).toBeCloseTo(10, 1);
      }
    });

    it('should return empty array for no nodes', () => {
      const result = positionNodesInArc([], 0, Math.PI, 10, { buildingSpacing: 1 });
      expect(result).toHaveLength(0);
    });

    it('should set y to 0 for all nodes', () => {
      const nodes = [{ id: 'n1' }, { id: 'n2' }];
      const result = positionNodesInArc(nodes, 0, Math.PI, 20, { buildingSpacing: 1 });

      for (const r of result) {
        expect(r.position.y).toBe(0);
      }
    });
  });

  describe('calculateEntryPointPosition', () => {
    it('should position single entry node at center', () => {
      const result = calculateEntryPointPosition(
        [{ id: 'entry1' }],
        { centerRadius: 10 }
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('entry1');
      expect(result[0].position.x).toBe(0);
      expect(result[0].position.y).toBe(0);
      expect(result[0].position.z).toBe(0);
    });

    it('should distribute multiple entry points within centerRadius', () => {
      const result = calculateEntryPointPosition(
        [{ id: 'e1' }, { id: 'e2' }, { id: 'e3' }],
        { centerRadius: 10 }
      );

      expect(result).toHaveLength(3);
      // All entry points should be within centerRadius
      for (const r of result) {
        const dist = Math.sqrt(r.position.x ** 2 + r.position.z ** 2);
        expect(dist).toBeLessThanOrEqual(10);
      }
    });

    it('should return empty array for no entry nodes', () => {
      const result = calculateEntryPointPosition([], { centerRadius: 10 });
      expect(result).toHaveLength(0);
    });
  });

  describe('distributeDistrictsAcrossRings', () => {
    it('should assign district to single ring when all nodes at same depth', () => {
      const districts = [{ id: 'src', nodeIds: ['n1', 'n2'] }];
      const nodeDepths = new Map([['n1', 1], ['n2', 1]]);
      const result = distributeDistrictsAcrossRings(districts, nodeDepths, {
        centerRadius: 5,
        ringSpacing: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0].districtId).toBe('src');
      expect(result[0].ringDepth).toBe(1);
      expect(result[0].nodeIds).toEqual(['n1', 'n2']);
    });

    it('should split district across rings when nodes span multiple depths', () => {
      const districts = [{ id: 'src', nodeIds: ['n1', 'n2', 'n3'] }];
      const nodeDepths = new Map([['n1', 0], ['n2', 1], ['n3', 2]]);
      const result = distributeDistrictsAcrossRings(districts, nodeDepths, {
        centerRadius: 5,
        ringSpacing: 10,
      });

      // Should produce 3 ring assignments (one per depth)
      expect(result.length).toBe(3);
      expect(result.map((r) => r.ringDepth).sort()).toEqual([0, 1, 2]);
    });

    it('should handle multiple districts', () => {
      const districts = [
        { id: 'a', nodeIds: ['a1', 'a2'] },
        { id: 'b', nodeIds: ['b1'] },
      ];
      const nodeDepths = new Map([['a1', 0], ['a2', 1], ['b1', 0]]);
      const result = distributeDistrictsAcrossRings(districts, nodeDepths, {
        centerRadius: 5,
        ringSpacing: 10,
      });

      // District 'a' spans 2 depths, district 'b' has 1
      expect(result.length).toBe(3);
    });

    it('should return empty array for empty districts', () => {
      const result = distributeDistrictsAcrossRings([], new Map(), {
        centerRadius: 5,
        ringSpacing: 10,
      });
      expect(result).toHaveLength(0);
    });

    it('should handle nodes at non-adjacent depths', () => {
      const districts = [{ id: 'src', nodeIds: ['n1', 'n2'] }];
      const nodeDepths = new Map([['n1', 0], ['n2', 3]]);
      const result = distributeDistrictsAcrossRings(districts, nodeDepths, {
        centerRadius: 5,
        ringSpacing: 10,
      });

      // Should produce ring assignments for depths 0 and 3
      const depths = result.map((r) => r.ringDepth).sort();
      expect(depths).toEqual([0, 3]);
    });
  });
});
