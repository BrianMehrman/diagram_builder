# Story 5-4: Feature Canvas (3D Visualization)

## Story

**ID:** 5-4
**Key:** 5-4-feature-canvas-3d
**Title:** Set up react-three-fiber Canvas3D component with camera controls and Zustand store
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Create the Canvas3D feature using react-three-fiber and @react-three/drei for 3D visualization. Implements camera controls (pan, zoom, rotate) and Zustand store for canvas state management.

---

## Acceptance Criteria

- **AC-1:** react-three-fiber v9.4.2 installed
- **AC-2:** @react-three/drei v10.7.7 installed
- **AC-3:** Canvas3D component renders 3D scene
- **AC-4:** Camera controls (OrbitControls) working
- **AC-5:** canvasStore (Zustand) with camera state
- **AC-6:** useCamera hook for camera state access
- **AC-7:** Component tests for Canvas3D

---

## Tasks/Subtasks

### Task 1: Install dependencies
- [ ] Install react-three-fiber@9.4.2
- [ ] Install @react-three/drei@10.7.7

### Task 2: Create Canvas3D component
- [ ] Create src/features/canvas/Canvas3D.tsx
- [ ] Set up react-three-fiber Canvas
- [ ] Add OrbitControls from drei

### Task 3: Create canvasStore
- [ ] Create src/features/canvas/canvasStore.ts
- [ ] Define camera state: position, target, zoom
- [ ] Add actions: setCamera, updateCamera, resetCamera

### Task 4: Create useCamera hook
- [ ] Create src/features/canvas/useCamera.ts
- [ ] Connect to canvasStore
- [ ] Expose camera state and actions

### Task 5: Test and validate
- [ ] Write Canvas3D.test.tsx
- [ ] Test camera controls
- [ ] Test store integration

---

## Dev Notes

**Zustand Store Pattern:**
```typescript
export const useCanvasStore = create<CanvasStore>((set) => ({
  camera: { position: [0, 0, 5], target: [0, 0, 0], zoom: 1 },
  setCamera: (camera) => set({ camera }),
  resetCamera: () => set({ camera: initialCamera }),
}))
```

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
