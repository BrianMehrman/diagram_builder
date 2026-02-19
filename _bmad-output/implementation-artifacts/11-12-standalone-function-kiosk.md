# Story 11.12: Standalone Function Kiosk Component

Status: review

## Story

**ID:** 11-12
**Key:** 11-12-standalone-function-kiosk
**Title:** Standalone Function Kiosk Component
**Epic:** Epic 11 - Vertical Layering — 3D Semantic City
**Phase:** Epic 11-D: Overhead Wire Layer
**Priority:** MEDIUM - Visual refinement for standalone functions

**As a** developer viewing the city visualization,
**I want** standalone functions (not inside a class) rendered as small kiosks or shops on the file block,
**So that** I can clearly distinguish standalone functions from class buildings.

**Spec Reference:** `city-metaphor-vertical-layering-spec.md` Section 8

---

## Acceptance Criteria

- **AC-1:** Standalone functions render as small kiosk/shop structures — single-story, compact
- **AC-2:** Kiosks sit directly on the file's city block (Z = 0, on the foundation)
- **AC-3:** Kiosks are visually smaller and simpler than class buildings — clearly readable as "not a class"
- **AC-4:** Overhead wires connect to kiosks when other methods call them
- **AC-5:** Kiosk visual is distinct from existing `FunctionShop` component (or updates it)
- **AC-6:** Co-located unit tests

---

## Tasks/Subtasks

### Task 1: Update FunctionShop component to kiosk visual (AC: 1, 3)
- [x] Modify `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx`
- [x] Reduce dimensions: KIOSK_WIDTH=1.5, KIOSK_DEPTH=1.5, KIOSK_HEIGHT=1.0
- [x] Single-story height (no floor bands, no rooms — it IS the function)
- [x] Material: warm amber palette distinct from class buildings
- [x] Awning slab (KIOSK_AWNING_OVERHANG=0.25, KIOSK_AWNING_THICKNESS=0.12) reinforces kiosk metaphor

### Task 2: Ensure correct positioning on file block (AC: 2)
- [x] Kiosk Y-base at ground level — group positioned at `position.y`, body at `height/2`
- [x] Positioned alongside class buildings via CityBlocks layout (no separate change needed)
- [x] Smaller footprint (1.5 × 1.5) easily fits in gaps between class buildings (2.5 × 2.5)

### Task 3: Verify overhead wire connectivity (AC: 4)
- [x] OverheadWire (Story 11-11) uses `sourceHeight`/`targetHeight` props — kiosk rooftop is at KIOSK_HEIGHT (1.0), which `calculateWireArcPeak` handles correctly (min clearance = WIRE_BASE_OFFSET above rooftop)

### Task 4: Update building geometry factory (AC: 5)
- [x] `buildingGeometry.ts` function case: shape='box', width=KIOSK_WIDTH, height=KIOSK_HEIGHT, depth=KIOSK_DEPTH
- [x] Material roughness=0.5, metalness=0.2 (distinct from class roughness=0.7, metalness=0.1)

### Task 5: Write tests (AC: 6)
- [x] Test: kiosk dimensions are smaller than class building (width/depth)
- [x] Test: kiosk height < FLOOR_HEIGHT (sub-floor-height single story)
- [x] Test: geometry factory returns box shape for function nodes
- [x] Test: kiosk not transparent/wireframe/dashed
- [x] Test: kiosk has distinct roughness from class building

---

## Dev Notes

- The existing `FunctionShop` component from Story 9-9 already renders standalone functions — this story refines it to be more kiosk-like
- The geometry factory already maps `function` → shop config — update the dimensions and material
- Keep the geometry simple — a kiosk is a box with maybe a slight overhang/awning, not complex architecture

## Dependencies
- 11-11 (overhead wire component — wires connect to kiosks)

## Files Expected
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.test.tsx` (MODIFIED)
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` (MODIFIED)

---

## Dev Agent Record

### Implementation Notes (2026-02-18)

**Design decisions:**
- Changed from `cylinderGeometry` (round silo) to `boxGeometry` (kiosk box) — better aligns with "shop/kiosk on a block" metaphor
- Removed directory-based colour in favour of a fixed warm amber palette (`#f59e0b`) so kiosks are immediately recognisable regardless of directory
- Awning geometry is a thin flat box (`KIOSK_AWNING_THICKNESS = 0.12`) sitting at 80% of wall height with `KIOSK_AWNING_OVERHANG = 0.25` per side
- `getBuildingConfig()` now returns `shape: 'box'` for `function` so any renderer using the factory picks up the right geometry

**New constants in `cityViewUtils.ts`:**
- `KIOSK_WIDTH = 1.5` / `KIOSK_DEPTH = 1.5` / `KIOSK_HEIGHT = 1.0`
- `KIOSK_AWNING_OVERHANG = 0.25` / `KIOSK_AWNING_THICKNESS = 0.12`

**Overhead wire connectivity (AC-4):**
- `OverheadWire` (Story 11-11) uses `sourceHeight`/`targetHeight` props
- Caller passes kiosk rooftop height = `KIOSK_HEIGHT` (1.0)
- `calculateWireArcPeak(kiosk1H, kiosk2H, dist)` = `1.0 + 2 + dist * 0.1` — well clear of the kiosk

### Modified Files
- `packages/ui/src/features/canvas/views/cityViewUtils.ts` (MODIFIED — 5 KIOSK constants added)
- `packages/ui/src/features/canvas/components/buildingGeometry.ts` (MODIFIED — function case: cylinder→box, SHOP_WIDTH→KIOSK_WIDTH)
- `packages/ui/src/features/canvas/components/buildings/FunctionShop.tsx` (MODIFIED — box+awning, amber palette)
- `packages/ui/src/features/canvas/components/buildingGeometry.test.ts` (MODIFIED — function describe updated to kiosk expectations, 4 new tests)

### Test Results
- 1631 passing, 41 pre-existing jsdom failures (unchanged baseline)
