# Improve AI Workflows, Memory & CLAUDE.md Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Apply insights from the Claude Code usage report to reduce recurring friction — wrong root cause diagnoses, regressions, missed sprint tracking, and test breakage from stale selectors.

**Architecture:** Four targeted areas: (1) CLAUDE.md gets new sections for debugging, R3F safety, and a stricter Definition of Done; (2) project hooks gain a type-check on file edits; (3) a `/story` slash command encodes the full story-execution workflow; (4) MEMORY.md is updated with newly confirmed patterns.

**Tech Stack:** Markdown, JSON (Claude settings), bash (hooks), existing Vitest/TypeScript toolchain

---

## Task 1: Add Debugging Guidelines section to CLAUDE.md

**Files:**
- Modify: `/Users/brianmehrman/projects/diagram_builder/CLAUDE.md` (after `## 🧠 AI Behavior Guidelines`)

**Step 1: Add the section**

Insert the following block immediately after the `## 🧠 AI Behavior Guidelines` section (before `---` / `## 🔧 Development Commands`):

```markdown
---

## 🔍 Debugging Guidelines

### Root-Cause Before Fixing (MANDATORY)

Before writing ANY fix, trace the bug through **all layers**:

1. **Frontend** — component state, props, event handlers
2. **Hooks/Store** — Zustand selectors, actions, derived state
3. **API** — request/response, middleware, validation
4. **Cache** — Redis TTL, invalidation logic, key construction
5. **Database** — Neo4j query, relationship traversal, label/property naming

Only apply a fix after identifying **which layer owns the defect**.

❌ WRONG: Fix the first symptom you find.
✅ RIGHT: List every layer the data flows through, then fix the owning layer.

**Prompt yourself before coding:**
> "Have I verified the fix addresses the root cause, not just a surface symptom?"

### Multi-Layer Bug Checklist

- [ ] I know which layer the defect lives in (not just where I first see it)
- [ ] I've checked whether the fix could affect other callers of the same code
- [ ] I've run the test suite after applying the fix to detect regressions
```

**Step 2: Verify**

Read the file and confirm the section appears between `## 🧠 AI Behavior Guidelines` and `## 🔧 Development Commands`.

---

## Task 2: Add R3F / 3D Visualization Guidelines to CLAUDE.md

**Files:**
- Modify: `/Users/brianmehrman/projects/diagram_builder/CLAUDE.md` (after the new Debugging section)

**Step 1: Add the section**

Insert immediately after the Debugging Guidelines section (before `## 🔧 Development Commands`):

```markdown
---

## 🏙️ R3F / 3D Visualization Guidelines

### Verify Data Before Using It

When implementing any visual feature that reads node/edge metadata:

1. **Confirm the field is populated** — search the parser and API to verify the property is actually set (e.g., `metadata.methods` vs `node.methodCount`).
2. **Log a sample** — before building on a field, add a temporary `console.log(node)` to verify shape in dev.
3. **Guard all optional paths** — if a field can be undefined, add a null check. Do not assume non-null.

```tsx
// ❌ WRONG — methodCount may never be populated
const floors = node.methodCount ?? 1;

// ✅ RIGHT — confirmed field from parser output
const floors = node.metadata?.methods?.length ?? 1;
```

### vertexColors Safety Rule

- **NEVER enable `vertexColors` on a geometry** unless you have confirmed the geometry already has a `color` attribute.
- Enabling `vertexColors` without color attributes silently overwrites the material color, losing district/directory coloring.

```tsx
// ❌ WRONG
<meshStandardMaterial vertexColors />

// ✅ RIGHT — only when geometry has .attributes.color
<meshStandardMaterial vertexColors={geometry.attributes.color != null} />
```

### R3F Line Rendering

- Do NOT use `<line>` JSX — it conflicts with SVG line elements in React.
- Use `<primitive object={new THREE.Line(geometry, material)} />` instead.
```

**Step 2: Verify**

Read the file and confirm the section is present and correctly placed.

---

## Task 3: Strengthen the Definition of Done in CLAUDE.md

**Files:**
- Modify: `/Users/brianmehrman/projects/diagram_builder/CLAUDE.md` (the `### When Completing Work` block)

**Step 1: Replace the existing "When Completing Work" content**

Find:
```markdown
### When Completing Work

> **CRITICAL:** You MUST update `sprint-status.yaml` every time you finish a story. This is non-optional.

1. **ALWAYS update `sprint-status.yaml`** — mark the story as `review` with a completion date comment (e.g., `review  # Description - COMPLETE (2026-02-11)`)
2. Mark tasks as `[x]` in `TASKS.md`
3. Update story file with completion notes
4. Document new/modified files in story file
```

Replace with:
```markdown
### When Completing Work

> **CRITICAL: Definition of Done — ALL items must be checked before a story is considered complete.**

- [ ] All acceptance criteria implemented
- [ ] `npm test` passes (zero new failures)
- [ ] `npm run type-check` passes (zero TypeScript errors)
- [ ] **`sprint-status.yaml` updated** — mark story as `review  # Description - COMPLETE (YYYY-MM-DD)`
- [ ] Tasks marked `[x]` in `TASKS.md`
- [ ] Story file updated with completion notes and file list

**NEVER claim a story is done without completing every item above.**
If `sprint-status.yaml` is not updated, the story is NOT done.
```

**Step 2: Verify**

Read the file and confirm the checklist format is in place.

---

## Task 4: Add test-selector update rule to the Testing section in CLAUDE.md

**Files:**
- Modify: `/Users/brianmehrman/projects/diagram_builder/CLAUDE.md` (the `### After Code Changes` block)

**Step 1: Expand the "After Code Changes" section**

Find:
```markdown
### After Code Changes

- ✅ Run tests: `npm test`
- ✅ Check types: `npm run type-check`
- ✅ Lint: `npm run lint`
- ✅ Update tests if behavior changed
```

Replace with:
```markdown
### After Code Changes

- ✅ Run tests: `npm test`
- ✅ Check types: `npm run type-check`
- ✅ Lint: `npm run lint`
- ✅ Update tests if behavior changed

### ARIA / Test Selector Rule

When you change **any** of these on a component:
- `title` attribute
- `aria-label` / `aria-labelledby`
- `role`
- `data-testid`
- Text content used in `getByText`

You MUST search for ALL matching test queries across the entire test suite:

```bash
# Find all tests that reference the old value
grep -r "getByTitle\|getByRole\|getByLabelText\|getByText\|data-testid" packages/ui/src --include="*.test.*" -l
```

Update every stale query before committing. Stale queries cause silent failures.
```

**Step 2: Verify**

Read the file and confirm the rule appears under Testing.

---

## Task 5: Add type-check hook to project settings.json

**Files:**
- Modify: `/Users/brianmehrman/projects/diagram_builder/.claude/settings.json`

**Step 1: Read current settings to understand structure**

Current content:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "TaskCompleted",
        "hooks": [
          {
            "type": "command",
            "command": "npm run test:e2e"
          }
        ]
      }
    ]
  }
}
```

**Step 2: Add type-check hook after file edits**

Replace with:
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd /Users/brianmehrman/projects/diagram_builder && npm run type-check 2>&1 | tail -20"
          }
        ]
      },
      {
        "matcher": "TaskCompleted",
        "hooks": [
          {
            "type": "command",
            "command": "npm run test:e2e"
          }
        ]
      }
    ]
  }
}
```

**Step 3: Verify**

Read settings.json and confirm both hooks are present.

> **Note:** The type-check hook runs `npm run type-check` after every Edit or Write tool call, so TypeScript errors surface immediately rather than at commit time. Output is trimmed to last 20 lines to keep noise low.

---

## Task 6: Create /story slash command

**Files:**
- Create: `/Users/brianmehrman/projects/diagram_builder/.claude/commands/story.md`

**Step 1: Write the skill file**

```markdown
# Implement Story

Executes a full story from planning to done, following TDD and the project's Definition of Done.

## Usage

`/story <story-file-path-or-story-id>`

Examples:
- `/story 12-3-connection-visibility`
- `/story _bmad-output/implementation-artifacts/12-3-connection-visibility.md`

## Workflow

### Phase 1: Understand
1. Read the story file (resolve path from sprint-status.yaml if only ID given)
2. Read relevant source files listed in the story's context
3. Identify all acceptance criteria
4. Identify which files will be created or modified

### Phase 2: Implement (TDD)
For each acceptance criterion:
1. Write the failing test first
2. Run `npm test -- --reporter=verbose 2>&1 | tail -30` — confirm it FAILS
3. Write minimal implementation to make it pass
4. Run `npm test -- --reporter=verbose 2>&1 | tail -30` — confirm it PASSES
5. Check for regressions in the full suite

### Phase 3: Quality Gate (MANDATORY — do not skip)
Run all checks and fix until each passes:
```bash
npm test 2>&1 | tail -20
npm run type-check 2>&1 | tail -20
npm run lint 2>&1 | tail -20
```

### Phase 4: Bookkeeping (MANDATORY — story is NOT done without this)
1. Update `_bmad-output/implementation-artifacts/sprint-status.yaml`:
   - Change story status to `review  # <story-name> - COMPLETE (<YYYY-MM-DD>)`
2. Mark all tasks `[x]` in `TASKS.md` (if file exists for this story)
3. Update story file Dev Agent Record section with:
   - Files created/modified
   - Completion notes
   - Any deviations from plan

### Phase 5: Report
Output a summary:
- ✅ Acceptance criteria: [list each, PASS/FAIL]
- ✅ Tests: [N passing, 0 new failures]
- ✅ Type check: PASS
- ✅ sprint-status.yaml: updated
- Files changed: [list]
```

**Step 2: Verify**

Read the file and confirm it exists and is well-formed.

---

## Task 7: Update MEMORY.md with new patterns from insights

**Files:**
- Modify: `/Users/brianmehrman/.claude/projects/-Users-brianmehrman-projects-diagram-builder/memory/MEMORY.md`

**Step 1: Add new patterns section**

Append the following sections to MEMORY.md (replacing old Debugging Rule section with expanded version):

Replace:
```markdown
## Debugging Rule: Constant/Default Changes
When changing a store default or exported constant, ALWAYS grep for hardcoded
test assertions using the old value — they will silently drift and fail.
Example: `cityVersion` changed `v1→v2` in store; test still asserted `v1`.
```

With:
```markdown
## Debugging Rules

### Constant/Default Changes
When changing a store default or exported constant, ALWAYS grep for hardcoded
test assertions using the old value — they will silently drift and fail.
Example: `cityVersion` changed `v1→v2` in store; test still asserted `v1`.

### Root-Cause First (From Insights: 11 wrong-approach incidents)
Trace bug through ALL layers before fixing: component → hooks/store → API → cache → DB.
Do NOT fix the first symptom. Fix the layer that owns the defect.
Post-fix: always run `npm test` to check for regressions.

### R3F Data Verification (From Insights: floor-band broke 3x)
Before using any node property in 3D rendering:
- Search the parser output to confirm the field is actually populated
- Confirmed safe: `node.metadata?.methods?.length` (NOT `node.methodCount` — never populated)
- Never enable `vertexColors` without checking `geometry.attributes.color` exists

### ARIA/Test Selector Updates (From Insights: stale queries after attribute changes)
When changing `title`, `aria-label`, `role`, `data-testid`, or display text:
grep all test files for the old value and update every query before committing.
```

**Step 2: Verify**

Read MEMORY.md and confirm the expanded section is present and under 200 lines total.

---

## Completion Checklist

After all tasks:
- [ ] CLAUDE.md has: Debugging Guidelines, R3F Guidelines, strengthened DoD, ARIA rule
- [ ] `.claude/settings.json` has type-check hook on Edit/Write
- [ ] `.claude/commands/story.md` skill exists and is well-formed
- [ ] MEMORY.md reflects new patterns

**No tests to run** — these are config/doc files only. Verify by reading each file after editing.
