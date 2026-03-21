# Connection Visibility Design
**Date:** 2026-02-20
**Status:** Approved
**Topic:** Improving edge/connection discoverability, tracing, directionality, and labeling in the 3D city visualization

---

## Problem Statement

The existing 3D city view renders connections (overhead wires, underground pipes) but they are difficult to interpret:
- **Tracing** — no way to tell which buildings are connected to a selected building
- **Directionality** — no arrowheads, dependency flow direction is unclear
- **Discovery** — underground pipes hidden by default; wires only appear at LOD 2+
- **Labeling** — no edge type or target name labels on connections

---

## Solution: Focus Mode + Radial Overlay Toggle

Two complementary interaction modes accessible from a single building click, toggleable between them.

---

## Section 1: State & Interaction Model

### New Store Fields (useCanvasStore)
```typescript
focusedNodeId: string | null   // which building is selected
showRadialOverlay: boolean      // whether the SVG overlay is active
```

### Interaction Flow
1. Click a building → `focusedNodeId` set, 3D focus mode activates
2. "Show Map" toggle button appears in UI → clicking sets `showRadialOverlay: true`; SVG overlay appears over dimmed 3D scene
3. Click a node inside the radial overlay → `focusedNodeId` updates, overlay re-centers on new node
4. Click "Close Map" → returns to 3D focus mode (stays focused, not back to normal view)
5. Press Escape or click background → both `focusedNodeId` and `showRadialOverlay` reset; normal view returns

---

## Section 2: 3D Focus Mode

### Building Opacity States
| State | Opacity |
|-------|---------|
| Selected building | 100% + emissive glow (white/yellow ring at base) |
| Directly connected buildings | 100% + subtle highlight border |
| Second-hop buildings | 50% |
| All other buildings | 15% |

### Edge Visibility in Focus Mode
- Edges from/to selected building → full opacity, bright, with arrowheads
- All other edges → hidden entirely (reduce clutter)
- Underground pipes → automatically visible regardless of global `undergroundVisible` toggle

### Floating Edge Labels
- Appear mid-edge on edges connected to the focused building
- Show: edge type (`calls`, `imports`, `inherits`, etc.) + target building name
- Rendered as `<Html>` sprites or billboarded text in R3F

### Arrowhead Additions (Base Improvement)
Added to all views (not just focus mode):
- **OverheadWire** — `THREE.ConeGeometry` at arc endpoint, oriented along final curve tangent
- **UndergroundPipe** — cone cap at tube exit point, matching pipe color/material

---

## Section 3: Radial Overlay (SVG)

### Layout
Full-canvas `<svg>` absolutely positioned over the dimmed 3D scene.

- **Center node** — focused building, labeled with building name, rendered as a circle
- **1st-hop spokes** — long spokes radiating evenly outward from center
- **2nd-hop spokes** — shorter spokes extending from each 1st-hop node, 40% opacity

### First-Hop Spoke Styling
| Property | Value |
|----------|-------|
| Length | Long (proportional to canvas size) |
| Color | Matches edge type color (green=`calls`, slate=`imports`, amber=`inherits`, purple=`composes`, red=`depends_on`) |
| Line style | Solid for `calls`/`composes`; dashed for structural types |
| Arrowhead | At endpoint, showing dependency direction |
| Labels | Edge type (small, mid-spoke) + target building name (at endpoint circle) |

### Second-Hop Spoke Styling
- Shorter length than 1st-hop
- 40% opacity
- Smaller label text
- Same color/dash conventions as 1st-hop

### Navigation
- Clicking any node in the overlay sets that node as `focusedNodeId` (overlay re-renders centered on it)
- "Close Map" button → `showRadialOverlay: false` (returns to 3D focus mode)

---

## New Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `useFocusedConnections` | `hooks/useFocusedConnections.ts` | Computes direct + second-hop edges for focused node |
| `BuildingFocusOverlay` | `components/BuildingFocusOverlay.tsx` | Manages opacity/highlight state in 3D scene during focus mode |
| `RadialOverlay` | `components/RadialOverlay.tsx` | SVG overlay with radial spoke diagram |
| `FocusToggleButton` | `components/FocusToggleButton.tsx` | "Show Map" / "Close Map" UI button |
| Edge label rendering | inline in `OverheadWire.tsx` / `UndergroundPipe.tsx` | Floating mid-edge type + target labels |
| Arrowhead geometry | inline in `OverheadWire.tsx` / `UndergroundPipe.tsx` | `THREE.ConeGeometry` at edge endpoints |

---

## Files Modified

- `packages/ui/src/features/canvas/store.ts` — add `focusedNodeId`, `showRadialOverlay`
- `packages/ui/src/features/canvas/views/CityView.tsx` — wire in `BuildingFocusOverlay`, `FocusToggleButton`
- `packages/ui/src/features/canvas/components/OverheadWire.tsx` — arrowhead + focus-mode label
- `packages/ui/src/features/canvas/components/UndergroundPipe.tsx` — arrowhead + focus-mode label
- `packages/ui/src/features/canvas/components/CityUnderground.tsx` — auto-visible in focus mode

---

## Out of Scope (Future)
- Edge count/multiplicity encoding (thickness by frequency)
- Temporal/frequency coloring
- LOD threshold adjustments for base view
