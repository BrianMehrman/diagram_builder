# Plan: Fix Group B Whole-Object state.camera Selectors

**Date:** 2026-04-12  
**Branch:** fix/group-b-camera-whole-object-selectors (cut from main after Group A PR merges)  
**Precondition:** `fix/camera-position-primitive-selectors` merged to main  
**Related:** Group A fix — `docs/specs/2026-04-12-camera-position-primitive-selectors-plan.md`

---

## Problem

Six files use `useCanvasStore((state) => state.camera)` — a selector returning the whole `CameraState` object. Unlike Group A (`s.camera.position`), this doesn't cause infinite loops, but it does cause **unnecessary re-renders on every camera mutation** (position, target, or zoom). During camera flight, that's every animation frame.

The most impactful case is `useWebSocket.ts`: the whole-object selector causes `broadcastPosition` to be recreated every frame → the position-update `useEffect` resets its 50ms throttle timer every frame → position updates fire constantly.

---

## Files and Their Usage

| File | What it subscribes to | What it actually uses | Re-renders on |
|------|----------------------|----------------------|---------------|
| `HUD.tsx` | `state.camera` | `position.x/y/z` (display) | pos + target + zoom change |
| `MiniMap.tsx` | `state.camera` | `position` + `target` (passed to `SpatialOverview`) | pos + target + zoom change |
| `ViewpointCreator.tsx` | `state.camera` | `position.x/y/z` (display) + `position`+`target` (snapshot in handler) | pos + target + zoom change |
| `Canvas3D.tsx (CameraController)` | `state.camera` | `position.x/y/z` (PerspectiveCamera prop) | pos + target + zoom change |
| `useCamera.ts` | `state.camera` | `position`, `target`, `zoom` (all, returned to caller) | pos + target + zoom change |
| `useWebSocket.ts` | `state.camera` | `camera.position` in `useCallback` dep + `useEffect` dep | every frame during flight |

---

## Fix Approaches by File

### `HUD.tsx`
**Current:** `const camera = useCanvasStore((state) => state.camera)` → uses `camera.position.x/y/z` in JSX  
**Fix:** 3 primitive position selectors. Inline `position.x/y/z` at usage sites.

```ts
const cameraPosX = useCanvasStore((s) => s.camera.position.x)
const cameraPosY = useCanvasStore((s) => s.camera.position.y)
const cameraPosZ = useCanvasStore((s) => s.camera.position.z)
```

---

### `ViewpointCreator.tsx`
**Current:** `const camera = useCanvasStore((state) => state.camera)` → two uses:
1. JSX: `camera.position.x/y/z` in the position display
2. `handleCreate`: reads `camera.position` + `camera.target` to snapshot the viewpoint

**Fix (split by use):**
- JSX display: 3 primitive position selectors (same as HUD)
- `handleCreate`: switch to `getState()` — it's a user-triggered snapshot, not a subscription. Reading at call time is both correct and stable.

```ts
const cameraPosX = useCanvasStore((s) => s.camera.position.x)
const cameraPosY = useCanvasStore((s) => s.camera.position.y)
const cameraPosZ = useCanvasStore((s) => s.camera.position.z)

const handleCreate = () => {
  const { position, target } = useCanvasStore.getState().camera
  const data = { name: ..., cameraPosition: position, cameraTarget: target, ... }
  ...
}
```

---

### `MiniMap.tsx`
**Current:** `const camera = useCanvasStore((state) => state.camera)` → passes `camera.position` and `camera.target` as props to `SpatialOverview`  
**Fix:** 6 primitive selectors (posX/Y/Z, targetX/Y/Z), assemble for SpatialOverview props.

```ts
const cameraPosX = useCanvasStore((s) => s.camera.position.x)
const cameraPosY = useCanvasStore((s) => s.camera.position.y)
const cameraPosZ = useCanvasStore((s) => s.camera.position.z)
const cameraTargetX = useCanvasStore((s) => s.camera.target.x)
const cameraTargetY = useCanvasStore((s) => s.camera.target.y)
const cameraTargetZ = useCanvasStore((s) => s.camera.target.z)

// In JSX:
<SpatialOverview
  cameraPosition={{ x: cameraPosX, y: cameraPosY, z: cameraPosZ }}
  cameraTarget={{ x: cameraTargetX, y: cameraTargetY, z: cameraTargetZ }}
  ...
/>
```

---

### `Canvas3D.tsx (CameraController)`
**Current:** `const camera = useCanvasStore((state) => state.camera)` → used for `PerspectiveCamera` `position` prop (`[camera.position.x, camera.position.y, camera.position.z]`)  
**Fix:** 3 primitive position selectors.

Note: `CameraController` is the *source* of position updates — it calls `setCameraPosition` when OrbitControls move. Having it also subscribe to and re-render on those position changes is circular. The `PerspectiveCamera` `position` prop only matters at mount in R3F (Three.js camera position is thereafter owned by OrbitControls). So a future cleanup could remove the subscription entirely and use `getState()` at mount — but that's a separate concern.

---

### `useCamera.ts`
**Current:** `const camera = useCanvasStore((state) => state.camera)` → returns `position`, `target`, `zoom`  
**Fix:** 7 primitive selectors (posX/Y/Z, targetX/Y/Z, zoom), assemble in return statement.

```ts
const posX = useCanvasStore((s) => s.camera.position.x)
const posY = useCanvasStore((s) => s.camera.position.y)
const posZ = useCanvasStore((s) => s.camera.position.z)
const targetX = useCanvasStore((s) => s.camera.target.x)
const targetY = useCanvasStore((s) => s.camera.target.y)
const targetZ = useCanvasStore((s) => s.camera.target.z)
const zoom = useCanvasStore((s) => s.camera.zoom)

return {
  position: { x: posX, y: posY, z: posZ },
  target: { x: targetX, y: targetY, z: targetZ },
  zoom,
  ...
}
```

Callers of `useCamera()` benefit automatically. Currently only `CameraControls.tsx`, which only uses `camera.zoom` and the setters — it will now only re-render when zoom changes.

---

### `useWebSocket.ts` ⚠️ Highest priority
**Current:**
```ts
const camera = useCanvasStore((state) => state.camera)

const broadcastPosition = useCallback(() => {
  socketRef.current.emit('position.update', { position: camera.position })
}, [camera.position, currentUserId])  // ← new object every frame

useEffect(() => {
  positionTimerRef.current = setTimeout(() => { broadcastPosition() }, 50)
}, [camera.position, broadcastPosition, currentUserId])  // ← fires every frame
```

**Fix:**
- Remove `state.camera` selector entirely
- Add 3 primitive position selectors for the `useEffect` dep array
- Inside `broadcastPosition`: read via `getState()` at call time (stable, always fresh)

```ts
const cameraPosX = useCanvasStore((s) => s.camera.position.x)
const cameraPosY = useCanvasStore((s) => s.camera.position.y)
const cameraPosZ = useCanvasStore((s) => s.camera.position.z)

const broadcastPosition = useCallback(() => {
  if (!socketRef.current || !currentUserId) return
  const { position } = useCanvasStore.getState().camera
  socketRef.current.emit('position.update', { position })
}, [currentUserId])  // ← stable, no camera dep

useEffect(() => {
  positionTimerRef.current = setTimeout(() => { broadcastPosition() }, 50)
  return () => { if (positionTimerRef.current) clearTimeout(positionTimerRef.current) }
}, [cameraPosX, cameraPosY, cameraPosZ, broadcastPosition, currentUserId])
```

**Result:** `broadcastPosition` is recreated only when `currentUserId` changes. The throttle timer resets only when actual position coordinates change — not on every render.

---

## Test Coverage Assessment

| File | Existing tests | New tests needed |
|------|---------------|-----------------|
| `HUD.tsx` | None | None — display-only, selector pattern change |
| `ViewpointCreator.tsx` | `ViewpointList.test.tsx` (indirect) | Verify `handleCreate` captures correct position/target via `getState()` |
| `MiniMap.tsx` | None | None — prop pass-through |
| `Canvas3D.tsx` | `CameraControls.test.tsx` (indirect) | None — R3F component, pattern change only |
| `useCamera.ts` | `CameraControls.test.tsx` | Verify returned `position`, `target`, `zoom` values are correct |
| `useWebSocket.ts` | None | Verify `broadcastPosition` emits current position; verify throttle fires once per position change not per render |

---

## Implementation Tasks

### Task 1 — Fix `HUD.tsx`
Replace `state.camera` selector with 3 primitive position selectors. No new tests required.  
CI: `npm test --workspace=packages/ui`

### Task 2 — Fix `ViewpointCreator.tsx`
3 primitive position selectors for display. Switch `handleCreate` to `getState()` for snapshot.  
New test: viewpoint captures correct position when created.  
CI: `npm test --workspace=packages/ui`

### Task 3 — Fix `MiniMap.tsx`
6 primitive selectors (pos + target), reassemble for SpatialOverview props.  
CI: `npm test --workspace=packages/ui`

### Task 4 — Fix `Canvas3D.tsx (CameraController)`
3 primitive position selectors.  
CI: `npm test --workspace=packages/ui`

### Task 5 — Fix `useCamera.ts`
7 primitive selectors, assemble in return. CameraControls re-renders only on zoom change.  
Verify existing `CameraControls.test.tsx` still passes.  
CI: `npm test --workspace=packages/ui`

### Task 6 — Fix `useWebSocket.ts` ⚠️
Switch to `getState()` in callback, 3 primitive selectors for effect dep.  
New tests: verify position is broadcast with correct value; verify throttle resets only on coordinate change.  
CI: `npm test --workspace=packages/ui`

### Task 7 — Full CI checklist
1. `npm run type-check`
2. `npm run lint`
3. `npm run format:check`
4. `npm test`

---

## Definition of Done

- [ ] `HUD.tsx` — no `state.camera` whole-object selector
- [ ] `ViewpointCreator.tsx` — no `state.camera` selector; `handleCreate` uses `getState()`
- [ ] `MiniMap.tsx` — no `state.camera` selector; 6 primitive selectors for pos + target
- [ ] `Canvas3D.tsx` — no `state.camera` selector in `CameraController`
- [ ] `useCamera.ts` — 7 primitive selectors; callers re-render only on their fields
- [ ] `useWebSocket.ts` — `broadcastPosition` stable; position effect fires only on coord change
- [ ] New tests for ViewpointCreator and useWebSocket pass
- [ ] All existing tests still pass
- [ ] `type-check`, `lint`, `format:check` all clean
- [ ] No `state.camera` whole-object selectors remain in any file
