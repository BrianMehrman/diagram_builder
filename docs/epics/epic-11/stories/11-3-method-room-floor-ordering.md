# Story 11.3: Method Room Floor Ordering & Type Distinction

Status: review

## Story

**ID:** 11-3
**Key:** 11-3-method-room-floor-ordering
**Title:** Method Room Floor Ordering & Type Distinction
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-A: Method Rooms & Building Containment
**Priority:** HIGH - Semantic ordering of methods inside buildings

**As a** developer inspecting a class building,
**I want** public methods on lower floors and private methods on upper floors, with constructors and static methods visually distinct,
**So that** the public API is the "storefront" at ground level and internal details are upstairs.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 5

---

## Acceptance Criteria

- **AC-1:** Public methods are placed on lower floors (closest to building base)
- **AC-2:** Protected methods are placed on middle floors
- **AC-3:** Private methods are placed on upper floors (closest to building top)
- **AC-4:** Constructors render as rooms with a distinct color or label indicating their role
- **AC-5:** Static methods render with a visually distinguishable style (different room color or subtle badge) from instance methods
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Implement visibility-based sorting (AC: 1, 2, 3)
- [ ] Create `sortMethodsByVisibility(methods: MethodInfo[])` utility
- [ ] Sort order: public → protected → private
- [ ] Within same visibility tier, maintain original source order
- [ ] Feed sorted list into room layout algorithm from Story 11-2

### Task 2: Implement constructor visual distinction (AC: 4)
- [ ] Detect constructor methods (name = `constructor`, `__init__`, `initialize`, etc.)
- [ ] Apply distinct room color (e.g., gold/amber accent)
- [ ] Optionally add a small label or icon indicator

### Task 3: Implement static method visual distinction (AC: 5)
- [ ] Detect static methods from metadata (`isStatic` flag)
- [ ] Apply distinct room color or material (e.g., metallic sheen, different hue from instance methods)
- [ ] Subtle badge or border to reinforce "belongs to class, not instance"

### Task 4: Define color palette for method types (AC: 4, 5)
- [ ] Define constants in `cityViewUtils.ts`:
  - Instance method (public): base color (e.g., light blue)
  - Instance method (protected): muted variant
  - Instance method (private): darker variant
  - Constructor: accent color (e.g., gold/amber)
  - Static method: distinct color (e.g., teal/cyan with metallic material)

### Task 5: Write tests (AC: 6)
- [ ] Test: public methods positioned lower than private methods
- [ ] Test: sort order is public → protected → private
- [ ] Test: constructor gets distinct color
- [ ] Test: static method gets distinct visual
- [ ] Test: mixed visibility methods sort correctly

---

## Dev Notes

- Relies on `visibility` field on method metadata — verify parser populates this
- The `GraphNode` already has `visibility?: 'public' | 'protected' | 'private' | 'static'` from Story 9-16
- Static is both a visibility modifier and a type — a method can be `public static`. Decide: does static override visibility sorting, or is it an overlay?

## Dependencies
- 11-2 (method room component — provides the room to style)

## Files Expected
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — sort utility, color constants)
- `packages/ui/src/features/canvas/views/cityViewUtils.test.ts` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/MethodRoom.tsx` (MODIFIED — type-based styling)
