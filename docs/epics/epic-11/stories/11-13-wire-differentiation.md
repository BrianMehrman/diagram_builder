# Story 11.13: Overhead Wire Differentiation — Method Calls vs Composition

Status: review

## Story

**ID:** 11-13
**Key:** 11-13-wire-differentiation
**Title:** Overhead Wire Differentiation — Method Calls vs Composition
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-D: Overhead Wire Layer
**Priority:** MEDIUM - Visual clarity for overhead connections

**As a** developer viewing overhead wires between buildings,
**I want** method call wires and composition wires to be visually distinguishable,
**So that** I can tell whether a connection represents a method calling another method or a class holding/using an instance of another class.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 6.2

---

## Acceptance Criteria

- **AC-1:** Method-to-method call wires have a distinct visual style (color, line style)
- **AC-2:** Composition reference wires have a different visual style from method calls
- **AC-3:** Both wire types are distinguishable at city-level zoom (LOD 2)
- **AC-4:** Legend or tooltip indicates what each wire style means
- **AC-5:** Wire type determined by edge relationship type from the graph
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Define wire style constants (AC: 1, 2)
- [x] Added to `cityViewUtils.ts`:
  - `WIRE_DASHED_TYPES: ReadonlySet<string>` = `new Set(['composes'])`
  - `WIRE_DASH_SIZE = 0.4`, `WIRE_GAP_SIZE = 0.25` (world-space units)
  - Colors already defined in `WIRE_COLORS`: calls=#34d399 (green), composes=#a78bfa (purple)
- [x] Colors contrast against dark sky background; distinct from underground pipe colors (blue-gray)

### Task 2: Update OverheadWire component for type-based styling (AC: 1, 2, 5)
- [x] Added `getWireMaterialType(edgeType): 'solid' | 'dashed'` to `cityViewUtils.ts`
- [x] `OverheadWire.tsx` uses `LineDashedMaterial` when `getWireMaterialType(edgeType) === 'dashed'`
- [x] `line.computeLineDistances()` called after geometry for dashed lines (Three.js requirement)
- [x] Wire type driven by `edgeType` prop — same prop already connected to classifier in Story 11-9

### Task 3: Ensure city-level readability (AC: 3)
- [x] LOD 2+ gate (`WIRE_LOD_MIN = 2`) already in place from Story 11-11
- [x] Dash pattern (0.4 dash / 0.25 gap) is legible at district zoom
- [x] Green vs purple palette has strong hue contrast at distance

### Task 4: Add wire type to legend/tooltip (AC: 4)
- [x] Wire type legend added to `LayerToggle.tsx` in v2 mode
- [x] Shows "— Calls" (green) and "- - Composes" (purple) with matching colors
- [x] Displayed below underground toggles in the right panel

### Task 5: Write tests (AC: 6)
- [x] Test: `calls` → `'solid'`
- [x] Test: `composes` → `'dashed'`
- [x] Test: unknown/empty → `'solid'` (safe default)
- [x] Test: `WIRE_DASHED_TYPES.has('composes')` true, `has('calls')` false
- [x] Test: calls and composes have different material types
- [x] Test: case-insensitive lookup (`'Composes'`, `'COMPOSES'` → `'dashed'`)
- [x] Test: WIRE_DASH_SIZE > WIRE_GAP_SIZE (more line than gap)

---

## Dev Notes

- This builds on the OverheadWire component from Story 11-11 — adds type-based styling
- The edge classifier from Story 11-9 determines which edges are overhead; this story further splits overhead edges by sub-type
- Parser must distinguish method call edges from composition edges — verify edge types available in graph data
- If composition edges are not yet produced by the parser, this story may need a parser prerequisite or should gracefully handle missing type (default to method-call styling)

## Dependencies
- 11-11 (overhead wire component)
- 11-9 (edge routing classifier — overhead sub-types)

## Files Expected
- `packages/ui/src/features/canvas/components/OverheadWire.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/OverheadWire.test.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — wire style constants)

---

## Dev Agent Record

### Implementation Notes (2026-02-18)

**Design decisions:**
- Drove material type from `edgeType` prop (same string used for color) rather than adding a separate `wireType` prop — keeps the API minimal and consistent with how `getWireColor` already works
- `getWireMaterialType()` is lowercase-normalised so edge type strings from the graph (e.g. `'Composes'`) are handled safely
- `LineDashedMaterial` requires `line.computeLineDistances()` — this is called immediately after construction and is a Three.js requirement for dashed lines to render correctly
- Dash pattern (0.4 / 0.25) chosen to be legible at district zoom (LOD 2) with the given arc lengths
- Legend placed in `LayerToggle` v2 section — static HTML, no R3F, matches existing toggle UI style

**New exports in `cityViewUtils.ts`:**
- `WIRE_DASHED_TYPES: ReadonlySet<string>` — `new Set(['composes'])`
- `WIRE_DASH_SIZE = 0.4` / `WIRE_GAP_SIZE = 0.25`
- `getWireMaterialType(edgeType): 'solid' | 'dashed'`

### Modified Files
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — 3 constants + 1 function)
- `packages/ui/src/features/canvas/components/OverheadWire.tsx` (MODIFIED — dashed branch, computeLineDistances)
- `packages/ui/src/features/canvas/components/OverheadWire.test.ts` (MODIFIED — 10 new tests for getWireMaterialType)
- `packages/ui/src/features/canvas/components/LayerToggle.tsx` (MODIFIED — wire legend in v2 mode)

### Test Results
- 1642 passing, 40 pre-existing jsdom failures (one fewer than before — unrelated pre-existing fix)
