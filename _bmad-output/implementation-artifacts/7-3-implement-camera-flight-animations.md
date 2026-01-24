# Story 7-3: Implement Camera Flight Animations with Feedback

## Story

**ID:** 7-3
**Key:** 7-3-implement-camera-flight-animations
**Title:** Implement Smooth Camera Flight Animations with Visual Feedback
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 2 (Core Interaction)
**Priority:** HIGH - Core Interaction Polish

**Description:**

Implement smooth, eased camera flight animations (1-2 seconds) with visual feedback on arrival: highlighted nodes, pulsing edges, tooltips, and breadcrumb updates.

**Context:**

From UX Design Specification:
- **Camera Flight Pattern:** 1-2s smooth eased animation, target pulses, breadcrumb updates, minimap FOV animates
- **On Arrival:** Element centered, highlighted, tooltip appears
- **Accessibility:** Respect `prefers-reduced-motion` (instant teleport)

Current state: Basic camera positioning exists but no smooth animations or arrival feedback.

---

## Acceptance Criteria

- **AC-1:** Smooth camera flight (1-2s eased animation)
- **AC-2:** On arrival: node highlighted, edges pulse, tooltip appears
- **AC-3:** Breadcrumb updates during flight
- **AC-4:** `prefers-reduced-motion` support (instant teleport)
- **AC-5:** ESC cancels flight mid-animation

---

## Tasks/Subtasks

### Task 1: Implement camera animation
- [ ] Use GSAP or Three.js animation for smooth camera movement
- [ ] Power2.inOut easing (1.5-2s duration)
- [ ] Update camera lookAt target during flight
- [ ] Cancel on ESC key or user interaction

### Task 2: Add arrival feedback
- [ ] Highlight target node (glow effect)
- [ ] Pulse connected edges (scale animation)
- [ ] Show tooltip with node details
- [ ] Fade out highlight after 2s

### Task 3: Update breadcrumb during flight
- [ ] Track camera position → node hierarchy
- [ ] Update breadcrumb text during flight
- [ ] Make breadcrumb clickable (fly to clicked level)

### Task 4: Respect reduced motion
- [ ] Detect `prefers-reduced-motion` media query
- [ ] Instant camera position update (no animation)
- [ ] Still show arrival feedback (highlight, tooltip)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours
- **Priority:** HIGH

**Status:** not-started
**Created:** 2026-01-24
