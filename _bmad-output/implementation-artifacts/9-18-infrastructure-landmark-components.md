# Story 9.18: Infrastructure Landmark Components

Status: done

## Story

**ID:** 9-18
**Key:** 9-18-infrastructure-landmark-components
**Title:** Infrastructure Landmark Components
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-D: Infrastructure Landmarks & Layer Control
**Priority:** HIGH - Distinctive visual landmarks

**As a** developer viewing a codebase,
**I want** infrastructure nodes rendered as distinctive landmark buildings,
**So that** I can orient myself in the city and identify external system connections at a glance.

---

## Acceptance Criteria

- **AC-1:** `PowerStation` — tall industrial geometry with smokestacks/towers for event bus/message broker nodes
- **AC-2:** `WaterTower` — cylindrical tank on stilts for job queue nodes
- **AC-3:** `MunicipalBuilding` — dome or clock tower for cron/scheduled task nodes
- **AC-4:** `Harbor` — dock/pier geometry at city edge for database nodes
- **AC-5:** `Airport` — terminal building with runway for external API nodes
- **AC-6:** `CityGate` — archway/tollbooth at city edge for entry-point endpoint nodes
- **AC-7:** All landmarks have tall/distinctive silhouettes visible from any position as orientation aids
- **AC-8:** All components accept standard props: `position`, `node`, `onClick`, `onHover`

---

## Tasks/Subtasks

### Task 1: Create infrastructure component directory (AC: 8)
- [x] Create `packages/ui/src/features/canvas/components/infrastructure/` directory
- [x] Create `index.ts` barrel export
- [x] Define common `InfrastructureProps` interface

### Task 2: Implement PowerStation (AC: 1, 7)
- [x] Create `PowerStation.tsx`
- [x] R3F component: tall box base + cylindrical smokestacks on top
- [x] Use `cylinderGeometry` for smokestacks, `boxGeometry` for base
- [x] Industrial color palette (dark gray, rust)

### Task 3: Implement WaterTower (AC: 2, 7)
- [x] Create `WaterTower.tsx`
- [x] R3F component: cylindrical tank on thin cylindrical stilts
- [x] Elevated position for visibility

### Task 4: Implement MunicipalBuilding (AC: 3, 7)
- [x] Create `MunicipalBuilding.tsx`
- [x] R3F component: base building with dome/sphere on top or clock tower (thin cylinder + sphere)

### Task 5: Implement Harbor (AC: 4, 7)
- [x] Create `Harbor.tsx`
- [x] R3F component: flat dock platform with pier posts (thin cylinders)
- [x] Water-themed color (blue-gray base)

### Task 6: Implement Airport (AC: 5, 7)
- [x] Create `Airport.tsx`
- [x] R3F component: wide flat terminal building with runway strip (thin long box)

### Task 7: Implement CityGate (AC: 6, 7)
- [x] Create `CityGate.tsx`
- [x] R3F component: two pillars with arch connecting them (cylinder + box arch + sphere caps)

---

## Dev Notes

### Architecture & Patterns

**R3F components:** Each landmark is built from primitive Three.js geometries (box, cylinder, sphere, torus) composed together. No custom geometry or 3D model loading — keep it simple and lightweight.

**Distinctive silhouettes:** The key design goal is that each landmark type is recognizable from its shape alone at city zoom level. Height and unique shape combinations achieve this (power station = tall + smokestacks, water tower = elevated sphere, etc.).

**Interaction:** Landmarks support click and hover for selection/tooltip, matching the building component pattern.

### Scope Boundaries

- **DO:** Create 6 R3F landmark components
- **DO:** Use primitive geometries for simplicity
- **DO:** Make silhouettes distinctive and tall
- **DO NOT:** Load 3D models or custom meshes
- **DO NOT:** Add sign components to landmarks (signs from Epic 9-C auto-attach)
- **DO NOT:** Position landmarks (that's story 9-19)

### References

- `packages/ui/src/features/canvas/views/Building.tsx` — existing building component for pattern
- `packages/ui/src/features/canvas/views/ExternalBuilding.tsx` — existing external building component

---

## Dev Agent Record

### Implementation Notes
- Created `infrastructure/` component directory with `types.ts`, barrel `index.ts`, and 6 landmark components
- All components follow the same pattern: useState hover, Zustand store for selection, `requestFlyToNode` on double-click
- Each has a distinctive silhouette: PowerStation (smokestacks), WaterTower (elevated tank), MunicipalBuilding (dome), Harbor (dock+posts), Airport (terminal+runway+tower), CityGate (arch+pillars+caps)
- Each type has a unique color accent for its label text
- All built from primitive geometries (box, cylinder, sphere, plane) — no custom meshes

### File List
- `packages/ui/src/features/canvas/components/infrastructure/types.ts` — NEW: InfrastructureProps
- `packages/ui/src/features/canvas/components/infrastructure/PowerStation.tsx` — NEW
- `packages/ui/src/features/canvas/components/infrastructure/WaterTower.tsx` — NEW
- `packages/ui/src/features/canvas/components/infrastructure/MunicipalBuilding.tsx` — NEW
- `packages/ui/src/features/canvas/components/infrastructure/Harbor.tsx` — NEW
- `packages/ui/src/features/canvas/components/infrastructure/Airport.tsx` — NEW
- `packages/ui/src/features/canvas/components/infrastructure/CityGate.tsx` — NEW
- `packages/ui/src/features/canvas/components/infrastructure/index.ts` — NEW: barrel export

---

## Change Log
- 2026-02-05: Story implemented — all ACs met, 6 landmark components created
