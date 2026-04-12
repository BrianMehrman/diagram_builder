# Code Review Fixes + URL Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix three code-review issues found on `feature/3d-performance-lod` and add URL persistence for camera position and active layout.

**Architecture:** Four tasks — two comment fixes, one LOD calculation fix (camera-to-target distance), and one new hook for continuous URL sync. All changes are additive or narrow in scope; no architectural changes.

**Tech Stack:** TypeScript, React, Zustand, React Three Fiber (`useFrame`), Vitest

---

### Task 1: Fix LOD calculation — camera-to-target distance instead of camera-to-origin

**Files:**
- Modify: `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts`
- Modify: `packages/ui/src/features/canvas/hooks/useLodCalculator.ts`
- Modify: `packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts`

**Context:**
`useLodCalculator.ts` calls `cameraDistanceToOrigin(camera.position.x/y/z)`. This computes distance from camera to `(0,0,0)`. After flying to a cluster centroid far from origin, the camera is near the centroid but still far from origin → LOD stays at 1, cluster blobs never dissolve into individual nodes.

Fix: compute distance from camera position to `camera.target` (the OrbitControls look-at point). The store's `camera.target` is already set to the cluster centroid on fly-in via `setCameraTarget`. Default target is `(0,0,0)` — no change in normal use.

- [ ] **Step 1: Write the failing test**

In `lodCalculatorUtils.test.ts`, add tests for the new `cameraDistanceToTarget` function:

```ts
describe('cameraDistanceToTarget', () => {
  it('returns 0 when camera is at target', () => {
    expect(cameraDistanceToTarget(5, 3, 1, 5, 3, 1)).toBe(0)
  })

  it('matches cameraDistanceToOrigin when target is origin', () => {
    expect(cameraDistanceToTarget(3, 4, 0, 0, 0, 0)).toBeCloseTo(5)
  })

  it('computes distance relative to non-origin target', () => {
    // Camera at (250, 0, 0), target at (200, 0, 0) → distance = 50
    expect(cameraDistanceToTarget(250, 0, 0, 200, 0, 0)).toBeCloseTo(50)
  })

  it('uses target distance for LOD — far from origin but close to target → LOD 4', () => {
    // Camera 50 units from target (in LOD 4 range) but 250 units from origin
    const dist = cameraDistanceToTarget(250, 0, 0, 200, 0, 0)
    expect(calculateLodFromDistance(dist)).toBe(4)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/ui && npx vitest run src/features/canvas/hooks/lodCalculatorUtils.test.ts
```

Expected: FAIL — `cameraDistanceToTarget is not a function`

- [ ] **Step 3: Add `cameraDistanceToTarget` to `lodCalculatorUtils.ts`**

Add after `cameraDistanceToOrigin`:

```ts
/**
 * Calculate euclidean distance from camera position to a target point.
 * Use this instead of cameraDistanceToOrigin when the scene has a non-origin
 * focal point (e.g. after flying to a cluster centroid).
 */
export function cameraDistanceToTarget(
  camX: number,
  camY: number,
  camZ: number,
  targetX: number,
  targetY: number,
  targetZ: number,
): number {
  const dx = camX - targetX
  const dy = camY - targetY
  const dz = camZ - targetZ
  return Math.sqrt(dx * dx + dy * dy + dz * dz)
}
```

- [ ] **Step 4: Update `useLodCalculator.ts` to use camera-to-target**

Replace the existing `useFrame` body:

```ts
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useCanvasStore } from '../store'
import { cameraDistanceToTarget, calculateLodWithHysteresis } from './lodCalculatorUtils'

export function useLodCalculator(): void {
  const setLodLevel = useCanvasStore((s) => s.setLodLevel)
  const currentLodRef = useRef(useCanvasStore.getState().lodLevel)

  useFrame(({ camera }) => {
    if (useCanvasStore.getState().lodManualOverride) return

    const { target } = useCanvasStore.getState().camera
    const distance = cameraDistanceToTarget(
      camera.position.x,
      camera.position.y,
      camera.position.z,
      target.x,
      target.y,
      target.z,
    )

    const newLod = calculateLodWithHysteresis(distance, currentLodRef.current)

    if (newLod !== currentLodRef.current) {
      currentLodRef.current = newLod
      setLodLevel(newLod)
    }
  })
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd packages/ui && npx vitest run src/features/canvas/hooks/lodCalculatorUtils.test.ts
```

Expected: PASS

- [ ] **Step 6: Run full CI checks**

```bash
cd packages/ui && npx vitest run && npm run type-check && npm run lint && npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: all pass

- [ ] **Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/hooks/lodCalculatorUtils.ts \
        packages/ui/src/features/canvas/hooks/lodCalculatorUtils.test.ts \
        packages/ui/src/features/canvas/hooks/useLodCalculator.ts
git commit -m "fix(lod): compute LOD distance from camera to target, not origin — fixes cluster fly-in LOD transition"
```

---

### Task 2: Fix comment on `positions` return value in `useBasic3DLayout`

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts`

**Context:**
`positions: positionsRef.current` at the return statement is a ref value, not reactive state. Any consumer that reads `positions` from this hook without also subscribing to `layoutState` will see a stale empty map. A comment documents this hazard so future callers don't get surprised.

- [ ] **Step 1: Add the comment**

Find the return block near line 227:

```ts
  return {
    positions: positionsRef.current,
    graph,
    maxDepth,
  }
```

Change to:

```ts
  return {
    // NOTE: positionsRef.current is a ref value — not reactive. Callers must also
    // subscribe to layoutState from the store and re-read positions when it transitions
    // to 'ready'. Basic3DView does this correctly; any new consumer must do the same.
    positions: positionsRef.current,
    graph,
    maxDepth,
  }
```

- [ ] **Step 2: Run CI checks**

```bash
cd packages/ui && npm run type-check && npm run lint && npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/useBasic3DLayout.ts
git commit -m "docs(basic3d): document positions ref dependency on layoutState for future consumers"
```

---

### Task 3: Fix stale header comment in `Basic3DView.tsx`

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx`

**Context:**
The file header at line 9 says `LOD 4: + Structural nodes (file, class, interface, type)` — but `file` is in `CONTAINER_TYPES` (visible from LOD 2 onward). LOD 4 only adds `class`, `interface`, and `type`.

- [ ] **Step 1: Fix the comment**

Change line 9 from:
```
 * LOD 4 (25–60 units):   + Structural nodes (file, class, interface, type), labels visible
```

To:
```
 * LOD 4 (25–60 units):   + class, interface, type nodes (file visible from LOD 2), labels visible
```

- [ ] **Step 2: Run CI checks**

```bash
cd packages/ui && npm run type-check && npm run lint && npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: all pass

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/basic3d/Basic3DView.tsx
git commit -m "docs(basic3d): correct LOD 4 header comment — file is visible from LOD 2, not LOD 4"
```

---

### Task 4: URL persistence for camera position and active layout

**Files:**
- Create: `packages/ui/src/shared/hooks/useCanvasUrlSync.ts`
- Create: `packages/ui/src/shared/hooks/useCanvasUrlSync.test.ts`
- Modify: `packages/ui/src/shared/hooks/index.ts`
- Modify: `packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts`
- Modify: `packages/ui/src/pages/WorkspacePage.tsx`

**Context:**
The app has no URL sync. If a user bookmarks or shares the URL, they land at the default view. The `generateViewpointLink` function in `useGlobalKeyboardShortcuts.ts` builds a URL but (a) doesn't include `layout` and (b) is only used for Ctrl+Shift+S copy — the URL bar itself is never updated.

**URL params managed:**
- `layout` → `activeLayout` (`city` | `basic3d`)
- `cx`, `cy`, `cz` → `camera.position` (floats, 2 decimal places)
- `tx`, `ty`, `tz` → `camera.target` (floats, 2 decimal places)

LOD is omitted — it derives from distance automatically on load.

**Behavior:**
- On mount: parse params, apply to store (invalid/missing params are silently ignored)
- On state change: debounced 500ms write to URL via `history.replaceState` (no navigation, no re-render)

- [ ] **Step 1: Write failing tests**

Create `packages/ui/src/shared/hooks/useCanvasUrlSync.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useCanvasUrlSync } from './useCanvasUrlSync'
import { useCanvasStore } from '../../features/canvas/store'

// Mock history.replaceState
const replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})

function setUrl(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
  })
}

beforeEach(() => {
  replaceStateSpy.mockClear()
  useCanvasStore.getState().resetStore?.()
  setUrl('')
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useCanvasUrlSync', () => {
  describe('on mount — reads URL params into store', () => {
    it('restores activeLayout from ?layout=basic3d', () => {
      setUrl('?layout=basic3d')
      renderHook(() => useCanvasUrlSync())
      expect(useCanvasStore.getState().activeLayout).toBe('basic3d')
    })

    it('restores camera position from cx/cy/cz params', () => {
      setUrl('?cx=10.00&cy=20.00&cz=30.00')
      renderHook(() => useCanvasUrlSync())
      const pos = useCanvasStore.getState().camera.position
      expect(pos.x).toBeCloseTo(10)
      expect(pos.y).toBeCloseTo(20)
      expect(pos.z).toBeCloseTo(30)
    })

    it('restores camera target from tx/ty/tz params', () => {
      setUrl('?tx=1.00&ty=2.00&tz=3.00')
      renderHook(() => useCanvasUrlSync())
      const target = useCanvasStore.getState().camera.target
      expect(target.x).toBeCloseTo(1)
      expect(target.y).toBeCloseTo(2)
      expect(target.z).toBeCloseTo(3)
    })

    it('ignores invalid layout value', () => {
      setUrl('?layout=invalid')
      renderHook(() => useCanvasUrlSync())
      expect(useCanvasStore.getState().activeLayout).toBe('city')
    })

    it('ignores non-numeric camera params', () => {
      setUrl('?cx=NaN&cy=abc')
      renderHook(() => useCanvasUrlSync())
      const pos = useCanvasStore.getState().camera.position
      expect(pos.x).toBe(0)
      expect(pos.y).toBe(0)
    })
  })

  describe('on state change — updates URL', () => {
    it('writes layout param when activeLayout changes', () => {
      vi.useFakeTimers()
      renderHook(() => useCanvasUrlSync())
      act(() => {
        useCanvasStore.getState().setActiveLayout('basic3d')
        vi.advanceTimersByTime(500)
      })
      expect(replaceStateSpy).toHaveBeenCalled()
      const url = replaceStateSpy.mock.calls[0]?.[2] as string
      expect(url).toContain('layout=basic3d')
    })

    it('writes camera position params when camera moves', () => {
      vi.useFakeTimers()
      renderHook(() => useCanvasUrlSync())
      act(() => {
        useCanvasStore.getState().setCameraPosition({ x: 50, y: 25, z: 10 })
        vi.advanceTimersByTime(500)
      })
      expect(replaceStateSpy).toHaveBeenCalled()
      const url = replaceStateSpy.mock.calls[0]?.[2] as string
      expect(url).toContain('cx=50.00')
      expect(url).toContain('cy=25.00')
      expect(url).toContain('cz=10.00')
    })

    it('debounces — only one replaceState call after multiple rapid changes', () => {
      vi.useFakeTimers()
      renderHook(() => useCanvasUrlSync())
      act(() => {
        useCanvasStore.getState().setCameraPosition({ x: 1, y: 0, z: 0 })
        useCanvasStore.getState().setCameraPosition({ x: 2, y: 0, z: 0 })
        useCanvasStore.getState().setCameraPosition({ x: 3, y: 0, z: 0 })
        vi.advanceTimersByTime(500)
      })
      expect(replaceStateSpy).toHaveBeenCalledTimes(1)
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd packages/ui && npx vitest run src/shared/hooks/useCanvasUrlSync.test.ts
```

Expected: FAIL — `useCanvasUrlSync is not a function`

- [ ] **Step 3: Implement `useCanvasUrlSync.ts`**

Create `packages/ui/src/shared/hooks/useCanvasUrlSync.ts`:

```ts
/**
 * useCanvasUrlSync
 *
 * Two-way sync between URL query params and canvas store state.
 *
 * On mount: reads layout/camera params from URL and applies to store.
 * On change: debounced 500ms write back to URL via history.replaceState.
 *
 * Params managed: layout, cx/cy/cz (camera position), tx/ty/tz (camera target).
 * LOD is omitted — it derives from camera distance automatically.
 */

import { useEffect, useRef } from 'react'
import { useCanvasStore } from '../../features/canvas/store'

const DEBOUNCE_MS = 500

function parseFloatOrNull(value: string | null): number | null {
  if (value === null) return null
  const n = parseFloat(value)
  return isFinite(n) ? n : null
}

function buildUrlParams(
  layout: string,
  position: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
): string {
  const params = new URLSearchParams()
  params.set('layout', layout)
  params.set('cx', position.x.toFixed(2))
  params.set('cy', position.y.toFixed(2))
  params.set('cz', position.z.toFixed(2))
  params.set('tx', target.x.toFixed(2))
  params.set('ty', target.y.toFixed(2))
  params.set('tz', target.z.toFixed(2))
  return `${window.location.pathname}?${params.toString()}`
}

export function useCanvasUrlSync(): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // On mount: read URL and apply to store
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)

    const layout = params.get('layout')
    if (layout === 'city' || layout === 'basic3d') {
      useCanvasStore.getState().setActiveLayout(layout)
    }

    const cx = parseFloatOrNull(params.get('cx'))
    const cy = parseFloatOrNull(params.get('cy'))
    const cz = parseFloatOrNull(params.get('cz'))
    if (cx !== null && cy !== null && cz !== null) {
      useCanvasStore.getState().setCameraPosition({ x: cx, y: cy, z: cz })
    }

    const tx = parseFloatOrNull(params.get('tx'))
    const ty = parseFloatOrNull(params.get('ty'))
    const tz = parseFloatOrNull(params.get('tz'))
    if (tx !== null && ty !== null && tz !== null) {
      useCanvasStore.getState().setCameraTarget({ x: tx, y: ty, z: tz })
    }
  }, [])

  // On state change: debounced write to URL
  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        const url = buildUrlParams(state.activeLayout, state.camera.position, state.camera.target)
        history.replaceState(null, '', url)
        timerRef.current = null
      }, DEBOUNCE_MS)
    })

    return () => {
      unsubscribe()
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd packages/ui && npx vitest run src/shared/hooks/useCanvasUrlSync.test.ts
```

Expected: PASS

- [ ] **Step 5: Re-export from hooks index**

In `packages/ui/src/shared/hooks/index.ts`, add:

```ts
export { useCanvasUrlSync } from './useCanvasUrlSync'
```

- [ ] **Step 6: Add `layout` param to `generateViewpointLink`**

In `packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts`, find the `generateViewpointLink` function and add the layout param after the opening `const params = new URLSearchParams()` line:

```ts
const { camera, selectedNodeId, lodLevel, activeLayout } = useCanvasStore.getState()
const params = new URLSearchParams()

// Active layout
params.set('layout', activeLayout)

// Camera position
params.set('cx', camera.position.x.toFixed(2))
// ... rest unchanged
```

- [ ] **Step 7: Mount `useCanvasUrlSync` in `WorkspacePage`**

In `packages/ui/src/pages/WorkspacePage.tsx`, add the import and call near the top of the component (alongside other hooks):

```ts
import { useGlobalSearchShortcut, useGlobalKeyboardShortcuts, useCanvasUrlSync } from '../shared/hooks'

// inside WorkspacePage():
useCanvasUrlSync()
```

- [ ] **Step 8: Run full CI checks**

```bash
cd packages/ui && npx vitest run && npm run type-check && npm run lint && npx prettier --check "src/**/*.{ts,tsx}"
```

Expected: all pass

- [ ] **Step 9: Prettier fix if needed**

```bash
cd packages/ui && npx prettier --write src/shared/hooks/useCanvasUrlSync.ts src/shared/hooks/useCanvasUrlSync.test.ts src/shared/hooks/index.ts src/shared/hooks/useGlobalKeyboardShortcuts.ts src/pages/WorkspacePage.tsx
```

- [ ] **Step 10: Commit**

```bash
git add packages/ui/src/shared/hooks/useCanvasUrlSync.ts \
        packages/ui/src/shared/hooks/useCanvasUrlSync.test.ts \
        packages/ui/src/shared/hooks/index.ts \
        packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts \
        packages/ui/src/pages/WorkspacePage.tsx
git commit -m "feat(canvas): sync camera position and active layout to URL — enables bookmark/share of current view"
```
