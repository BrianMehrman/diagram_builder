import { describe, it, expect } from "vitest";
import {
  getBuildingHeight, getMethodBasedHeight, getContainmentHeight,
  getEncodedHeight, getLodTransition, getFootprintScale,
  FLOOR_HEIGHT, ROOM_LOD_THRESHOLD,
} from "./heightUtils";

describe("getBuildingHeight", () => {
  it("returns FLOOR_HEIGHT for depth 0", () => {
    expect(getBuildingHeight(0)).toBe(FLOOR_HEIGHT);
  });
  it("uses FLOOR_HEIGHT per depth level", () => {
    expect(getBuildingHeight(2)).toBe(3 * FLOOR_HEIGHT);
  });
  it("handles undefined depth", () => {
    expect(getBuildingHeight(undefined)).toBe(FLOOR_HEIGHT);
  });
});

describe("getMethodBasedHeight", () => {
  it("falls back to depth-based height when no methods", () => {
    expect(getMethodBasedHeight(0, 1)).toBe(getBuildingHeight(1));
  });
  it("uses log2 for method count", () => {
    expect(getMethodBasedHeight(3, 0)).toBeGreaterThan(FLOOR_HEIGHT);
  });
});

describe("getContainmentHeight", () => {
  it("minimum 1 floor", () => {
    expect(getContainmentHeight(0)).toBeGreaterThan(0);
  });
  it("scales with method count", () => {
    expect(getContainmentHeight(5)).toBeGreaterThan(getContainmentHeight(1));
  });
});

describe("getLodTransition", () => {
  it("showRooms=false below threshold", () => {
    const { showRooms } = getLodTransition(ROOM_LOD_THRESHOLD - 1);
    expect(showRooms).toBe(false);
  });
  it("showRooms=true at threshold", () => {
    const { showRooms } = getLodTransition(ROOM_LOD_THRESHOLD);
    expect(showRooms).toBe(true);
  });
  it("bandOpacity transitions from 1 to 0", () => {
    const low = getLodTransition(ROOM_LOD_THRESHOLD - 1);
    const high = getLodTransition(ROOM_LOD_THRESHOLD);
    expect(low.bandOpacity).toBeGreaterThan(high.bandOpacity);
  });
});

describe("getFootprintScale", () => {
  it("returns 1.0 for zero value", () => {
    expect(getFootprintScale({ methodCount: 0 }, { encoding: "methodCount" })).toBe(1.0);
  });
  it("returns > 1.0 for positive value", () => {
    expect(getFootprintScale({ methodCount: 10 }, { encoding: "methodCount" })).toBeGreaterThan(1.0);
  });
});
