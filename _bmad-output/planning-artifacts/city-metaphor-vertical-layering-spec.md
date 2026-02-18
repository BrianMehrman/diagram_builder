# City Metaphor — Vertical Layering Specification

> **Status:** Draft — Supersedes conflicting sections in `tech-spec-city-metaphor-rethink.md` and `ux-3d-layout-vision.md`
> **Date:** 2026-02-17
> **Author:** Brian (via Mary, Business Analyst)

---

## 1. Overview

The 3D city visualization must use **all three spatial axes** meaningfully. Currently, nodes are laid out on a flat X-Y plane with minimal Z-axis usage. This specification defines a **vertical layering model** where the Z-axis encodes containment hierarchy and relationship type determines whether connections route **underground** or **overhead**.

### Core Principle

> The visualization should show not just *topology* but *semantics* — not just what connects to what, but **how** and **why**, using vertical space to encode **containment** and connection routing to encode **relationship type**.

---

## 2. Vertical Layer Model

The Z-axis is divided into distinct semantic layers:

```
        ═══════════════════════════════════════════
        ~~ Overhead Wires ~~                        ← Method-to-method calls,
        ~~ (above buildings) ~~                        composition references
        ═══════════════════════════════════════════

        ┌─────────────────┐
        │  ┌─────┐ ┌────┐ │  ← Methods/Functions
        │  │ m1  │ │ m2 │ │     (rooms inside building)
        │  └─────┘ └────┘ │
        │  ┌─────┐        │
        │  │ m3  │        │
        │  └─────┘        │
        └─────────────────┘  ← Class (building)

    ════════════════════════════════════════════════
                FILE (city block / foundation)        ← Ground level (Z = 0)
    ════════════════════════════════════════════════

        ╠══════════════════╣
        ║  Underground     ║  ← Imports, dependencies,
        ║  Plumbing/Sewer  ║     inheritance (extends/implements)
        ╠══════════════════╣
```

### Layer Definitions

| Layer | Z-Position | Represents | Visual Metaphor |
|-------|-----------|------------|-----------------|
| **Underground** | Below Z=0 | Imports, dependencies, inheritance (`extends`, `implements`) | Plumbing / sewer lines |
| **Foundation** | Z = 0 (ground plane) | Files | City blocks / lots |
| **Building** | Z > 0 (on foundation) | Classes | Structures on the block |
| **Rooms** | Inside building volume | Methods / functions of a class | Boxes arranged inside the building |
| **Overhead** | Above building rooftops | Method-to-method calls, composition | Wires / cables strung between buildings |

### Z-Value Ranges

Exact values are implementation details, but the following rough ranges establish spatial intent:

| Layer | Approximate Z Range | Notes |
|-------|-------------------|-------|
| **Underground** | Z = -5 to -1 | Depth can vary by connection type; inheritance lines may run deeper than simple imports |
| **Ground plane** | Z = 0 | Fixed reference plane |
| **Buildings** | Z = 0.5 to dynamic | Height driven by number of method rooms contained |
| **Overhead wires** | tallest building + 2 to +10 | Arc height scales with distance between connected buildings |

These ranges should be tunable via layout configuration and may need adjustment based on codebase scale.

---

## 3. Foundation Layer — Files as City Blocks

- Each **file** creates a bounded plot of land at ground level (Z = 0)
- The file block is the foundation upon which classes (buildings) are placed
- Standalone functions (not inside a class) sit directly on the file block as **small kiosks or shops**
- File blocks cluster into districts by directory/namespace

---

## 4. Building Layer — Classes

- Each **class** renders as a **building** sitting on its file's city block
- Building footprint reflects class complexity (number of methods, properties)
- Building height accommodates the rooms (methods) inside it

### 4.1 Base Class — Distinct Visual

A class that is **inherited from** (i.e., a base class / superclass) must have a **visually distinct building appearance** so it is immediately recognizable:

- **Different color scheme** — Base classes use a distinct color palette that sets them apart from regular class buildings (e.g., warmer tones, stone/marble coloring vs standard building colors)
- **Different box profile** — The building geometry itself differs from a regular class. Could be a wider base, tapered profile, stepped/pyramidal shape, or beveled edges — something that reads as "foundational" at a glance
- Both color AND profile must differ so base classes are unmistakable even at city-level zoom

### 4.2 Mid-Chain Inheritance

A class that is **both** a subclass (extends something) **and** a base class (something extends it) receives the **base class visual treatment**. The rule is simple: if any class inherits from it, it gets the base class look. Being a subclass does not override this — the "foundational" visual takes priority because other code depends on it.

### 4.3 Inheritance — Two Scenarios

**Scenario A: Same Namespace**
- Subclass building is nearby (same block or adjacent block)
- Underground plumbing line connects subclass to base class
- Proximity reinforces the relationship

**Scenario B: Different Namespace**
- Subclass is in a different district (another collection of buildings)
- Underground plumbing line runs across districts back to the base class
- The long-distance underground connection should still be discoverable (e.g., via toggle, highlight on hover, or transit-map overlay)

---

## 5. Room Layer — Methods Inside Buildings

- **Methods and functions** belonging to a class render as **box-shaped rooms** arranged inside the building volume
- Methods are visually contained within their parent class — they do not float outside
- **Public methods on lower floors**, private/protected methods on upper floors — public API is the "ground floor storefront" that other buildings interact with, private internals are upstairs
- **Constructors** render as rooms like any other method, but may use a distinct color or label to indicate their role (implementation detail)
- **Static methods** render as rooms but should be visually distinguishable from instance methods (e.g., different room color or a subtle badge) since they belong to the class itself, not instances
- At high zoom (city level / LOD 1-2), methods may simplify to floor bands on the building exterior for performance; at closer zoom (LOD 3+), individual method rooms become visible

---

## 6. Connection Routing — Two Distinct Systems

### 6.1 Underground Connections (Plumbing / Sewer Lines)

**What routes underground:**
- `import` / dependency references
- `extends` (inheritance)
- `implements` (interface implementation)
- Dependency injection

**Visual treatment:**
- Lines rendered **below the ground plane** (Z < 0)
- Styled as pipes or conduit lines
- Toggle-able visibility (can show/hide underground layer)
- Thickness or color can encode frequency or type

> **SUPERSEDES:** The existing spec's placement of `extends` and `implements` as sky edges at Y=60+. Inheritance is fundamentally a **structural foundation** relationship and belongs underground, not overhead.

### 6.2 Overhead Connections (Wires / Cables)

**What routes overhead:**
- Method calling another class's method
- Method calling a standalone function
- Composition references (a class holding/using an instance of another class)

**Visual treatment:**
- Lines rendered **above building rooftops**
- Styled as wires, cables, or arcs
- Color or style can differentiate call types (method call vs composition)
- Should be visible at city level to show communication patterns

### 6.3 Rationale for Split

| Relationship | Nature | Routing | Why |
|---|---|---|---|
| Import / dependency | Structural foundation | Underground | You build *on top of* your dependencies — they are the infrastructure |
| Inheritance / extends | Structural foundation | Underground | A subclass is *built on* its base class |
| Implements | Structural contract | Underground | The interface is an underground blueprint/spec |
| Method call | Runtime communication | Overhead | Active signals passing between buildings at runtime |
| Composition | Runtime relationship | Overhead | One building actively using/holding another's services |

---

## 7. External Dependencies

- External packages (e.g., `lodash`, `express` — code not in the user's codebase) are represented as **infrastructure landmarks** at the city edge (already defined in existing spec)
- Underground plumbing lines connect internal buildings to these external landmarks
- Underground connections to external packages are **toggle-able** (hidden by default to reduce visual noise; revealed on demand via UI toggle or hover interaction)
- The underground connection makes it clear these are foundational dependencies, not active runtime relationships

---

## 8. Standalone Functions

- Functions **not inside a class** sit directly on the file's city block as **small kiosks or shops** — single-story, compact structures
- They are visually smaller and simpler than class buildings, clearly readable as "not a class"
- Overhead wires connect to them when other methods call them

---

## 9. Superseded Specifications

This document **supersedes** the following sections in existing docs:

| Existing Doc | Section | Change |
|---|---|---|
| `tech-spec-city-metaphor-rethink.md` | Sky Edges — height encoding by relationship type | Inheritance/implements move **underground**; only method calls and composition remain overhead |
| `tech-spec-city-metaphor-rethink.md` | Sky Edge color coding (extends=green, implements=purple at Y=60+) | These relationship types now route underground with pipe styling |
| `tech-spec-city-visualization-overhaul.md` | Floor Band System for methods | Floor bands remain as LOD 1-2 simplification; at LOD 3+, methods render as rooms inside the building |
| `ux-3d-layout-vision.md` | Building height = depth of abstraction | Building height is now driven by **containment** (must be tall enough to hold method rooms); height encoding metrics (methodCount, loc, etc.) influence footprint or are secondary |

### What Remains Unchanged

- Radial layout system (ring positioning, districts, arc segments)
- Node clustering and LOD cascade
- Signage system
- Infrastructure landmarks and boundary zones
- Atmospheric indicators
- Camera and navigation system
- Shape language for different node types (class, interface, abstract_class, enum, etc.)
- District ground planes
- Transit map overlay mode (updated to show underground layer instead of/in addition to sky edges)

---

## 10. Design Decisions (Resolved)

| Decision | Resolution |
|---|---|
| **Base class visual** | Different color scheme + different box profile (geometry shape) — both must differ from regular classes |
| **Method floor ordering** | Public methods on **lower floors** (storefront), private/protected on upper floors |
| **External dependency underground lines** | **Toggle-able** — hidden by default, revealed on demand |
| **Standalone function shape** | **Kiosk / small shop** — compact single-story structure on the file block |

---

## 11. Future Considerations

| Topic | Notes |
|---|---|
| **Event emissions** (`EventEmitter.emit()`, pub/sub patterns) | These are runtime communication but broadcast rather than targeting a specific method. Overhead wire routing is unclear — could use a "broadcast antenna" visual on the emitting building, or fan-out wires to all listeners. Deferred for future design. |
