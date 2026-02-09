# Story 8-3: Add External Library Detection

**Status:** review

---

## Story

**ID:** 8-3
**Key:** 8-3-add-external-library-detection
**Title:** Detect and Flag External Library Imports
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 1 (Data Foundation)
**Priority:** HIGH - Required for city layout with neighboring buildings

**As a** developer viewing the 3D codebase visualization,
**I want** external library imports identified and flagged,
**So that** external libraries appear as separate neighboring buildings in the city layout.

**Description:**

Create a standalone detection module in the parser to identify external library imports (npm packages, node built-ins) and produce stub DependencyNodes with `isExternal`-equivalent metadata plus DependencyEdges linking internal files to external packages. This enables future layout engines to position external libraries as separate buildings.

**Context:**

From UX 3D Layout Vision:
- External libraries = neighboring buildings
- Connected underground via dependency tunnels
- Different visual style from internal code
- Examples: `express`, `react`, `lodash`

Detection rules:
- Import path doesn't start with `.` or `/` = external
- Import from `node:*` = Node.js built-in
- Listed in package.json `dependencies`, `devDependencies`

---

## Acceptance Criteria

- **AC-1:** External imports detected from import paths
  - `'express'` → external
  - `'react'` → external
  - `'./utils'` → NOT external
  - `'../shared/types'` → NOT external

- **AC-2:** Node.js built-ins detected
  - `'node:fs'` → external + builtin
  - `'path'` → external + builtin
  - Standard built-in list maintained

- **AC-3:** External stub nodes created as DependencyNode
  - One DependencyNode per unique package
  - `type: 'module'` with metadata `{ isExternal: true }`
  - Label/name = package name (e.g., "express", "react")
  - Grouped by package (not per-import)

- **AC-4:** Import edges link internal to external
  - DependencyEdge type `'imports'` from internal file to external node
  - Preserves import path in metadata

- **AC-5:** Package.json cross-referenced (when available)
  - Validate against dependencies/devDependencies
  - Flag as `devDependency` in metadata if applicable
  - Handle missing package.json gracefully

- **AC-6:** Unit tests verify detection
  - Test relative imports (not external)
  - Test npm package imports
  - Test Node.js built-ins
  - Test scoped packages (`@scope/package`)
  - Test package.json cross-reference
  - Test deduplication (multiple files importing same package)

---

## Tasks/Subtasks

### Task 1: Implement external import detection helpers (AC: 1, 2)
- [x] `isExternalImport(importPath)` — check if path is external
- [x] `extractPackageName(importPath)` — extract package name from path
- [x] `isNodeBuiltin(name)` — check against Node.js built-in list
- [x] Handle scoped packages (`@scope/package`)
- [x] Handle `node:` protocol prefix

### Task 2: Implement main detection function (AC: 3, 4, 5)
- [x] Create `detectExternalImports()` that takes import info + optional package.json
- [x] Create stub DependencyNode per unique external package
- [x] Create DependencyEdge linking source file to external node
- [x] Cross-reference package.json for version/devDependency info

### Task 3: Write comprehensive unit tests (AC: 6)
- [x] Test `isExternalImport` with relative/absolute/external paths
- [x] Test `extractPackageName` with regular, scoped, and deep paths
- [x] Test `isNodeBuiltin` with known builtins and non-builtins
- [x] Test `detectExternalImports` end-to-end scenarios
- [x] Test package.json cross-referencing
- [x] Test deduplication across multiple files

### Task 4: Export from parser index (AC: all)
- [x] Export functions and types from `packages/parser/src/index.ts`

---

## Dev Notes

### Architecture & Patterns

**Location:** `packages/parser/src/analysis/externalDetector.ts` — follows the pattern of `depthCalculator.ts` in the same directory.

**Types:** Uses `DependencyNode` and `DependencyEdge` from `packages/parser/src/graph/dependency-graph.ts`. These are the parser's native types.

**Key discovery:** The current `graph-builder.ts` (line 168) **skips external imports entirely** — `if (!importInfo.isExternal && importInfo.resolvedPath)`. External imports from `resolveImports()` are detected but discarded. The `import-resolver.ts` already has `isExternalPackage()` (line 64) which checks if a path starts with `.` or `/`.

**Import path is NOT stored on edges.** The existing `DependencyEdge.metadata` for import edges only stores `importedSymbols`, not the original import path. This means we cannot detect externals from the graph alone — we need the raw import path information.

**Input design:** Since this is a standalone algorithm (integration deferred), the function takes a simple input format:
```typescript
interface ExternalImportInfo {
  sourceNodeId: string   // ID of the file node that contains the import
  importPath: string     // The raw import path (e.g., 'express', './utils')
}
```
This decouples from `ResolvedImport` and allows calling from anywhere.

**DependencyEdgeType:** Only `'imports' | 'extends' | 'implements' | 'calls' | 'exports'` exist. We use `'imports'` for external edges (not a new type) and mark them via metadata `{ isExternal: true }`.

**DependencyNode for externals:** Use `type: 'module'` (already in DependencyNodeType) with metadata marking it as external.

### Integration Note

This story creates the standalone algorithm. Integration into `buildDependencyGraph()` is deferred to a future story. That story would capture external imports from the `resolveImports()` call at graph-builder.ts:166 instead of discarding them.

### Files to Create

- `packages/parser/src/analysis/externalDetector.ts` — Detection algorithm
- `packages/parser/src/analysis/externalDetector.test.ts` — Unit tests

### Files to Modify

- `packages/parser/src/index.ts` — Export new module

### References

- [Source: packages/parser/src/graph/dependency-graph.ts] — DependencyNode/DependencyEdge types
- [Source: packages/parser/src/graph/import-resolver.ts:64-68] — Existing isExternalPackage() logic
- [Source: packages/parser/src/graph/graph-builder.ts:166-182] — Where external imports are currently skipped
- [Source: packages/parser/src/analysis/depthCalculator.ts] — Pattern to follow for standalone algorithm

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.5 (claude-opus-4-5-20251101)

### Debug Log References

- Original story file assumed edge.metadata contains importPath — it doesn't. Redesigned to use standalone `ExternalImportInfo` input format.
- Original story referenced `pipeline.ts` (doesn't exist), core package types (wrong package), and `external_import` edge type (not in DependencyEdgeType). All corrected.
- All 391 parser tests pass with zero regressions.

### Completion Notes List

All 4 tasks completed:
- **Task 1 (Helpers):** `isExternalImport()` checks `.`/`/` prefix. `extractPackageName()` handles simple, deep, scoped, and `node:` prefixed paths. `isNodeBuiltin()` checks against 44 Node.js built-in module names.
- **Task 2 (Main function):** `detectExternalImports()` takes `ExternalImportInfo[]` + optional `PackageJsonDeps`, creates one `DependencyNode` (type: `'module'`) per unique package with metadata `{ isExternal, isBuiltin, isDevDependency, packageVersion }`, and one `DependencyEdge` (type: `'imports'`) per import with metadata `{ isExternal, importPath }`.
- **Task 3 (Tests):** 25 unit tests across 4 describe blocks: `isExternalImport` (7 tests), `extractPackageName` (5 tests), `isNodeBuiltin` (3 tests), `detectExternalImports` (10 tests covering npm packages, builtins, scoped packages, deduplication, package.json cross-reference, empty input, mixed imports).
- **Task 4 (Exports):** All functions and types exported from `packages/parser/src/index.ts`.

### File List

**New Files:**
- `packages/parser/src/analysis/externalDetector.ts` — Detection algorithm with `detectExternalImports()`, `isExternalImport()`, `extractPackageName()`, `isNodeBuiltin()`
- `packages/parser/src/analysis/externalDetector.test.ts` — 25 unit tests

**Modified Files:**
- `packages/parser/src/index.ts` — Export new module functions and types

---

## Change Log
- 2026-02-02: Implemented external library detection with standalone algorithm. 25 unit tests, all passing. Exported from parser index. Story file corrected for actual codebase architecture.

