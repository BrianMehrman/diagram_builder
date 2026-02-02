# Story 7-4: Add Keyboard Navigation Shortcuts

## Story

**ID:** 7-4
**Key:** 7-4-add-keyboard-navigation-shortcuts
**Title:** Implement Global Keyboard Shortcuts for Navigation
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 2 (Core Interaction)
**Priority:** HIGH - Power User Experience

**Description:**

Implement global keyboard shortcuts for all core actions: ⌘K (search), ESC (close/deselect), Home (fly to root), C (toggle Orbit/Fly mode), arrow keys (navigate search results).

**Context:**

From UX Design Specification:
- **Keyboard-First Navigation:** All core actions accessible via keyboard
- **Global shortcuts:** ⌘K, ESC, Home, C, Ctrl+Shift+S (share viewpoint)
- **No keyboard traps:** ESC closes all modals

---

## Acceptance Criteria

- **AC-1:** ⌘K opens search (global shortcut) - DONE (Story 7-1)
- **AC-2:** ESC closes modals, deselects nodes - DONE
- **AC-3:** Home key flies to root node - DONE
- **AC-4:** C key toggles Orbit/Fly control mode - DONE
- **AC-5:** Ctrl+Shift+S shares viewpoint (copy link) - DONE
- **AC-6:** All shortcuts work globally (not just when focused) - DONE
- **AC-7:** Shortcuts documented in help modal - DONE

---

## Tasks/Subtasks

### Task 1: Implement global keyboard listener
- [x] Add document-level event listener
- [x] Dispatch actions based on key combinations
- [x] Prevent default browser behavior when needed
- [x] Clean up on unmount

### Task 2: Implement individual shortcuts
- [x] ⌘K - Open search modal (already in 7-1)
- [x] ESC - Close active modal or deselect node
- [x] Home - Fly to root/entry point
- [x] C - Toggle between Orbit and Fly control modes
- [x] Ctrl+Shift+S - Copy viewpoint link to clipboard

### Task 3: Create keyboard shortcut help modal
- [x] List all shortcuts with descriptions
- [x] ? key or Help button opens modal
- [x] Group by category (Navigation, Search, Controls)

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-4 hours
- **Priority:** HIGH

**Status:** review
**Created:** 2026-01-24
**Completed:** 2026-01-26

---

## Dev Agent Record

### Session 2026-01-26

**Implementation Approach:**
- Created comprehensive `useGlobalKeyboardShortcuts` hook for all shortcuts
- Created `KeyboardShortcutsModal` component using Radix UI Dialog
- Created `useUIStore` for managing global UI state (help modal)
- Integrated shortcuts into WorkspacePage and modal into App

**Changes Made:**

1. **UI Store** (`packages/ui/src/shared/stores/uiStore.ts`):
   - New store for global UI state
   - `isHelpModalOpen` state
   - `openHelpModal()`, `closeHelpModal()`, `toggleHelpModal()` actions
   - 6 unit tests

2. **useGlobalKeyboardShortcuts Hook** (`packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts`):
   - Document-level keyboard event listener
   - ESC: Close help modal → search modal → deselect node (priority order)
   - Home: Fly to root node (first file node)
   - C: Toggle Orbit/Fly control mode with toast feedback
   - Ctrl+Shift+S: Copy viewpoint link to clipboard
   - ?: Open help modal
   - Ignores shortcuts when typing in inputs (except ESC)
   - Disables shortcuts when modals open (except ESC)
   - 24 unit tests

3. **KeyboardShortcutsModal** (`packages/ui/src/shared/components/KeyboardShortcutsModal.tsx`):
   - Radix UI Dialog for accessibility
   - Categorized shortcuts: Search, Navigation, Camera Controls, Sharing, Help
   - Keyboard key badges with styled `<kbd>` elements
   - Windows/Linux note for Ctrl vs ⌘
   - Close with ESC, "Got it" button, or X button
   - 14 unit tests

4. **Integration**:
   - Added `useGlobalKeyboardShortcuts` to WorkspacePage with nodes and flyToNode
   - Added `KeyboardShortcutsModal` to App.tsx (global modal)
   - Updated index files for exports

**Tests:**
- `uiStore.test.ts`: 6 tests
- `useGlobalKeyboardShortcuts.test.ts`: 24 tests
- `KeyboardShortcutsModal.test.tsx`: 14 tests
- Total: 44 new tests, all passing

---

## File List

**Created:**
- `packages/ui/src/shared/stores/uiStore.ts` - UI state store
- `packages/ui/src/shared/stores/uiStore.test.ts` - 6 tests
- `packages/ui/src/shared/stores/index.ts` - Store exports
- `packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.ts` - Keyboard shortcuts hook
- `packages/ui/src/shared/hooks/useGlobalKeyboardShortcuts.test.ts` - 24 tests
- `packages/ui/src/shared/components/KeyboardShortcutsModal.tsx` - Help modal
- `packages/ui/src/shared/components/KeyboardShortcutsModal.test.tsx` - 14 tests

**Modified:**
- `packages/ui/src/shared/hooks/index.ts` - Added export
- `packages/ui/src/shared/components/index.ts` - Added export
- `packages/ui/src/shared/index.ts` - Added stores export
- `packages/ui/src/pages/WorkspacePage.tsx` - Added useGlobalKeyboardShortcuts hook
- `packages/ui/src/App.tsx` - Added KeyboardShortcutsModal
