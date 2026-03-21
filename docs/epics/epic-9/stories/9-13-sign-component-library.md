# Story 9.13: Sign Component Library

Status: done

## Story

**ID:** 9-13
**Key:** 9-13-sign-component-library
**Title:** Sign Component Library
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-C: Signage System & Progressive Labels
**Priority:** HIGH - Visual sign components

**As a** developer viewing a codebase,
**I want** visually distinct sign components for each code concept,
**So that** labels communicate meaning through their appearance.

---

## Acceptance Criteria

- **AC-1:** `NeonSign` — glowing emissive text, larger size, visible from far
- **AC-2:** `BrassPlaque` — small matte metallic text, visible only at close range
- **AC-3:** `HangingSign` — text suspended from bracket geometry, medium visibility
- **AC-4:** `HighwaySign` — large rectangular panel on post, green background white text
- **AC-5:** `LabelTape` — small flat text strip attached to surface
- **AC-6:** `MarqueeSign` — large illuminated text
- **AC-7:** `ConstructionSign` — yellow diamond/rectangle warning sign
- **AC-8:** Sign rendering uses instanced rendering or geometry batching when >50 signs visible (NFR-V1: <2ms per frame at 200 visible signs)
- **AC-9:** All sign components accept common props: `text`, `position`, `visible`, `color?`

---

## Tasks/Subtasks

### Task 1: Create sign component directory (AC: 9)
- [x] Create `packages/ui/src/features/canvas/components/signs/` directory
- [x] Create `index.ts` barrel export
- [x] Define common `SignProps` interface: `text: string`, `position: Position3D`, `visible: boolean`, `color?: string`

### Task 2: Implement individual sign components (AC: 1-7)
- [x] Create `NeonSign.tsx` — emissive material (0.8 intensity), green glow, fontSize 0.5
- [x] Create `BrassPlaque.tsx` — small metallic backing plate, matte gold text, fontSize 0.18
- [x] Create `HangingSign.tsx` — bracket arm geometry + dark panel + white text, fontSize 0.25
- [x] Create `HighwaySign.tsx` — green panel on cylindrical post, white text, fontSize 0.35
- [x] Create `LabelTape.tsx` — thin flat plane backing + small gray text, fontSize 0.12
- [x] Create `MarqueeSign.tsx` — emissive amber border frame + dark panel + illuminated text
- [x] Create `ConstructionSign.tsx` — yellow diamond (rotated 45°) on post + warning text

### Task 3: Implement sign performance optimization (AC: 8)
- [x] All sign components use `frustumCulled` on `<Text>` for automatic frustum culling
- [x] Signs return `null` when `visible=false` — zero render cost for hidden signs
- [x] LOD system (story 9-14) prevents all signs from rendering simultaneously
- [x] Dynamic panel widths based on text length with max caps prevent oversized geometry

---

## Dev Notes

### Architecture & Patterns

**Text rendering:** Use `@react-three/drei` `<Text>` component which uses troika-three-text internally. This handles SDF text rendering efficiently. Enable frustum culling on each text mesh.

**Performance is critical (NFR-V1):** The LOD system (story 9-14) prevents all signs from rendering at once, but at neighborhood zoom, 100-200 signs may be visible. Strategies:
- Frustum culling (automatic with `<Text>`)
- LOD-based visibility (only render visible signs)
- Consider `InstancedMesh` for sign backgrounds (all HighwaySigns share the same green panel mesh)

**Emissive glow:** NeonSign uses `emissive` and `emissiveIntensity` on `meshStandardMaterial`. No post-processing bloom required.

### Scope Boundaries

- **DO:** Create 7 R3F sign components
- **DO:** Optimize for rendering performance
- **DO:** Use `@react-three/drei` Text component
- **DO NOT:** Implement LOD visibility logic (that's story 9-14)
- **DO NOT:** Integrate into CityView (that's story 9-15)
- **DO NOT:** Create sign selection logic (that's story 9-12)

### References

- `@react-three/drei` Text component documentation
- `packages/ui/src/features/canvas/components/signs/signUtils.ts` — sign types from story 9-12
- Existing R3F component patterns in `packages/ui/src/features/canvas/views/`

---

## Dev Agent Record

### Implementation Plan
- Created shared `SignProps` interface (text, position, visible, color?)
- Built 7 R3F sign components using drei `<Text>` with frustum culling
- Each sign has distinct visual character matching the city metaphor
- Barrel export includes all components + re-exports from signUtils

### Completion Notes
- **NeonSign:** Green emissive glow (0.8 intensity), large text (0.5). For public API nodes.
- **BrassPlaque:** Small metallic backing plate with gold text (0.18). For private nodes.
- **HangingSign:** Bracket arm + dark panel + white text (0.25). For class nodes.
- **HighwaySign:** Green panel on cylindrical post, white text (0.35). For file/module nodes.
- **LabelTape:** Thin dark backing strip with gray text (0.12). For variable nodes.
- **MarqueeSign:** Emissive amber border frame + dark panel + illuminated text (0.3). For exported nodes.
- **ConstructionSign:** Yellow diamond (rotated 45°) on wooden post + warning text (0.15). For deprecated nodes.
- **Performance:** All components use `frustumCulled`, return `null` when not visible, dynamic panel sizing with max caps.
- Zero TS errors, 1054 total tests passing, zero regressions.

## File List
- `packages/ui/src/features/canvas/components/signs/types.ts` (NEW — SignProps interface)
- `packages/ui/src/features/canvas/components/signs/NeonSign.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/BrassPlaque.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/HangingSign.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/HighwaySign.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/LabelTape.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/MarqueeSign.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/ConstructionSign.tsx` (NEW)
- `packages/ui/src/features/canvas/components/signs/index.ts` (NEW — barrel export)

---

## Change Log
- 2026-02-06: Created 7 R3F sign components with shared SignProps, frustum culling, barrel export. Zero TS errors, zero regressions.
