# Story 10.12: Create SkyEdge Component

Status: not-started

## Story

**ID:** 10-12
**Key:** 10-12-sky-edge-component
**Title:** Create SkyEdge Component
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-C: Sky Layer (Phase 2)
**Priority:** CRITICAL - Core sky edge rendering

**As a** developer viewing codebase dependencies,
**I want** cross-district import edges rendered as elevated bezier arcs in the sky,
**So that** dependency structure is visible without cluttering the ground plane.

---

## Acceptance Criteria

- **AC-1:** Renders bezier arc between source and target building positions
- **AC-2:** Y-height determined by edge type (NOT distance): imports cross-district Y=30-50, extends Y=60+, implements Y=60+ dashed
- **AC-3:** Color by edge type: imports=blue, extends=green, implements=purple
- **AC-4:** Visibility gated by LOD level and `edgeTierVisibility` store settings
- **AC-5:** Edge visibility threshold: show top N edges by weight at LOD 2, all at LOD 3
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create SkyEdge component (AC: 1, 2, 3)
- [ ] Create `packages/ui/src/features/canvas/components/SkyEdge.tsx`
- [ ] Generate bezier curve: start at source (y=0), peak at type-based Y-height, end at target (y=0)
- [ ] Use `THREE.QuadraticBezierCurve3` or `CubicBezierCurve3` for smooth arcs
- [ ] Color by edge type via material
- [ ] Dashed line for `implements` edges

### Task 2: Implement type-based height (AC: 2)
- [ ] `imports` cross-district: Y = 30-50 (scale by distance optionally)
- [ ] `extends`: Y = 60+
- [ ] `implements`: Y = 60+
- [ ] Height is stable regardless of density slider changes

### Task 3: Implement visibility controls (AC: 4, 5)
- [ ] Read `edgeTierVisibility` from store
- [ ] Read `lodLevel` — hide all sky edges below LOD 2
- [ ] At LOD 2: show top N edges by weight (e.g., top 50)
- [ ] At LOD 3+: show all edges matching tier visibility settings

### Task 4: Write tests (AC: 6)
- [ ] Test: correct Y-height for each edge type
- [ ] Test: color matches edge type
- [ ] Test: hidden at LOD 1, visible at LOD 2+
- [ ] Test: respects tier visibility toggles

---

## Dev Notes

### Architecture & Patterns

**New component, not modification:** SkyEdge is a new component — don't modify existing CityEdge. This keeps v1 rendering intact and avoids breaking existing edge rendering during development.

**Bezier curve generation:**
```typescript
const midY = edgeType === 'imports' ? 40 : 65;
const curve = new THREE.QuadraticBezierCurve3(
  new THREE.Vector3(sx, 0, sz),
  new THREE.Vector3((sx+tx)/2, midY, (sz+tz)/2),
  new THREE.Vector3(tx, 0, tz)
);
const points = curve.getPoints(20); // 20 segments
```

**Type-based height (not distance-based):** This was a key ADR decision. Distance-based heights would change when the density slider moves. Type-based heights are stable.

### Scope Boundaries

- **DO:** Create SkyEdge component
- **DO NOT:** Modify CityEdge (keep for v1)
- **DO NOT:** Implement ground shadows (that's story 10-13)
- **DO NOT:** Wire into CitySky (that's story 10-17)

### References

- `packages/ui/src/features/canvas/components/CityEdge.tsx` — existing edge (reference, not modify)
- Story 10-5: `edgeTierVisibility` store state
- Tech spec: Task 2.1

---

## Dev Agent Record

### Implementation Plan
_To be filled during implementation_

### Completion Notes
_To be filled on completion_

## File List
_To be filled during implementation_

---

## Change Log
- 2026-02-10: Story created from tech-spec-city-metaphor-rethink.md
