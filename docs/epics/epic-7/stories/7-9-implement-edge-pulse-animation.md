# Story 7.9: Implement Edge Pulse Animation on Arrival

Status: review

## Story

As a **developer exploring a codebase**,
I want **connected edges to pulse when I arrive at a node via camera flight**,
so that **I can immediately see the node's relationships and understand its context in the dependency graph**.

## Acceptance Criteria

- **AC-1:** When a node is highlighted (after camera arrival), edges connected to that node pulse with a scale animation (1.0 → 1.2 → 1.0 over ~1 second cycle)
- **AC-2:** Connected edge color brightens during pulse via emissive glow effect
- **AC-3:** Pulse animation stops and fades out smoothly when highlight clears (after 2 seconds, matching node highlight timing)
- **AC-4:** Respect `prefers-reduced-motion` — show static bright highlight instead of animation
- **AC-5:** Non-connected edges remain visually unchanged during pulse

---

## Tasks/Subtasks

### Task 1: Update EdgeRenderer to support highlight state (AC: 1, 5)
- [x] Import `useCanvasStore` and subscribe to `highlightedNodeId`
- [x] Determine if edge is connected to highlighted node (source or target matches)
- [x] Add `useRef` for line material to enable per-frame updates
- [x] Switch from `lineBasicMaterial` to a material that supports emissive/opacity animation (or use color + opacity manipulation on `lineBasicMaterial`)

### Task 2: Implement pulse animation (AC: 1, 2, 3)
- [x] Add `useFrame` hook from `@react-three/fiber` for per-frame animation
- [x] Implement sine wave pulse: `Math.sin(time * 4)` for ~1s cycle (matching NodeRenderer pattern)
- [x] Animate line width or opacity for scale feel (Three.js lines don't support geometric scale — use opacity 0.7→1.0 and color brightness)
- [x] Brighten edge color during pulse (lerp toward white or increase lightness)
- [x] Smooth fade-out when `highlightedNodeId` clears (decay intensity over ~0.5s)

### Task 3: Respect reduced motion (AC: 4)
- [x] Import `useReducedMotion` hook from `shared/hooks`
- [x] When reduced motion preferred: apply static bright color (no animation) to connected edges
- [x] Still visually distinguish connected vs non-connected edges

### Task 4: Write tests (AC: 1-5)
- [x] Unit test: connected edges identified correctly (source match, target match, no match)
- [x] Unit test: pulse animation state changes when `highlightedNodeId` set/cleared
- [x] Unit test: reduced motion disables animation but still highlights
- [x] Unit test: non-connected edges unaffected by highlight

---

## Dev Notes

### Architecture & Patterns

**State management:** Zustand only. The `highlightedNodeId` state already exists in canvas store (`packages/ui/src/features/canvas/store.ts:49`). The `useCameraFlight` hook sets this on arrival and clears it after 2 seconds.

**Feature organization:** All edge rendering code stays in `packages/ui/src/features/canvas/components/`. Tests co-located as `.test.tsx`.

**Animation pattern:** Follow the exact same pattern as `NodeRenderer` (lines 79-90):
```typescript
useFrame((_, delta) => {
  if (isConnected) {
    const time = performance.now() / 1000;
    const intensity = 0.55 + Math.sin(time * 4) * 0.25;
    // Apply to material
  } else if (pulseIntensity > 0) {
    setPulseIntensity(Math.max(0, pulseIntensity - delta * 2));
  }
});
```

### Existing Code Analysis

**EdgeRenderer** (`packages/ui/src/features/canvas/components/EdgeRenderer.tsx`):
- Currently renders static lines with `lineBasicMaterial` (opacity 0.7)
- Color based on edge type (contains=blue, depends_on=purple, calls=green, inherits=amber, imports=red)
- Takes `edge: GraphEdge` and `nodes: GraphNode[]` props
- Finds source/target nodes by ID to get positions
- Uses `bufferGeometry` with `bufferAttribute` for line positions

**NodeRenderer pulse pattern** (`packages/ui/src/features/canvas/components/NodeRenderer.tsx`):
- Uses `useFrame` for per-frame animation
- Sine wave: `0.55 + Math.sin(time * 4) * 0.25` for intensity
- `meshStandardMaterial` with emissive color/intensity
- Fade-out: `Math.max(0, pulseIntensity - delta * 2)`

**useReducedMotion hook** (`packages/ui/src/shared/hooks/useReducedMotion.ts`):
- Already exists, listens for `prefers-reduced-motion` media query
- Returns `boolean`
- Exported from `packages/ui/src/shared/hooks/index.ts`

**Canvas store highlight state** (`packages/ui/src/features/canvas/store.ts`):
- `highlightedNodeId: string | null` — set on camera flight arrival
- `setHighlightedNode(nodeId: string | null)` — action
- Cleared after 2 seconds by `useCameraFlight`

### Technical Constraints

**Three.js line limitations:**
- `lineBasicMaterial` does NOT support emissive properties
- Options for pulse effect:
  1. Animate `color` and `opacity` on `lineBasicMaterial` (simplest, recommended)
  2. Switch to `meshLine` or tube geometry for more control (over-engineering for this story)
- Recommended: Animate color brightness (lerp toward white) + opacity (0.7 → 1.0) for pulse feel
- Use `useRef` on material and mutate directly in `useFrame` to avoid React re-renders

**Implementation approach:**
```typescript
// Add ref for material
const materialRef = useRef<LineBasicMaterial>(null);

// In useFrame:
if (materialRef.current && isConnected) {
  const time = performance.now() / 1000;
  const t = 0.5 + Math.sin(time * 4) * 0.5; // 0 to 1
  materialRef.current.opacity = 0.7 + t * 0.3; // 0.7 to 1.0
  materialRef.current.color.lerp(highlightColor, t * 0.5); // Brighten
}
```

### Previous Story Learnings (from 7-3 and 7-8)

- `useFrame` works well for per-frame animation in this codebase
- `performance.now() / 1000` for time-based animation (not delta accumulation)
- `prefers-reduced-motion` detection uses existing `useReducedMotion` hook
- Tests use Vitest + Testing Library. For `useFrame` tests, mock `@react-three/fiber`
- Panel tests needed `getByLabelText` instead of `getByTitle` after accessibility changes

### Project Structure Notes

- File location: `packages/ui/src/features/canvas/components/EdgeRenderer.tsx` (existing)
- Test location: `packages/ui/src/features/canvas/components/EdgeRenderer.test.tsx` (new)
- No new dependencies needed — all required APIs available in existing packages

### References

- [Source: packages/ui/src/features/canvas/components/EdgeRenderer.tsx] — Current edge rendering
- [Source: packages/ui/src/features/canvas/components/NodeRenderer.tsx:79-124] — Pulse animation pattern
- [Source: packages/ui/src/features/canvas/store.ts:49,120] — highlightedNodeId state
- [Source: packages/ui/src/shared/hooks/useReducedMotion.ts] — Reduced motion detection
- [Source: _bmad-output/implementation-artifacts/7-3-implement-camera-flight-animations.md] — Deferred from here
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md] — "Connected edges pulse" on arrival

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Initial `useFrame` guard used `if (!materialRef.current)` but JSDOM renders `<lineBasicMaterial>` as a DOM element without `.color` property. Fixed guard to `if (!materialRef.current?.color)` for robustness.

### Completion Notes List

All 4 tasks completed:
- **Task 1 (Highlight state):** Added `useCanvasStore` subscription to `highlightedNodeId`, `useRef<LineBasicMaterial>` for direct material mutation, and `isConnected` boolean checking source/target match.
- **Task 2 (Pulse animation):** Implemented `useFrame` with sine wave (`Math.sin(time * 4)`) matching NodeRenderer pattern. Animates opacity (0.7→1.0) and color brightness (lerp toward white). Smooth fade-out via `delta * 2` decay when highlight clears.
- **Task 3 (Reduced motion):** Imported existing `useReducedMotion` hook. When active, applies static bright color (40% lerp toward white) and full opacity without animation.
- **Task 4 (Tests):** 11 unit tests covering: basic rendering, null node handling, connected edge detection (source match, target match, no match), useFrame registration, animation callback safety, reduced motion behavior, and non-connected edge isolation.

### File List

**New Files:**
- `packages/ui/src/features/canvas/components/EdgeRenderer.test.tsx` — 11 unit tests

**Modified Files:**
- `packages/ui/src/features/canvas/components/EdgeRenderer.tsx` — Added pulse animation for highlighted node arrival feedback

---

## Change Log
- 2026-02-02: Implemented edge pulse animation — connected edges animate opacity/color brightness on camera flight arrival, with reduced motion support and 11 unit tests

