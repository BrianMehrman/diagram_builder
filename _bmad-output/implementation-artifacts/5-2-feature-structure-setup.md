# Story 5-2: Feature Structure Setup

## Story

**ID:** 5-2
**Key:** 5-2-feature-structure-setup
**Title:** Create feature-based directory structure and shared utilities
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Establish the feature-based organization structure for the UI package. Create src/features/ directory and shared utilities directory, setting the foundation for all subsequent UI features (Canvas, MiniMap, Navigation, etc.).

CRITICAL: Feature-based organization (NOT type-based) is mandatory per architecture.

---

## Acceptance Criteria

- **AC-1:** src/features/ directory created
- **AC-2:** src/shared/ directory with types, utils, constants
- **AC-3:** Example feature structure documented
- **AC-4:** NO type-based directories at root (no /components/, /hooks/)
- **AC-5:** README documents structure and conventions

---

## Tasks/Subtasks

### Task 1: Create directory structure
- [ ] Create src/features/ directory
- [ ] Create src/shared/types/
- [ ] Create src/shared/utils/
- [ ] Create src/shared/constants/
- [ ] Create example feature: src/features/example/

### Task 2: Document structure
- [ ] Create README.md documenting feature-based organization
- [ ] Add examples of correct vs incorrect structure
- [ ] Document shared utilities pattern

### Task 3: Validate structure
- [ ] Ensure NO /components/, /hooks/, /stores/ at root
- [ ] Create placeholder files to demonstrate structure

---

## Dev Notes

**Feature Structure Example:**
```
src/
├── features/           # Feature-based (CORRECT)
│   ├── canvas/
│   │   ├── Canvas3D.tsx
│   │   ├── Canvas3D.test.tsx
│   │   ├── canvasStore.ts
│   │   ├── useCamera.ts
│   │   └── types.ts
├── shared/            # Shared utilities
│   ├── types/
│   ├── utils/
│   └── constants/
```

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
