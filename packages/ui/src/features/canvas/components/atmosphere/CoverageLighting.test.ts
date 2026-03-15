/**
 * CoverageLighting Tests
 *
 * Unit tests for coverage lighting utilities and visibility gating.
 * WebGL rendering is unavailable in jsdom, so we test:
 *  1. Coverage extraction utility logic (coverageLightingUtils)
 *  2. Visibility gating via store state
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useCanvasStore } from '../../store'
import { getTestCoverage, computeLightIntensity, computeLightColor } from './coverageLightingUtils'
import type { IVMNode } from '../../../../shared/types'

/** Helper: create a minimal IVMNode with optional testCoverage in metadata.properties */
function makeNode(id: string, testCoverage?: number): IVMNode {
  return {
    id,
    type: 'class',
    metadata: {
      label: id,
      path: `src/${id}.ts`,
      properties: testCoverage !== undefined ? { testCoverage } : {},
    },
    lod: 1,
    position: { x: 0, y: 0, z: 0 },
  }
}

describe('CoverageLighting', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
  })

  // ── getTestCoverage ─────────────────────────────────────────────
  describe('getTestCoverage', () => {
    it('returns testCoverage from metadata.properties', () => {
      const node = makeNode('a', 85)
      expect(getTestCoverage(node)).toBe(85)
    })

    it('returns null when metadata has no testCoverage (AC-5)', () => {
      const node = makeNode('a')
      expect(getTestCoverage(node)).toBeNull()
    })

    it('returns null when metadata.properties is empty', () => {
      const node: IVMNode = {
        id: 'x',
        type: 'file',
        metadata: { label: 'x', path: 'x.ts', properties: {} },
        lod: 1,
        position: { x: 0, y: 0, z: 0 },
      }
      expect(getTestCoverage(node)).toBeNull()
    })

    it('returns 0 for explicitly zero coverage (distinct from null)', () => {
      const node = makeNode('a', 0)
      expect(getTestCoverage(node)).toBe(0)
    })
  })

  // ── computeLightIntensity ───────────────────────────────────────
  describe('computeLightIntensity', () => {
    it('returns high intensity for 80-100% coverage (AC-1)', () => {
      expect(computeLightIntensity(80)).toBeGreaterThanOrEqual(1.5)
      expect(computeLightIntensity(100)).toBe(2.0)
      expect(computeLightIntensity(90)).toBeGreaterThan(1.5)
      expect(computeLightIntensity(90)).toBeLessThan(2.0)
    })

    it('returns 0 for 0-30% coverage (AC-2)', () => {
      expect(computeLightIntensity(0)).toBe(0)
      expect(computeLightIntensity(15)).toBe(0)
      expect(computeLightIntensity(30)).toBe(0)
    })

    it('returns 0 for null coverage (AC-5)', () => {
      expect(computeLightIntensity(null)).toBe(0)
    })

    it('returns interpolated value for mid-range coverage', () => {
      const mid = computeLightIntensity(55)
      expect(mid).toBeGreaterThan(0)
      expect(mid).toBeLessThan(1.5)
    })

    it('increases monotonically across range', () => {
      const i30 = computeLightIntensity(30)
      const i50 = computeLightIntensity(50)
      const i70 = computeLightIntensity(70)
      const i90 = computeLightIntensity(90)
      expect(i50).toBeGreaterThan(i30)
      expect(i70).toBeGreaterThan(i50)
      expect(i90).toBeGreaterThan(i70)
    })
  })

  // ── computeLightColor ───────────────────────────────────────────
  describe('computeLightColor', () => {
    it('returns warm white for high coverage', () => {
      expect(computeLightColor(90)).toBe('#FFF5E0')
      expect(computeLightColor(100)).toBe('#FFF5E0')
    })

    it('returns neutral white for null coverage', () => {
      expect(computeLightColor(null)).toBe('#FFFFFF')
    })

    it('returns neutral white for low coverage', () => {
      expect(computeLightColor(0)).toBe('#FFFFFF')
      expect(computeLightColor(30)).toBe('#FFFFFF')
    })

    it('returns blended color for mid-range coverage', () => {
      const color = computeLightColor(55)
      // Should be between neutral (#FFFFFF) and warm (#FFF5E0)
      expect(color).not.toBe('#FFFFFF')
      expect(color).not.toBe('#FFF5E0')
      expect(color.startsWith('#FF')).toBe(true)
    })
  })

  // ── Visibility gating (store-based) ─────────────────────────────
  describe('visibility gating', () => {
    it('should be hidden when lodLevel < 3 (AC-6)', () => {
      useCanvasStore.getState().setLodLevel(2)
      const { lodLevel, citySettings } = useCanvasStore.getState()
      expect(lodLevel).toBe(2)
      // Component would early-return null
      expect(lodLevel < 3).toBe(true)
      expect(citySettings.atmosphereOverlays.lighting).toBe(false)
    })

    it('should be visible when lodLevel >= 3 and lighting toggle is on', () => {
      useCanvasStore.getState().setLodLevel(3)
      useCanvasStore.getState().toggleAtmosphereOverlay('lighting')
      const { lodLevel, citySettings } = useCanvasStore.getState()
      expect(lodLevel).toBe(3)
      expect(citySettings.atmosphereOverlays.lighting).toBe(true)
      // Component would render
      const shouldRender = lodLevel >= 3 && citySettings.atmosphereOverlays.lighting
      expect(shouldRender).toBe(true)
    })

    it('should be hidden when atmosphereOverlays.lighting is false (AC-4)', () => {
      useCanvasStore.getState().setLodLevel(4)
      // lighting defaults to false — don't toggle it
      const { lodLevel, citySettings } = useCanvasStore.getState()
      expect(lodLevel).toBe(4)
      expect(citySettings.atmosphereOverlays.lighting).toBe(false)
      const shouldRender = lodLevel >= 3 && citySettings.atmosphereOverlays.lighting
      expect(shouldRender).toBe(false)
    })

    it('toggling lighting twice returns to original state', () => {
      useCanvasStore.getState().toggleAtmosphereOverlay('lighting')
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.lighting).toBe(true)
      useCanvasStore.getState().toggleAtmosphereOverlay('lighting')
      expect(useCanvasStore.getState().citySettings.atmosphereOverlays.lighting).toBe(false)
    })
  })
})
