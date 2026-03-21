# Story 6-1: Fix Parser File Discovery

## Story

**ID:** 6-1
**Key:** 6-1-fix-parser-file-discovery
**Title:** Fix loadRepository() File Discovery - Core Feature Blocker
**Epic:** Epic 6 - Fix Parser & Complete Core Integration
**Phase:** Implementation
**Priority:** CRITICAL ⭐ - BLOCKS ENTIRE APPLICATION

**Description:**

Fix the critical bug in `loadRepository()` function where the parser returns 0 files when scanning repositories. This is the single point of failure blocking the entire codebase-to-3D-visualization pipeline.

**Context:**

During brainstorming session (2026-01-03), investigation revealed that the complete upload → parse → Neo4j → API → UI pipeline exists and is fully implemented. However, the parser's `loadRepository()` function returns `{ files: [] }`, causing empty graphs throughout the entire system.

**Impact:**
- Parser finds 0 files → empty dependency graph
- Empty IVM created with no nodes/edges
- Neo4j stores empty Repository
- API returns empty graph
- Canvas3D renders blank 3D scene
- **User sees nothing when uploading codebase**

This story supersedes and completes Story 5.5-10 (fix-parser-file-discovery).

---

## Acceptance Criteria

- **AC-1:** Parser finds files in real codebases
  - Test with multiple real repositories (various languages and sizes)
  - File count > 0 for all supported language repositories
  - Files are discovered recursively through directory tree
  - Supported extensions detected: .js, .jsx, .ts, .tsx, .py, .java, .go, .c, .cpp, .h, .hpp

- **AC-2:** File filtering works correctly
  - node_modules excluded
  - .git directories excluded
  - dist/build directories excluded
  - Test fixtures/mocks excluded as appropriate
  - Only valid source files included in results

- **AC-3:** Logging and observability added
  - Log entry to `loadRepository()` with path/config
  - Log files discovered count
  - Log total directories scanned
  - Log filtering results (X files found, Y excluded)
  - Log errors/warnings when 0 files found

- **AC-4:** End-to-end validation passes
  - Upload real codebase via API
  - Verify files > 0 in parser output
  - Verify nodes > 0 in Neo4j graph
  - Verify Canvas3D renders visualization
  - No blank screen - user sees their codebase

- **AC-5:** Test coverage added
  - Unit tests for file discovery logic
  - Tests with real file systems (not mocked)
  - Edge case tests: empty dirs, binary files, symlinks
  - Integration test for complete upload → render flow

---

## Tasks/Subtasks

### Task 1: Investigate current implementation
- [ ] Read `loadRepository()` implementation in parser package
- [ ] Identify file scanning logic (glob, fs.readdir, etc.)
- [ ] Review file filtering/exclusion patterns
- [ ] Document current behavior with test repository
- [ ] Identify root cause of 0 files returned

### Task 2: Add debug logging
- [ ] Add log entry to `loadRepository()`
- [ ] Log directory path being scanned
- [ ] Log file patterns/extensions configured
- [ ] Log files found at each directory level
- [ ] Log final file count before returning

### Task 3: Create minimal reproduction test
- [ ] Create test directory with known files
- [ ] Call `loadRepository()` directly with test path
- [ ] Verify expected file count matches actual
- [ ] Document behavior (passes or fails)

### Task 4: Fix file discovery bug
- [ ] Implement fix based on root cause analysis
- [ ] Ensure recursive directory scanning works
- [ ] Verify glob patterns match target extensions
- [ ] Test exclusion filters (node_modules, .git)
- [ ] Validate fix with multiple test cases

### Task 5: Add comprehensive tests
- [ ] Unit test: finds .js files
- [ ] Unit test: finds .ts/.tsx files
- [ ] Unit test: excludes node_modules
- [ ] Unit test: handles empty directories
- [ ] Integration test: end-to-end with real repo

### Task 6: End-to-end validation
- [ ] Build parser package with fix
- [ ] Restart API server
- [ ] Upload real codebase via UI
- [ ] Verify files discovered > 0
- [ ] Verify graph nodes > 0
- [ ] Verify 3D visualization renders
- [ ] Confirm user sees codebase in canvas

---

## Dev Notes

### Root Cause Analysis (From Brainstorming Session)

**The Complete Pipeline (AS IMPLEMENTED):**
1. User uploads → `POST /api/workspaces/:id/codebases`
2. Async parser job → `triggerParserImport()` in codebase-service.ts
3. **BREAKS HERE:** `loadRepository()` returns `{ files: [] }`
4. Empty dependency graph built from 0 files
5. Empty IVM created with no nodes/edges
6. Neo4j stores empty Repository
7. API returns `{nodes: [], edges: []}`
8. Canvas receives empty graph
9. User sees blank 3D scene

**What Works ✅:**
- Complete integration layer exists
- API endpoints all functional
- Neo4j storage works correctly
- UI rendering system works perfectly
- Data flow architecture is sound

**What's Broken ❌:**
- Single point of failure: `loadRepository()` finds 0 files
- Everything downstream has no data to process

### Investigation Areas

**Check parser/src/repository/ files:**
- `repository-loader.ts` - Main `loadRepository()` function
- `directory-scanner.ts` - File discovery logic
- `git-cloner.ts` - Temp directory cleanup timing
- `file-filters.ts` - Exclusion patterns

**Potential Root Causes:**

1. **Path Issue:**
   - Git clones to temp directory
   - Scanner uses wrong path (relative vs absolute)
   - Path separator issues (Windows vs Unix)

2. **Glob Pattern Issue:**
   - Patterns don't match actual files
   - Extensions not configured
   - Regex broken or too restrictive

3. **Timing Issue:**
   - Cleanup runs before scanning
   - Temp directory deleted too early
   - Race condition in async operations

4. **Filter Issue:**
   - All files excluded by overly aggressive filters
   - .gitignore parsing broken
   - Default excludes too broad

### Files Involved

**Parser Package:**
- `packages/parser/src/repository/repository-loader.ts`
- `packages/parser/src/repository/directory-scanner.ts`
- `packages/parser/src/repository/git-cloner.ts`
- `packages/parser/src/repository/file-filters.ts` (if exists)

**API Package:**
- `packages/api/src/services/codebase-service.ts` - Calls parser

**Tests:**
- `packages/parser/src/repository/__tests__/` - Unit tests
- `tests/e2e/codebase-import.spec.ts` - E2E validation

### Dependencies

- **Blocks:** Entire application (core feature broken)
- **Supersedes:** Story 5.5-10 (fix-parser-file-discovery)
- **Enables:** Stories 6-2 through 6-6
- **Unblocks:** Stories 5.5-4, 5.5-5, 5.5-9

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-8 hours
- **Priority:** CRITICAL - Must fix before any other Epic 6 work

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified files will be listed here after implementation*

---

## Change Log

- **2026-01-04**: Story created from Epic 6 planning
  - Brainstorming session identified parser file discovery as single blocker
  - Complete pipeline exists but needs data from parser
  - Marked as CRITICAL priority for Epic 6
  - Supersedes Story 5.5-10

**Status:** backlog
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
