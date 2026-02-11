# Story 10.8: Implement Floor Band Rendering

Status: not-started

## Story

**ID:** 10-8
**Key:** 10-8-floor-band-rendering
**Title:** Implement Floor Band Rendering on Class Buildings
**Epic:** Epic 10 - City Metaphor Rethink
**Phase:** Epic 10-B: Core Metaphor (Phase 1)
**Priority:** CRITICAL - Core visual metaphor for methods as floors

**As a** developer viewing a class building,
**I want** visible floor bands representing each method with colors indicating visibility,
**So that** I can glance at a building and understand its size, complexity, and API surface.

---

## Acceptance Criteria

- **AC-1:** Class building height = `log2(methodCount + 1) * FLOOR_HEIGHT` (log-scaled, prevents pencil towers)
- **AC-2:** Floor bands rendered as vertex coloring on a SINGLE mesh (NOT separate meshes per floor) — critical for draw call performance
- **AC-3:** Floor color by method visibility: public = light/glass color, private = dark/solid, protected = tinted
- **AC-4:** Default to "public" coloring when method visibility data is undefined
- **AC-5:** Zero-method classes render with 1 minimum "lobby" floor (never invisible)
- **AC-6:** Same floor band system applies to AbstractBuilding and InterfaceBuilding
- **AC-7:** Floor labels (method names) appear at LOD 3+ as text sprites
- **AC-8:** Tooltip on hover shows "ClassName: N methods"
- **AC-9:** Co-located unit tests verify height calculation and vertex color assignment

---

## Tasks/Subtasks

### Task 1: Implement log-scaled height calculation (AC: 1, 5)
- [ ] Create `calculateBuildingHeight(methodCount, encoding)` utility
- [ ] Log scale: `log2(methodCount + 1) * FLOOR_HEIGHT`
- [ ] Minimum: 1 floor (FLOOR_HEIGHT) for zero-method classes
- [ ] Unit test with 0, 1, 5, 10, 30, 100 methods

### Task 2: Implement vertex-colored floor bands (AC: 2, 3, 4)
- [ ] Modify ClassBuilding geometry to use `BufferGeometry` with per-vertex colors
- [ ] Divide building into `methodCount` horizontal bands (or minimum 1)
- [ ] Assign vertex colors per band based on method visibility
- [ ] Color mapping: public → light blue/glass, private → dark gray, protected → tinted amber
- [ ] Default visibility = "public" when undefined
- [ ] CRITICAL: Must be single mesh with `vertexColors: true` material — NOT separate meshes

### Task 3: Apply to AbstractBuilding and InterfaceBuilding (AC: 6)
- [ ] AbstractBuilding: same floor bands but with 50% opacity material + scaffolding lines
- [ ] InterfaceBuilding: same floor bands but with 30% opacity wireframe material
- [ ] Both use same `calculateBuildingHeight` utility

### Task 4: Add floor labels at LOD 3 (AC: 7)
- [ ] Render method names as text sprites at each floor level
- [ ] Visible only at LOD 3+ (close zoom)
- [ ] Use existing sign/label rendering patterns from Epic 9-C

### Task 5: Add hover tooltip (AC: 8)
- [ ] On hover: show "ClassName: N methods" tooltip
- [ ] Reuse existing tooltip/hover infrastructure

### Task 6: Write tests (AC: 9)
- [ ] Test `calculateBuildingHeight` with various method counts
- [ ] Test vertex color assignment matches visibility
- [ ] Test default visibility fallback
- [ ] Test minimum 1 floor for zero methods

---

## Dev Notes

### Architecture & Patterns

**CRITICAL — Single mesh:** The #1 performance trap is creating separate meshes per floor. With 1000 buildings averaging 8 floors, that's 8000 draw calls instead of 1000. Use `BufferGeometry` with `Float32BufferAttribute` for position AND color. Set `vertexColors: true` on the material.

**Log scaling rationale:** Linear height (3 units per method) creates pencil towers for large classes. A class with 30 methods would be 90 units tall at 2.5 units wide (36:1 ratio). Log scale compresses this: `log2(31) * 3 ≈ 15 units` — a 6:1 ratio. Still tall, but visually reasonable.

**Vertex color technique:**
```typescript
const colors = new Float32Array(vertexCount * 3);
// For each floor band, set RGB values based on visibility
// public: [0.6, 0.8, 1.0], private: [0.3, 0.3, 0.35], protected: [0.8, 0.7, 0.4]
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
material.vertexColors = true;
```

### Scope Boundaries

- **DO:** Modify ClassBuilding, AbstractBuilding, InterfaceBuilding rendering
- **DO:** Create height calculation utility
- **DO NOT:** Change building positions (layout is handled by story 10-6)
- **DO NOT:** Implement configurable height encoding UI (that's story 10-11)

### References

- `packages/ui/src/features/canvas/components/buildings/ClassBuilding.tsx`
- `packages/ui/src/features/canvas/components/buildings/AbstractBuilding.tsx`
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.tsx`
- `packages/ui/src/features/canvas/components/buildings/buildingGeometry.ts`
- Three.js BufferGeometry docs for vertex colors

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
