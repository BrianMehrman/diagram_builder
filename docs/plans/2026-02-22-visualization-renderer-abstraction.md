# Visualization Renderer Abstraction Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate layout logic from 3D rendering by introducing a `VisualizationRenderer` interface + `RendererRegistry` (mirroring `LayoutEngine`/`LayoutRegistry`), while also splitting the 700-line `cityViewUtils.ts` god module, extracting `BuildingFactory`/`SignFactory`/`InfrastructureFactory` to eliminate duplicate `switch(node.type)` code, and scaffolding a `TreeRenderer` as proof of swappability.

**Architecture:** A `VisualizationRenderer` interface lives in `visualization/types.ts`. A `RendererRegistry` singleton lives in `visualization/registry.ts`. All city-specific rendering moves to `visualization/renderers/city/` and is wrapped in a `CityRenderer` that implements the interface. A stub `TreeRenderer` demonstrates that layout and rendering are truly decoupled.

**Tech Stack:** TypeScript strict, React 19, @react-three/fiber (R3F), Zustand, Vitest

---

## Dependency Map

```
Phase 1 (foundation)
  Task 1: visualization/types.ts
  Task 2: visualization/registry.ts         ← needs Task 1

Phase 2 (utility splits — fully parallel, no deps)
  Task 3: colorUtils.ts + inheritanceUtils.ts
  Task 4: heightUtils.ts
  Task 5: pipeUtils.ts + wireUtils.ts
  Task 6: focusUtils.ts + methodUtils.ts + edgeUtils.ts
  Task 7: cityViewUtils.ts barrel re-export (update imports)

Phase 3 (factory extraction — parallel, needs Phase 2)
  Task 8: BuildingFactory.ts               ← needs Task 4 (height), Task 3 (color)
  Task 9: InfrastructureFactory.tsx
  Task 10: (signs already factored — validate and test)

Phase 4 (CityRenderer — needs Phase 1+3)
  Task 11: CityRenderer.tsx + register in registry

Phase 5 (ViewModeRenderer wiring — needs Phase 4)
  Task 12: Update ViewModeRenderer to use RendererRegistry

Phase 6 (TreeRenderer proof-of-concept — needs Phase 1)
  Task 13: tree layout engine stub
  Task 14: TreeRenderer.tsx
```

---

## Task 1: Create `visualization/types.ts`

**Purpose:** Define the `VisualizationRenderer` interface and supporting types that mirror the existing `LayoutEngine` pattern.

**Files:**
- Create: `packages/ui/src/features/canvas/visualization/types.ts`
- Create: `packages/ui/src/features/canvas/visualization/types.test.ts`

**Step 1: Write the failing test**

```typescript
// packages/ui/src/features/canvas/visualization/types.test.ts
import { describe, it, expect } from 'vitest';
import type { VisualizationRenderer, RenderContext, VisualizationStyle } from './types';
import type { Graph } from '../../../shared/types';
import type { LayoutEngine, LayoutResult } from '../layout/types';

describe('VisualizationRenderer contract', () => {
  it('can implement VisualizationRenderer with required methods', () => {
    const stubRenderer: VisualizationRenderer = {
      type: 'stub',
      render: (_ctx: RenderContext) => null as unknown as React.JSX.Element,
      canRender: (_layoutType: string) => true,
    };
    expect(stubRenderer.type).toBe('stub');
    expect(stubRenderer.canRender('radial-city')).toBe(true);
  });

  it('VisualizationStyle bundles a layout engine and renderer', () => {
    const stubEngine: LayoutEngine = {
      type: 'stub-layout',
      layout: (_graph: Graph) => ({ positions: new Map(), bounds: { min: { x:0,y:0,z:0 }, max: { x:0,y:0,z:0 } } }) as LayoutResult,
      canHandle: () => true,
    };
    const stubRenderer: VisualizationRenderer = {
      type: 'stub',
      render: () => null as unknown as React.JSX.Element,
      canRender: () => true,
    };
    const style: VisualizationStyle = {
      id: 'test-style',
      label: 'Test Style',
      layoutEngine: stubEngine,
      renderer: stubRenderer,
    };
    expect(style.id).toBe('test-style');
    expect(style.layoutEngine.type).toBe('stub-layout');
    expect(style.renderer.type).toBe('stub');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd /Users/brianmehrman/projects/diagram_builder
npx vitest run packages/ui/src/features/canvas/visualization/types.test.ts
```

Expected: FAIL — `Cannot find module './types'`

**Step 3: Write the implementation**

```typescript
// packages/ui/src/features/canvas/visualization/types.ts
import type { Graph, Position3D } from '../../../shared/types';
import type { LayoutEngine, LayoutResult, HierarchicalLayoutResult } from '../layout/types';
import type { CitySettings } from '../store';

/**
 * Context passed to every VisualizationRenderer.render() call.
 * Contains everything a renderer needs to produce its 3D scene.
 */
export interface RenderContext {
  /** The full graph being visualised */
  graph: Graph;
  /** Flat map of node ID → world-space position (from layout engine) */
  positions: Map<string, Position3D>;
  /** Raw layout result (may be HierarchicalLayoutResult for city-style engines) */
  layoutResult: LayoutResult | HierarchicalLayoutResult;
  /** Current camera LOD level (0–4) */
  lodLevel: number;
  /** Visual settings from the canvas store */
  citySettings: CitySettings;
}

/**
 * Interface all visualization renderers must implement.
 *
 * A VisualizationRenderer is the symmetric counterpart to LayoutEngine:
 * - LayoutEngine computes WHERE nodes are (pure data, no React)
 * - VisualizationRenderer decides HOW they look (React/R3F components)
 *
 * Renderers are registered in RendererRegistry and selected by
 * VisualizationStyleRegistry pairing them with a LayoutEngine.
 */
export interface VisualizationRenderer {
  /** Unique identifier matching the paired LayoutEngine type (e.g. 'radial-city') */
  readonly type: string;

  /**
   * Produce the full 3D scene subtree for this renderer.
   * Called inside an R3F <Canvas> context.
   */
  render(ctx: RenderContext): React.JSX.Element;

  /**
   * Whether this renderer can handle output from a given layout engine type.
   * Used by RendererRegistry.autoSelect().
   */
  canRender(layoutType: string): boolean;
}

/**
 * A VisualizationStyle bundles a layout engine with its matched renderer.
 * This is the unit of swappability — swapping a style swaps both algorithm and visuals.
 */
export interface VisualizationStyle {
  /** Unique identifier for this style (e.g. 'city', 'tree') */
  id: string;
  /** Human-readable display label (e.g. 'City View', 'Tree View') */
  label: string;
  /** The layout engine that computes positions */
  layoutEngine: LayoutEngine;
  /** The renderer that turns those positions into 3D visuals */
  renderer: VisualizationRenderer;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run packages/ui/src/features/canvas/visualization/types.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/visualization/types.ts \
        packages/ui/src/features/canvas/visualization/types.test.ts
git commit -m "feat(visualization): add VisualizationRenderer interface and RenderContext types"
```

---

## Task 2: Create `visualization/registry.ts`

**Purpose:** Create `RendererRegistry` class (mirrors `LayoutRegistry`) and a `VisualizationStyleRegistry` that pairs layout engines with renderers.

**Files:**
- Create: `packages/ui/src/features/canvas/visualization/registry.ts`
- Create: `packages/ui/src/features/canvas/visualization/registry.test.ts`

**Step 1: Write the failing tests**

```typescript
// packages/ui/src/features/canvas/visualization/registry.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { RendererRegistry, VisualizationStyleRegistry } from './registry';
import type { VisualizationRenderer, RenderContext, VisualizationStyle } from './types';
import type { LayoutEngine, LayoutResult } from '../layout/types';
import type { Graph } from '../../../shared/types';

function makeRenderer(type: string, handles: string[]): VisualizationRenderer {
  return {
    type,
    render: (_ctx: RenderContext) => null as unknown as React.JSX.Element,
    canRender: (lt: string) => handles.includes(lt),
  };
}

function makeEngine(type: string): LayoutEngine {
  return {
    type,
    layout: (_g: Graph) => ({ positions: new Map(), bounds: { min: {x:0,y:0,z:0}, max: {x:0,y:0,z:0} } }) as LayoutResult,
    canHandle: () => true,
  };
}

describe('RendererRegistry', () => {
  let registry: RendererRegistry;

  beforeEach(() => { registry = new RendererRegistry(); });

  it('registers and retrieves a renderer by type', () => {
    const r = makeRenderer('city', ['radial-city']);
    registry.register(r);
    expect(registry.get('city')).toBe(r);
  });

  it('returns undefined for unregistered type', () => {
    expect(registry.get('unknown')).toBeUndefined();
  });

  it('autoSelect picks first renderer that canRender the layout type', () => {
    registry.register(makeRenderer('tree', ['tree']));
    registry.register(makeRenderer('city', ['radial-city']));
    const selected = registry.autoSelect('radial-city');
    expect(selected?.type).toBe('city');
  });

  it('unregister removes the renderer', () => {
    registry.register(makeRenderer('city', ['radial-city']));
    registry.unregister('city');
    expect(registry.get('city')).toBeUndefined();
  });

  it('size reflects registered count', () => {
    expect(registry.size).toBe(0);
    registry.register(makeRenderer('city', []));
    expect(registry.size).toBe(1);
  });
});

describe('VisualizationStyleRegistry', () => {
  let registry: VisualizationStyleRegistry;

  beforeEach(() => { registry = new VisualizationStyleRegistry(); });

  it('registers and retrieves a style by id', () => {
    const style: VisualizationStyle = {
      id: 'city',
      label: 'City View',
      layoutEngine: makeEngine('radial-city'),
      renderer: makeRenderer('city', ['radial-city']),
    };
    registry.register(style);
    expect(registry.get('city')).toBe(style);
  });

  it('getAll returns all registered styles', () => {
    registry.register({ id: 'a', label: 'A', layoutEngine: makeEngine('a'), renderer: makeRenderer('a', []) });
    registry.register({ id: 'b', label: 'B', layoutEngine: makeEngine('b'), renderer: makeRenderer('b', []) });
    expect(registry.getAll()).toHaveLength(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/ui/src/features/canvas/visualization/registry.test.ts
```

Expected: FAIL

**Step 3: Write the implementation**

```typescript
// packages/ui/src/features/canvas/visualization/registry.ts
import type { VisualizationRenderer, VisualizationStyle } from './types';

/**
 * Registry for VisualizationRenderer instances.
 * Mirrors LayoutRegistry in layout/registry.ts.
 */
export class RendererRegistry {
  private renderers = new Map<string, VisualizationRenderer>();

  register(renderer: VisualizationRenderer): void {
    this.renderers.set(renderer.type, renderer);
  }

  unregister(type: string): boolean {
    return this.renderers.delete(type);
  }

  get(type: string): VisualizationRenderer | undefined {
    return this.renderers.get(type);
  }

  /** Return the first renderer that reports it can handle the given layout type. */
  autoSelect(layoutType: string): VisualizationRenderer | undefined {
    for (const renderer of this.renderers.values()) {
      if (renderer.canRender(layoutType)) return renderer;
    }
    return undefined;
  }

  getAll(): VisualizationRenderer[] {
    return Array.from(this.renderers.values());
  }

  has(type: string): boolean {
    return this.renderers.has(type);
  }

  get size(): number {
    return this.renderers.size;
  }
}

/**
 * Registry for VisualizationStyle instances.
 * Each style bundles a LayoutEngine with its matched VisualizationRenderer.
 */
export class VisualizationStyleRegistry {
  private styles = new Map<string, VisualizationStyle>();

  register(style: VisualizationStyle): void {
    this.styles.set(style.id, style);
  }

  unregister(id: string): boolean {
    return this.styles.delete(id);
  }

  get(id: string): VisualizationStyle | undefined {
    return this.styles.get(id);
  }

  getAll(): VisualizationStyle[] {
    return Array.from(this.styles.values());
  }

  has(id: string): boolean {
    return this.styles.has(id);
  }
}

/** Singleton renderer registry */
export const rendererRegistry = new RendererRegistry();

/** Singleton style registry */
export const visualizationStyleRegistry = new VisualizationStyleRegistry();
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run packages/ui/src/features/canvas/visualization/registry.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/visualization/registry.ts \
        packages/ui/src/features/canvas/visualization/registry.test.ts
git commit -m "feat(visualization): add RendererRegistry and VisualizationStyleRegistry"
```

---

## Task 3: Extract `colorUtils.ts` and `inheritanceUtils.ts`

**Purpose:** Pull color-management and inheritance-detection logic out of the 686-line `cityViewUtils.ts` into focused modules.

**Files:**
- Create: `packages/ui/src/features/canvas/views/colorUtils.ts`
- Create: `packages/ui/src/features/canvas/views/colorUtils.test.ts`
- Create: `packages/ui/src/features/canvas/views/inheritanceUtils.ts`
- Create: `packages/ui/src/features/canvas/views/inheritanceUtils.test.ts`
- Modify: `packages/ui/src/features/canvas/views/cityViewUtils.ts` (re-export from new files, delete moved code)

**Step 1: Create `colorUtils.ts`**

Move the following from `cityViewUtils.ts` lines 11–58, 325–342:

```typescript
// packages/ui/src/features/canvas/views/colorUtils.ts

export const COLOR_PALETTE = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#14b8a6', '#84cc16', '#f59e0b', '#06b6d4',
];

const directoryColorMap: Record<string, string> = {};
let colorIndex = 0;

export function resetDirectoryColors(): void {
  for (const key of Object.keys(directoryColorMap)) {
    delete directoryColorMap[key];
  }
  colorIndex = 0;
}

export function getDirectoryFromLabel(label: string | undefined): string {
  if (!label) return 'root';
  const lastSlash = label.lastIndexOf('/');
  if (lastSlash === -1) return 'root';
  return label.substring(0, lastSlash);
}

export function getDirectoryColor(directory: string): string {
  const existing = directoryColorMap[directory];
  if (existing) return existing;
  const color = COLOR_PALETTE[colorIndex % COLOR_PALETTE.length]!;
  directoryColorMap[directory] = color;
  colorIndex++;
  return color;
}

export const EXTERNAL_COLOR = '#475569';
export const BASE_CLASS_COLOR = '#b45309';
export const BASE_CLASS_EMISSIVE = '#78350f';
export const BASE_CLASS_ROUGHNESS = 0.9;
export const BASE_CLASS_METALNESS = 0.05;
export const BASE_CLASS_FOOTPRINT_MULTIPLIER = 1.3;
```

**Step 2: Create `colorUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/colorUtils.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDirectoryColor,
  getDirectoryFromLabel,
  resetDirectoryColors,
  COLOR_PALETTE,
  EXTERNAL_COLOR,
} from './colorUtils';

describe('getDirectoryFromLabel', () => {
  it('returns root for undefined', () => {
    expect(getDirectoryFromLabel(undefined)).toBe('root');
  });
  it('returns root when no slash', () => {
    expect(getDirectoryFromLabel('file.ts')).toBe('root');
  });
  it('extracts directory path', () => {
    expect(getDirectoryFromLabel('src/utils/file.ts')).toBe('src/utils');
  });
});

describe('getDirectoryColor', () => {
  beforeEach(() => resetDirectoryColors());

  it('returns same color for same directory', () => {
    const c1 = getDirectoryColor('src/utils');
    const c2 = getDirectoryColor('src/utils');
    expect(c1).toBe(c2);
  });

  it('returns different colors for different directories', () => {
    const c1 = getDirectoryColor('src/a');
    const c2 = getDirectoryColor('src/b');
    expect(c1).not.toBe(c2);
  });

  it('cycles through COLOR_PALETTE', () => {
    for (let i = 0; i < COLOR_PALETTE.length + 1; i++) {
      getDirectoryColor(`dir/${i}`);
    }
    // should not throw
  });
});

describe('EXTERNAL_COLOR', () => {
  it('is defined and is a hex color', () => {
    expect(EXTERNAL_COLOR).toMatch(/^#[0-9a-f]{6}$/i);
  });
});
```

**Step 3: Create `inheritanceUtils.ts`**

Move `isBaseClass`, `detectBaseClasses`, `buildIncomingEdgeCounts` from `cityViewUtils.ts` lines 262–320:

```typescript
// packages/ui/src/features/canvas/views/inheritanceUtils.ts

const INHERITANCE_EDGE_TYPES = new Set(['extends', 'implements', 'inherits']);

export function isBaseClass(
  nodeId: string,
  edges: ReadonlyArray<{ source: string; target: string; type: string }>,
): boolean {
  return edges.some((e) => e.target === nodeId && INHERITANCE_EDGE_TYPES.has(e.type));
}

export function detectBaseClasses(
  edges: ReadonlyArray<{ source: string; target: string; type: string }>,
): Set<string> {
  const baseClasses = new Set<string>();
  for (const edge of edges) {
    if (INHERITANCE_EDGE_TYPES.has(edge.type)) {
      baseClasses.add(edge.target);
    }
  }
  return baseClasses;
}

export function buildIncomingEdgeCounts(
  edges: ReadonlyArray<{ target: string }>,
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const edge of edges) {
    counts.set(edge.target, (counts.get(edge.target) ?? 0) + 1);
  }
  return counts;
}
```

**Step 4: Create `inheritanceUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/inheritanceUtils.test.ts
import { describe, it, expect } from 'vitest';
import { isBaseClass, detectBaseClasses, buildIncomingEdgeCounts } from './inheritanceUtils';

const edges = [
  { source: 'A', target: 'B', type: 'extends' },
  { source: 'C', target: 'B', type: 'implements' },
  { source: 'D', target: 'E', type: 'imports' },
];

describe('isBaseClass', () => {
  it('returns true when node is target of inheritance edge', () => {
    expect(isBaseClass('B', edges)).toBe(true);
  });
  it('returns false for non-inheritance target', () => {
    expect(isBaseClass('E', edges)).toBe(false);
  });
});

describe('detectBaseClasses', () => {
  it('returns set of all base class IDs', () => {
    const result = detectBaseClasses(edges);
    expect(result.has('B')).toBe(true);
    expect(result.has('E')).toBe(false);
    expect(result.size).toBe(1);
  });
});

describe('buildIncomingEdgeCounts', () => {
  it('counts incoming edges per target', () => {
    const counts = buildIncomingEdgeCounts(edges);
    expect(counts.get('B')).toBe(2);
    expect(counts.get('E')).toBe(1);
    expect(counts.get('A')).toBeUndefined();
  });
});
```

**Step 5: Update `cityViewUtils.ts` to re-export the moved symbols**

At the top of `cityViewUtils.ts`, add:

```typescript
// Re-exports for backward compatibility — these modules now live in focused files
export * from './colorUtils';
export * from './inheritanceUtils';
```

Then **delete** the original implementations of those functions/constants from `cityViewUtils.ts`.

**Step 6: Run all related tests**

```bash
npx vitest run packages/ui/src/features/canvas/views/colorUtils.test.ts \
                packages/ui/src/features/canvas/views/inheritanceUtils.test.ts \
                packages/ui/src/features/canvas/views/cityViewUtils.test.ts
```

Expected: All PASS

**Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/views/colorUtils.ts \
        packages/ui/src/features/canvas/views/colorUtils.test.ts \
        packages/ui/src/features/canvas/views/inheritanceUtils.ts \
        packages/ui/src/features/canvas/views/inheritanceUtils.test.ts \
        packages/ui/src/features/canvas/views/cityViewUtils.ts
git commit -m "refactor(cityViewUtils): extract colorUtils and inheritanceUtils modules"
```

---

## Task 4: Extract `heightUtils.ts`

**Purpose:** Move all height-calculation logic and constants out of `cityViewUtils.ts`.

**Files:**
- Create: `packages/ui/src/features/canvas/views/heightUtils.ts`
- Create: `packages/ui/src/features/canvas/views/heightUtils.test.ts`
- Modify: `packages/ui/src/features/canvas/views/cityViewUtils.ts` (re-export, delete originals)

**Step 1: Create `heightUtils.ts`**

Move from `cityViewUtils.ts` lines 62–201, 431–472 (all height, floor, LOD-transition, method-room constants and functions):

```typescript
// packages/ui/src/features/canvas/views/heightUtils.ts

export const FLOOR_HEIGHT = 3;
export const METHOD_ROOM_HEIGHT = 2;
export const BUILDING_PADDING = 1;
export const BUILDING_Y_OFFSET = 0.1;
export const BUILDING_WIDTH = 2;
export const BUILDING_DEPTH = 2;
export const CLASS_WIDTH = 2.5;
export const CLASS_DEPTH = 2.5;
export const SHOP_WIDTH = 3.5;
export const SHOP_DEPTH = 1.5;
export const KIOSK_WIDTH = 1.5;
export const KIOSK_DEPTH = 1.5;
export const KIOSK_HEIGHT = 1.0;
export const KIOSK_AWNING_OVERHANG = 0.25;
export const KIOSK_AWNING_THICKNESS = 0.12;
export const CRATE_SIZE = 1.0;
export const GLASS_OPACITY = 0.3;
export const ABSTRACT_OPACITY = 0.5;
export const ROOM_LOD_THRESHOLD = 2;
export const UNDERGROUND_GROUND_OPACITY = 0.35;
export const SURFACE_GROUND_OPACITY = 1.0;

export type HeightEncodingType = 'methodCount' | 'dependencies' | 'loc' | 'complexity' | 'churn';

export interface EncodedHeightOptions {
  encoding: HeightEncodingType;
  incomingEdgeCount?: number;
}

export const METHOD_ROOM_COLORS = {
  public: '#60a5fa',
  protected: '#f59e0b',
  private: '#6b7280',
  constructor: '#34d399',
  static: '#a78bfa',
  default: '#60a5fa',
} as const;

export function getBuildingHeight(depth: number | undefined): number {
  return ((depth ?? 0) + 1) * FLOOR_HEIGHT;
}

export function getMethodBasedHeight(methodCount: number | undefined, depth: number | undefined): number {
  if (methodCount !== undefined && methodCount > 0) {
    return Math.max(Math.log2(methodCount + 1), 1) * FLOOR_HEIGHT;
  }
  return getBuildingHeight(depth);
}

export function getContainmentHeight(methodCount: number): number {
  return Math.max(methodCount, 1) * METHOD_ROOM_HEIGHT + BUILDING_PADDING;
}

export function getFootprintScale(
  node: { methodCount?: number; depth?: number; metadata?: Record<string, unknown> },
  options: EncodedHeightOptions,
): number {
  const { encoding, incomingEdgeCount } = options;
  let rawValue = 0;
  switch (encoding) {
    case 'methodCount': rawValue = node.methodCount ?? 0; break;
    case 'dependencies': rawValue = incomingEdgeCount ?? 0; break;
    case 'loc': rawValue = (node.metadata?.loc as number | undefined) ?? 0; break;
    case 'complexity': rawValue = (node.metadata?.complexity as number | undefined) ?? 0; break;
    case 'churn': rawValue = (node.metadata?.churn as number | undefined) ?? 0; break;
  }
  if (rawValue <= 0) return 1.0;
  return Math.min(1.0 + Math.log2(rawValue + 1) / 10, 2.0);
}

export function getEncodedHeight(
  node: { methodCount?: number; depth?: number; metadata?: Record<string, unknown> },
  options: EncodedHeightOptions,
  resolvedMethodCount?: number,
): number {
  const { encoding, incomingEdgeCount } = options;
  const mc = resolvedMethodCount ?? node.methodCount;
  switch (encoding) {
    case 'methodCount': return getMethodBasedHeight(mc, node.depth);
    case 'dependencies': {
      const count = incomingEdgeCount ?? 0;
      return count > 0 ? Math.max(Math.log2(count + 1), 1) * FLOOR_HEIGHT : getMethodBasedHeight(mc, node.depth);
    }
    case 'loc': {
      const loc = (node.metadata?.loc as number | undefined) ?? 0;
      return loc > 0 ? Math.max(Math.log2(loc / 50 + 1), 1) * FLOOR_HEIGHT : getMethodBasedHeight(mc, node.depth);
    }
    case 'complexity': {
      const complexity = (node.metadata?.complexity as number | undefined) ?? 0;
      return complexity > 0 ? Math.max(Math.log2(complexity + 1), 1) * FLOOR_HEIGHT : getMethodBasedHeight(mc, node.depth);
    }
    case 'churn': {
      const churn = (node.metadata?.churn as number | undefined) ?? 0;
      return churn > 0 ? Math.max(Math.log2(churn + 1), 1) * FLOOR_HEIGHT : getMethodBasedHeight(mc, node.depth);
    }
    default: return getMethodBasedHeight(mc, node.depth);
  }
}

export function getLodTransition(lodLevel: number): {
  bandOpacity: number;
  roomOpacity: number;
  showRooms: boolean;
} {
  const transitionStart = ROOM_LOD_THRESHOLD - 0.5;
  const factor = Math.max(0, Math.min(1, (lodLevel - transitionStart) / 0.5));
  return { bandOpacity: 1 - factor, roomOpacity: factor, showRooms: factor > 0 };
}

export function computeUndergroundGroundOpacity(undergroundVisible: boolean): number {
  return undergroundVisible ? UNDERGROUND_GROUND_OPACITY : SURFACE_GROUND_OPACITY;
}
```

**Step 2: Create `heightUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/heightUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
  getBuildingHeight, getMethodBasedHeight, getContainmentHeight,
  getEncodedHeight, getLodTransition, getFootprintScale,
  FLOOR_HEIGHT, ROOM_LOD_THRESHOLD,
} from './heightUtils';

describe('getBuildingHeight', () => {
  it('returns FLOOR_HEIGHT for depth 0', () => {
    expect(getBuildingHeight(0)).toBe(FLOOR_HEIGHT);
  });
  it('uses FLOOR_HEIGHT per depth level', () => {
    expect(getBuildingHeight(2)).toBe(3 * FLOOR_HEIGHT);
  });
  it('handles undefined depth', () => {
    expect(getBuildingHeight(undefined)).toBe(FLOOR_HEIGHT);
  });
});

describe('getMethodBasedHeight', () => {
  it('falls back to depth-based height when no methods', () => {
    expect(getMethodBasedHeight(0, 1)).toBe(getBuildingHeight(1));
  });
  it('uses log2 for method count', () => {
    expect(getMethodBasedHeight(3, 0)).toBeGreaterThan(FLOOR_HEIGHT);
  });
});

describe('getContainmentHeight', () => {
  it('minimum 1 floor', () => {
    expect(getContainmentHeight(0)).toBeGreaterThan(0);
  });
  it('scales with method count', () => {
    expect(getContainmentHeight(5)).toBeGreaterThan(getContainmentHeight(1));
  });
});

describe('getLodTransition', () => {
  it('showRooms=false below threshold', () => {
    const { showRooms } = getLodTransition(ROOM_LOD_THRESHOLD - 1);
    expect(showRooms).toBe(false);
  });
  it('showRooms=true at threshold', () => {
    const { showRooms } = getLodTransition(ROOM_LOD_THRESHOLD);
    expect(showRooms).toBe(true);
  });
  it('bandOpacity transitions from 1 to 0', () => {
    const low = getLodTransition(ROOM_LOD_THRESHOLD - 1);
    const high = getLodTransition(ROOM_LOD_THRESHOLD);
    expect(low.bandOpacity).toBeGreaterThan(high.bandOpacity);
  });
});

describe('getFootprintScale', () => {
  it('returns 1.0 for zero value', () => {
    expect(getFootprintScale({ methodCount: 0 }, { encoding: 'methodCount' })).toBe(1.0);
  });
  it('returns > 1.0 for positive value', () => {
    expect(getFootprintScale({ methodCount: 10 }, { encoding: 'methodCount' })).toBeGreaterThan(1.0);
  });
});
```

**Step 3: Update `cityViewUtils.ts`** — add `export * from './heightUtils';` and delete the moved code.

**Step 4: Run tests**

```bash
npx vitest run packages/ui/src/features/canvas/views/heightUtils.test.ts \
                packages/ui/src/features/canvas/views/cityViewUtils.test.ts
```

Expected: All PASS

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/views/heightUtils.ts \
        packages/ui/src/features/canvas/views/heightUtils.test.ts \
        packages/ui/src/features/canvas/views/cityViewUtils.ts
git commit -m "refactor(cityViewUtils): extract heightUtils module"
```

---

## Task 5: Extract `pipeUtils.ts` and `wireUtils.ts`

**Purpose:** Move underground pipe and overhead wire constants + math out of `cityViewUtils.ts`.

**Files:**
- Create: `packages/ui/src/features/canvas/views/pipeUtils.ts`
- Create: `packages/ui/src/features/canvas/views/pipeUtils.test.ts`
- Create: `packages/ui/src/features/canvas/views/wireUtils.ts`
- Create: `packages/ui/src/features/canvas/views/wireUtils.test.ts`
- Modify: `packages/ui/src/features/canvas/views/cityViewUtils.ts` (re-export + delete)

**Step 1: Create `pipeUtils.ts`**

Move from `cityViewUtils.ts` lines 344–422:

```typescript
// packages/ui/src/features/canvas/views/pipeUtils.ts

export const SHORT_PIPE_THRESHOLD = 15;
export const SHORT_PIPE_DEPTH = 2;
export const LONG_PIPE_DEPTH = 4;

export const PIPE_COLORS: Record<string, string> = {
  imports: '#475569',
  depends_on: '#475569',
  extends: '#92400e',
  inherits: '#92400e',
  implements: '#94a3b8',
};
export const PIPE_DEFAULT_COLOR = '#475569';

export const PIPE_RADIUS: Record<string, number> = {
  imports: 0.08,
  depends_on: 0.08,
  extends: 0.12,
  inherits: 0.12,
  implements: 0.10,
};
export const PIPE_DEFAULT_RADIUS = 0.08;

export function getPipeDepth(
  source: { x: number; z: number },
  target: { x: number; z: number },
): number {
  const dx = target.x - source.x;
  const dz = target.z - source.z;
  return Math.sqrt(dx * dx + dz * dz) > SHORT_PIPE_THRESHOLD ? LONG_PIPE_DEPTH : SHORT_PIPE_DEPTH;
}

export function calculatePipeRoute(
  source: { x: number; y: number; z: number },
  target: { x: number; y: number; z: number },
  pipeDepth: number,
): Array<{ x: number; y: number; z: number }> {
  const midX = (source.x + target.x) / 2;
  const midZ = (source.z + target.z) / 2;
  return [
    { x: source.x, y: 0,          z: source.z },
    { x: source.x, y: -pipeDepth, z: source.z },
    { x: midX,     y: -pipeDepth, z: midZ      },
    { x: target.x, y: -pipeDepth, z: target.z  },
    { x: target.x, y: 0,          z: target.z  },
  ];
}
```

**Step 2: Create `pipeUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/pipeUtils.test.ts
import { describe, it, expect } from 'vitest';
import { getPipeDepth, calculatePipeRoute, SHORT_PIPE_THRESHOLD, SHORT_PIPE_DEPTH, LONG_PIPE_DEPTH } from './pipeUtils';

describe('getPipeDepth', () => {
  it('returns SHORT_PIPE_DEPTH for close nodes', () => {
    expect(getPipeDepth({ x: 0, z: 0 }, { x: 1, z: 0 })).toBe(SHORT_PIPE_DEPTH);
  });
  it('returns LONG_PIPE_DEPTH for distant nodes', () => {
    expect(getPipeDepth({ x: 0, z: 0 }, { x: SHORT_PIPE_THRESHOLD + 1, z: 0 })).toBe(LONG_PIPE_DEPTH);
  });
});

describe('calculatePipeRoute', () => {
  it('returns 5 waypoints', () => {
    const route = calculatePipeRoute({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 2);
    expect(route).toHaveLength(5);
  });
  it('starts at source x/z', () => {
    const route = calculatePipeRoute({ x: 3, y: 0, z: 5 }, { x: 10, y: 0, z: 0 }, 2);
    expect(route[0]).toMatchObject({ x: 3, z: 5, y: 0 });
  });
  it('dips underground at pipeDepth', () => {
    const route = calculatePipeRoute({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 }, 3);
    expect(route[1]!.y).toBe(-3);
  });
});
```

**Step 3: Create `wireUtils.ts`**

Move from `cityViewUtils.ts` lines 500–626:

```typescript
// packages/ui/src/features/canvas/views/wireUtils.ts

export type EdgeRouting = 'underground' | 'overhead';

export function classifyEdgeRouting(edgeType: string): EdgeRouting {
  switch (edgeType.toLowerCase()) {
    case 'calls':
    case 'composes':
      return 'overhead';
    default:
      return 'underground';
  }
}

export const WIRE_BASE_OFFSET = 2;
export const WIRE_SCALE_FACTOR = 0.1;
export const WIRE_MAX_PEAK = 80;
export const WIRE_LOD_MIN = 2;

export const WIRE_COLORS: Record<string, string> = {
  calls:    '#34d399',
  composes: '#a78bfa',
};
export const WIRE_DEFAULT_COLOR = '#6ee7b7';
export const WIRE_DASHED_TYPES: ReadonlySet<string> = new Set(['composes']);
export const WIRE_DASH_SIZE = 0.4;
export const WIRE_GAP_SIZE = 0.25;

export function getWireMaterialType(edgeType: string): 'solid' | 'dashed' {
  return WIRE_DASHED_TYPES.has(edgeType.toLowerCase()) ? 'dashed' : 'solid';
}

export function calculateWireArcPeak(
  sourceHeight: number,
  targetHeight: number,
  horizontalDistance: number,
): number {
  const rooftop = Math.max(sourceHeight, targetHeight);
  const raw = rooftop + WIRE_BASE_OFFSET + horizontalDistance * WIRE_SCALE_FACTOR;
  return Math.min(raw, WIRE_MAX_PEAK);
}

export function isWireVisible(lodLevel: number): boolean {
  return lodLevel >= WIRE_LOD_MIN;
}

export function getWireColor(edgeType: string): string {
  return WIRE_COLORS[edgeType] ?? WIRE_DEFAULT_COLOR;
}
```

**Step 4: Create `wireUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/wireUtils.test.ts
import { describe, it, expect } from 'vitest';
import { classifyEdgeRouting, calculateWireArcPeak, isWireVisible, getWireColor, WIRE_LOD_MIN } from './wireUtils';

describe('classifyEdgeRouting', () => {
  it('calls → overhead', () => expect(classifyEdgeRouting('calls')).toBe('overhead'));
  it('composes → overhead', () => expect(classifyEdgeRouting('composes')).toBe('overhead'));
  it('imports → underground', () => expect(classifyEdgeRouting('imports')).toBe('underground'));
  it('extends → underground', () => expect(classifyEdgeRouting('extends')).toBe('underground'));
  it('case insensitive', () => expect(classifyEdgeRouting('CALLS')).toBe('overhead'));
});

describe('calculateWireArcPeak', () => {
  it('clears the taller rooftop', () => {
    const peak = calculateWireArcPeak(5, 10, 0);
    expect(peak).toBeGreaterThan(10);
  });
  it('increases with horizontal distance', () => {
    const near = calculateWireArcPeak(5, 5, 10);
    const far = calculateWireArcPeak(5, 5, 50);
    expect(far).toBeGreaterThan(near);
  });
});

describe('isWireVisible', () => {
  it('false below WIRE_LOD_MIN', () => expect(isWireVisible(WIRE_LOD_MIN - 1)).toBe(false));
  it('true at WIRE_LOD_MIN', () => expect(isWireVisible(WIRE_LOD_MIN)).toBe(true));
});

describe('getWireColor', () => {
  it('returns specific color for known type', () => expect(getWireColor('calls')).toBe('#34d399'));
  it('returns default for unknown type', () => expect(getWireColor('unknown')).toBe('#6ee7b7'));
});
```

**Step 5: Update `cityViewUtils.ts`** — add `export * from './pipeUtils'; export * from './wireUtils';` and delete originals.

**Step 6: Run tests**

```bash
npx vitest run packages/ui/src/features/canvas/views/pipeUtils.test.ts \
                packages/ui/src/features/canvas/views/wireUtils.test.ts \
                packages/ui/src/features/canvas/views/cityViewUtils.test.ts
```

Expected: All PASS

**Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/views/pipeUtils.ts \
        packages/ui/src/features/canvas/views/pipeUtils.test.ts \
        packages/ui/src/features/canvas/views/wireUtils.ts \
        packages/ui/src/features/canvas/views/wireUtils.test.ts \
        packages/ui/src/features/canvas/views/cityViewUtils.ts
git commit -m "refactor(cityViewUtils): extract pipeUtils and wireUtils modules"
```

---

## Task 6: Extract `focusUtils.ts` and `methodUtils.ts`

**Purpose:** Move focus-opacity and method-sorting logic out of `cityViewUtils.ts`.

**Files:**
- Create: `packages/ui/src/features/canvas/views/focusUtils.ts`
- Create: `packages/ui/src/features/canvas/views/focusUtils.test.ts`
- Create: `packages/ui/src/features/canvas/views/methodUtils.ts`
- Create: `packages/ui/src/features/canvas/views/methodUtils.test.ts`
- Modify: `packages/ui/src/features/canvas/views/cityViewUtils.ts` (re-export + delete)

**Step 1: Create `focusUtils.ts`**

Move `getNodeFocusOpacity` from `cityViewUtils.ts` lines 629–653:

```typescript
// packages/ui/src/features/canvas/views/focusUtils.ts

export function getNodeFocusOpacity(
  nodeId: string,
  selectedNodeId: string | null,
  directNodeIds: Set<string>,
  secondHopNodeIds: Set<string>,
): number {
  if (!selectedNodeId) return 1.0;
  if (nodeId === selectedNodeId) return 1.0;
  if (directNodeIds.has(nodeId)) return 1.0;
  if (secondHopNodeIds.has(nodeId)) return 0.5;
  return 0.15;
}
```

**Step 2: Create `focusUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/focusUtils.test.ts
import { describe, it, expect } from 'vitest';
import { getNodeFocusOpacity } from './focusUtils';

describe('getNodeFocusOpacity', () => {
  const direct = new Set(['B', 'C']);
  const secondHop = new Set(['D']);

  it('returns 1.0 when no focus mode', () => {
    expect(getNodeFocusOpacity('X', null, direct, secondHop)).toBe(1.0);
  });
  it('returns 1.0 for the focused node itself', () => {
    expect(getNodeFocusOpacity('A', 'A', direct, secondHop)).toBe(1.0);
  });
  it('returns 1.0 for direct connections', () => {
    expect(getNodeFocusOpacity('B', 'A', direct, secondHop)).toBe(1.0);
  });
  it('returns 0.5 for second-hop nodes', () => {
    expect(getNodeFocusOpacity('D', 'A', direct, secondHop)).toBe(0.5);
  });
  it('returns 0.15 for unrelated nodes', () => {
    expect(getNodeFocusOpacity('Z', 'A', direct, secondHop)).toBe(0.15);
  });
});
```

**Step 3: Create `methodUtils.ts`**

Move `sortMethodsByVisibility` from `cityViewUtils.ts` lines 655–686:

```typescript
// packages/ui/src/features/canvas/views/methodUtils.ts

const VISIBILITY_SORT_ORDER: Record<string, number> = {
  public: 0,
  protected: 1,
  private: 2,
};

export function sortMethodsByVisibility<T extends { visibility?: string }>(
  methods: readonly T[],
): T[] {
  return methods
    .map((m, i) => ({ m, i }))
    .sort((a, b) => {
      const aPri = VISIBILITY_SORT_ORDER[a.m.visibility ?? 'public'] ?? 0;
      const bPri = VISIBILITY_SORT_ORDER[b.m.visibility ?? 'public'] ?? 0;
      return aPri !== bPri ? aPri - bPri : a.i - b.i;
    })
    .map(({ m }) => m);
}
```

**Step 4: Create `methodUtils.test.ts`**

```typescript
// packages/ui/src/features/canvas/views/methodUtils.test.ts
import { describe, it, expect } from 'vitest';
import { sortMethodsByVisibility } from './methodUtils';

describe('sortMethodsByVisibility', () => {
  it('sorts public before protected before private', () => {
    const methods = [
      { name: 'doPrivate', visibility: 'private' },
      { name: 'doPublic', visibility: 'public' },
      { name: 'doProtected', visibility: 'protected' },
    ];
    const sorted = sortMethodsByVisibility(methods);
    expect(sorted[0]!.visibility).toBe('public');
    expect(sorted[1]!.visibility).toBe('protected');
    expect(sorted[2]!.visibility).toBe('private');
  });

  it('preserves original order within same visibility tier', () => {
    const methods = [
      { name: 'first', visibility: 'public' },
      { name: 'second', visibility: 'public' },
    ];
    const sorted = sortMethodsByVisibility(methods);
    expect(sorted[0]!.name).toBe('first');
    expect(sorted[1]!.name).toBe('second');
  });

  it('does not mutate the input array', () => {
    const input = [{ visibility: 'private' }, { visibility: 'public' }];
    sortMethodsByVisibility(input);
    expect(input[0]!.visibility).toBe('private');
  });
});
```

**Step 5: Update `cityViewUtils.ts`** — add re-exports, delete originals. At this point `cityViewUtils.ts` should be a thin barrel file of ~10 lines re-exporting from 6 focused modules plus whatever remains (e.g., the `SHORT_PIPE_THRESHOLD` consolidation check).

**Step 6: Run tests**

```bash
npx vitest run packages/ui/src/features/canvas/views/focusUtils.test.ts \
                packages/ui/src/features/canvas/views/methodUtils.test.ts \
                packages/ui/src/features/canvas/views/cityViewUtils.test.ts
```

Expected: All PASS

**Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/views/focusUtils.ts \
        packages/ui/src/features/canvas/views/focusUtils.test.ts \
        packages/ui/src/features/canvas/views/methodUtils.ts \
        packages/ui/src/features/canvas/views/methodUtils.test.ts \
        packages/ui/src/features/canvas/views/cityViewUtils.ts
git commit -m "refactor(cityViewUtils): extract focusUtils and methodUtils modules"
```

---

## Task 7: Update all import sites to point to focused modules

**Purpose:** After Tasks 3–6, all callers still import from `cityViewUtils` (barrel). Now update each file to import directly from the focused module. This removes the barrel file's raison d'être and makes each module's dependencies explicit.

**Key files to update** (search for `from.*cityViewUtils`):
- `packages/ui/src/features/canvas/layout/engines/blockLayoutUtils.ts` → `heightUtils`
- `packages/ui/src/features/canvas/components/buildings/*.tsx` → `heightUtils` or `methodUtils`
- `packages/ui/src/features/canvas/components/buildings/floorBandUtils.ts` → `heightUtils`
- `packages/ui/src/features/canvas/components/OverheadWire.tsx` → `wireUtils`
- `packages/ui/src/features/canvas/components/UndergroundPipe.tsx` → `pipeUtils`
- `packages/ui/src/features/canvas/components/CityUnderground.tsx` → `pipeUtils`
- `packages/ui/src/features/canvas/views/CityBlocks.tsx` → `inheritanceUtils`, `heightUtils`
- `packages/ui/src/features/canvas/views/CityView.tsx` → `heightUtils`
- `packages/ui/src/features/canvas/views/Building.tsx` → `heightUtils`
- `packages/ui/src/features/canvas/views/CitySky.tsx` → `wireUtils`, `pipeUtils`
- `packages/ui/src/features/canvas/views/ExternalBuilding.tsx` → `colorUtils`
- `packages/ui/src/features/canvas/views/XRayBuilding.tsx` → `heightUtils`
- `packages/ui/src/features/canvas/views/CityEdge.tsx` → `wireUtils`

**Step 1: For each file, run:**

```bash
grep -n "from.*cityViewUtils" <file>
```

Update each import to point to the most specific focused module.

**Step 2: After all updates, verify `cityViewUtils` is no longer imported by production code**

```bash
grep -r "from.*cityViewUtils" packages/ui/src --include="*.ts" --include="*.tsx" \
  | grep -v ".test." | grep -v "cityViewUtils.ts"
```

Expected: 0 results (only tests may still import from the barrel)

**Step 3: Run full canvas test suite**

```bash
npx vitest run packages/ui/src/features/canvas
```

Expected: All PASS (same count as before)

**Step 4: Run TypeScript check**

```bash
npm run type-check -w @diagram-builder/ui
```

Expected: 0 errors

**Step 5: Commit**

```bash
git add -u packages/ui/src/features/canvas
git commit -m "refactor(canvas): update all imports to use focused utility modules"
```

---

## Task 8: Extract `BuildingFactory.tsx`

**Purpose:** Eliminate the duplicated `switch(node.type)` pattern in `renderTypedBuilding()` and `renderTypedBuildingInner()` in `CityBlocks.tsx` by extracting a single `BuildingFactory`.

**Files:**
- Create: `packages/ui/src/features/canvas/views/BuildingFactory.tsx`
- Create: `packages/ui/src/features/canvas/views/BuildingFactory.test.tsx`
- Modify: `packages/ui/src/features/canvas/views/CityBlocks.tsx`

**Step 1: Create `BuildingFactory.test.tsx`**

```typescript
// packages/ui/src/features/canvas/views/BuildingFactory.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { createBuildingElement, createBuildingElementAtOrigin } from './BuildingFactory';
import type { GraphNode } from '../../../shared/types';

vi.mock('../components/buildings', () => ({
  ClassBuilding: () => null,
  BaseClassBuilding: () => null,
  FunctionShop: () => null,
  InterfaceBuilding: () => null,
  AbstractBuilding: () => null,
  VariableCrate: () => null,
  EnumCrate: () => null,
  RooftopGarden: () => null,
}));
vi.mock('./Building', () => ({ Building: () => null }));

function makeNode(type: GraphNode['type'], id = 'n1'): GraphNode {
  return { id, type, label: id };
}

const pos = { x: 0, y: 0, z: 0 };
const graph = { nodes: [], edges: [] };

describe('createBuildingElement', () => {
  it('returns JSX for class node', () => {
    const el = createBuildingElement(makeNode('class'), pos, new Map(), new Map(), 1, graph);
    expect(el).not.toBeNull();
  });
  it('returns JSX for function node', () => {
    const el = createBuildingElement(makeNode('function'), pos, new Map(), new Map(), 1, graph);
    expect(el).not.toBeNull();
  });
  it('returns JSX for unknown type (fallback)', () => {
    const el = createBuildingElement(makeNode('file'), pos, new Map(), new Map(), 1, graph);
    expect(el).not.toBeNull();
  });
});

describe('createBuildingElementAtOrigin', () => {
  it('creates element at origin for class', () => {
    const el = createBuildingElementAtOrigin(makeNode('class'), new Map(), 1, graph);
    expect(el).not.toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/ui/src/features/canvas/views/BuildingFactory.test.tsx
```

Expected: FAIL

**Step 3: Create `BuildingFactory.tsx`**

```tsx
// packages/ui/src/features/canvas/views/BuildingFactory.tsx
/**
 * BuildingFactory
 *
 * Single source of truth for mapping node.type → building component.
 * Replaces the duplicated switch(node.type) in renderTypedBuilding()
 * and renderTypedBuildingInner() in CityBlocks.tsx.
 */
import {
  ClassBuilding,
  BaseClassBuilding,
  FunctionShop,
  InterfaceBuilding,
  AbstractBuilding,
  VariableCrate,
  EnumCrate,
  RooftopGarden,
} from '../components/buildings';
import { getBuildingConfig } from '../components/buildingGeometry';
import { Building } from './Building';
import type { Graph, GraphNode, Position3D } from '../../../shared/types';
import type { EncodedHeightOptions } from './heightUtils';

/** Types that can contain nested type definitions */
const CONTAINER_TYPES = new Set(['class', 'abstract_class', 'file']);

export interface BuildingFactoryOptions {
  nestedMap?: Map<string, GraphNode[]>;
  methodsByClass?: Map<string, GraphNode[]>;
  lodLevel?: number;
  graph: Graph;
  encodingOptions?: EncodedHeightOptions;
  baseClassIds?: Set<string>;
}

/**
 * Create a building element at a given world position.
 * Wraps in a RooftopGarden group when the node has nested children.
 */
export function createBuildingElement(
  node: GraphNode,
  position: Position3D,
  nestedMap: Map<string, GraphNode[]>,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
  graph: Graph,
  encodingOptions?: EncodedHeightOptions,
  baseClassIds?: Set<string>,
): React.JSX.Element {
  const hasNested = CONTAINER_TYPES.has(node.type) && nestedMap.has(node.id);

  if (!hasNested) {
    return createBuildingCore(node, position, methodsByClass, lodLevel, graph, encodingOptions, baseClassIds);
  }

  const config = getBuildingConfig(node, encodingOptions);
  return (
    <group key={node.id} position={[position.x, position.y, position.z]}>
      {createBuildingElementAtOrigin(node, methodsByClass, lodLevel, graph, encodingOptions, baseClassIds)}
      <RooftopGarden
        parentNode={node}
        parentWidth={config.geometry.width}
        parentHeight={config.geometry.height}
        nestedMap={nestedMap}
      />
    </group>
  );
}

/**
 * Create a building element positioned at the origin (0,0,0).
 * Used inside rooftop groups where the parent group handles world position.
 */
export function createBuildingElementAtOrigin(
  node: GraphNode,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
  graph: Graph,
  encodingOptions?: EncodedHeightOptions,
  baseClassIds?: Set<string>,
): React.JSX.Element {
  return createBuildingCore(
    node,
    { x: 0, y: 0, z: 0 },
    methodsByClass,
    lodLevel,
    graph,
    encodingOptions,
    baseClassIds,
    `inner-${node.id}`,
  );
}

/** Internal: create the typed building component for a node. */
function createBuildingCore(
  node: GraphNode,
  position: Position3D,
  methodsByClass: Map<string, GraphNode[]>,
  lodLevel: number,
  graph: Graph,
  encodingOptions?: EncodedHeightOptions,
  baseClassIds?: Set<string>,
  keyOverride?: string,
): React.JSX.Element {
  const key = keyOverride ?? node.id;
  const props = { key, node, position };
  const classMethods = methodsByClass.get(node.id);
  const classExtras = encodingOptions ? { encodingOptions } : {};
  const nodeIsBase = baseClassIds?.has(node.id) ?? false;
  const methodProps = classMethods
    ? { methods: classMethods, lodLevel, isBaseClass: nodeIsBase, ...classExtras }
    : { lodLevel, isBaseClass: nodeIsBase, ...classExtras };

  switch (node.type) {
    case 'class':
      return nodeIsBase
        ? <BaseClassBuilding {...props} {...methodProps} graph={graph} />
        : <ClassBuilding {...props} {...methodProps} graph={graph} />;
    case 'function':
      return <FunctionShop {...props} {...classExtras} graph={graph} />;
    case 'interface':
      return <InterfaceBuilding {...props} {...methodProps} graph={graph} />;
    case 'abstract_class':
      return <AbstractBuilding {...props} {...methodProps} graph={graph} />;
    case 'variable':
      return <VariableCrate {...props} graph={graph} />;
    case 'enum':
      return <EnumCrate {...props} graph={graph} />;
    default:
      return <Building key={key} node={node} position={position} graph={graph} {...classExtras} />;
  }
}
```

**Step 4: Update `CityBlocks.tsx`** — replace `renderTypedBuilding()` and `renderTypedBuildingInner()` function definitions with imports from `BuildingFactory`:

```typescript
import { createBuildingElement, createBuildingElementAtOrigin } from './BuildingFactory';
```

Replace all calls:
- `renderTypedBuilding(node, pos, ...)` → `createBuildingElement(node, pos, ...)`
- `renderTypedBuildingInner(node, ...)` → `createBuildingElementAtOrigin(node, ...)`

Delete the two local function definitions.

**Step 5: Run tests**

```bash
npx vitest run packages/ui/src/features/canvas/views/BuildingFactory.test.tsx \
                packages/ui/src/features/canvas/views/
```

Expected: All PASS

**Step 6: Type-check**

```bash
npm run type-check -w @diagram-builder/ui
```

Expected: 0 errors

**Step 7: Commit**

```bash
git add packages/ui/src/features/canvas/views/BuildingFactory.tsx \
        packages/ui/src/features/canvas/views/BuildingFactory.test.tsx \
        packages/ui/src/features/canvas/views/CityBlocks.tsx
git commit -m "refactor(CityBlocks): extract BuildingFactory to eliminate switch(node.type) duplication"
```

---

## Task 9: Extract `InfrastructureFactory.tsx`

**Purpose:** Move `renderInfrastructureLandmark()` out of `CityBlocks.tsx` into its own file with tests.

**Files:**
- Create: `packages/ui/src/features/canvas/views/InfrastructureFactory.tsx`
- Create: `packages/ui/src/features/canvas/views/InfrastructureFactory.test.tsx`
- Modify: `packages/ui/src/features/canvas/views/CityBlocks.tsx`

**Step 1: Create `InfrastructureFactory.test.tsx`**

```typescript
// packages/ui/src/features/canvas/views/InfrastructureFactory.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { createInfrastructureElement } from './InfrastructureFactory';
import type { GraphNode } from '../../../shared/types';

vi.mock('../components/infrastructure', () => ({
  Harbor: () => null, Airport: () => null, PowerStation: () => null,
  WaterTower: () => null, CityGate: () => null, MunicipalBuilding: () => null,
}));

const pos = { x: 0, y: 0, z: 0 };

function makeExternal(infraType: string): GraphNode {
  return { id: 'ext1', type: 'file', label: 'ext1', isExternal: true, metadata: { infrastructureType: infraType } };
}

describe('createInfrastructureElement', () => {
  it('returns null for general type', () => {
    expect(createInfrastructureElement(makeExternal('general'), pos)).toBeNull();
  });
  it('returns null when no metadata', () => {
    expect(createInfrastructureElement({ id: 'x', type: 'file', label: 'x' }, pos)).toBeNull();
  });
  it('returns element for database', () => {
    expect(createInfrastructureElement(makeExternal('database'), pos)).not.toBeNull();
  });
  it('returns element for api', () => {
    expect(createInfrastructureElement(makeExternal('api'), pos)).not.toBeNull();
  });
  it('returns null for unknown type', () => {
    expect(createInfrastructureElement(makeExternal('unknown-type'), pos)).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/ui/src/features/canvas/views/InfrastructureFactory.test.tsx
```

Expected: FAIL

**Step 3: Create `InfrastructureFactory.tsx`**

```tsx
// packages/ui/src/features/canvas/views/InfrastructureFactory.tsx
import {
  PowerStation, WaterTower, MunicipalBuilding, Harbor, Airport, CityGate,
} from '../components/infrastructure';
import type { GraphNode, Position3D } from '../../../shared/types';

/**
 * Maps a node's infrastructureType metadata to its landmark component.
 * Returns null for 'general' or unknown types (callers fall back to ExternalBuilding).
 */
export function createInfrastructureElement(
  node: GraphNode,
  position: Position3D,
): React.JSX.Element | null {
  const infraType = node.metadata?.infrastructureType as string | undefined;
  if (!infraType || infraType === 'general') return null;

  const props = { key: node.id, node, position };
  switch (infraType) {
    case 'database':    return <Harbor {...props} />;
    case 'api':         return <Airport {...props} />;
    case 'queue':       return <PowerStation {...props} />;
    case 'cache':       return <WaterTower {...props} />;
    case 'auth':        return <CityGate {...props} />;
    case 'logging':
    case 'filesystem':  return <MunicipalBuilding {...props} />;
    default:            return null;
  }
}
```

**Step 4: Update `CityBlocks.tsx`** — replace `renderInfrastructureLandmark` with an import from `InfrastructureFactory`:

```typescript
import { createInfrastructureElement } from './InfrastructureFactory';
```

Delete the local `renderInfrastructureLandmark` function. Replace calls:
- `renderInfrastructureLandmark(node, pos)` → `createInfrastructureElement(node, pos)`

**Step 5: Run tests**

```bash
npx vitest run packages/ui/src/features/canvas/views/InfrastructureFactory.test.tsx \
                packages/ui/src/features/canvas/views/
```

Expected: All PASS

**Step 6: Commit**

```bash
git add packages/ui/src/features/canvas/views/InfrastructureFactory.tsx \
        packages/ui/src/features/canvas/views/InfrastructureFactory.test.tsx \
        packages/ui/src/features/canvas/views/CityBlocks.tsx
git commit -m "refactor(CityBlocks): extract InfrastructureFactory"
```

---

## Task 10: Create `CityRenderer.tsx` — implements `VisualizationRenderer`

**Purpose:** Wrap all city-specific rendering (CityView, CityBlocks, CitySky, CityAtmosphere) behind the `VisualizationRenderer` interface and register it in the `RendererRegistry`.

**Files:**
- Create: `packages/ui/src/features/canvas/visualization/renderers/city/CityRenderer.tsx`
- Create: `packages/ui/src/features/canvas/visualization/renderers/city/CityRenderer.test.tsx`
- Create: `packages/ui/src/features/canvas/visualization/index.ts`

**Step 1: Create `CityRenderer.test.tsx`**

```typescript
// packages/ui/src/features/canvas/visualization/renderers/city/CityRenderer.test.tsx
import { describe, it, expect } from 'vitest';
import { cityRenderer } from './CityRenderer';

describe('CityRenderer', () => {
  it('has type radial-city', () => {
    expect(cityRenderer.type).toBe('radial-city');
  });

  it('canRender radial-city layout', () => {
    expect(cityRenderer.canRender('radial-city')).toBe(true);
  });

  it('cannot render tree layout', () => {
    expect(cityRenderer.canRender('tree')).toBe(false);
  });

  it('has a render function', () => {
    expect(typeof cityRenderer.render).toBe('function');
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/ui/src/features/canvas/visualization/renderers/city/CityRenderer.test.tsx
```

Expected: FAIL

**Step 3: Create `CityRenderer.tsx`**

```tsx
// packages/ui/src/features/canvas/visualization/renderers/city/CityRenderer.tsx
import { CityView } from '../../../views/CityView';
import type { VisualizationRenderer, RenderContext } from '../../types';

/**
 * CityRenderer implements VisualizationRenderer for the radial city layout.
 *
 * It delegates to the existing CityView component, which internally
 * composes CityBlocks, CitySky, and CityAtmosphere.
 */
const cityRenderer: VisualizationRenderer = {
  type: 'radial-city',

  render(ctx: RenderContext): React.JSX.Element {
    return <CityView graph={ctx.graph} />;
  },

  canRender(layoutType: string): boolean {
    return layoutType === 'radial-city';
  },
};

export { cityRenderer };
```

**Step 4: Create `visualization/index.ts`**

```typescript
// packages/ui/src/features/canvas/visualization/index.ts
export { rendererRegistry, visualizationStyleRegistry } from './registry';
export type { VisualizationRenderer, RenderContext, VisualizationStyle } from './types';
export { cityRenderer } from './renderers/city/CityRenderer';
```

**Step 5: Run test to verify it passes**

```bash
npx vitest run packages/ui/src/features/canvas/visualization/renderers/city/CityRenderer.test.tsx
```

Expected: PASS

**Step 6: Commit**

```bash
git add packages/ui/src/features/canvas/visualization/renderers/ \
        packages/ui/src/features/canvas/visualization/index.ts
git commit -m "feat(visualization): add CityRenderer implementing VisualizationRenderer"
```

---

## Task 11: Wire `RendererRegistry` into `ViewModeRenderer`

**Purpose:** Register the city style at startup and make `ViewModeRenderer` use the registry.

**Files:**
- Modify: `packages/ui/src/features/canvas/views/ViewModeRenderer.tsx`
- Create: `packages/ui/src/features/canvas/visualization/setup.ts`

**Step 1: Create `visualization/setup.ts`** — bootstrap registry at app startup

```typescript
// packages/ui/src/features/canvas/visualization/setup.ts
/**
 * Register all built-in visualization styles.
 * Import this file once at app startup (e.g., in Canvas3D.tsx).
 */
import { visualizationStyleRegistry } from './registry';
import { cityRenderer } from './renderers/city/CityRenderer';
import { RadialCityLayoutEngine } from '../layout/engines/radialCityLayout';

visualizationStyleRegistry.register({
  id: 'city',
  label: 'City View',
  layoutEngine: new RadialCityLayoutEngine(),
  renderer: cityRenderer,
});
```

**Step 2: Update `Canvas3D.tsx`** — import setup at the top

Add to top of `Canvas3D.tsx`:
```typescript
import '../features/canvas/visualization/setup'; // register built-in styles
```

**Step 3: Verify `ViewModeRenderer` still works**

No code change needed to `ViewModeRenderer.tsx` at this point — the registry is now populated but `ViewModeRenderer` doesn't need to query it yet (it still dispatches to `CityView` directly). The registry wiring is infrastructure for the tree renderer in Task 13.

**Step 4: Run full canvas suite**

```bash
npx vitest run packages/ui/src/features/canvas
```

Expected: Same pass count as before

**Step 5: Commit**

```bash
git add packages/ui/src/features/canvas/visualization/setup.ts \
        packages/ui/src/features/canvas/Canvas3D.tsx
git commit -m "feat(visualization): register CityRenderer in VisualizationStyleRegistry at startup"
```

---

## Task 12: Create `TreeRenderer` (proof of swappability)

**Purpose:** Demonstrate that the `VisualizationRenderer` abstraction is truly pluggable by creating a minimal tree/hierarchy renderer. Uses a depth-based top-down tree layout engine and renders nodes as colored spheres connected by lines.

**Files:**
- Create: `packages/ui/src/features/canvas/layout/engines/treeLayout.ts`
- Create: `packages/ui/src/features/canvas/layout/engines/treeLayout.test.ts`
- Create: `packages/ui/src/features/canvas/visualization/renderers/tree/TreeRenderer.tsx`
- Create: `packages/ui/src/features/canvas/visualization/renderers/tree/TreeRenderer.test.tsx`
- Modify: `packages/ui/src/features/canvas/visualization/setup.ts`

**Step 1: Create `treeLayout.test.ts`**

```typescript
// packages/ui/src/features/canvas/layout/engines/treeLayout.test.ts
import { describe, it, expect } from 'vitest';
import { TreeLayoutEngine } from './treeLayout';
import type { Graph } from '../../../../shared/types';

const graph: Graph = {
  nodes: [
    { id: 'root', type: 'file', label: 'root.ts', depth: 0 },
    { id: 'child1', type: 'class', label: 'A', depth: 1, parentId: 'root' },
    { id: 'child2', type: 'class', label: 'B', depth: 1, parentId: 'root' },
  ],
  edges: [],
};

describe('TreeLayoutEngine', () => {
  const engine = new TreeLayoutEngine();

  it('has type "tree"', () => {
    expect(engine.type).toBe('tree');
  });

  it('canHandle any graph', () => {
    expect(engine.canHandle(graph)).toBe(true);
  });

  it('positions all nodes', () => {
    const result = engine.layout(graph, {});
    expect(result.positions.size).toBe(3);
  });

  it('places root at y=0', () => {
    const result = engine.layout(graph, {});
    expect(result.positions.get('root')?.y).toBe(0);
  });

  it('places children below root (negative y for downward tree)', () => {
    const result = engine.layout(graph, {});
    const child = result.positions.get('child1');
    expect(child).toBeDefined();
    expect(child!.y).toBeLessThan(0);
  });

  it('spreads siblings on the x axis', () => {
    const result = engine.layout(graph, {});
    const c1 = result.positions.get('child1')!;
    const c2 = result.positions.get('child2')!;
    expect(c1.x).not.toBe(c2.x);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run packages/ui/src/features/canvas/layout/engines/treeLayout.test.ts
```

Expected: FAIL

**Step 3: Create `treeLayout.ts`**

```typescript
// packages/ui/src/features/canvas/layout/engines/treeLayout.ts
import type { Graph, Position3D } from '../../../../shared/types';
import type { LayoutEngine, LayoutResult, LayoutConfig, BoundingBox } from '../types';

const VERTICAL_SPACING = 8;
const HORIZONTAL_SPACING = 6;

/**
 * Top-down tree layout engine.
 *
 * Groups nodes by depth level. Root nodes (depth 0) sit at y=0.
 * Each additional depth level drops by VERTICAL_SPACING.
 * Nodes at the same depth are spread evenly along the x axis.
 */
export class TreeLayoutEngine implements LayoutEngine {
  readonly type = 'tree';

  layout(graph: Graph, _config: LayoutConfig): LayoutResult {
    const positions = new Map<string, Position3D>();

    // Group nodes by depth
    const byDepth = new Map<number, string[]>();
    for (const node of graph.nodes) {
      const d = node.depth ?? 0;
      if (!byDepth.has(d)) byDepth.set(d, []);
      byDepth.get(d)!.push(node.id);
    }

    // Position each depth level
    for (const [depth, nodeIds] of byDepth.entries()) {
      const count = nodeIds.length;
      const totalWidth = (count - 1) * HORIZONTAL_SPACING;
      nodeIds.forEach((id, i) => {
        positions.set(id, {
          x: -totalWidth / 2 + i * HORIZONTAL_SPACING,
          y: -depth * VERTICAL_SPACING,
          z: 0,
        });
      });
    }

    // Compute bounds
    const xs = Array.from(positions.values()).map((p) => p.x);
    const ys = Array.from(positions.values()).map((p) => p.y);
    const bounds: BoundingBox = {
      min: { x: Math.min(...xs), y: Math.min(...ys), z: 0 },
      max: { x: Math.max(...xs), y: Math.max(...ys), z: 0 },
    };

    return { positions, bounds };
  }

  canHandle(_graph: Graph): boolean {
    return true;
  }
}
```

**Step 4: Run tree layout test**

```bash
npx vitest run packages/ui/src/features/canvas/layout/engines/treeLayout.test.ts
```

Expected: PASS

**Step 5: Create `TreeRenderer.test.tsx`**

```typescript
// packages/ui/src/features/canvas/visualization/renderers/tree/TreeRenderer.test.tsx
import { describe, it, expect } from 'vitest';
import { treeRenderer } from './TreeRenderer';

describe('TreeRenderer', () => {
  it('has type tree', () => {
    expect(treeRenderer.type).toBe('tree');
  });

  it('canRender tree layout', () => {
    expect(treeRenderer.canRender('tree')).toBe(true);
  });

  it('cannot render radial-city layout', () => {
    expect(treeRenderer.canRender('radial-city')).toBe(false);
  });
});
```

**Step 6: Create `TreeRenderer.tsx`**

```tsx
// packages/ui/src/features/canvas/visualization/renderers/tree/TreeRenderer.tsx
import type { VisualizationRenderer, RenderContext } from '../../types';

/**
 * TreeRenderer — minimal hierarchy visualization.
 *
 * Renders nodes as spheres at their layout positions.
 * Edges are rendered as lines. No city metaphor.
 *
 * This is a proof-of-concept demonstrating that VisualizationRenderer
 * is truly decoupled from the city rendering system.
 */
const treeRenderer: VisualizationRenderer = {
  type: 'tree',

  render(ctx: RenderContext): React.JSX.Element {
    const { graph, positions } = ctx;
    return (
      <group>
        {/* Nodes as spheres */}
        {graph.nodes.map((node) => {
          const pos = positions.get(node.id);
          if (!pos) return null;
          return (
            <mesh key={node.id} position={[pos.x, pos.y, pos.z]}>
              <sphereGeometry args={[0.5, 16, 16]} />
              <meshStandardMaterial color="#60a5fa" />
            </mesh>
          );
        })}
        {/* Edges as lines */}
        {graph.edges.map((edge) => {
          const src = positions.get(edge.source);
          const tgt = positions.get(edge.target);
          if (!src || !tgt) return null;
          const points = new Float32Array([src.x, src.y, src.z, tgt.x, tgt.y, tgt.z]);
          return (
            <primitive
              key={`${edge.source}-${edge.target}`}
              object={(() => {
                const geo = new (require('three').BufferGeometry)();
                geo.setAttribute('position', new (require('three').Float32BufferAttribute)(points, 3));
                return new (require('three').Line)(geo, new (require('three').LineBasicMaterial)({ color: '#94a3b8' }));
              })()}
            />
          );
        })}
      </group>
    );
  },

  canRender(layoutType: string): boolean {
    return layoutType === 'tree';
  },
};

export { treeRenderer };
```

> **Note:** The `require('three')` pattern above is a quick implementation. For production quality, import Three.js at the top. Use `<primitive object={new THREE.Line(...)} />` per the R3F line rendering rule in CLAUDE.md.

**Step 7: Register tree style in `setup.ts`**

```typescript
// Add to visualization/setup.ts
import { treeRenderer } from './renderers/tree/TreeRenderer';
import { TreeLayoutEngine } from '../layout/engines/treeLayout';

visualizationStyleRegistry.register({
  id: 'tree',
  label: 'Tree View',
  layoutEngine: new TreeLayoutEngine(),
  renderer: treeRenderer,
});
```

**Step 8: Run all new tests**

```bash
npx vitest run packages/ui/src/features/canvas/layout/engines/treeLayout.test.ts \
                packages/ui/src/features/canvas/visualization/renderers/tree/TreeRenderer.test.tsx
```

Expected: PASS

**Step 9: Run full canvas suite + type-check**

```bash
npx vitest run packages/ui/src/features/canvas
npm run type-check -w @diagram-builder/ui
```

Expected: All PASS, 0 type errors

**Step 10: Commit**

```bash
git add packages/ui/src/features/canvas/layout/engines/treeLayout.ts \
        packages/ui/src/features/canvas/layout/engines/treeLayout.test.ts \
        packages/ui/src/features/canvas/visualization/renderers/tree/ \
        packages/ui/src/features/canvas/visualization/setup.ts
git commit -m "feat(visualization): add TreeLayoutEngine and TreeRenderer as proof of pluggability"
```

---

## Parallel Execution Guide

Tasks can be dispatched to subagents in these independent groups:

| Group | Tasks | Prereqs |
|-------|-------|---------|
| A | Task 1, Task 2 | None (can run in parallel) |
| B | Task 3, Task 4, Task 5, Task 6 | None (can run in parallel) |
| C | Task 7 | B complete |
| D | Task 8, Task 9 | B complete |
| E | Task 10 | A complete |
| F | Task 11 | A + E complete |
| G | Task 12 | A complete |

Recommended session order:
1. **Session 1:** Group A (Tasks 1+2) + Group B (Tasks 3+4+5+6) in parallel
2. **Session 2:** Group C (Task 7) + Group D (Tasks 8+9)
3. **Session 3:** Group E (Task 10) → Group F (Task 11)
4. **Session 4:** Group G (Task 12)

---

## Verification Commands (run after all tasks)

```bash
# All canvas tests
npx vitest run packages/ui/src/features/canvas

# TypeScript strict check
npm run type-check -w @diagram-builder/ui

# Lint
npm run lint -w @diagram-builder/ui

# Confirm cityViewUtils.ts is only a barrel re-export (<20 lines)
wc -l packages/ui/src/features/canvas/views/cityViewUtils.ts

# Confirm no production code imports from the barrel
grep -r "from.*cityViewUtils" packages/ui/src --include="*.ts" --include="*.tsx" \
  | grep -v ".test."
```
