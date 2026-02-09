# Story 9.13: Sign Component Library

Status: not-started

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
- [ ] Create `packages/ui/src/features/canvas/components/signs/` directory
- [ ] Create `index.ts` barrel export
- [ ] Define common `SignProps` interface: `text: string`, `position: Position3D`, `visible: boolean`, `color?: string`

### Task 2: Implement individual sign components (AC: 1-7)
- [ ] Create `NeonSign.tsx` — emissive material, glow effect, larger `<Text>` from drei
- [ ] Create `BrassPlaque.tsx` — small metallic material, compact text
- [ ] Create `HangingSign.tsx` — bracket geometry + suspended text panel
- [ ] Create `HighwaySign.tsx` — green box with white `<Text>`, post geometry below
- [ ] Create `LabelTape.tsx` — thin flat plane with small text
- [ ] Create `MarqueeSign.tsx` — illuminated text with emissive border
- [ ] Create `ConstructionSign.tsx` — yellow rotated box (diamond shape) with text

### Task 3: Implement sign performance optimization (AC: 8)
- [ ] Consider using `@react-three/drei` `Text` component with frustum culling
- [ ] Group signs by type for potential instanced rendering
- [ ] Implement visibility culling — only render signs within camera frustum
- [ ] Profile rendering to verify <2ms budget at 200 visible signs

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
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
