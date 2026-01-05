# Story 6-6: Codebase Management UI

## Story

**ID:** 6-6
**Key:** 6-6-codebase-management-ui
**Title:** Build UI for Viewing, Managing, and Deleting Codebases
**Epic:** Epic 6 - Fix Parser & Complete Core Integration
**Phase:** Implementation
**Priority:** MEDIUM - User Experience Enhancement

**Description:**

Build comprehensive codebase management UI that allows users to view all imported codebases, see their status, delete codebases, and retry failed imports.

**Context:**

From brainstorming session Constraint Mapping, Stage 1 (User Upload) identified missing features:
- "Allow deletions of codebase from visualization"
- "No codebase deletion API endpoint"
- "No way to remove a codebase from workspace"
- "No existing UI for codebase management"

Current limitations:
- Users can upload codebases but not delete them
- No visibility into all codebases in a workspace
- No way to retry failed imports
- No way to see parsing status of multiple codebases
- Cannot switch between multiple imported codebases

This story completes the codebase management user experience.

---

## Acceptance Criteria

- **AC-1:** Codebase list view implemented
  - Display all codebases in current workspace
  - Show codebase name, source (URL or path), status
  - Show upload date/time
  - Show file count and node count (if available)
  - Visual indicators for status (pending, processing, completed, error)

- **AC-2:** Codebase deletion implemented
  - "Delete" button on each codebase
  - Confirmation dialog before deletion
  - API endpoint: `DELETE /api/workspaces/:workspaceId/codebases/:codebaseId`
  - Remove from Neo4j (codebase node, repository node, all graph data)
  - Clean up temporary files
  - Update UI after deletion

- **AC-3:** Retry failed imports
  - "Retry" button for codebases with status = 'error'
  - Re-trigger parsing for failed codebase
  - Reset status to 'pending'
  - Show new parsing progress

- **AC-4:** Switch between codebases
  - Click codebase to load its graph in canvas
  - Highlight active/selected codebase
  - Update canvas when codebase changes
  - Preserve camera position per codebase (optional)

- **AC-5:** Codebase details view (optional)
  - Expandable details for each codebase
  - Show parsing metadata (files found, parse time, errors)
  - Show graph statistics (nodes by type, edges by type)
  - Show languages detected
  - Link to view in canvas

---

## Tasks/Subtasks

### Task 1: Design codebase list UI
- [ ] Design layout (sidebar, panel, or modal)
- [ ] Design codebase list item (name, status, actions)
- [ ] Design status indicators (icons, colors)
- [ ] Design delete confirmation dialog
- [ ] Design empty state (no codebases uploaded)
- [ ] Create mockups/wireframes

### Task 2: Build CodebaseList component
- [ ] Create CodebaseList.tsx component
- [ ] Fetch codebases from API
- [ ] Display codebase list with status
- [ ] Add loading state while fetching
- [ ] Add error state if fetch fails
- [ ] Style with Tailwind CSS

### Task 3: Build CodebaseListItem component
- [ ] Create CodebaseListItem.tsx component
- [ ] Display codebase name, source, status
- [ ] Add status indicator (icon + color)
- [ ] Add "Delete" button
- [ ] Add "Retry" button (only for error status)
- [ ] Add click handler to select codebase
- [ ] Highlight selected codebase

### Task 4: Implement delete functionality
- [ ] Create DELETE API endpoint
- [ ] Delete Codebase node from Neo4j
- [ ] Delete linked Repository node (if exists)
- [ ] Delete all graph data (nodes, edges)
- [ ] Clean up temporary files (if retention policy)
- [ ] Return success/error response
- [ ] Update UI after successful deletion
- [ ] Show confirmation dialog before delete

### Task 5: Implement retry functionality
- [ ] Create PATCH endpoint to reset codebase status
- [ ] Reset status to 'pending'
- [ ] Re-trigger parser import
- [ ] Update UI to show parsing progress
- [ ] Handle retry errors gracefully

### Task 6: Implement codebase switching
- [ ] Add click handler to load selected codebase
- [ ] Fetch graph data for selected codebase
- [ ] Update Canvas3D with new graph
- [ ] Update URL with codebaseId (optional)
- [ ] Preserve camera position per codebase (optional)

### Task 7: Add codebase statistics (optional)
- [ ] Show file count
- [ ] Show node count
- [ ] Show edge count
- [ ] Show languages detected
- [ ] Show parse time
- [ ] Expand/collapse details section

### Task 8: Integration and testing
- [ ] Integrate CodebaseList into WorkspacePage
- [ ] Test delete flow (confirmation → API → update)
- [ ] Test retry flow (button → re-parse → success)
- [ ] Test switching between codebases
- [ ] Test empty state (no codebases)
- [ ] Test error states (API failures)

---

## Dev Notes

### UI Layout Options

**Option 1: Sidebar (Recommended)**
```
┌─────────────┬─────────────────────────┐
│ Codebases   │   Canvas 3D             │
│ ────────    │                         │
│ ☑ Project A │                         │
│   Project B │      [3D Graph]         │
│ ⚠ Project C │                         │
│             │                         │
│ [+ Import]  │                         │
└─────────────┴─────────────────────────┘
```

**Pros:**
- Always visible
- Easy to switch between codebases
- Clear workspace organization

**Cons:**
- Takes horizontal space
- May need collapse/expand

**Option 2: Top Panel**
```
┌────────────────────────────────────────┐
│ [☑ Project A] [Project B] [⚠ Project C] │
├────────────────────────────────────────┤
│                                        │
│           Canvas 3D                    │
│          [3D Graph]                    │
│                                        │
└────────────────────────────────────────┘
```

**Pros:**
- Compact
- Familiar tab-like interface

**Cons:**
- Limited space for many codebases
- Less room for status details

**Option 3: Modal/Drawer**
```
┌────────────────────────────────────────┐
│ [≡ Manage Codebases]    Canvas 3D      │
│                                        │
│           [3D Graph]                   │
│                                        │
└────────────────────────────────────────┘

Click button → Opens modal with codebase list
```

**Pros:**
- Doesn't take permanent space
- Can show more details

**Cons:**
- Hidden until opened
- Extra click to manage

**Recommendation:** Option 1 (Sidebar) for best UX

### Status Indicators

```typescript
const statusConfig = {
  none: {
    icon: '○',
    color: 'text-gray-400',
    label: 'Not uploaded',
  },
  pending: {
    icon: '◔',
    color: 'text-blue-400',
    label: 'Pending',
  },
  processing: {
    icon: '◑',
    color: 'text-yellow-400 animate-spin',
    label: 'Parsing...',
  },
  completed: {
    icon: '●',
    color: 'text-green-500',
    label: 'Complete',
  },
  error: {
    icon: '⚠',
    color: 'text-red-500',
    label: 'Failed',
  },
};
```

### API Endpoints to Implement

**Delete Codebase:**
```typescript
// DELETE /api/workspaces/:workspaceId/codebases/:codebaseId
async function deleteCodebase(workspaceId: string, codebaseId: string) {
  // 1. Get codebase with repositoryId
  const codebase = await neo4j.findCodebase(codebaseId);

  // 2. Delete all graph data if repository exists
  if (codebase.repositoryId) {
    await neo4j.deleteRepository(codebase.repositoryId);
  }

  // 3. Delete codebase node
  await neo4j.deleteCodebase(codebaseId);

  // 4. Clean up temp files (if any)
  await fileManager.cleanupCodebase(codebaseId);

  return { success: true };
}
```

**Retry Import:**
```typescript
// PATCH /api/workspaces/:workspaceId/codebases/:codebaseId/retry
async function retryCodebaseImport(workspaceId: string, codebaseId: string) {
  // 1. Get codebase
  const codebase = await neo4j.findCodebase(codebaseId);

  // 2. Reset status
  await neo4j.updateCodebase(codebaseId, {
    status: 'pending',
    repositoryId: null,
    errorMessage: null,
  });

  // 3. Re-trigger parser
  await triggerParserImport(codebaseId, codebase.input);

  return { success: true, status: 'pending' };
}
```

### Component Architecture

```typescript
// CodebaseList.tsx
export function CodebaseList({ workspaceId }: { workspaceId: string }) {
  const [codebases, setCodebases] = useState<Codebase[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    loadCodebases();
  }, [workspaceId]);

  const handleDelete = async (codebaseId: string) => {
    const confirmed = window.confirm('Delete this codebase?');
    if (!confirmed) return;

    await api.deleteCodebase(workspaceId, codebaseId);
    await loadCodebases(); // Refresh list
  };

  const handleRetry = async (codebaseId: string) => {
    await api.retryCodebaseImport(workspaceId, codebaseId);
    await loadCodebases(); // Refresh list
  };

  const handleSelect = (codebaseId: string) => {
    setSelectedId(codebaseId);
    onCodebaseSelected(codebaseId); // Load graph in canvas
  };

  return (
    <div className="codebase-list">
      {codebases.map(cb => (
        <CodebaseListItem
          key={cb.id}
          codebase={cb}
          selected={cb.id === selectedId}
          onSelect={() => handleSelect(cb.id)}
          onDelete={() => handleDelete(cb.id)}
          onRetry={() => handleRetry(cb.id)}
        />
      ))}
    </div>
  );
}

// CodebaseListItem.tsx
export function CodebaseListItem({
  codebase,
  selected,
  onSelect,
  onDelete,
  onRetry,
}: CodebaseListItemProps) {
  const status = statusConfig[codebase.status];

  return (
    <div
      className={`codebase-item ${selected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      <span className={status.color}>{status.icon}</span>
      <div className="codebase-info">
        <h4>{codebase.name || codebase.input.path}</h4>
        <p>{status.label}</p>
      </div>
      <div className="codebase-actions">
        {codebase.status === 'error' && (
          <button onClick={(e) => { e.stopPropagation(); onRetry(); }}>
            Retry
          </button>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}>
          Delete
        </button>
      </div>
    </div>
  );
}
```

### Files Involved

**UI Package:**
- `packages/ui/src/features/workspace/CodebaseList.tsx` (create)
- `packages/ui/src/features/workspace/CodebaseListItem.tsx` (create)
- `packages/ui/src/features/workspace/DeleteCodebaseDialog.tsx` (create)
- `packages/ui/src/features/workspace/WorkspacePage.tsx` (update - add sidebar)
- `packages/ui/src/hooks/useCodebases.ts` (create - codebase fetching hook)
- `packages/ui/src/api/codebases.ts` (add delete, retry methods)

**API Package:**
- `packages/api/src/routes/codebases.ts` (add DELETE, PATCH endpoints)
- `packages/api/src/services/codebase-service.ts` (add delete, retry functions)

**Styling:**
- Add Tailwind classes for sidebar layout
- Add status indicator animations
- Add hover/selected states

### Dependencies

- **Depends On:** Story 6-1 (parser must work for codebases to exist)
- **Enhances:** Story 6-3 (better UX for managing multiple codebases)
- **Enables:** Multi-codebase workflows

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 8-10 hours
- **Priority:** MEDIUM - User experience enhancement

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-04**: Story created from Epic 6 planning
  - Brainstorming session identified missing codebase management features
  - Constraint mapping revealed no deletion or retry capabilities
  - Sidebar layout recommended for best UX
  - Multi-codebase switching enables better workflows

**Status:** backlog
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
