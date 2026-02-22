import { describe, it, expect } from "vitest";
import { classifyEdgeRouting, calculateWireArcPeak, isWireVisible, getWireColor, WIRE_LOD_MIN } from "./wireUtils";

describe("classifyEdgeRouting", () => {
  it('calls -> overhead', () => expect(classifyEdgeRouting('calls')).toBe('overhead'));
  it('composes -> overhead', () => expect(classifyEdgeRouting('composes')).toBe('overhead'));
  it('imports -> underground', () => expect(classifyEdgeRouting('imports')).toBe('underground'));
  it('extends -> underground', () => expect(classifyEdgeRouting('extends')).toBe('underground'));
  it('case insensitive', () => expect(classifyEdgeRouting('CALLS')).toBe('overhead'));
});

describe("calculateWireArcPeak", () => {
  it("clears the taller rooftop", () => {
    const peak = calculateWireArcPeak(5, 10, 0);
    expect(peak).toBeGreaterThan(10);
  });
  it("increases with horizontal distance", () => {
    const near = calculateWireArcPeak(5, 5, 10);
    const far = calculateWireArcPeak(5, 5, 50);
    expect(far).toBeGreaterThan(near);
  });
});

describe("isWireVisible", () => {
  it("false below WIRE_LOD_MIN", () => expect(isWireVisible(WIRE_LOD_MIN - 1)).toBe(false));
  it("true at WIRE_LOD_MIN", () => expect(isWireVisible(WIRE_LOD_MIN)).toBe(true));
});

describe("getWireColor", () => {
  it('returns specific color for known type', () => expect(getWireColor('calls')).toBe('#34d399'));
  it('returns default for unknown type', () => expect(getWireColor('unknown')).toBe('#6ee7b7'));
});
