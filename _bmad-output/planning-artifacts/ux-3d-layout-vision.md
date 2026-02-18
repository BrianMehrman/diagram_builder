---
type: ux-supplement
parent: ux-design-specification.md
project_name: diagram_builder
author: Brian
facilitator: Sally (UX Designer)
date: 2026-01-27
status: approved-vision
---

# 3D Layout Vision: City-to-Cell Metaphor

**Supplement to:** UX Design Specification
**Purpose:** Define the spatial metaphor, layout system, and visual language for the 3D codebase visualization.

---

## Executive Summary

This document defines a **multi-scale spatial metaphor** for visualizing codebases in 3D. The core insight: different levels of code abstraction benefit from different visual languages.

- **Macro level (city/district):** Architectural, geometric, intentional
- **Micro level (cell/organelle):** Organic, biological, emergent

The visualization transitions between these languages as users zoom from ecosystem overview to individual code elements.

---

## The Metaphor Stack

| Level | Metaphor | Visual Language | What It Shows |
|-------|----------|-----------------|---------------|
| **Ecosystem** | City skyline | Geometric, architectural | All codebases + dependencies |
| **Codebase** | Building | Floors, rooms, structure | One project's internal organization |
| **Module/Class** | Room → Cell | Transition from geometric to organic | Internal structure of a class |
| **Method/Function** | Organelle | Organic, floating, biological | Individual code elements |

---

## Level 1: City View (Ecosystem)

### Concept

The entire ecosystem appears as a **city skyline**. Your codebase is one building. External libraries (React, Express, lodash, etc.) are neighboring buildings on the same ground plane.

### Layout Rules

```
         YOUR CODEBASE                    REACT              LODASH

            ┌───────┐
            │       │
            │       │                    ┌───────┐
            │       │                    │       │         ┌─────┐
            │       │                    │       │         │     │
════════════╧═══════╧════════════════════╧═══════╧═════════╧═════╧════
                              GROUND LEVEL
```

- **Ground level:** Shared plane where all buildings sit
- **Building height:** Represents depth of abstraction (taller = deeper call hierarchy)
- **Building footprint:** Represents codebase size/complexity
- **Proximity:** Related libraries cluster together

### Underground Dependencies

Import connections between your code and external libraries are visualized as **underground tunnels** (like a subway system).

```
════════════════════════════════════════════════════════════════════
            ║       ║                    ║       ║         ║
            ║       ╚════════════════════╝       ║         ║
            ║           react import             ║         ║
            ╚════════════════════════════════════╩═════════╝
                        lodash imports
════════════════════════════════════════════════════════════════════
                              BEDROCK
```

- **Underground mode:** Toggle to reveal dependency connections
- **Tunnel thickness:** Could represent import frequency (future enhancement)
- **Not navigable yet:** Phase 1 is visibility only

### Scale Reference

At city level, the user is a **bird or drone** flying over the skyline. Buildings appear as large structures below.

---

## Level 2: Building View (Codebase)

### Concept

Flying into a building reveals its internal structure: **floors** representing abstraction layers, **rooms** representing classes/modules.

### Vertical Organization

> ⚠️ **SUPERSEDED** — See `city-metaphor-vertical-layering-spec.md`.
> Building height is now driven by **containment** (must be tall enough to hold method rooms), not abstraction depth.
> Methods render as box-shaped rooms inside class buildings (public on lower floors, private on upper).
> The floor-by-abstraction-depth model below is replaced by the vertical layering model:
> Underground (imports/inheritance) → Foundation (files) → Buildings (classes) → Rooms (methods) → Overhead wires (method calls).
> The diagram below is preserved for historical reference only.

```
    ┌─────────────────────────────────────┐
    │  ┌─────┐  ┌─────┐  ┌─────┐         │  ← Top Floor: Utilities
    │  │utils│  │helpr│  │const│         │    (leaf nodes, import nothing internal)
    │  └─────┘  └─────┘  └─────┘         │
    ├─────────────────────────────────────┤
    │  ┌──────────┐  ┌──────────┐        │  ← Middle Floors: Features
    │  │ useAuth  │  │ useCart  │        │    (hooks, stores, domain logic)
    │  └──────────┘  └──────────┘        │
    ├─────────────────────────────────────┤
    │  ┌────────┐  ┌────────┐  ┌───────┐ │  ← Lower Floors: Pages/Routes
    │  │  Home  │  │ Product│  │ Cart  │ │    (entry-adjacent code)
    │  └────────┘  └────────┘  └───────┘ │
    ├─────────────────────────────────────┤
    │           ┌──────────┐             │  ← Ground Floor: Entry Points
    │           │  App.tsx │             │    (foundation)
    │           └──────────┘             │
    └─────────────────────────────────────┘
```

### Layout Rules

> ⚠️ **SUPERSEDED** — See `city-metaphor-vertical-layering-spec.md`. The table below used floors to represent import-chain depth. The new model uses floors to represent **method rooms** inside class buildings, with public methods on lower floors and private on upper. Preserved for historical reference.

| Element | Representation |
|---------|----------------|
| ~~**Ground floor**~~ | ~~Entry points (main.ts, index.ts, app.ts)~~ |
| ~~**Floor N**~~ | ~~Code that is N levels deep in the import chain~~ |
| ~~**Rooms on a floor**~~ | ~~Classes/modules at that abstraction level~~ |
| ~~**Connections between rooms**~~ | ~~Internal imports at that level~~ |
| ~~**Stairs/elevators**~~ | ~~Import relationships between floors~~ |

### Building Shape Semantics

> ⚠️ **PARTIALLY SUPERSEDED** — Per `city-metaphor-vertical-layering-spec.md`, building height is now driven by method containment (number of method rooms), not abstraction depth. Tall = many methods, short = few methods. Base classes get distinct color scheme + box profile.

| Building Shape | Meaning |
|----------------|---------|
| **Tall, narrow** | ~~Deep abstraction, many layers~~ → Many methods |
| **Short, wide** | ~~Flat structure, everything near entry~~ → Few methods, broad API |
| **Irregular** | Organic growth, possible architectural issues |

### Scale Reference

At building level, the user is a **person walking through a building**. Floors are stories, rooms are offices.

---

## Level 3: Room → Cell View (Module/Class)

### Concept

This is where the visual language **transforms**. From the outside, a module looks like a geometric room. But when you enter, it becomes an **organic cell** with floating organelles.

### The Transition

There are **two ways** to see inside a room:

#### 1. Cross the Membrane (Full Immersion)

Fly toward a room. As you approach:
1. The wall becomes translucent
2. Then permeable
3. You push **through** the membrane
4. Now you're floating inside the cell

This is a **threshold transition** - a distinct moment of entering.

#### 2. X-Ray Mode (Peek Without Entering)

Toggle X-ray mode and the building becomes **transparent**:
- Walls become wireframes
- Cells visible inside every room
- Organelles visible within cells
- You remain outside but can see everything

```
  NORMAL VIEW                    X-RAY VIEW

  ┌─────────────┐               ┌ ─ ─ ─ ─ ─ ─ ┐
  │             │               │ ○   ◉   ○   │
  │  [ROOM]     │      →        │   ○   ○     │
  │             │               │ ◉     ○   ◉ │
  └─────────────┘               └ ─ ─ ─ ─ ─ ─ ┘
```

**X-ray = surveying.** Membrane crossing = **exploring.**

---

## Level 4: Cell View (Inside a Class)

### Concept

Inside a class, the architectural metaphor dissolves. Instead of walls and floors, you see **organelles floating in cytoplasm** - an organic, biological space.

```
    ╭─────────────────────────────────────────────────────╮
    │                                                     │
    │    ╭──────────╮                                     │
    │    │ ◉ state  │      ┌─────────────┐               │
    │    │  props   │══════│ render()    │               │
    │    ╰──────────╯      │   ◦ ◦ ◦     │               │
    │         ║            └──────┬──────┘               │
    │         ║                   │                       │
    │    ╭────╨────╮         ╭────┴────╮                 │
    │    │ useState │         │ onClick │                 │
    │    │  ~~~~    │════════│ handler │                 │
    │    ╰─────────╯         ╰─────────╯                 │
    │                              ║                      │
    │         ╭──────────────╮     ║                      │
    │         │  useEffect   │═════╝                      │
    │         │    ◈ ◈ ◈     │                           │
    │         ╰──────────────╯                           │
    │                                                     │
    ╰─────────────────────────────────────────────────────╯
```

### Organelle Mapping

| Code Element | Visual Shape | Characteristics |
|--------------|--------------|-----------------|
| **Function/Method** | Blob/sphere | Self-contained, rounded |
| **State/Variable** | Pulsing core (visual only, no animation yet) | Central, data-holding |
| **Constant** | Crystal/gem | Solid, faceted, unchanging |
| **Event handler** | Shape with receptor | Has "antenna" for signals |
| **Type/Interface** | Wireframe shape | Structural, transparent |

### Visual Properties

| Property | Purpose |
|----------|---------|
| **Color** | Type differentiation ONLY (not health/metrics) |
| **Shape** | Element type identification |
| **Size** | Relative complexity/importance |
| **Connections** | Data flow, call relationships |

### Color Palette (Type Differentiation)

| Element Type | Color Family |
|--------------|--------------|
| Functions/Methods | Blue family |
| State/Variables | Green family |
| Constants | Purple/crystal |
| Event handlers | Orange/warm |
| Types/Interfaces | Gray/wireframe |

**Important:** Colors indicate TYPE only. Not health, not complexity, not test coverage. Keep it simple and learnable.

### Animation

**Organelles are static.** No floating animation, no pulsing, no movement. This keeps the view calm and readable. Animation may be added in future phases.

### Scale Reference

At cell level, organelles are **chair-sized**. The user can walk up to one and inspect it.

---

## Interaction Design

### Navigation Model

| Level | Navigation Style |
|-------|------------------|
| **City** | Fly freely (drone mode) |
| **Building** | Fly or walk through |
| **Cell** | Float/drift through organic space |

### Selection & Inspection

1. **Hover** → Tooltip appears
   - Element name
   - Element type
   - Basic info (parameters, return type)

2. **Tooltip includes** → "View Code" button

3. **Click "View Code"** → Side panel opens with actual code

### Mode Toggles

| Toggle | What It Does |
|--------|--------------|
| **X-Ray Mode** | Makes buildings/rooms transparent, reveals cells/organelles |
| **Underground Mode** | Shows dependency subway system beneath city |

---

## Scale Reference Summary

| Level | You Are... | Things Are... |
|-------|------------|---------------|
| **City** | Bird/drone flying over | Buildings = large structures |
| **Building** | Person in lobby/hallway | Floors = stories, rooms = offices |
| **Room/Cell** | Person inside a space | Organelles = chair-sized objects |

This gives intuitive, human-relatable sense of scale at every level.

---

## Implementation Phases

### Phase 1: Foundation (Current Target)
- [ ] City view with building placeholders
- [ ] Building view with floor/room structure
- [ ] Basic cell view (organelles as simple shapes)
- [ ] Membrane threshold transition
- [ ] Tooltip on hover
- [ ] "View Code" panel

### Phase 2: Polish
- [ ] X-ray mode toggle
- [ ] Underground dependency visualization
- [ ] Refined organelle shapes by type
- [ ] Smooth transitions between levels

### Phase 3: Enhancement
- [ ] Color themes
- [ ] Underground navigation (future)
- [ ] Organelle animation (optional)
- [ ] Advanced metrics overlay (optional)

---

## Design Principles

1. **Metaphor consistency:** City outside, biology inside
2. **Meaningful dimensions:** Height = abstraction depth, not arbitrary
3. **Progressive disclosure:** Details appear as you zoom in
4. **Simplicity first:** Color = type only, no metric overload
5. **Threshold transitions:** Clear moments of "entering" a new level
6. **Human scale:** Relatable size references at every level

---

## Appendix: The Philosophy

> "Clusters of information rising like cities; programs as complex as you and me."

Software has two natures:

- **Macro:** Intentionally designed, structured, architectural (like a city)
- **Micro:** Organic, emergent, evolved (like biology)

This visualization honors both. We design the city. But the cells just *grow*.

---

**Document Status:** Approved Vision
**Next Steps:** Implementation planning, epic/story creation
**Related Documents:** ux-design-specification.md, architecture.md
