# LLM Instructions for Diagram Builder

> **Purpose:** This document provides context loading instructions and development guidelines for AI assistants working on the Diagram Builder project.

---

## 📚 Documentation Quick Reference

### Start Here (Every Session)

1. **[README.md](./README.md)** - Project overview, quick start, and navigation hub
2. **[PLANNING.md](./PLANNING.md)** - Documentation organization and where to find everything
3. **[Sprint Status](/_bmad-output/implementation-artifacts/sprint-status.yaml)** - Current progress and active stories

### Before Writing Code

- **[Project Context](/_bmad-output/project-context.md)** - CRITICAL rules and conventions (MUST READ)
- **[Architecture](/_bmad-output/planning-artifacts/architecture.md)** - System design and technical decisions
- **[PORT-CONFIGURATION.md](./PORT-CONFIGURATION.md)** - Standard ports: API=4000, UI=3000

### When Implementing a Story

- **Story File**: `_bmad-output/implementation-artifacts/{epic}-{story}-{name}.md`
- **Tasks Checklist**: `TASKS.md` for detailed task tracking
- **UX Specs**: `_bmad-output/planning-artifacts/ux-*.md` (if UI work)

---

## 🎯 Context Loading Priority

Load these documents in order for optimal context:

```
1. README.md (lines 1-100)           # Project overview
2. PLANNING.md (full)                 # Documentation navigation
3. sprint-status.yaml (full)          # Current state
4. project-context.md (full)          # Critical rules
5. architecture.md (lines 1-200)      # High-level architecture
6. Story file (if implementing)       # Specific requirements
```

---

## 🔄 Project Awareness & Context

### Always Check These First

- **Read `PLANNING.md`** at the start of any session to understand documentation organization
- **Read `PORT-CONFIGURATION.md`** before working with servers, scripts, or tests
- **Check `sprint-status.yaml`** to know what's in-progress, done, or blocked
- **Review relevant story file** before implementing any feature

### Document Locations (Quick Copy-Paste)

```typescript
// Key paths for context
const docs = {
  navigation: './README.md',
  planning: './PLANNING.md',
  ports: './PORT-CONFIGURATION.md',
  tasks: './TASKS.md',
  
  // _bmad-output/
  sprintStatus: './_bmad-output/implementation-artifacts/sprint-status.yaml',
  projectContext: './_bmad-output/project-context.md',
  architecture: './_bmad-output/planning-artifacts/architecture.md',
  prd: './_bmad-output/planning-artifacts/prd.md',
  
  // Stories by epic
  epic3Stories: './_bmad-output/implementation-artifacts/3-*.md',
  epic4Stories: './_bmad-output/implementation-artifacts/4-*.md',
  epic5Stories: './_bmad-output/implementation-artifacts/5-*.md',
}
```

---

## 🧱 Code Structure & Architecture Rules

### Critical Rules (from project-context.md)

**MUST FOLLOW:**
1. **State Management**: Zustand ONLY (NO Redux, NO Context API)
2. **Organization**: Feature-based structure (NOT type-based)
3. **Neo4j Naming**:
   - Node labels: PascalCase (`:Repository`, `:File`)
   - Properties: camelCase (`fileName`, `lineCount`)
   - Relationships: UPPER_SNAKE_CASE (`:CONTAINS`, `:DEPENDS_ON`)
4. **Error Format**: RFC 7807 for ALL API errors
5. **Authentication**: JWT everywhere (REST, WebSocket)
6. **Tests**: Co-located with source files (`.test.ts` suffix)
7. **TypeScript**: Strict mode (NO `any` types)

### File Organization

- **Monorepo packages**: `packages/{core,parser,api,ui,cli}/`
- **Feature-based**: Group by feature, not file type
  - ✅ `features/workspace/WorkspacePage.tsx`
  - ❌ `components/WorkspacePage.tsx`
- **Co-located tests**: `WorkspacePage.test.tsx` next to `WorkspacePage.tsx`
- **Max file size**: Keep files under 500 lines - refactor if larger

---

## 🧪 Testing & Quality

### Test Requirements

1. **Unit Tests**: Co-located with source (`.test.ts`)
   - Test expected behavior
   - Test edge cases
   - Test error handling
   - Run with: `npm test`

2. **E2E Tests**: Located in `tests/e2e/`
   - Use Playwright
   - Test critical user flows
   - Services auto-start via `./scripts/init.sh`
   - Run with: `npm run test:e2e`

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

---

## ✅ Sprint & Task Tracking

### When Starting Work

1. Check `sprint-status.yaml` for story status
2. Mark story as `in-progress` when starting
3. Check `TASKS.md` for detailed task breakdown

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

### Status Values

```yaml
not-started    # Story not begun
in-progress    # Actively working
review         # Complete, awaiting review
done           # Reviewed and complete
blocked        # Dependency or issue blocking
```

---

## 📎 Development Standards

### TypeScript

- **Strict mode**: Always enabled
- **No `any` types**: Use proper typing
- **Interfaces over types**: For object shapes
- **Import order**: 
  1. External packages
  2. Internal packages (`@diagram-builder/*`)
  3. Relative imports

### React (UI Package)

- **Functional components only**: No class components
- **Hooks**: Use built-in and Zustand hooks
- **Styling**: Tailwind CSS utility classes
- **3D Rendering**: `@react-three/fiber` for Three.js

### API (Express)

- **Async handlers**: Use `asyncHandler` wrapper
- **Error format**: RFC 7807 Problem Details
- **Authentication**: JWT middleware on all routes
- **Validation**: Zod schemas for request validation

### Database (Neo4j)

- **Labels**: PascalCase - `:Repository`, `:File`, `:Class`
- **Properties**: camelCase - `fileName`, `lineCount`, `createdAt`
- **Relationships**: UPPER_SNAKE_CASE - `:CONTAINS`, `:DEPENDS_ON`

---

## 📚 Documentation Updates

### When to Update README.md

- Adding new features
- Changing dependencies
- Modifying setup steps
- Adding new scripts

### When to Update Architecture

- System design changes
- New integrations
- API endpoint changes
- Data model changes

### When to Update Story Files

- During implementation (Dev Agent Record section)
- After completion (Completion Notes)
- File list (all new/modified files)

---

## 🧠 AI Behavior Guidelines

### Do

- ✅ Ask for clarification when requirements are unclear
- ✅ Read relevant documentation before implementing
- ✅ Follow established patterns and conventions
- ✅ Write tests for new functionality
- ✅ Update documentation when making changes
- ✅ Check existing code for similar patterns

### Don't

- ❌ Make assumptions about missing context
- ❌ Use libraries not already in package.json
- ❌ Delete or overwrite code without instruction
- ❌ Skip testing requirements
- ❌ Ignore TypeScript errors
- ❌ Use `any` types
- ❌ Create type-based file organization

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

- I know which layer the defect lives in (not just where I first see it)
- I've checked whether the fix could affect other callers of the same code
- See **Testing & Quality → After Code Changes** for the full post-fix checklist

### Constant/Default Drift Rule

When changing an **exported constant** or **Zustand store default**, before and after the change:

```bash
# Find hardcoded test assertions using the old value
grep -r "oldValue" packages/ --include="*.test.*"
```

Stale test assertions silently fail after constant renames. Always grep and update them.

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

---

## 🔧 Development Commands

### Quick Reference

```bash
# Install dependencies
npm install

# Start all services (Docker + API + UI)
./scripts/init.sh

# Development
npm run dev              # Start all packages
npm run dev -w @diagram-builder/api   # API only
npm run dev -w @diagram-builder/ui    # UI only

# Testing
npm test                 # Unit tests
npm run test:e2e         # E2E tests
npm run test:e2e:ui      # E2E with UI

# Quality
npm run type-check       # TypeScript
npm run lint             # ESLint
npm run lint -- --fix    # Auto-fix
npm run format           # Prettier

# Build
npm run build            # All packages
```

---

## 🎓 Learning Resources

### First Time Working on This Project?

Read in this order:
1. [README.md](./README.md) - 5 min
2. [PLANNING.md](./PLANNING.md) - 10 min  
3. [project-context.md](/_bmad-output/project-context.md) - 15 min
4. [architecture.md](/_bmad-output/planning-artifacts/architecture.md) - 30 min

### Need to Implement a Feature?

1. Find story in `sprint-status.yaml`
2. Read story file: `_bmad-output/implementation-artifacts/{story}.md`
3. Check `TASKS.md` for detailed tasks
4. Review relevant architecture sections
5. Look at similar existing features for patterns

---

**Last Updated:** 2026-01-02  
**Project:** Diagram Builder - 3D Codebase Visualization  
**Status:** Active Development (Epic 4 & 5 in progress)
