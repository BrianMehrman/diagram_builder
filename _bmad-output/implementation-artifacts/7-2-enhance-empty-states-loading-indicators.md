# Story 7-2: Enhance Empty States and Loading Indicators

## Story

**ID:** 7-2
**Key:** 7-2-enhance-empty-states-loading-indicators
**Title:** Implement Comprehensive Empty States and Loading Feedback
**Epic:** Epic 7 - "Search-First Command Center" UX Implementation
**Phase:** Implementation - Phase 1 (Core Journey)
**Priority:** HIGH - User Onboarding & Feedback

**Description:**

Implement comprehensive empty states and loading indicators that guide users through the core journey (Import → Explore) with clear CTAs, progress feedback, and success/error notifications.

**Context:**

From UX Design Specification:
- **Empty State Pattern:** "No Workspace (First Visit)" - large icon, headline, primary button, example screenshot
- **Loading State Pattern:** Import progress with 0-100% bar, status text, estimated time
- **Feedback Pattern:** Success toasts (green, 3-5s), error toasts (red, actionable messages)

Current state:
- Story 6-3 implemented basic empty state, parsing indicators, success/error notifications
- Needs enhancement with UX spec designs (better copy, visuals, CTAs)
- Needs progress bars, spinners, loading states per UX patterns

This story polishes the onboarding and feedback experience.

---

## Acceptance Criteria

- **AC-1:** Empty state for new workspace
  - Large icon (upload or 3D cube illustration)
  - Headline: "Start exploring your codebase in 3D"
  - Subheading: "Import a repository to visualize its architecture"
  - Primary button: "Import Codebase"
  - Example screenshot showing 3D visualization
  - Inviting tone (not intimidating)

- **AC-2:** Import progress indicator
  - Modal with progress bar (0-100%)
  - Status text updates: "Cloning repository...", "Parsing 342 files...", "Building graph..."
  - Estimated time remaining (if predictable)
  - Cancel button (for operations >30s)
  - Updates every 2 seconds
  - On complete: modal closes, camera flies to root, success toast

- **AC-3:** Loading spinners for async operations
  - Spinner overlay on canvas for graph loading (>500ms)
  - 3 sizes: 20px (inline), 40px (modal), 60px (canvas overlay)
  - Blue accent color (#3b82f6)
  - "Loading graph..." text below spinner
  - Prevents interaction while loading

- **AC-4:** Success notifications (Toast)
  - Green toast top-right corner
  - Checkmark icon
  - Message examples: "Viewpoint link copied!", "Loaded 1,248 nodes"
  - Auto-dismiss after 3-5 seconds
  - Fade in/out animation
  - `role="status"` with `aria-live="polite"`

- **AC-5:** Error notifications (Toast)
  - Red toast top-right corner
  - Warning icon
  - Format: "[What happened] [Why] [What to do]"
  - Example: "Repository not found. Check the URL and try again."
  - Persists until dismissed (X button)
  - Preserve user input on error
  - Actionable recovery steps

---

## Tasks/Subtasks

### Task 1: Design and implement empty state
- [ ] Create EmptyState.tsx component
- [ ] Add 3D cube or upload illustration (SVG or icon library)
- [ ] Style headline (30px, bold) and subheading (16px, gray)
- [ ] Add "Import Codebase" primary button (blue, prominent)
- [ ] Add example screenshot (optional - placeholder for now)
- [ ] Style with Tailwind CSS
- [ ] Test on empty workspace

### Task 2: Build progress indicator component
- [ ] Create ImportProgress.tsx component
- [ ] Use Radix Dialog for modal
- [ ] Add progress bar (0-100%) with animated fill
- [ ] Display status text (dynamic based on stage)
- [ ] Calculate estimated time remaining (optional)
- [ ] Add cancel button (triggers abort signal)
- [ ] Update progress every 2s from API
- [ ] Close modal on completion
- [ ] Trigger camera flight on complete

### Task 3: Implement loading spinners
- [ ] Create Spinner.tsx component (3 sizes: sm/md/lg)
- [ ] Use CSS animation for rotation
- [ ] Blue accent color (#3b82f6)
- [ ] Canvas overlay spinner (40px, center, "Loading graph...")
- [ ] Modal spinner (20px inline)
- [ ] Show spinner for operations >500ms
- [ ] Prevent interaction while loading

### Task 4: Build Toast notification system
- [ ] Install @radix-ui/react-toast
- [ ] Create Toast.tsx component
- [ ] Success variant (green, checkmark icon)
- [ ] Error variant (red, warning icon, dismiss button)
- [ ] Position: top-right corner
- [ ] Auto-dismiss success toasts (3-5s)
- [ ] Manual dismiss for error toasts
- [ ] Fade in/out animations
- [ ] Stack multiple toasts vertically

### Task 5: Integrate toasts with API calls
- [ ] Show success toast on codebase import complete
- [ ] Show error toast on API failures
- [ ] Show success toast on viewpoint copy
- [ ] Show error toast on network errors
- [ ] Preserve user input on error toasts
- [ ] Include actionable error messages

### Task 6: Add progress tracking to API
- [ ] Update codebase import API to return progress
- [ ] Track stages: cloning (0-30%), parsing (30-70%), graph building (70-100%)
- [ ] Emit progress events via WebSocket or polling
- [ ] Calculate estimated time remaining (optional)
- [ ] Support cancellation (abort signal)

### Task 7: Testing
- [ ] Unit tests for EmptyState, Spinner, Toast
- [ ] Integration test: import flow with progress updates
- [ ] E2E test: empty state → import → progress → success toast
- [ ] Test error handling (network failure, invalid URL)
- [ ] Accessibility audit (screen reader, keyboard nav)
- [ ] Test `prefers-reduced-motion` (disable animations)

---

## Dev Notes

### Empty State Design

```typescript
// EmptyState.tsx
export function EmptyState({ onImportClick }: { onImportClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 text-white">
      {/* Icon */}
      <div className="text-6xl mb-4">📦</div>

      {/* Headline */}
      <h1 className="text-3xl font-bold mb-2">
        Start exploring your codebase in 3D
      </h1>

      {/* Subheading */}
      <p className="text-gray-400 mb-8 text-center max-w-md">
        Import a repository to visualize its architecture, understand dependencies, and navigate code spatially.
      </p>

      {/* CTA Button */}
      <button
        onClick={onImportClick}
        className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
      >
        Import Codebase
      </button>

      {/* Optional: Example screenshot */}
      {/* <img src="/example-viz.png" alt="Example visualization" className="mt-12 rounded-lg shadow-xl max-w-2xl" /> */}
    </div>
  );
}
```

### Progress Indicator

```typescript
// ImportProgress.tsx
import * as Dialog from '@radix-ui/react-dialog';

export function ImportProgress({ progress, status, onCancel }: ImportProgressProps) {
  return (
    <Dialog.Root open={progress < 100}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/4 left-1/2 -translate-x-1/2 bg-white rounded-lg p-6 w-[500px]">
          <Dialog.Title className="text-xl font-semibold mb-4">
            Importing Codebase
          </Dialog.Title>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              />
            </div>
          </div>

          {/* Status Text */}
          <p className="text-gray-600 mb-4">{status}</p>

          {/* Estimated Time (optional) */}
          {/* <p className="text-sm text-gray-400">Estimated time: 2 minutes</p> */}

          {/* Cancel Button */}
          <button
            onClick={onCancel}
            className="text-gray-600 hover:text-gray-800 text-sm"
          >
            Cancel
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### Spinner Component

```typescript
// Spinner.tsx
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-10 h-10',
    lg: 'w-15 h-15',
  };

  return (
    <div className={`${sizeClasses[size]} border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin`} />
  );
}

// Canvas overlay usage
export function CanvasLoadingOverlay() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/50 z-50">
      <Spinner size="lg" />
      <p className="mt-4 text-white">Loading graph...</p>
    </div>
  );
}
```

### Toast Notifications

```typescript
// Toast.tsx
import * as ToastPrimitive from '@radix-ui/react-toast';

export function Toast({ type, message, onDismiss }: ToastProps) {
  const isError = type === 'error';

  return (
    <ToastPrimitive.Root
      className={`
        ${isError ? 'bg-red-500' : 'bg-green-500'}
        text-white px-4 py-3 rounded-lg shadow-lg
        flex items-center gap-3
        animate-slideIn
      `}
      duration={isError ? Infinity : 5000}
    >
      {/* Icon */}
      <ToastPrimitive.Description className="text-lg">
        {isError ? '⚠' : '✓'}
      </ToastPrimitive.Description>

      {/* Message */}
      <ToastPrimitive.Description className="flex-1">
        {message}
      </ToastPrimitive.Description>

      {/* Dismiss Button (error only) */}
      {isError && (
        <ToastPrimitive.Close
          onClick={onDismiss}
          className="text-white/80 hover:text-white"
        >
          ✕
        </ToastPrimitive.Close>
      )}
    </ToastPrimitive.Root>
  );
}

// Usage
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToasts(prev => [...prev, { id: Date.now(), type, message }]);
  };

  return { toasts, showToast };
}
```

### Progress Tracking API

```typescript
// API endpoint for progress updates
GET /api/workspaces/:workspaceId/codebases/:codebaseId/progress

// Response
{
  "progress": 45,
  "status": "Parsing 342 files...",
  "stage": "parsing",
  "estimatedTimeRemaining": 120000 // ms
}

// Frontend polling
useEffect(() => {
  if (status === 'processing') {
    const interval = setInterval(async () => {
      const progress = await api.getCodebaseProgress(workspaceId, codebaseId);
      setProgress(progress.progress);
      setStatusText(progress.status);
    }, 2000);

    return () => clearInterval(interval);
  }
}, [status]);
```

### Files Involved

**UI Package (create):**
- `packages/ui/src/features/canvas/EmptyState.tsx` - Empty state component (enhance existing)
- `packages/ui/src/features/import/ImportProgress.tsx` - Progress modal
- `packages/ui/src/components/Spinner.tsx` - Loading spinner
- `packages/ui/src/components/Toast.tsx` - Toast notification
- `packages/ui/src/hooks/useToast.ts` - Toast state management

**UI Package (update):**
- `packages/ui/src/pages/WorkspacePage.tsx` - Add empty state, progress, toasts
- `packages/ui/src/features/workspace/ImportCodebaseButton.tsx` - Integrate progress

**API Package:**
- `packages/api/src/routes/codebases.ts` - Add progress endpoint (optional)

### Dependencies

- **Depends On:** Story 6-3 (basic feedback states exist)
- **Enhances:** Story 5-15 (codebase import UI)
- **Enables:** Better onboarding experience

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours
- **Priority:** HIGH - Core onboarding experience

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-24**: Story created from Epic 7 planning
  - Based on UX Design Specification feedback patterns
  - Enhances existing Story 6-3 implementations
  - Adds polish and UX spec compliance

**Status:** not-started
**Created:** 2026-01-24
**Last Updated:** 2026-01-24
