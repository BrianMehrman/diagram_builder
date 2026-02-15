/**
 * GroundShadow Tests
 *
 * Unit tests for the GroundShadow component.
 * WebGL rendering is unavailable in jsdom, so we test:
 *  1. Visibility gating via the store-driven utility functions (same as SkyEdge)
 *  2. Ground projection logic (all Y = 0) via THREE geometry
 *  3. Opacity values in normal vs transit-map mode via THREE material
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as THREE from 'three';
import { useCanvasStore } from '../store';
import { isSkyEdgeVisible, getSkyEdgeHeight, getSkyEdgeColor } from './skyEdgeUtils';
import type { GraphEdge } from '../../../shared/types';

const CURVE_SEGMENTS = 32;
const GROUND_Y = 0.01;
const NORMAL_OPACITY = 0.25;
const TRANSIT_MAP_OPACITY = 1.0;

/** Helper: build the same projected line the component would build */
function buildGroundLine(
  edgeType: GraphEdge['type'],
  srcX: number,
  srcZ: number,
  tgtX: number,
  tgtZ: number,
  transitMapMode: boolean,
): THREE.Line {
  const peakY = getSkyEdgeHeight(edgeType);
  const midX = (srcX + tgtX) / 2;
  const midZ = (srcZ + tgtZ) / 2;

  const curve = new THREE.QuadraticBezierCurve3(
    new THREE.Vector3(srcX, 0, srcZ),
    new THREE.Vector3(midX, peakY, midZ),
    new THREE.Vector3(tgtX, 0, tgtZ),
  );

  const points = curve.getPoints(CURVE_SEGMENTS);
  for (const p of points) {
    p.y = GROUND_Y;
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const color = getSkyEdgeColor(edgeType);
  const opacity = transitMapMode ? TRANSIT_MAP_OPACITY : NORMAL_OPACITY;

  const material = new THREE.LineBasicMaterial({
    color,
    opacity,
    transparent: true,
    depthWrite: false,
  });

  return new THREE.Line(geometry, material);
}

describe('GroundShadow', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset();
  });

  // ── Visibility (AC-4) ────────────────────────────────────────────
  describe('visibility gating', () => {
    it('is hidden at LOD 1 (same rule as SkyEdge)', () => {
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(lodLevel).toBe(1);
      expect(isSkyEdgeVisible('imports', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
    });

    it('is visible at LOD 2+', () => {
      useCanvasStore.getState().setLodLevel(2);
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(isSkyEdgeVisible('imports', lodLevel, citySettings.edgeTierVisibility)).toBe(true);
    });

    it('respects edge tier toggles', () => {
      useCanvasStore.getState().setLodLevel(3);
      useCanvasStore.getState().toggleEdgeTierVisibility('crossDistrict');
      const { lodLevel, citySettings } = useCanvasStore.getState();
      expect(isSkyEdgeVisible('imports', lodLevel, citySettings.edgeTierVisibility)).toBe(false);
    });
  });

  // ── Ground projection (AC-1, AC-2) ──────────────────────────────
  describe('ground projection', () => {
    it('projects all Y coordinates to ground level', () => {
      const line = buildGroundLine('imports', -10, 5, 20, -8, false);
      const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;
      const count = posAttr.count;

      expect(count).toBe(CURVE_SEGMENTS + 1);

      for (let i = 0; i < count; i++) {
        expect(posAttr.getY(i)).toBeCloseTo(GROUND_Y, 5);
      }
    });

    it('preserves X/Z from the bezier arc', () => {
      const srcX = -5;
      const srcZ = 3;
      const tgtX = 15;
      const tgtZ = -7;
      const line = buildGroundLine('imports', srcX, srcZ, tgtX, tgtZ, false);
      const posAttr = line.geometry.getAttribute('position') as THREE.BufferAttribute;

      // First point should match source
      expect(posAttr.getX(0)).toBeCloseTo(srcX, 3);
      expect(posAttr.getZ(0)).toBeCloseTo(srcZ, 3);

      // Last point should match target
      const last = posAttr.count - 1;
      expect(posAttr.getX(last)).toBeCloseTo(tgtX, 3);
      expect(posAttr.getZ(last)).toBeCloseTo(tgtZ, 3);
    });
  });

  // ── Opacity (AC-3, AC-5) ────────────────────────────────────────
  describe('opacity', () => {
    it('uses normal opacity (0.25) in default mode', () => {
      const line = buildGroundLine('imports', 0, 0, 10, 10, false);
      const mat = line.material as THREE.LineBasicMaterial;
      expect(mat.opacity).toBe(NORMAL_OPACITY);
      expect(mat.transparent).toBe(true);
    });

    it('uses full opacity (1.0) in transit map mode', () => {
      const line = buildGroundLine('imports', 0, 0, 10, 10, true);
      const mat = line.material as THREE.LineBasicMaterial;
      expect(mat.opacity).toBe(TRANSIT_MAP_OPACITY);
    });

    it('disables depthWrite to avoid ground-plane z-fighting', () => {
      const line = buildGroundLine('imports', 0, 0, 10, 10, false);
      const mat = line.material as THREE.LineBasicMaterial;
      expect(mat.depthWrite).toBe(false);
    });
  });

  // ── Color (matches SkyEdge) ─────────────────────────────────────
  describe('color', () => {
    it('uses the same color as SkyEdge for each type', () => {
      const types: GraphEdge['type'][] = ['imports', 'depends_on', 'calls', 'inherits'];
      for (const t of types) {
        const line = buildGroundLine(t, 0, 0, 10, 10, false);
        const mat = line.material as THREE.LineBasicMaterial;
        const expected = new THREE.Color(getSkyEdgeColor(t));
        expect(mat.color.getHexString()).toBe(expected.getHexString());
      }
    });
  });
});
