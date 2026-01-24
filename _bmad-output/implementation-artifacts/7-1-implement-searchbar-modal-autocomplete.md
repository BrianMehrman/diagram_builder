# Story 7-1: Implement SearchBar with ⌘K Modal and Autocomplete

## Story

**ID:** 7-1
**Key:** 7-1-implement-searchbar-modal-autocomplete
**Title:** Implement SearchBar with ⌘K Modal, Fuzzy Autocomplete, and Camera Flight
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 2 (Core Interaction)
**Priority:** CRITICAL - Highest User Value

**Description:**

Implement the primary search interface for finding code elements (files, classes, methods) with ⌘K keyboard shortcut, fuzzy autocomplete, and smooth camera flight to selected results. This is the defining interaction for diagram_builder: "Search → Fly → Understand in <5 seconds."

**Context:**

From UX Design Specification:
- **Core Experience:** "Search → Fly → Understand" is the primary user journey
- **Design Direction:** "Search-First Command Center" with 600px prominent white search bar
- **User Need:** "I want to type 'AuthService' and immediately fly to it in 3D space"
- **Performance Target:** <100ms autocomplete response, <5 seconds total journey time

Current state:
- Story 5-8 (feature-navigation) has basic SearchBar component
- No ⌘K modal trigger
- No autocomplete functionality
- No fuzzy matching
- No camera flight integration

This story implements the complete search experience as specified in UX design.

---

## Acceptance Criteria

- **AC-1:** ⌘K keyboard shortcut triggers search modal
  - Global keyboard listener for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
  - Modal opens with dark overlay backdrop
  - Search input auto-focused when modal opens
  - ESC key closes modal
  - Click outside modal closes modal

- **AC-2:** Fuzzy autocomplete with <100ms response
  - Search executes as user types (debounced 100ms)
  - Fuzzy matching finds partial matches (e.g., "auth" finds "AuthService", "authenticate", "authMiddleware")
  - Results ranked by relevance (Files > Classes > Methods, then alphabetical)
  - Display top 10 results maximum
  - Show result type icon + name + file path
  - Empty state: "No matches found. Try searching for a file, class, or method name."

- **AC-3:** Keyboard navigation in results
  - ↑↓ arrow keys navigate results
  - Selected result highlighted with blue background
  - Enter key selects highlighted result
  - No mouse required for entire flow

- **AC-4:** Camera flight to selected result
  - Enter or click selects result
  - Modal closes
  - Camera smoothly flies to target node (1-2 second eased animation)
  - On arrival: node highlighted, edges pulse, tooltip appears
  - Breadcrumb updates to show current location

- **AC-5:** Accessibility compliance
  - Modal has `role="dialog"` with `aria-label="Search code elements"`
  - Input has `aria-autocomplete="list"`
  - Results have `role="listbox"` with `aria-activedescendant`
  - Screen reader announces "X results for 'query'"
  - `prefers-reduced-motion` support (instant teleport instead of flight)

---

## Tasks/Subtasks

### Task 1: Implement ⌘K keyboard shortcut
- [ ] Add global keyboard event listener (document level)
- [ ] Detect Cmd+K (Mac) or Ctrl+K (Windows/Linux)
- [ ] Prevent default browser behavior (Cmd+K opens address bar)
- [ ] Toggle search modal visibility
- [ ] Focus search input when modal opens
- [ ] Clean up event listener on unmount

### Task 2: Build SearchModal component
- [ ] Create SearchModal.tsx using Radix Dialog
- [ ] Dark overlay backdrop (rgba(0, 0, 0, 0.5))
- [ ] White modal container (600px width, centered)
- [ ] Search input with magnifying glass icon
- [ ] Results container below input
- [ ] ESC closes modal
- [ ] Click outside closes modal
- [ ] Style with Tailwind CSS + CSS Modules

### Task 3: Implement fuzzy search logic
- [ ] Install fuzzy search library (e.g., fuse.js or fuzzy)
- [ ] Create searchIndex with all nodes (id, label, type, filePath)
- [ ] Implement debounced search (100ms)
- [ ] Rank results: Files > Classes > Functions > Variables
- [ ] Limit to top 10 results
- [ ] Return result objects with {id, label, type, filePath, score}

### Task 4: Build SearchResults component
- [ ] Create SearchResults.tsx component
- [ ] Display results as list with hover states
- [ ] Show type icon (📄 File, 🔷 Class, ƒ Function)
- [ ] Show name (bold) + file path (gray, truncated)
- [ ] Highlight selected result (blue background)
- [ ] Show "X results for 'query'" count
- [ ] Empty state: "No matches found..."
- [ ] Loading state: spinner while searching

### Task 5: Implement keyboard navigation
- [ ] Track selectedIndex state (0 to results.length - 1)
- [ ] ↑ key decrements selectedIndex (wrap to bottom)
- [ ] ↓ key increments selectedIndex (wrap to top)
- [ ] Enter key selects result at selectedIndex
- [ ] Update `aria-activedescendant` on selection change
- [ ] Scroll selected item into view if needed

### Task 6: Integrate camera flight
- [ ] Create flyToNode(nodeId) function
- [ ] Use existing camera animation from Canvas3D
- [ ] Animate camera position to node (1-2s eased)
- [ ] On arrival: highlight node, pulse edges
- [ ] Show tooltip with node details
- [ ] Update breadcrumb with new location
- [ ] Respect `prefers-reduced-motion` (instant teleport)

### Task 7: Add accessibility features
- [ ] Add ARIA attributes (role, aria-label, aria-autocomplete)
- [ ] Announce results count with aria-live region
- [ ] Trap focus in modal (tab doesn't leave modal)
- [ ] Screen reader support for navigation
- [ ] High contrast mode support
- [ ] Focus indicators (2px blue outline)

### Task 8: Testing and optimization
- [ ] Unit tests for fuzzy search logic
- [ ] Component tests for SearchModal
- [ ] E2E test: ⌘K → type → select → camera flies
- [ ] Performance test: <100ms autocomplete on 10k nodes
- [ ] Accessibility audit (axe, Lighthouse)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## Dev Notes

### Keyboard Shortcut Implementation

```typescript
// useSearchShortcut.ts
import { useEffect } from 'react';

export function useSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault(); // Prevent browser address bar
        onOpen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpen]);
}
```

### SearchModal Component

```typescript
// SearchModal.tsx
import * as Dialog from '@radix-ui/react-dialog';
import { useState } from 'react';
import { SearchInput } from './SearchInput';
import { SearchResults } from './SearchResults';
import { useSearch } from './useSearch';

export function SearchModal({ open, onClose }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const { results, loading } = useSearch(query);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      handleSelect(results[selectedIndex]);
    }
  };

  const handleSelect = (result: SearchResult) => {
    onClose();
    flyToNode(result.id);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content
          className="fixed top-1/4 left-1/2 -translate-x-1/2 bg-white rounded-lg shadow-xl w-[600px] max-h-[400px] overflow-hidden"
          aria-label="Search code elements"
          onKeyDown={handleKeyDown}
        >
          <SearchInput
            value={query}
            onChange={setQuery}
            autoFocus
          />
          <SearchResults
            results={results}
            loading={loading}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
            query={query}
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Fuzzy Search Implementation

**Option 1: Fuse.js (Recommended)**

```typescript
// useSearch.ts
import Fuse from 'fuse.js';
import { useMemo, useState, useEffect } from 'react';
import { useDebouncedValue } from './useDebouncedValue';
import { useGraphStore } from '../stores/graphStore';

export function useSearch(query: string) {
  const nodes = useGraphStore((state) => state.nodes);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  // Debounce query by 100ms
  const debouncedQuery = useDebouncedValue(query, 100);

  // Build search index
  const fuse = useMemo(() => {
    const searchData = nodes.map(node => ({
      id: node.id,
      label: node.label,
      type: node.type,
      filePath: node.metadata?.filePath || '',
    }));

    return new Fuse(searchData, {
      keys: ['label', 'filePath'],
      threshold: 0.3, // Fuzzy matching threshold
      includeScore: true,
    });
  }, [nodes]);

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([]);
      return;
    }

    setLoading(true);
    const searchResults = fuse.search(debouncedQuery, { limit: 10 });

    // Rank results: File > Class > Function > Variable
    const ranked = searchResults
      .map(r => ({ ...r.item, score: r.score }))
      .sort((a, b) => {
        const typeOrder = { File: 0, Class: 1, Function: 2, Variable: 3 };
        return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
      });

    setResults(ranked);
    setLoading(false);
  }, [debouncedQuery, fuse]);

  return { results, loading };
}
```

**Option 2: Simple substring match (faster, less fuzzy)**

```typescript
export function useSearch(query: string) {
  const nodes = useGraphStore((state) => state.nodes);
  const debouncedQuery = useDebouncedValue(query.toLowerCase(), 100);

  const results = useMemo(() => {
    if (!debouncedQuery) return [];

    return nodes
      .filter(node =>
        node.label.toLowerCase().includes(debouncedQuery) ||
        node.metadata?.filePath?.toLowerCase().includes(debouncedQuery)
      )
      .slice(0, 10);
  }, [debouncedQuery, nodes]);

  return { results, loading: false };
}
```

**Recommendation:** Use Fuse.js for better fuzzy matching UX

### Camera Flight Integration

```typescript
// useCameraFlight.ts
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';

export function useCameraFlight() {
  const { camera } = useThree();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const flyToNode = (nodeId: string) => {
    const node = findNodeById(nodeId);
    if (!node) return;

    const targetPosition = {
      x: node.position.x,
      y: node.position.y + 5, // Slight offset above node
      z: node.position.z + 10,
    };

    if (prefersReducedMotion) {
      // Instant teleport (no animation)
      camera.position.set(targetPosition.x, targetPosition.y, targetPosition.z);
      camera.lookAt(node.position.x, node.position.y, node.position.z);
    } else {
      // Smooth 1.5s eased animation
      gsap.to(camera.position, {
        x: targetPosition.x,
        y: targetPosition.y,
        z: targetPosition.z,
        duration: 1.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.lookAt(node.position.x, node.position.y, node.position.z);
        },
        onComplete: () => {
          // On arrival: highlight node, pulse edges, show tooltip
          highlightNode(nodeId);
          pulseEdges(nodeId);
          showTooltip(nodeId);
          updateBreadcrumb(nodeId);
        },
      });
    }
  };

  return { flyToNode };
}
```

### Type Icons

```typescript
const typeIcons = {
  File: '📄',
  Class: '🔷',
  Function: 'ƒ',
  Method: 'ƒ',
  Variable: '𝑥',
  Interface: '⬡',
};
```

### Files Involved

**UI Package (create):**
- `packages/ui/src/features/search/SearchModal.tsx` - Main modal component
- `packages/ui/src/features/search/SearchInput.tsx` - Input field with icon
- `packages/ui/src/features/search/SearchResults.tsx` - Results list
- `packages/ui/src/features/search/SearchResultItem.tsx` - Individual result
- `packages/ui/src/features/search/useSearch.ts` - Fuzzy search hook
- `packages/ui/src/features/search/useSearchShortcut.ts` - ⌘K listener
- `packages/ui/src/features/search/useCameraFlight.ts` - Camera animation
- `packages/ui/src/features/search/types.ts` - TypeScript types

**UI Package (update):**
- `packages/ui/src/pages/WorkspacePage.tsx` - Add SearchModal
- `packages/ui/src/features/canvas/Canvas3D.tsx` - Integrate camera flight

**Dependencies:**
- `fuse.js` - Fuzzy search library
- `gsap` - Camera animation (already installed)

### Dependencies

- **Depends On:** Story 5-8 (navigation feature exists)
- **Depends On:** Story 5-4 (Canvas3D for camera control)
- **Integrates With:** Story 7-3 (camera flight animations)
- **Integrates With:** Story 7-4 (keyboard shortcuts)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 8-10 hours
- **Priority:** CRITICAL - Highest user value story in Epic 7

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-24**: Story created from Epic 7 planning
  - Based on UX Design Specification "Search-First Command Center"
  - Core interaction: "Search → Fly → Understand in <5 seconds"
  - Fuzzy autocomplete with <100ms response target
  - ⌘K keyboard shortcut as primary entry point

**Status:** not-started
**Created:** 2026-01-24
**Last Updated:** 2026-01-24
