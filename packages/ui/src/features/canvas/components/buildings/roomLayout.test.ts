/**
 * Room Layout Utility Tests
 */

import { describe, it, expect } from 'vitest';
import { calculateRoomLayout, WALL_PADDING, ROOM_GAP } from './roomLayout';
import { METHOD_ROOM_HEIGHT } from '../../views/cityViewUtils';

describe('calculateRoomLayout', () => {
  const defaultWidth = 2.5;
  const defaultDepth = 2.5;

  it('returns empty array for zero methods', () => {
    expect(calculateRoomLayout(0, defaultWidth, 10, defaultDepth)).toEqual([]);
  });

  it('returns one room for one method', () => {
    const placements = calculateRoomLayout(1, defaultWidth, 10, defaultDepth);
    expect(placements).toHaveLength(1);
    expect(placements[0]!.methodIndex).toBe(0);
  });

  it('returns correct count for multiple methods', () => {
    const placements = calculateRoomLayout(5, defaultWidth, 20, defaultDepth);
    expect(placements).toHaveLength(5);
    placements.forEach((p, i) => {
      expect(p.methodIndex).toBe(i);
    });
  });

  it('rooms are positioned inside building bounds', () => {
    const buildingHeight = 20;
    const placements = calculateRoomLayout(5, defaultWidth, buildingHeight, defaultDepth);

    const interiorHalfWidth = (defaultWidth - WALL_PADDING * 2) / 2;
    const interiorHalfDepth = (defaultDepth - WALL_PADDING * 2) / 2;

    for (const p of placements) {
      // Room center ± half room size should be within building
      expect(p.position.x - p.size.width / 2).toBeGreaterThanOrEqual(-interiorHalfWidth - 0.01);
      expect(p.position.x + p.size.width / 2).toBeLessThanOrEqual(interiorHalfWidth + 0.01);
      expect(p.position.z - p.size.depth / 2).toBeGreaterThanOrEqual(-interiorHalfDepth - 0.01);
      expect(p.position.z + p.size.depth / 2).toBeLessThanOrEqual(interiorHalfDepth + 0.01);
      // Y should be positive (rooms stack upward from base)
      expect(p.position.y).toBeGreaterThan(0);
    }
  });

  it('rooms on different floors do not overlap vertically', () => {
    // Use narrow building to force 1 room per floor
    const narrowWidth = 1.0;
    const placements = calculateRoomLayout(3, narrowWidth, 20, defaultDepth);

    for (let i = 1; i < placements.length; i++) {
      const prev = placements[i - 1]!;
      const curr = placements[i]!;
      const prevTop = prev.position.y + prev.size.height / 2;
      const currBottom = curr.position.y - curr.size.height / 2;
      expect(currBottom).toBeGreaterThanOrEqual(prevTop - 0.01);
    }
  });

  it('rooms have positive dimensions', () => {
    const placements = calculateRoomLayout(3, defaultWidth, 15, defaultDepth);
    for (const p of placements) {
      expect(p.size.width).toBeGreaterThan(0);
      expect(p.size.height).toBeGreaterThan(0);
      expect(p.size.depth).toBeGreaterThan(0);
    }
  });

  it('room height is 80% of METHOD_ROOM_HEIGHT', () => {
    const placements = calculateRoomLayout(1, defaultWidth, 10, defaultDepth);
    expect(placements[0]!.size.height).toBeCloseTo(METHOD_ROOM_HEIGHT * 0.8);
  });

  it('stacks rooms on successive floors for narrow buildings', () => {
    // Use narrow building to force 1 room per floor
    const narrowWidth = 1.0;
    const placements = calculateRoomLayout(3, narrowWidth, 20, defaultDepth);
    // Each floor is METHOD_ROOM_HEIGHT apart
    for (let i = 1; i < placements.length; i++) {
      const yDiff = placements[i]!.position.y - placements[i - 1]!.position.y;
      expect(yDiff).toBeCloseTo(METHOD_ROOM_HEIGHT);
    }
  });

  it('supports multiple rooms per floor for wide buildings', () => {
    const wideWidth = 6; // Should fit multiple rooms
    const placements = calculateRoomLayout(4, wideWidth, 20, defaultDepth);
    // With wide building, first two methods should share floor 0
    expect(placements[0]!.position.y).toBe(placements[1]!.position.y);
    // And their X positions should differ
    expect(placements[0]!.position.x).not.toBe(placements[1]!.position.x);
  });

  it('handles negative method count gracefully', () => {
    expect(calculateRoomLayout(-1, defaultWidth, 10, defaultDepth)).toEqual([]);
  });
});
