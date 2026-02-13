/**
 * RooftopGarden Y-Offset Tests
 *
 * Verifies that rooftop garden tiers are positioned correctly
 * on top of log-scaled building heights.
 */

import { describe, it, expect } from 'vitest';
import { ROOFTOP_GAP } from './RooftopGarden';
import { getLogScaledHeight } from './floorBandUtils';
import { FLOOR_HEIGHT, getBuildingHeight } from '../../views/cityViewUtils';
import { collectNestingTiers } from './nestedTypeUtils';
import type { GraphNode } from '../../../../shared/types';

/** Mirrors the constants in RooftopGarden.tsx */
const TIER_HEIGHT = 0.8;

function makeNode(overrides: Partial<GraphNode> & { id: string; type: GraphNode['type'] }): GraphNode {
  return {
    label: 'Test',
    metadata: {},
    lod: 1,
    ...overrides,
  };
}

/**
 * Replicates the Y-position calculation from RooftopGarden:
 *   cumulativeY starts at parentHeight + ROOFTOP_GAP
 *   each tier center = cumulativeY + TIER_HEIGHT / 2
 *   cumulativeY += TIER_HEIGHT after each tier
 */
function computeTierYPositions(parentHeight: number, tierCount: number): number[] {
  const positions: number[] = [];
  let cumulativeY = parentHeight + ROOFTOP_GAP;
  for (let i = 0; i < tierCount; i++) {
    positions.push(cumulativeY + TIER_HEIGHT / 2);
    cumulativeY += TIER_HEIGHT;
  }
  return positions;
}

describe('RooftopGarden Y-offset', () => {
  it('exports ROOFTOP_GAP as a positive number', () => {
    expect(ROOFTOP_GAP).toBeGreaterThan(0);
  });

  describe('tier positioning on log-scaled heights', () => {
    it('positions first tier above a 5-method class building', () => {
      const height = getLogScaledHeight(5, 0);
      const [firstTierY] = computeTierYPositions(height, 1);
      expect(firstTierY).toBeGreaterThan(height);
      expect(firstTierY).toBeCloseTo(height + ROOFTOP_GAP + TIER_HEIGHT / 2);
    });

    it('positions first tier above a 30-method class building', () => {
      const height = getLogScaledHeight(30, 0);
      const [firstTierY] = computeTierYPositions(height, 1);
      expect(firstTierY).toBeGreaterThan(height);
      expect(firstTierY).toBeCloseTo(height + ROOFTOP_GAP + TIER_HEIGHT / 2);
    });

    it('30-method building rooftop is higher than 5-method building rooftop', () => {
      const h5 = getLogScaledHeight(5, 0);
      const h30 = getLogScaledHeight(30, 0);
      const [y5] = computeTierYPositions(h5, 1);
      const [y30] = computeTierYPositions(h30, 1);
      expect(y30).toBeGreaterThan(y5!);
    });

    it('positions correctly on depth-based fallback height (no methods)', () => {
      const height = getBuildingHeight(2); // (2+1) * FLOOR_HEIGHT
      const [firstTierY] = computeTierYPositions(height, 1);
      expect(firstTierY).toBeCloseTo(3 * FLOOR_HEIGHT + ROOFTOP_GAP + TIER_HEIGHT / 2);
    });
  });

  describe('multi-tier stacking', () => {
    it('stacks 3 tiers with correct spacing', () => {
      const height = getLogScaledHeight(10, 0);
      const positions = computeTierYPositions(height, 3);

      expect(positions).toHaveLength(3);
      // Each tier is TIER_HEIGHT above the previous
      expect(positions[1]! - positions[0]!).toBeCloseTo(TIER_HEIGHT);
      expect(positions[2]! - positions[1]!).toBeCloseTo(TIER_HEIGHT);
    });

    it('all tiers are above the building top', () => {
      const height = getLogScaledHeight(100, 0);
      const positions = computeTierYPositions(height, 3);

      for (const y of positions) {
        expect(y).toBeGreaterThan(height);
      }
    });
  });

  describe('nesting tier collection', () => {
    it('collects tiers from nested type map', () => {
      const nestedMap = new Map<string, GraphNode[]>();
      nestedMap.set('parent', [
        makeNode({ id: 'child1', type: 'class', parentId: 'parent' }),
        makeNode({ id: 'child2', type: 'enum', parentId: 'parent' }),
      ]);
      nestedMap.set('child1', [
        makeNode({ id: 'grandchild1', type: 'interface', parentId: 'child1' }),
      ]);

      const tiers = collectNestingTiers('parent', nestedMap, 3);
      expect(tiers).toHaveLength(2);
      expect(tiers[0]).toHaveLength(2);
      expect(tiers[1]).toHaveLength(1);
    });

    it('returns empty array when no nested types', () => {
      const nestedMap = new Map<string, GraphNode[]>();
      const tiers = collectNestingTiers('no-children', nestedMap, 3);
      expect(tiers).toHaveLength(0);
    });
  });
});
