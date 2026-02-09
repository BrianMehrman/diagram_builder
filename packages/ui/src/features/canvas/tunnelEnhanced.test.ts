/**
 * Enhanced Dependency Tunnel Tests
 *
 * Tests for dependency type color mapping, junction computation,
 * animation toggle state, and legend items.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from './store';
import {
  getDependencyColor,
  computeJunctionSize,
  countTunnelsPerNode,
  DEPENDENCY_COLORS,
  LEGEND_ITEMS,
} from './tunnelEnhancedUtils';
import type { GraphEdge } from '../../shared/types';

describe('Tunnel Enhanced - Dependency Colors', () => {
  it('should return blue for production dependencies', () => {
    expect(getDependencyColor('production')).toBe(DEPENDENCY_COLORS.production);
  });

  it('should return purple for dev dependencies', () => {
    expect(getDependencyColor('dev')).toBe(DEPENDENCY_COLORS.dev);
  });

  it('should return green for peer dependencies', () => {
    expect(getDependencyColor('peer')).toBe(DEPENDENCY_COLORS.peer);
  });

  it('should return gray for type-only imports', () => {
    expect(getDependencyColor('type')).toBe(DEPENDENCY_COLORS.type);
  });

  it('should default to production color for unknown type', () => {
    expect(getDependencyColor('unknown' as 'production')).toBe(
      DEPENDENCY_COLORS.production
    );
  });
});

describe('Tunnel Enhanced - Junction Size', () => {
  it('should return base size for 1 tunnel', () => {
    expect(computeJunctionSize(1)).toBeCloseTo(0.4);
  });

  it('should scale with tunnel count', () => {
    const s1 = computeJunctionSize(1);
    const s5 = computeJunctionSize(5);
    expect(s5).toBeGreaterThan(s1);
  });

  it('should cap at maximum size', () => {
    const s100 = computeJunctionSize(100);
    expect(s100).toBeLessThanOrEqual(1.5);
  });
});

describe('Tunnel Enhanced - Tunnels Per Node', () => {
  const edges: GraphEdge[] = [
    { id: 'e1', source: 'a', target: 'b', type: 'imports', metadata: {} },
    { id: 'e2', source: 'a', target: 'c', type: 'imports', metadata: {} },
    { id: 'e3', source: 'b', target: 'c', type: 'depends_on', metadata: {} },
    { id: 'e4', source: 'd', target: 'a', type: 'imports', metadata: {} },
  ];

  it('should count edges per node (source + target)', () => {
    const counts = countTunnelsPerNode(edges);
    expect(counts.get('a')).toBe(3); // e1 source, e2 source, e4 target
    expect(counts.get('b')).toBe(2); // e1 target, e3 source
    expect(counts.get('c')).toBe(2); // e2 target, e3 target
    expect(counts.get('d')).toBe(1); // e4 source
  });

  it('should return empty map for empty edges', () => {
    const counts = countTunnelsPerNode([]);
    expect(counts.size).toBe(0);
  });
});

describe('Tunnel Enhanced - Animation Toggle Store', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  it('should default to flow animation off', () => {
    expect(useCanvasStore.getState().showFlowAnimation).toBe(false);
  });

  it('should toggle flow animation on', () => {
    useCanvasStore.getState().toggleFlowAnimation();
    expect(useCanvasStore.getState().showFlowAnimation).toBe(true);
  });

  it('should toggle flow animation off', () => {
    useCanvasStore.getState().toggleFlowAnimation();
    useCanvasStore.getState().toggleFlowAnimation();
    expect(useCanvasStore.getState().showFlowAnimation).toBe(false);
  });

  it('should reset flow animation to default', () => {
    useCanvasStore.getState().toggleFlowAnimation();
    useCanvasStore.getState().reset();
    expect(useCanvasStore.getState().showFlowAnimation).toBe(false);
  });
});

describe('Tunnel Enhanced - Legend Items', () => {
  it('should have 4 dependency types', () => {
    expect(LEGEND_ITEMS).toHaveLength(4);
  });

  it('should include production, dev, peer, type', () => {
    const types = LEGEND_ITEMS.map((i) => i.type);
    expect(types).toContain('production');
    expect(types).toContain('dev');
    expect(types).toContain('peer');
    expect(types).toContain('type');
  });

  it('should have a color and label for each item', () => {
    for (const item of LEGEND_ITEMS) {
      expect(item.color).toBeTruthy();
      expect(item.label).toBeTruthy();
    }
  });
});
