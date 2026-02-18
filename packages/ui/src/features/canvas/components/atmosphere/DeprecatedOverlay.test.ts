/**
 * DeprecatedOverlay Tests
 *
 * Unit tests for deprecated detection utilities and visibility gating.
 * WebGL rendering is unavailable in jsdom, so we test:
 *  1. Detection utility logic (deprecatedUtils)
 *  2. Visibility gating via store state
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore } from '../../store';
import {
  isDeprecated,
  DEPRECATED_COLOR,
  DEPRECATED_STRIPE_COLOR,
  DEPRECATED_ROUGHNESS,
  DEPRECATED_METALNESS,
} from './deprecatedUtils';
import type { GraphNode } from '../../../../shared/types';

/** Helper: create a minimal GraphNode with optional isDeprecated */
function makeNode(
  id: string,
  options: {
    deprecated?: boolean;
    nestedDeprecated?: boolean;
    metadataDeprecated?: boolean;
  } = {},
): GraphNode {
  const metadata: Record<string, unknown> = {};
  if (options.metadataDeprecated !== undefined) {
    metadata.isDeprecated = options.metadataDeprecated;
  }
  if (options.nestedDeprecated !== undefined) {
    metadata.properties = { isDeprecated: options.nestedDeprecated };
  }

  const node: GraphNode = {
    id,
    type: 'class',
    label: id,
    metadata,
    lod: 1,
  };

  if (options.deprecated !== undefined) {
    node.isDeprecated = options.deprecated;
  }

  return node;
}

describe('DeprecatedOverlay', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // ── isDeprecated ──────────────────────────────────────────────
  describe('isDeprecated', () => {
    it('returns true when node.isDeprecated is true', () => {
      const node = makeNode('a', { deprecated: true });
      expect(isDeprecated(node)).toBe(true);
    });

    it('returns false when node.isDeprecated is false', () => {
      const node = makeNode('a', { deprecated: false });
      expect(isDeprecated(node)).toBe(false);
    });

    it('returns true when metadata.isDeprecated is true', () => {
      const node = makeNode('a', { metadataDeprecated: true });
      expect(isDeprecated(node)).toBe(true);
    });

    it('returns false when metadata.isDeprecated is false', () => {
      const node = makeNode('a', { metadataDeprecated: false });
      expect(isDeprecated(node)).toBe(false);
    });

    it('returns true when metadata.properties.isDeprecated is true', () => {
      const node = makeNode('a', { nestedDeprecated: true });
      expect(isDeprecated(node)).toBe(true);
    });

    it('returns false when no deprecated flag set (AC-4)', () => {
      const node = makeNode('a');
      expect(isDeprecated(node)).toBe(false);
    });

    it('returns false when metadata is empty object', () => {
      const node: GraphNode = {
        id: 'x',
        type: 'file',
        label: 'x',
        metadata: {},
        lod: 1,
      };
      expect(isDeprecated(node)).toBe(false);
    });

    it('prioritizes direct field over metadata', () => {
      const node = makeNode('a', { deprecated: true, metadataDeprecated: false });
      // Direct field is checked first, returns true
      expect(isDeprecated(node)).toBe(true);
    });
  });

  // ── Constants ─────────────────────────────────────────────────
  describe('constants', () => {
    it('has dark deprecated color', () => {
      expect(DEPRECATED_COLOR).toBe('#4B5563');
    });

    it('has lighter stripe color', () => {
      expect(DEPRECATED_STRIPE_COLOR).toBe('#6B7280');
    });

    it('has high roughness for weathered look', () => {
      expect(DEPRECATED_ROUGHNESS).toBe(0.9);
    });

    it('has low metalness for dull look', () => {
      expect(DEPRECATED_METALNESS).toBe(0.1);
    });
  });

  // ── Visibility gating (store-based) ───────────────────────────
  describe('visibility gating', () => {
    it('deprecated overlay defaults to off', () => {
      const { citySettings } = useCanvasStore.getState();
      expect(citySettings.atmosphereOverlays.deprecated).toBe(false);
    });

    it('should be visible when deprecated toggle is on', () => {
      useCanvasStore.getState().toggleAtmosphereOverlay('deprecated');
      const { citySettings } = useCanvasStore.getState();
      expect(citySettings.atmosphereOverlays.deprecated).toBe(true);
    });

    it('should be hidden when atmosphereOverlays.deprecated is false (AC-3)', () => {
      // Don't toggle — defaults to false
      const { citySettings } = useCanvasStore.getState();
      expect(citySettings.atmosphereOverlays.deprecated).toBe(false);
    });

    it('toggling deprecated twice returns to original state', () => {
      useCanvasStore.getState().toggleAtmosphereOverlay('deprecated');
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.deprecated).toBe(true);
      useCanvasStore.getState().toggleAtmosphereOverlay('deprecated');
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.deprecated).toBe(false);
    });
  });
});
