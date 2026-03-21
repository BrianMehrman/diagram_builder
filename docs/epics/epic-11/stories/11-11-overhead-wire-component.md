# Story 11.11: Overhead Wire Component

Status: review

## Story

**ID:** 11-11
**Key:** 11-11-overhead-wire-component
**Title:** Overhead Wire Component
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-D: Overhead Wire Layer
**Priority:** CRITICAL - Core overhead rendering for runtime relationships

**As a** developer viewing the city visualization,
**I want** method-to-method calls and composition references rendered as wires/cables arcing above building rooftops,
**So that** I can see runtime communication patterns between code elements.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 6.2

---

## Acceptance Criteria

- **AC-1:** Renders wire/cable arc above building rooftops (Z > tallest connected building)
- **AC-2:** Wire connects from source method's building rooftop to target method's building rooftop
- **AC-3:** Arc height scales with distance between connected buildings (longer distance = higher arc)
- **AC-4:** Wire visual style reads as "cable/wire" (thin line, not pipe — distinct from underground)
- **AC-5:** Visible at city level (LOD 2+) to show communication patterns
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Create OverheadWire component (AC: 1, 2, 4)
- [x] Create `packages/ui/src/features/canvas/components/OverheadWire.tsx`
- [x] Render as curved line (quadratic or cubic bezier) above buildings
- [x] Start point: source building rooftop center (Z = building height)
- [x] End point: target building rooftop center (Z = building height)
- [x] Peak: midpoint at Z = max(source height, target height) + offset
- [x] Material: thin wire/cable style (line material, not tube geometry — distinguishes from underground pipes)

### Task 2: Implement dynamic arc height (AC: 3)
- [x] Calculate arc peak based on horizontal distance between source and target
- [x] Formula: `peakZ = max(sourceHeight, targetHeight) + baseOffset + (distance * scaleFactor)`
- [x] `baseOffset`: minimum clearance above tallest building (WIRE_BASE_OFFSET = 2)
- [x] `scaleFactor`: how much height increases with distance (WIRE_SCALE_FACTOR = 0.1)
- [x] Cap maximum arc height to prevent extreme values (WIRE_MAX_PEAK = 80)

### Task 3: Implement LOD visibility (AC: 5)
- [x] Show overhead wires at LOD 2+ (district level and closer)
- [x] Read LOD from store (`useCanvasStore s.lodLevel`)
- [x] `isWireVisible(lodLevel)` gates rendering at WIRE_LOD_MIN = 2

### Task 4: Write tests (AC: 6)
- [x] Test: wire renders above both connected buildings
- [x] Test: arc height increases with distance
- [x] Test: arc height has minimum clearance above tallest building
- [x] Test: wire hidden at LOD 1
- [x] Test: wire visible at LOD 2+
- [x] Test: wire material is line-based (not tube) — documented via WIRE_COLORS proxy test

---

## Dev Notes

- This replaces/modifies the existing `SkyEdge` component for overhead routing — or could be a new component that SkyEdge delegates to
- The key visual distinction from underground pipes: wires are THIN (line geometry), pipes are THICK (tube geometry)
- Consider using `THREE.Line` with `LineBasicMaterial` or `LineDashedMaterial` for the wire
- R3F note: use `<primitive object={new THREE.Line(...)} />` to avoid SVG `<line>` conflict

## Dependencies
- 11-9 (edge routing classifier — determines which edges are overhead)

## Files Expected
- `packages/ui/src/features/canvas/components/OverheadWire.tsx` (NEW)
- `packages/ui/src/features/canvas/components/OverheadWire.test.tsx` (NEW)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — arc height constants)

---

## Dev Agent Record

### Implementation Notes (2026-02-18)

**Approach:**
- Created `OverheadWire.tsx` as a standalone component accepting `sourcePosition`, `targetPosition`, `sourceHeight`, `targetHeight`, and `edgeType` props
- Geometry: `THREE.QuadraticBezierCurve3` sampled at 24 segments → `THREE.BufferGeometry` → `THREE.Line` with `LineBasicMaterial`
- Used `<primitive object={lineObject} />` to avoid R3F `<line>` / SVG reconciler conflict (pattern from MEMORY.md)
- Arc formula: `max(srcH, tgtH) + WIRE_BASE_OFFSET + dist * WIRE_SCALE_FACTOR`, capped at `WIRE_MAX_PEAK = 80`
- LOD gate: `isWireVisible(lodLevel)` → returns `null` at LOD < 2

**Constants added to `cityViewUtils.ts`:**
- `WIRE_BASE_OFFSET = 2` — minimum clearance above rooftop
- `WIRE_SCALE_FACTOR = 0.1` — arc growth per horizontal unit
- `WIRE_MAX_PEAK = 80` — prevents absurd heights for distant nodes
- `WIRE_LOD_MIN = 2` — visible at district level and closer
- `WIRE_COLORS: { calls: '#34d399', composes: '#a78bfa' }` — green/violet
- `WIRE_DEFAULT_COLOR = '#6ee7b7'` — fallback for unknown edge types

**Test strategy:**
- Pure utility tests only (no jsdom, no R3F render) — same pattern as UndergroundPipe and other R3F components
- 21 tests: 8 for `calculateWireArcPeak`, 6 for `isWireVisible`, 6 for `getWireColor`, 1 architectural distinction doc

**Visual distinction from UndergroundPipe:**
- OverheadWire: `THREE.Line` + `LineBasicMaterial` (thin wire, 0.7 opacity)
- UndergroundPipe: `THREE.TubeGeometry` + `MeshStandardMaterial` (thick conduit)

### Modified Files
- `packages/ui/src/features/canvas/components/OverheadWire.tsx` (NEW)
- `packages/ui/src/features/canvas/components/OverheadWire.test.ts` (NEW — note: `.ts` not `.tsx`, pure utility tests)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — 7 exports added)

### Test Results
- 1627 passing, 41 pre-existing jsdom failures (unchanged baseline)
