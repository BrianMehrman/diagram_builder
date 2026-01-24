# Story 7-8: WCAG AA Compliance (Accessibility)

## Story

**ID:** 7-8
**Key:** 7-8-wcag-aa-compliance-accessibility
**Title:** Implement WCAG AA Accessibility Compliance
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 4 (Accessibility & Polish)
**Priority:** HIGH - Legal Compliance & Inclusive Design

**Description:**

Ensure complete WCAG AA compliance across all UI components: keyboard navigation, ARIA labels, screen reader support, color contrast, focus indicators, and `prefers-reduced-motion` support.

**Context:**

From UX Design Specification (Section 8: Responsive Design & Accessibility):
- **Target:** WCAG AA compliance (4.5:1 contrast minimum)
- **Visual:** All text meets contrast ratios (Primary: 18.5:1, Body: 11.2:1, Tertiary: 5.8:1)
- **Keyboard:** All core actions accessible via keyboard
- **Screen Reader:** ARIA labels throughout, semantic HTML
- **Motion:** `prefers-reduced-motion` disables all animations

---

## Acceptance Criteria

- **AC-1:** Color contrast compliance (WCAG AA)
  - All text meets 4.5:1 minimum contrast ratio
  - Primary text: 18.5:1 (AAA ✅)
  - Body text: 11.2:1 (AAA ✅)
  - Tertiary text: 5.8:1 (AA ✅)
  - Automated testing with axe DevTools

- **AC-2:** Keyboard navigation
  - All interactive elements keyboard-accessible (Tab, Enter, Space)
  - Logical tab order (HUD → Search → MiniMap → Panels)
  - Skip links ("Skip to canvas")
  - No keyboard traps (ESC closes all modals)
  - Visible focus indicators (2px blue outline)

- **AC-3:** Screen reader support
  - All images have alt text
  - All buttons have aria-label or visible text
  - Form inputs have associated labels
  - Live regions for dynamic content (`aria-live="polite"`)
  - Semantic HTML (`<nav>`, `<main>`, `<aside>`, `<button>`)

- **AC-4:** Reduced motion support
  - Detect `prefers-reduced-motion` media query
  - Disable camera flight animations (instant teleport)
  - Disable toast fade animations (instant show)
  - Disable panel slide animations (instant show/hide)

- **AC-5:** Touch target sizes
  - All interactive elements minimum 44x44px (WCAG AA)
  - Buttons: 48x48px
  - Search results: 48px height
  - Icon buttons: 40x40px minimum

- **AC-6:** Automated testing
  - Lighthouse accessibility score ≥95
  - axe DevTools 0 violations
  - Pa11y CI checks pass

---

## Tasks/Subtasks

### Task 1: Color contrast audit
- [ ] Run axe DevTools on all pages
- [ ] Fix any contrast violations
- [ ] Verify all text meets 4.5:1 minimum
- [ ] Document color combinations tested

### Task 2: Keyboard navigation implementation
- [ ] Add skip links ("Skip to canvas")
- [ ] Verify tab order (test with Tab key only)
- [ ] Ensure all modals closeable with ESC
- [ ] Add visible focus indicators (2px blue outline)
- [ ] Test complete user journey with keyboard only

### Task 3: ARIA labels and semantic HTML
- [ ] Audit all buttons for aria-label
- [ ] Audit all images for alt text
- [ ] Add aria-live regions for dynamic content
- [ ] Use semantic HTML (`<nav>`, `<main>`, `<aside>`)
- [ ] Add aria-expanded to collapsible elements

### Task 4: Reduced motion support
- [ ] Add `prefers-reduced-motion` media query detection
- [ ] Disable camera flights (instant teleport)
- [ ] Disable toast animations
- [ ] Disable panel transitions
- [ ] Test with browser setting enabled

### Task 5: Touch target size audit
- [ ] Verify all buttons meet 44x44px minimum
- [ ] Increase size of small touch targets
- [ ] Add padding to increase hit area
- [ ] Test on touchscreen laptop

### Task 6: Automated testing setup
- [ ] Add Lighthouse CI to GitHub Actions
- [ ] Add axe-core to Vitest tests
- [ ] Add Pa11y to CI pipeline
- [ ] Set minimum accessibility score threshold (≥95)

### Task 7: Manual testing
- [ ] Screen reader testing (VoiceOver, NVDA)
- [ ] Keyboard-only testing (complete journey)
- [ ] Color blindness simulation (Chrome DevTools)
- [ ] 200% zoom testing (no horizontal scroll)

---

## Dev Notes

### Reduced Motion Detection

```typescript
// useReducedMotion.ts
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = () => setPrefersReducedMotion(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// Usage in camera flight
const prefersReducedMotion = useReducedMotion();

function flyToNode(nodeId: string) {
  if (prefersReducedMotion) {
    // Instant teleport
    camera.position.set(target.x, target.y, target.z);
  } else {
    // Smooth animation
    gsap.to(camera.position, { ...target, duration: 1.5 });
  }
}
```

### Focus Indicators

```css
/* Global focus styles */
*:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove default focus for mouse users */
*:focus:not(:focus-visible) {
  outline: none;
}
```

### Skip Links

```tsx
// SkipLinks.tsx
export function SkipLinks() {
  return (
    <div className="skip-links">
      <a href="#main-canvas" className="sr-only focus:not-sr-only">
        Skip to canvas
      </a>
      <a href="#search" className="sr-only focus:not-sr-only">
        Skip to search
      </a>
    </div>
  );
}
```

### Automated Testing

```typescript
// vitest.config.ts - Add axe-core
import { defineConfig } from 'vitest/config';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Component test example
it('should have no accessibility violations', async () => {
  const { container } = render(<SearchModal open />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 6-8 hours
- **Priority:** HIGH - Legal compliance

**Status:** not-started
**Created:** 2026-01-24
