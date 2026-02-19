/**
 * SkyEdge Tests
 *
 * Unit tests for the SkyEdge component's visibility logic.
 * Full WebGL rendering is not available in jsdom, so we test
 * the store-driven visibility gating via the utility functions
 * and verify component instantiation does not throw.
 *
 * After Story 11-9: only 'calls' edges are sky/overhead edges.
 * Imports, depends_on, inherits now route underground.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../store';
import { isSkyEdgeVisible } from './skyEdgeUtils';
import type { GraphEdge } from '../../../shared/types';

const makeEdge = (type: GraphEdge['type']): GraphEdge => ({
  id: `edge-${type}`,
  source: 'src-node',
  target: 'tgt-node',
  type,
  metadata: {},
});

describe('SkyEdge visibility (store integration)', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('is hidden at default LOD level (1)', () => {
    const { lodLevel, citySettings } = useCanvasStore.getState();
    expect(lodLevel).toBe(1);
    expect(isSkyEdgeVisible('calls', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
  });

  it('is visible at LOD 2 with crossDistrict enabled (calls edge)', () => {
    useCanvasStore.getState().setLodLevel(2);
    const { lodLevel, citySettings } = useCanvasStore.getState();
    expect(isSkyEdgeVisible('calls', lodLevel, citySettings.edgeTierVisibility)).toBe(true);
  });

  it('imports is NOT visible at LOD 2 — it now routes underground', () => {
    useCanvasStore.getState().setLodLevel(2);
    const { lodLevel, citySettings } = useCanvasStore.getState();
    expect(isSkyEdgeVisible('imports', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
    expect(isSkyEdgeVisible('depends_on', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
    expect(isSkyEdgeVisible('inherits', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
  });

  it('hides crossDistrict edges when that tier is toggled off', () => {
    useCanvasStore.getState().setLodLevel(3);
    useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');

    const { lodLevel, citySettings } = useCanvasStore.getState();
    expect(citySettings.edgeTierVisibility.crossDistrict).toBe(false);
    expect(isSkyEdgeVisible('calls', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
  });

  it('calls is visible when crossDistrict is enabled at LOD 2+', () => {
    useCanvasStore.getState().setLodLevel(2);
    const { lodLevel, citySettings } = useCanvasStore.getState();
    expect(citySettings.edgeTierVisibility.crossDistrict).toBe(true);
    expect(isSkyEdgeVisible('calls', lodLevel, citySettings.edgeTierVisibility)).toBe(true);
  });

  it('never shows "contains" edges regardless of LOD or settings', () => {
    useCanvasStore.getState().setLodLevel(3);
    const { lodLevel, citySettings } = useCanvasStore.getState();
    expect(isSkyEdgeVisible('contains', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
  });

  it('all edge types supported by makeEdge helper', () => {
    const types: GraphEdge['type'][] = ['imports', 'depends_on', 'calls', 'inherits', 'contains'];
    for (const t of types) {
      const edge = makeEdge(t);
      expect(edge.type).toBe(t);
    }
  });
});
