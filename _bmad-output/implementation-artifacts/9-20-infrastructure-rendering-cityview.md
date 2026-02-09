# Story 9.20: Infrastructure Rendering in CityView

Status: not-started

## Story

**ID:** 9-20
**Key:** 9-20-infrastructure-rendering-cityview
**Title:** Infrastructure Rendering in CityView
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-D: Infrastructure Landmarks & Layer Control
**Priority:** HIGH - Wires landmarks into city rendering

**As a** developer viewing a codebase,
**I want** the city view to render infrastructure landmarks instead of generic buildings for classified nodes,
**So that** the city has recognizable landmarks for navigation.

---

## Acceptance Criteria

- **AC-1:** Nodes with `metadata.infrastructureType` set render as the appropriate landmark component

- **AC-2:** Nodes with `infrastructureType: 'general'` or no `infrastructureType` render as standard external buildings (wireframe)

- **AC-3:** Infrastructure landmarks remain visible at all LOD levels (not hidden by LOD filtering)

---

## Tasks/Subtasks

### Task 1: Create infrastructure type → component mapping (AC: 1, 2)
- [ ] Create a mapping function or switch: `infrastructureType` → landmark component
- [ ] `'database'` → Harbor
- [ ] `'api'` → Airport
- [ ] `'queue'` → PowerStation
- [ ] `'cache'` → WaterTower
- [ ] `'auth'` → CityGate
- [ ] `'logging'` → MunicipalBuilding
- [ ] `'filesystem'` → MunicipalBuilding (reuse)
- [ ] `'general'` → existing ExternalBuilding (wireframe)

### Task 2: Update CityView external node rendering (AC: 1, 2)
- [ ] Update `packages/ui/src/features/canvas/views/CityView.tsx`
- [ ] In the external nodes rendering loop, check `node.metadata.infrastructureType`
- [ ] Render appropriate landmark component instead of default ExternalBuilding
- [ ] Pass position, node, and interaction props

### Task 3: Ensure LOD independence (AC: 3)
- [ ] Infrastructure landmarks bypass LOD visibility filtering
- [ ] They render at all zoom levels as orientation aids
- [ ] This may mean skipping the `lodLevel` check for external/infrastructure nodes

---

## Dev Notes

### Architecture & Patterns

**Type-switched rendering:** Similar to story 9-10 (typed building components), this uses a switch/map to select the correct landmark component. The pattern is consistent.

**LOD independence:** Landmarks serve as orientation aids — they must always be visible. The sign system (Epic 9-C) may attach signs to landmarks, and those signs follow LOD rules, but the landmarks themselves do not.

**Fallback:** If `infrastructureType` is missing or `'general'`, the existing `ExternalBuilding` wireframe component renders. This ensures backward compatibility.

### Scope Boundaries

- **DO:** Wire landmark components into CityView
- **DO:** Handle all infrastructure types
- **DO:** Ensure landmarks are always visible
- **DO NOT:** Modify landmark components
- **DO NOT:** Add layer toggle logic (that's story 9-21)

### References

- `packages/ui/src/features/canvas/views/CityView.tsx` — external node rendering loop
- `packages/ui/src/features/canvas/views/ExternalBuilding.tsx` — current external rendering
- `packages/ui/src/features/canvas/components/infrastructure/` — landmark components from story 9-18

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
