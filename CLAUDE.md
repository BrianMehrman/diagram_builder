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

---

## ✅ Sprint & Task Tracking

### When Starting Work

1. Check `sprint-status.yaml` for story status
2. Mark story as `in-progress` when starting
3. Check `TASKS.md` for detailed task breakdown

### When Completing Work

1. Mark story as `review` or `done` in `sprint-status.yaml`
2. Mark tasks as `[x]` in `TASKS.md`
3. Update story file with completion notes
4. Document new/modified files in story file

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
