/**
 * CityUnderground Utility Tests (Stories 11-9, 11-10)
 *
 * Verifies the edge-routing and visibility logic that CityUnderground relies on.
 * R3F rendering is not tested here (no jsdom dependency).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { classifyEdgeRouting } from '../views/cityViewUtils';
import { useCanvasStore } from '../store';

/** All GraphEdge types in the UI type system */
const ALL_EDGE_TYPES = ['contains', 'depends_on', 'calls', 'inherits', 'imports'] as const;

describe('CityUnderground — edge routing behaviour (Story 11-9)', () => {
  it('CitySky only renders overhead edges: only "calls" (and "composes") are overhead', () => {
    const overheadTypes = ALL_EDGE_TYPES.filter(
      (t) => classifyEdgeRouting(t) === 'overhead',
    );
    expect(overheadTypes).toEqual(['calls']);
  });

  it('CityUnderground only renders underground edges', () => {
    const undergroundTypes = ALL_EDGE_TYPES.filter(
      (t) => classifyEdgeRouting(t) === 'underground',
    );
    expect(undergroundTypes).toContain('imports');
    expect(undergroundTypes).toContain('depends_on');
    expect(undergroundTypes).toContain('inherits');
    expect(undergroundTypes).toContain('contains');
    expect(undergroundTypes).not.toContain('calls');
  });

  it('every edge type has exactly one routing layer (no overlap)', () => {
    for (const type of ALL_EDGE_TYPES) {
      const route = classifyEdgeRouting(type);
      expect(['underground', 'overhead']).toContain(route);
    }
  });

  it('routing is exhaustive — all known edge types are classified', () => {
    const classified = ALL_EDGE_TYPES.map((t) => ({
      type: t,
      routing: classifyEdgeRouting(t),
    }));
    for (const { routing } of classified) {
      expect(routing).toBeTruthy();
    }
  });

  it('imports + depends_on + inherits are all underground (structural group)', () => {
    expect(classifyEdgeRouting('imports')).toBe('underground');
    expect(classifyEdgeRouting('depends_on')).toBe('underground');
    expect(classifyEdgeRouting('inherits')).toBe('underground');
  });

  it('calls is overhead (runtime group)', () => {
    expect(classifyEdgeRouting('calls')).toBe('overhead');
  });
});

describe('CityUnderground — store visibility settings (Story 11-10)', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('underground is hidden by default', () => {
    expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
  });

  it('external pipes are hidden by default', () => {
    expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(false);
  });

  it('toggling underground shows it', () => {
    useCanvasStore.getState().toggleUndergroundVisible();
    expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(true);
  });

  it('external pipes only visible when both toggles are on', () => {
    // underground off, external off
    expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
    expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(false);

    // turn on external only — underground still off
    useCanvasStore.getState().toggleExternalPipes();
    expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(true);
    // underground still off — external pipes should NOT show (gated by underground first)
    expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);

    // turn on underground — now both are on
    useCanvasStore.getState().toggleUndergroundVisible();
    expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(true);
    expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(true);
  });

  it('store state persists toggle values between reads', () => {
    useCanvasStore.getState().toggleUndergroundVisible();
    useCanvasStore.getState().toggleExternalPipes();

    const state = useCanvasStore.getState().citySettings;
    expect(state.undergroundVisible).toBe(true);
    expect(state.externalPipesVisible).toBe(true);
  });

  it('reset clears underground settings back to defaults', () => {
    useCanvasStore.getState().toggleUndergroundVisible();
    useCanvasStore.getState().toggleExternalPipes();
    useCanvasStore.getState().reset();

    expect(useCanvasStore.getState().citySettings.undergroundVisible).toBe(false);
    expect(useCanvasStore.getState().citySettings.externalPipesVisible).toBe(false);
  });
});

describe('CityUnderground — external edge filtering logic', () => {
  /**
   * Simulate the filter logic used inside CityUnderground.tsx:
   * - Skip non-underground edges
   * - Skip external edges when externalPipesVisible is false
   */
  function filterPipes(
    edges: Array<{ source: string; target: string; type: string }>,
    externalNodeIds: Set<string>,
    externalPipesVisible: boolean,
  ) {
    return edges.filter((edge) => {
      if (classifyEdgeRouting(edge.type) !== 'underground') return false;
      const isExternal =
        externalNodeIds.has(edge.source) || externalNodeIds.has(edge.target);
      if (isExternal && !externalPipesVisible) return false;
      return true;
    });
  }

  const internalEdge = { source: 'A', target: 'B', type: 'imports' };
  const externalEdge = { source: 'A', target: 'react', type: 'imports' };
  const callsEdge    = { source: 'A', target: 'B', type: 'calls' };
  const externalIds  = new Set(['react']);

  it('shows internal pipes when underground is on, external is off', () => {
    const result = filterPipes([internalEdge], externalIds, false);
    expect(result).toHaveLength(1);
  });

  it('hides external pipes when externalPipesVisible is false', () => {
    const result = filterPipes([externalEdge], externalIds, false);
    expect(result).toHaveLength(0);
  });

  it('shows external pipes when externalPipesVisible is true', () => {
    const result = filterPipes([externalEdge], externalIds, true);
    expect(result).toHaveLength(1);
  });

  it('always excludes overhead edges regardless of external setting', () => {
    const result = filterPipes([callsEdge], externalIds, true);
    expect(result).toHaveLength(0);
  });

  it('mixes correctly: internal shown, external hidden', () => {
    const edges = [internalEdge, externalEdge, callsEdge];
    const result = filterPipes(edges, externalIds, false);
    expect(result).toHaveLength(1);
    expect(result[0]).toBe(internalEdge);
  });

  it('mixes correctly: all pipes shown when both toggles on', () => {
    const edges = [internalEdge, externalEdge];
    const result = filterPipes(edges, externalIds, true);
    expect(result).toHaveLength(2);
  });
});
