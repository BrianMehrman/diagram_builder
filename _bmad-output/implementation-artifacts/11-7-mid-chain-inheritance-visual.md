# Story 11.7: Mid-Chain Inheritance Visual Treatment

Status: not-started

## Story

**ID:** 11-7
**Key:** 11-7-mid-chain-inheritance-visual
**Title:** Mid-Chain Inheritance Visual Treatment
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-B: Base Class Visual Differentiation
**Priority:** MEDIUM - Edge case handling for inheritance chains

**As a** developer viewing an inheritance hierarchy,
**I want** classes in the middle of an inheritance chain (both extend and are extended from) to receive the base class visual treatment,
**So that** any class that other code depends on is immediately identifiable as foundational.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 4.2

---

## Acceptance Criteria

- **AC-1:** A class that is both a subclass AND a base class (mid-chain) receives the base class visual treatment
- **AC-2:** Rule: if ANY class inherits from it, it gets the base class look — being a subclass does not override this
- **AC-3:** Deep inheritance chains (A → B → C → D) correctly mark B and C as base classes
- **AC-4:** Inheritance via `implements` also qualifies — an interface implemented by others gets base class treatment
- **AC-5:** Visual integration test: a 3+ level inheritance chain renders correctly with base class visuals on all mid-chain nodes
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Verify detection utility handles mid-chain (AC: 1, 2, 3)
- [ ] Verify `detectBaseClasses()` from Story 11-5 correctly identifies mid-chain classes
- [ ] Add explicit test cases for chains of depth 3+
- [ ] Verify the rule: "if inherited from → base class" regardless of whether it also extends something

### Task 2: Verify visual rendering for mid-chain (AC: 1, 5)
- [ ] Create test scenario with A → B → C inheritance chain
- [ ] Verify B renders with base class visual (distinct color + profile)
- [ ] Verify A (root base) also renders with base class visual
- [ ] Verify C (leaf subclass only) renders as regular class

### Task 3: Handle interface implementation chains (AC: 4)
- [ ] Verify interfaces implemented by multiple classes get base class visual
- [ ] Test: `InterfaceBuilding` with `isBaseClass=true` gets the distinct treatment while maintaining glass/wireframe character

### Task 4: Write tests (AC: 6)
- [ ] Test: A → B → C chain: A=base, B=base, C=regular
- [ ] Test: A → B → C → D chain: A=base, B=base, C=base, D=regular
- [ ] Test: diamond inheritance: A → B, A → C, B → D, C → D: A=base, B=base, C=base, D=regular
- [ ] Test: interface implemented by multiple classes: interface=base

---

## Dev Notes

- This story is primarily validation and edge-case testing of Stories 11-5 and 11-6
- If the detection utility from 11-5 handles this correctly (it should — the logic is "has incoming extends edge"), most of this story is testing
- Diamond inheritance is the trickiest case — ensure no infinite loops in detection
- The visual for an InterfaceBuilding that is also a base class needs consideration: keep glass aesthetic but add base class color tint?

## Dependencies
- 11-5 (base class detection utility)
- 11-6 (base class building component)

## Files Expected
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` (MODIFIED — chain tests)
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.tsx` (MODIFIED — base class tint)
- `packages/ui/src/features/canvas/components/buildings/InterfaceBuilding.test.tsx` (MODIFIED)
