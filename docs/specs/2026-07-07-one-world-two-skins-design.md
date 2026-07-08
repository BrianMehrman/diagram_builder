---
type: design-spec
project_name: diagram_builder
author: Brian (facilitated by Sage)
date: 2026-07-07
status: awaiting-review
related:
  - ux-3d-layout-vision.md
  - city-metaphor-vertical-layering-spec.md
  - tech-spec-city-metaphor-rethink.md
artifacts:
  - docs/mockups/one-world-two-skins.html (interactive Three.js mockup)
---

# Epic 13: One World, Two Skins

## Problem

The 3D experience is fragmented across three independent state axes that do not compose:

- `activeLayout: 'city' | 'basic3d'` — two separate layout engines
- `viewMode: 'city' | 'building' | 'cell'` — Epic 8's scale system; `ViewModeRenderer`
  **swaps the entire scene** when entering a building or cell, so BuildingView/CellView are
  disconnected worlds with their own coordinates
- `cityVersion: 'v1' | 'v2'` — old flat city vs. Epic 10 hierarchical city

Consequences observed in use:

1. **Layout doesn't communicate** — two competing placement systems; node position isn't
   trustworthy as meaning.
2. **Views don't connect** — zooming into a building teleports to a different scene instead
   of moving through one world.
3. **The vision isn't realized** — `ux-3d-layout-vision.md` ("city outside, biology inside")
   exists as disconnected islands built in different epics.

## Concept

**One canonical spatial layout computed from the code graph; two complete visual languages
rendered on top of it.**

- **Architect skin** — the city: buildings, sky wires, subway pipes.
- **Gardener skin** — the organism: trees, vines, roots.

Swapping skins never moves anything. Node positions, camera, and selection are identical in
both skins, so spatial memory transfers. The world is continuous: camera distance drives
detail; entering a structure is a threshold moment inside the same coordinate space, never a
scene swap.

This supersedes the "city outside, biology inside" split of `ux-3d-layout-vision.md`: instead
of the metaphor changing with zoom level, the metaphor is a **user-selected skin** applied
consistently at every zoom level. The vision doc's cell/organelle interior language survives
as the Gardener skin's interior treatment (Phase 4).

## Architecture

### Layout layer (shared substrate)

The v2 hierarchical layout becomes the **single canonical layout engine**. It produces
skin-agnostic data:

- positions, footprints, heights
- hierarchy: folder → file → class → method
- edges classified by routing tier: **overhead** (calls), **underground** (imports,
  inheritance)

### Skin layer (pluggable renderers)

A `SceneSkin` interface. Each skin supplies:

- node renderers per node kind (class, interface, abstract class, enum, function, file, folder)
- edge renderers per routing tier
- ambience: ground treatment, lighting, atmosphere indicators

The existing city components (ClassBuilding, FileBlock, SkyEdge, UndergroundPipe, signs,
atmosphere) move behind this interface **unchanged**. The Gardener skin implements the same
contract with new components (Tree, Canopy, VineEdge, RootEdge, …).

### Store changes

- `cityVersion` axis is **deleted** (v1 code removed).
- New `activeSkin: 'architect' | 'gardener'` field.
- `viewMode` stops selecting scenes; it becomes a **derived value** (computed from camera
  position: over city / inside structure envelope) used only for HUD, breadcrumbs, and
  control hints. `BuildingView`/`CellView` as standalone scenes retire.
- `activeLayout`/basic3d is **frozen**: kept behind the existing switcher as a maintenance-mode
  debug view, excluded from the continuous-world experience. (If the skin architecture proves
  out, basic3d could later be reborn as a cheap third "wireframe" skin.)

## Semantic mapping — equal citizens

Every code fact renders in both skins with equal fidelity. No indicator is second-class.

| Code fact | Architect (city) | Gardener (organism) |
|---|---|---|
| Folder/module | district ground arc | grove / soil bed |
| Class | building | tree (trunk + canopy) |
| Method count | building height / rooms | branch + leaf density |
| Standalone function | kiosk | sapling/shrub |
| Base class | wide sandstone building | old-growth tree |
| Export | rooftop sign | fruit |
| Call edge | sky wire | vine |
| Import/inheritance | subway pipe | root |
| Churn | construction crane | bright new growth |
| Deprecated | striped overlay | bare gray branches |
| Test coverage | lit windows | fireflies/bioluminescence |
| Complexity hotspot | smog | blight/withered canopy |

An interactive mockup demonstrating all rows in both skins lives at
`docs/mockups/one-world-two-skins.html` (open directly in a browser; self-contained,
Three.js via CDN).

## Deterministic semantic placement

Lands in the shared layout layer, so both skins inherit it:

- districts = top-level directories/modules
- within-district proximity = import coupling (promote `proximityRefinement` from an optional
  pass to the rule)
- **deterministic**: same repo always produces the same city — seeded ordering, path-sorted
  tie-breaking
- **stable across re-parses**: unchanged nodes keep their placement so the world stays
  memorable as code evolves

## Phasing

Each phase is independently shippable.

- **Phase 0 — prerequisite:** close the Epic 10/11 review backlog (~38 stories in `review`);
  this epic builds directly on that code.
- **Phase 1 — skin seam:** extract the `SceneSkin` interface; move city rendering behind it;
  delete `cityVersion` v1 branches; freeze basic3d. **Zero visual change**, protected by the
  Epic 10-1 CityView interaction regression suite.
- **Phase 2 — substrate:** deterministic semantic layout in the shared layout layer.
- **Phase 3 — Gardener skin to parity:** all node/edge kinds, ambience, selection, search
  fly-to, LOD, HUD stats, plus the skin toggle with camera/selection preservation.
- **Phase 4 — continuous world:** camera-distance detail (no mode switches), membrane-crossing
  threshold transitions, per-skin interiors (method rooms ⇄ leaf clusters/organelles),
  `viewMode` derived from camera; retire scene-swapping `ViewModeRenderer`.

## Testing strategy

**Skin-conformance suite:** one parameterized test harness that runs identical assertions
against every registered skin:

- renders every node kind and edge tier without error
- selection, hover, and search fly-to work
- skin toggle preserves camera, selection, and node positions
- LOD transitions occur at the same camera distances

City skin must pass it first (establishing the baseline); the Gardener skin must pass the
same suite to ship. Phase 1 is additionally guarded by the existing CityView interaction
regression tests (Epic 10-1). E2E continues to use `data-testid` hooks and
`window.__canvasStore` (DEV-only).

## Risks

- **Extraction risk (Phase 1):** moving city components behind an interface without visual
  change; mitigated by the regression suite and "zero visual diff" acceptance criteria.
- **Parity creep (Phase 3):** the organism skin has no existing components; the conformance
  suite defines "done" objectively to prevent endless polish.
- **Perf:** two skins mean more geometry variants, but only one skin renders at a time;
  organic geometry (spheres, tubes) must reuse instancing patterns from the LOD perf work.

## Out of scope

- Multi-language parsing, collaboration features, git-history temporal views.
- Rebuilding basic3d as a wireframe skin (noted as a future possibility only).
- Any new parser-side metrics; both skins consume only data the parser already extracts.
