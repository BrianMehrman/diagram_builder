# Story 11.13: Overhead Wire Differentiation — Method Calls vs Composition

Status: not-started

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
- [ ] Define in `cityViewUtils.ts`:
  - Method call wire: solid line, color (e.g., electric blue or orange)
  - Composition wire: dashed line, color (e.g., green or purple)
- [ ] Ensure both colors contrast well against sky/background
- [ ] Ensure colors are distinct from underground pipe colors

### Task 2: Update OverheadWire component for type-based styling (AC: 1, 2, 5)
- [ ] Accept `wireType: 'method-call' | 'composition'` prop
- [ ] Apply line material based on type:
  - Method call: `LineBasicMaterial` with solid line
  - Composition: `LineDashedMaterial` with dashed pattern
- [ ] Apply color based on type
- [ ] Determine wire type from edge relationship type via classifier (Story 11-9)

### Task 3: Ensure city-level readability (AC: 3)
- [ ] Wire colors must be distinguishable at LOD 2 (district zoom)
- [ ] Line width sufficient to see style difference (solid vs dashed) at distance
- [ ] Test with both light and dark background settings

### Task 4: Add wire type to legend/tooltip (AC: 4)
- [ ] Add wire type legend to canvas toolbar or info panel
- [ ] On hover over a wire: tooltip showing relationship type and connected nodes
- [ ] Match existing tooltip patterns in the UI

### Task 5: Write tests (AC: 6)
- [ ] Test: method call wire gets solid line material
- [ ] Test: composition wire gets dashed line material
- [ ] Test: wire colors match defined constants
- [ ] Test: colors differ between method call and composition
- [ ] Test: wire type derived from edge relationship type

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
