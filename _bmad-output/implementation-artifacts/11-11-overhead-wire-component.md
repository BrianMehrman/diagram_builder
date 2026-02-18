# Story 11.11: Overhead Wire Component

Status: not-started

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
- [ ] Create `packages/ui/src/features/canvas/components/OverheadWire.tsx`
- [ ] Render as curved line (quadratic or cubic bezier) above buildings
- [ ] Start point: source building rooftop center (Z = building height)
- [ ] End point: target building rooftop center (Z = building height)
- [ ] Peak: midpoint at Z = max(source height, target height) + offset
- [ ] Material: thin wire/cable style (line material, not tube geometry — distinguishes from underground pipes)

### Task 2: Implement dynamic arc height (AC: 3)
- [ ] Calculate arc peak based on horizontal distance between source and target
- [ ] Formula: `peakZ = max(sourceHeight, targetHeight) + baseOffset + (distance * scaleFactor)`
- [ ] `baseOffset`: minimum clearance above tallest building (e.g., 2 units)
- [ ] `scaleFactor`: how much height increases with distance (e.g., 0.1)
- [ ] Cap maximum arc height to prevent extreme values

### Task 3: Implement LOD visibility (AC: 5)
- [ ] Show overhead wires at LOD 2+ (district level and closer)
- [ ] At LOD 2: show top N wires by weight/frequency
- [ ] At LOD 3+: show all overhead wires
- [ ] Read LOD from store/hook

### Task 4: Write tests (AC: 6)
- [ ] Test: wire renders above both connected buildings
- [ ] Test: arc height increases with distance
- [ ] Test: arc height has minimum clearance above tallest building
- [ ] Test: wire hidden at LOD 1
- [ ] Test: wire visible at LOD 2+
- [ ] Test: wire material is line-based (not tube)

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
