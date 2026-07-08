# One World, Two Skins — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** One canonical spatial layout rendered through pluggable visual skins (Architect city / Gardener organism), on the way to a continuous world with no scene swaps.

**Architecture:** Extract a `SceneSkin` seam between the shared hierarchical layout and the rendering components; delete the `cityVersion` v1 axis; route CityView through skin slots with zero visual change; then build determinism, the Gardener skin, and the continuous world on top.

**Tech Stack:** React 19, Three.js via @react-three/fiber, Zustand, Vitest, Playwright.

**Spec:** `docs/specs/2026-07-07-one-world-two-skins-design.md`
**Stories:** `docs/epics/epic-13/stories/` (13-1 … 13-15) — this plan details **Phase 13-A** (stories 13-2 … 13-5). Phases 13-B/C/D get their own detailed plan docs when they start (project convention: one plan per increment); their stories carry the acceptance criteria until then.

## Global Constraints

- All four CI checks before every push: `npm run type-check`, `npm run lint`, `npm run format:check`, `npm test` (format:check is the most-missed — do not skip)
- ESLint: no `!` non-null assertions (use guards); `@ts-expect-error` not `@ts-ignore`; `exactOptionalPropertyTypes` — conditional spread for optional props
- Zustand: primitive selectors only (whole-object selectors cause render loops); any new store field MUST also be added to `reset()` (it enumerates fields manually)
- Zero visual change is the Phase-A acceptance bar: the Epic 10-1 CityView interaction suite (`packages/ui/src/features/canvas/layouts/city/CityView.test.tsx`) must pass without assertion edits (except where a test asserts v1 behavior — those get deleted, not adapted)
- Story 13-1 (verify Phase A foundations — rescoped after PR #15 closed the Epic 10/11 statuses) gates all tasks below
- Branch convention: `feature/<short-name>`; PR target `main`; never push to main

---

### Task 1: SceneSkin types (Story 13-2)

**Files:**
- Create: `packages/ui/src/features/canvas/skins/types.ts`

**Interfaces:**
- Produces: `SkinId`, `SkinLayerProps`, `SkinGroundProps`, `SceneSkin` — consumed by Tasks 2, 3, 6, 9

- [ ] **Step 1: Write the types file**

```ts
// packages/ui/src/features/canvas/skins/types.ts
import type React from 'react'
import type { IVMGraph } from '../../../shared/types'

/** Registered visual languages. Gardener components arrive in Story 13-9. */
export type SkinId = 'architect' | 'gardener'

/** Props for graph-driven skin layers. */
export interface SkinLayerProps {
  graph: IVMGraph
}

/** Props for the ground treatment layer. */
export interface SkinGroundProps {
  width: number
  depth: number
  opacity: number
}

/**
 * A complete visual language for the one canonical layout.
 * Every slot renders the SAME node positions — skins change geometry,
 * never placement.
 */
export interface SceneSkin {
  id: SkinId
  label: string
  /** Above-ground node structures (buildings / trees), incl. signs. */
  Structures: React.ComponentType<SkinLayerProps>
  /** Overhead edge tier — calls (sky wires / vines). */
  Overhead: React.ComponentType<SkinLayerProps>
  /** Underground edge tier — imports & inheritance (pipes / roots). */
  Underground: React.ComponentType<SkinLayerProps>
  /** Metadata indicators (cranes, smog / new growth, blight). */
  Atmosphere: React.ComponentType<SkinLayerProps>
  /** Ground treatment (plaza / meadow). */
  Ground: React.ComponentType<SkinGroundProps>
}
```

- [ ] **Step 2: Type-check**

Run: `npm run type-check --workspace=packages/ui`
Expected: PASS (types only, no consumers yet)

- [ ] **Step 3: Commit**

```bash
git add packages/ui/src/features/canvas/skins/types.ts
git commit -m "feat(skins): SceneSkin interface and SkinId types (13-2)"
```

---

### Task 2: activeSkin store field (Story 13-2)

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts` (state interface, initial state, actions, `reset()`)
- Test: `packages/ui/src/features/canvas/store.test.ts`

**Interfaces:**
- Consumes: `SkinId` from Task 1
- Produces: `useCanvasStore` state `activeSkin: SkinId` and action `setActiveSkin(skin: SkinId): void` — consumed by Tasks 3, 6

- [ ] **Step 1: Write the failing tests** (append to `store.test.ts`)

```ts
describe('activeSkin', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
  })

  it('defaults to architect', () => {
    expect(useCanvasStore.getState().activeSkin).toBe('architect')
  })

  it('setActiveSkin switches the skin', () => {
    useCanvasStore.getState().setActiveSkin('gardener')
    expect(useCanvasStore.getState().activeSkin).toBe('gardener')
  })

  it('reset restores architect', () => {
    useCanvasStore.getState().setActiveSkin('gardener')
    useCanvasStore.getState().reset()
    expect(useCanvasStore.getState().activeSkin).toBe('architect')
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test --workspace=packages/ui -- store.test`
Expected: FAIL — `activeSkin` undefined / `setActiveSkin` is not a function

- [ ] **Step 3: Implement in `store.ts`**

```ts
import type { SkinId } from './skins/types'

// in the state interface:
  /** Active visual language. Skins change geometry, never placement. */
  activeSkin: SkinId
  setActiveSkin: (skin: SkinId) => void

// in initial state (near activeLayout, line ~113):
  activeSkin: 'architect' as SkinId,

// with the other actions (near setActiveLayout, line ~495):
  setActiveSkin: (skin) => set({ activeSkin: skin }),

// in reset() — REQUIRED, reset enumerates fields manually (line ~527 area):
  activeSkin: 'architect' as SkinId,
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test --workspace=packages/ui -- store.test`
Expected: PASS (all three new tests; zero existing failures)

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/store.ts packages/ui/src/features/canvas/store.test.ts
git commit -m "feat(store): activeSkin field with reset support (13-2)"
```

---

### Task 3: Skin registry and useSkin hook (Story 13-2)

**Files:**
- Create: `packages/ui/src/features/canvas/skins/index.ts`
- Test: `packages/ui/src/features/canvas/skins/index.test.ts`

**Interfaces:**
- Consumes: `SceneSkin`, `SkinId` (Task 1); `useCanvasStore.activeSkin` (Task 2); existing components `CityBlocks`, `CitySky`, `CityUnderground`, `CityAtmosphere`, `GroundPlane`
- Produces: `architectSkin: SceneSkin`, `skins: Record<SkinId, SceneSkin>`, `useSkin(): SceneSkin` — consumed by Tasks 6, 8, 9

- [ ] **Step 1: Write the failing test**

```ts
// packages/ui/src/features/canvas/skins/index.test.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { skins, architectSkin, useSkin } from './index'
import { useCanvasStore } from '../store'

describe('skin registry', () => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
  })

  it('architect skin exposes all five slots', () => {
    expect(architectSkin.id).toBe('architect')
    for (const slot of ['Structures', 'Overhead', 'Underground', 'Atmosphere', 'Ground'] as const) {
      expect(architectSkin[slot]).toBeTypeOf('function')
    }
  })

  it('every SkinId resolves to a registered skin', () => {
    expect(skins.architect).toBe(architectSkin)
    expect(skins.gardener).toBeDefined() // TEMP alias until 13-9
  })

  it('useSkin follows activeSkin', () => {
    const { result, rerender } = renderHook(() => useSkin())
    expect(result.current.id).toBe('architect')
    useCanvasStore.getState().setActiveSkin('gardener')
    rerender()
    expect(result.current).toBe(skins.gardener)
  })
})
```

- [ ] **Step 2: Run to verify failure**

Run: `npm test --workspace=packages/ui -- skins/index.test`
Expected: FAIL — module `./index` not found

- [ ] **Step 3: Implement the registry**

```ts
// packages/ui/src/features/canvas/skins/index.ts
import { useCanvasStore } from '../store'
import { CityBlocks } from '../layouts/city/CityBlocks'
import { CitySky } from '../layouts/city/CitySky'
import { CityAtmosphere } from '../layouts/city/CityAtmosphere'
import { CityUnderground } from '../components/CityUnderground'
import { GroundPlane } from '../views/GroundPlane'
import type { SceneSkin, SkinId } from './types'

export type { SceneSkin, SkinId } from './types'

export const architectSkin: SceneSkin = {
  id: 'architect',
  label: 'Architect',
  Structures: CityBlocks,
  Overhead: CitySky,
  Underground: CityUnderground,
  Atmosphere: CityAtmosphere,
  Ground: GroundPlane,
}

/**
 * Skin registry. `gardener` is a TEMP alias to architect until Story 13-9
 * lands the organic components — the toggle UI (13-12) must not ship
 * while this alias exists.
 */
export const skins: Record<SkinId, SceneSkin> = {
  architect: architectSkin,
  gardener: architectSkin,
}

/** Resolve the active skin. Selects the primitive id (Zustand rule). */
export function useSkin(): SceneSkin {
  const activeSkin = useCanvasStore((s) => s.activeSkin)
  return skins[activeSkin]
}
```

Note: if any import path differs (e.g. `GroundPlane` export name/location), fix the import — do not re-export components from new places.

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test --workspace=packages/ui -- skins/index.test`
Expected: PASS. (`useSkin` returns `architectSkin` for BOTH ids while the alias exists — the third test asserts identity with `skins.gardener`, which is correct either way.)

- [ ] **Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/skins/
git commit -m "feat(skins): architect skin registry and useSkin hook (13-2)"
```

---

### Task 4: Remove cityVersion from store and types (Story 13-3)

**Files:**
- Modify: `packages/ui/src/features/canvas/store.ts` (`citySettings.cityVersion` field line ~89, default line ~253, setter action line ~437, plus the `CityVersion` type import/def)
- Modify: `packages/ui/src/features/canvas/visualization/types.ts:14` (remove `cityVersion` field)
- Test: `packages/ui/src/features/canvas/store.test.ts`

**Interfaces:**
- Produces: a store with NO `citySettings.cityVersion` — Task 5 fixes the four components that still read it (they will fail type-check until Task 5; do Tasks 4+5 on one branch, commit together only when green)

- [ ] **Step 1: Delete v1 axis from store + visualization types**

Remove the field, its default (`'v2'`), the `setCityVersion`-style action at line ~437, the `CityVersion` type, and the `cityVersion` member of the interface in `visualization/types.ts`. Update any store tests that referenced `cityVersion` (delete those cases — the axis is gone, not renamed).

- [ ] **Step 2: Type-check to enumerate remaining readers**

Run: `npm run type-check --workspace=packages/ui`
Expected: FAIL in exactly: `LayerToggle.tsx`, `CityView.tsx`, `CityBlocks.tsx`, `CitySky.tsx`, `useCityFiltering.ts` (+ their tests). This list is Task 5's worklist — if anything else appears, handle it the same way (keep v2 behavior).

*(No commit yet — tree is red until Task 5.)*

---

### Task 5: Remove v1 rendering branches (Story 13-3)

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/city/CityView.tsx`, `CityBlocks.tsx`, `CitySky.tsx`, `useCityFiltering.ts`
- Modify: `packages/ui/src/features/canvas/components/LayerToggle.tsx`
- Delete: `packages/ui/src/features/canvas/layouts/city/UndergroundLayer.tsx` (+ its test file)
- Test: existing suites (`CityView.test.tsx`, `useCityFiltering.test.ts`, `LayerToggle` tests)

**Interfaces:**
- Produces: CityView with a single (v2) rendering path — Task 6 rewires it through the skin

- [ ] **Step 1: CityView — v2-only ground opacity and underground**

```tsx
// CityView.tsx — replace the version-branched section with:
const undergroundVisible = useCanvasStore((s) => s.citySettings.undergroundVisible)
const { groundWidth, groundDepth, graph } = useCityLayout() // `positions` was v1-only

const groundOpacity = computeUndergroundGroundOpacity(undergroundVisible)
```

and in JSX, delete the `{cityVersion !== 'v2' && …<UndergroundLayer…>}` block; keep `<CityUnderground graph={graph} />` unconditional (it self-gates on `citySettings.undergroundVisible`). Remove now-unused imports (`UndergroundLayer`, `computeGroundOpacity`, `isUndergroundMode` selector if unreferenced).

- [ ] **Step 2: CityBlocks / CitySky / useCityFiltering / LayerToggle**

In each: delete the `cityVersion` selector and `isV2` flag; keep the v2 branch body unconditionally; delete the v1 branch (CityBlocks' flat path starts ~line 179). In `LayerToggle.tsx` remove the v1/v2 switch UI, keep the v2 controls.

- [ ] **Step 3: Delete the v1-only component**

```bash
git rm packages/ui/src/features/canvas/layouts/city/UndergroundLayer.tsx
git rm packages/ui/src/features/canvas/layouts/city/UndergroundLayer.test.tsx 2>/dev/null || true
```

If `computeGroundOpacity` in `undergroundUtils.ts` is now unreferenced (`grep -rn computeGroundOpacity packages/ui/src`), delete it and its tests.

- [ ] **Step 4: Fix tests asserting v1**

Delete test cases that set `cityVersion: 'v1'` or assert v1 rendering; keep every v2 assertion byte-identical.

- [ ] **Step 5: Verify clean**

Run:
```bash
grep -rn cityVersion packages/ui/src && echo "LEFTOVERS" || echo "CLEAN"
npm run type-check && npm run lint && npm run format:check && npm test
```
Expected: `CLEAN`; all four checks PASS; CityView interaction suite green.

- [ ] **Step 6: Commit**

```bash
git add -A packages/ui/src
git commit -m "refactor(city): delete cityVersion v1 axis — v2 is the only city (13-3)"
```

---

### Task 6: Route CityView through skin slots (Story 13-4)

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/city/CityView.tsx`
- Test: `packages/ui/src/features/canvas/layouts/city/CityView.test.tsx` (mock update only — assertions unchanged)

**Interfaces:**
- Consumes: `useSkin()` (Task 3)
- Produces: skin-driven world rendering — every later story renders through this

- [ ] **Step 1: Update CityView**

```tsx
import { useSkin } from '../../skins'

export function CityView() {
  const visibleLayers = useCanvasStore((s) => s.visibleLayers)
  const undergroundVisible = useCanvasStore((s) => s.citySettings.undergroundVisible)
  const { groundWidth, groundDepth, graph } = useCityLayout()
  const skin = useSkin()

  useCameraTiltAssist()
  useFocusEscape()

  const groundOpacity = computeUndergroundGroundOpacity(undergroundVisible)

  return (
    <group name="city-view">
      <LodController />
      <skin.Ground
        width={Math.max(groundWidth, 20)}
        depth={Math.max(groundDepth, 20)}
        opacity={groundOpacity}
      />
      {visibleLayers.aboveGround && (
        <>
          <skin.Structures graph={graph} />
          <skin.Overhead graph={graph} />
        </>
      )}
      <skin.Atmosphere graph={graph} />
      <skin.Underground graph={graph} />
    </group>
  )
}
```

Gating semantics preserved exactly: `aboveGround` wraps Structures+Overhead (as it wrapped CityBlocks+CitySky); Atmosphere and Underground stay outside it, matching the pre-task JSX.

- [ ] **Step 2: Regression suite must pass unmodified**

Run: `npm test --workspace=packages/ui -- CityView.test`
Expected: PASS with zero assertion changes. If the suite mocks `CityBlocks` et al. by module path, those mocks now apply through the registry import — verify the mocked components still intercept (they do if `vi.mock` paths are unchanged, since the registry imports the same modules).

- [ ] **Step 3: Manual smoke**

Run: `./scripts/init.sh`, open `http://localhost:8742/canvas`
Expected: identical city — buildings, signs, sky wires, underground toggle, atmosphere overlays. (Rebuild `@diagram-builder/core` + `parser` first if the canvas is silently empty — stale-dist gotcha.)

- [ ] **Step 4: Commit**

```bash
git add packages/ui/src/features/canvas/layouts/city/CityView.tsx packages/ui/src/features/canvas/layouts/city/CityView.test.tsx
git commit -m "refactor(canvas): CityView renders through SceneSkin slots — zero visual change (13-4)"
```

---

### Task 7: Freeze basic3d (Story 13-4)

**Files:**
- Modify: `packages/ui/src/features/canvas/layouts/index.ts` (label only)

- [ ] **Step 1: Relabel**

```ts
const basic3dEngine: UILayoutEngine = {
  id: 'basic3d',
  label: 'Basic 3D (debug)',
  component: Basic3DView,
}
```

- [ ] **Step 2: Fix any label-asserting test, run checks, commit**

```bash
npm test --workspace=packages/ui -- layouts/index.test
git add packages/ui/src/features/canvas/layouts/
git commit -m "chore(layouts): freeze basic3d as debug-only view (13-4)"
```

---

### Task 8: Conformance fixture (Story 13-5)

**Files:**
- Create: `packages/ui/src/features/canvas/skins/conformanceFixtures.ts`

**Interfaces:**
- Produces: `conformanceGraph: IVMGraph` (every node kind, both edge tiers), `emptyGraph: IVMGraph` — consumed by Task 9 and later by 13-6 determinism tests

- [ ] **Step 1: Write the fixture** (respect required IVM fields exactly)

```ts
// packages/ui/src/features/canvas/skins/conformanceFixtures.ts
import type { IVMGraph, IVMNode, IVMEdge } from '../../../shared/types'

function node(partial: Pick<IVMNode, 'id' | 'type'> & { path?: string }): IVMNode {
  return {
    id: partial.id,
    type: partial.type,
    lod: 1,
    position: { x: 0, y: 0, z: 0 },
    metadata: {
      label: partial.id,
      path: partial.path ?? `src/fixture/${partial.id}.ts`,
    },
  } as IVMNode
}

function edge(id: string, source: string, target: string, type: IVMEdge['type']): IVMEdge {
  return { id, source, target, type, lod: 1, metadata: {} } as IVMEdge
}

/** Every node kind the Architect skin renders + both edge tiers. */
export const conformanceGraph: IVMGraph = {
  nodes: [
    node({ id: 'fileA', type: 'file' }),
    node({ id: 'ClassA', type: 'class' }),
    node({ id: 'IFaceA', type: 'interface' }),
    node({ id: 'AbstractA', type: 'abstract_class' }),
    node({ id: 'EnumA', type: 'enum' }),
    node({ id: 'funcA', type: 'function' }),
    node({ id: 'varA', type: 'variable' }),
  ],
  edges: [
    edge('e-call', 'funcA', 'ClassA', 'calls'), // overhead tier
    edge('e-import', 'fileA', 'ClassA', 'imports'), // underground tier
    edge('e-extends', 'ClassA', 'AbstractA', 'extends'), // underground tier
    edge('e-implements', 'ClassA', 'IFaceA', 'implements'), // underground tier
  ],
  metadata: {
    name: 'conformance-fixture',
    schemaVersion: '1.0',
    generatedAt: new Date(0).toISOString(),
    rootPath: '/fixture',
    stats: { nodeCount: 7, edgeCount: 4 },
    languages: ['typescript'],
  },
  bounds: { min: { x: -10, y: 0, z: -10 }, max: { x: 10, y: 10, z: 10 } },
} as IVMGraph

export const emptyGraph: IVMGraph = {
  ...conformanceGraph,
  nodes: [],
  edges: [],
  metadata: { ...conformanceGraph.metadata, name: 'empty-fixture', stats: { nodeCount: 0, edgeCount: 0 } },
} as IVMGraph
```

Adjust the `as` casts away if the real `IVMGraph` shape admits object literals directly (check `packages/ui/src/shared/types`); single-cast escape hatches only if `stats` has extra required members — copy real shapes from `CityView.test.tsx` fixtures, which already satisfy the type.

- [ ] **Step 2: Type-check, commit**

```bash
npm run type-check --workspace=packages/ui
git add packages/ui/src/features/canvas/skins/conformanceFixtures.ts
git commit -m "test(skins): conformance fixture graph — all node kinds, both edge tiers (13-5)"
```

---

### Task 9: Conformance harness (Story 13-5)

**Files:**
- Create: `packages/ui/src/features/canvas/skins/skinConformance.test.tsx`

**Interfaces:**
- Consumes: `skins` (Task 3), fixtures (Task 8)
- Produces: the suite every future skin must pass (13-9/13-10/13-11 enroll Gardener; 13-12 appends behavioral cases)

- [ ] **Step 1: Write the parameterized suite**

```tsx
// packages/ui/src/features/canvas/skins/skinConformance.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { skins } from './index'
import { conformanceGraph, emptyGraph } from './conformanceFixtures'
import { useCanvasStore } from '../store'

// R3F/drei mocks — same pattern as CityView.test.tsx
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useFrame: vi.fn(),
  useThree: vi.fn(() => ({ camera: { position: { x: 0, y: 5, z: 10 } }, gl: {} })),
}))
vi.mock('@react-three/drei', () => ({
  Text: (props: Record<string, unknown>) => <div data-testid="drei-text" {...props} />,
  Billboard: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Html: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Grid: () => <div data-testid="drei-grid" />,
  Line: () => <div data-testid="drei-line" />,
}))

const uniqueSkins = [...new Map(Object.values(skins).map((s) => [s.id, s])).values()]

describe.each(uniqueSkins)('skin conformance: $id', (skin) => {
  beforeEach(() => {
    useCanvasStore.getState().reset()
  })

  const graphSlots = ['Structures', 'Overhead', 'Underground', 'Atmosphere'] as const

  it.each(graphSlots)('%s renders the full fixture graph without throwing', (slot) => {
    const Slot = skin[slot]
    expect(() => render(<Slot graph={conformanceGraph} />)).not.toThrow()
  })

  it.each(graphSlots)('%s renders an empty graph without throwing', (slot) => {
    const Slot = skin[slot]
    expect(() => render(<Slot graph={emptyGraph} />)).not.toThrow()
  })

  it.each([0, 0.5, 1])('Ground renders at opacity %f', (opacity) => {
    const Ground = skin.Ground
    expect(() => render(<Ground width={20} depth={20} opacity={opacity} />)).not.toThrow()
  })
})
```

Note `uniqueSkins`: while `gardener` aliases `architect` the suite runs once; when 13-9 replaces the alias it runs per real skin with no harness edits.

- [ ] **Step 2: Run — architect must pass**

Run: `npm test --workspace=packages/ui -- skinConformance`
Expected: PASS. Likely first failures are missing R3F component mocks (add to the mock blocks, mirroring CityView.test.tsx) or empty-graph null guards in city components — a missing guard is a REAL defect: fix the component (e.g. `?? []` / early return), never the test.

- [ ] **Step 3: All four CI checks, commit**

```bash
npm run type-check && npm run lint && npm run format:check && npm test
git add packages/ui/src/features/canvas/skins/skinConformance.test.tsx
git commit -m "test(skins): parameterized skin conformance harness — architect baseline (13-5)"
```

---

## Phase completion

- [ ] Open PR `feature/skin-seam` → `main` covering Tasks 1–9 (or one PR per story if review size warrants)
- [ ] Update `docs/sprints/sprint-status.yaml`: 13-2 … 13-5 → `review`, then `done` after code review
- [ ] Write the Phase 13-B detailed plan (`2026-XX-XX-deterministic-layout-plan.md`) before starting 13-6

## Self-review notes (spec → plan)

- Spec "Architecture / Skin layer" → Tasks 1, 3, 6. "Store changes" → Tasks 2, 4, 5, 7. "Testing strategy" → Tasks 8, 9. Zero-visual-change bar → Task 6 Step 2.
- Spec items NOT in this plan by design: deterministic placement (13-6..13-8), Gardener (13-9..13-12), continuous world (13-13..13-15) — story files carry their ACs until their phase plans are written.
- Type names cross-checked: `SkinId`/`SceneSkin`/`SkinLayerProps`/`SkinGroundProps` consistent across Tasks 1/2/3/6/9; `conformanceGraph`/`emptyGraph` consistent across Tasks 8/9.
