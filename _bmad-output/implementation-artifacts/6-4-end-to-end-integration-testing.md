# Story 6-4: End-to-End Integration Testing

## Story

**ID:** 6-4
**Key:** 6-4-end-to-end-integration-testing
**Title:** Create Comprehensive Integration Tests for Full Upload → Render Flow
**Epic:** Epic 6 - Fix Parser & Complete Core Integration
**Phase:** Implementation
**Priority:** MEDIUM - Quality Assurance & Regression Prevention

**Description:**

Create comprehensive integration test suite that validates the complete codebase upload → parse → Neo4j → API → render pipeline with real file systems and real repositories.

**Context:**

From brainstorming session Question Storming, we identified critical testing gaps:
- "We have provided a real codebase, why is there not a failing test that lets us know the loading is failing?"
- "Are the existing tests using mock data instead of real file systems?"
- "Is there integration test coverage for the full upload → parse → Neo4j flow?"

Current test gaps:
- Unit tests use mocked file systems
- E2E tests were skipped (tests/e2e/codebase-import.spec.ts had P0 test skipped)
- No validation of graph quality (nodes + edges)
- No real-world repository testing

This story supersedes and completes Story 5.5-9 (codebase-import-validation).

---

## Acceptance Criteria

- **AC-1:** Integration tests with real file systems
  - Tests use actual directories with real files
  - No mocking of fs, glob, or file operations
  - Test multiple repository structures
  - Validate file discovery works with real paths

- **AC-2:** Full pipeline integration tests
  - Test complete flow: upload → parse → Neo4j → API → response
  - Validate each stage produces expected output
  - Assert data flows correctly between stages
  - Test with multiple real repositories

- **AC-3:** Graph quality validation
  - Assert nodes.length > 0 for non-empty repos
  - Assert edges.length > 0 (relationships exist)
  - Validate node types (File, Class, Function)
  - Validate edge types (IMPORTS, DEPENDS_ON)
  - Check 3D coordinates exist on all nodes

- **AC-4:** Real repository test cases
  - Small repo (5-10 files) - fast feedback
  - Medium repo (50-100 files) - realistic size
  - Multi-language repo - parser flexibility
  - Empty repo - edge case handling

- **AC-5:** Test coverage for failure modes
  - Invalid path/URL
  - Repository not found
  - No matching files (wrong language)
  - Parser timeout (very large repo)
  - Neo4j connection failure
  - Partial failure recovery

- **AC-6:** E2E test completes Story 5.5-9
  - P0 test in codebase-import.spec.ts un-skipped and passing
  - Tests run against real API server
  - No API mocking in integration tests
  - Tests validate full user journey

---

## Tasks/Subtasks

### Task 1: Audit existing test coverage
- [x] Review all test files in packages/parser
- [x] Review all test files in packages/api
- [x] Review E2E tests in tests/e2e
- [x] Identify mocked vs real file system tests
- [x] Document gaps in integration coverage

### Task 2: Create test fixture repositories
- [x] Create small-js-repo (5-10 .js files)
- [x] Create small-ts-repo (5-10 .ts files)
- [x] Create multi-language-repo (mix of languages)
- [x] Create empty-repo (0 code files)
- [ ] Create large-repo (100+ files - optional for performance testing)
- [x] Store in tests/fixtures/repositories/

### Task 3: Write parser integration tests
- [x] Test loadRepository() with real directories
- [x] Test file discovery finds expected file count
- [x] Test buildDependencyGraph() with real files
- [x] Test convertToIVM() produces valid coordinates
- [x] Assert file count matches actual files in fixture
- [x] No mocking of file system operations

### Task 4: Write API integration tests
- [ ] Test POST /api/workspaces/:id/codebases with real repo
- [ ] Assert codebase status transitions correctly
- [ ] Wait for status = 'completed'
- [ ] Test GET /api/graph/:repoId returns data
- [ ] Validate graph structure (nodes, edges, metadata)
- [ ] Test with Neo4j (not mocked)

### Task 5: Write E2E pipeline tests
- [ ] Un-skip P0 test in codebase-import.spec.ts
- [ ] Test upload → parse → store → retrieve → render flow
- [ ] Use real repository (tests/fixtures or public repo)
- [ ] Assert nodes > 0, edges > 0
- [ ] Validate node types and edge types
- [ ] Check 3D coordinates present
- [ ] Verify graph quality (relationships make sense)

### Task 6: Add graph quality assertions
- [ ] Create validateGraphQuality() helper function
- [ ] Assert nodes.length > 0
- [ ] Assert edges.length > 0
- [ ] Check nodes have required fields (id, label, position)
- [ ] Check edges have source/target references
- [ ] Validate position has x, y, z coordinates
- [ ] Assert node types are valid (File, Class, Function, etc.)

### Task 7: Add failure mode tests
- [ ] Test invalid repository path
- [ ] Test repository with 0 matching files
- [ ] Test very large repository (timeout handling)
- [ ] Test Neo4j connection failure
- [ ] Test parser error handling
- [ ] Validate error messages are helpful

### Task 8: Performance benchmarking (optional)
- [ ] Measure parse time for small/medium/large repos
- [ ] Set performance baselines
- [ ] Add timeout limits to prevent hanging tests
- [ ] Document expected performance characteristics

---

## Dev Notes

### Why Integration Tests Matter

**From Brainstorming Session:**

> "We have provided a real codebase, why is there not a failing test that lets us know the loading is failing?"

**The Problem:**
- Parser bug (0 files found) wasn't caught by tests
- Unit tests used mocks - didn't catch real file system issues
- E2E tests were skipped - didn't validate end-to-end flow
- No graph quality validation - empty graphs passed as "success"

**The Solution:**
This story ensures the same bug can't happen again. Integration tests with real file systems and real Neo4j will catch:
- File discovery failures
- Parsing failures
- Graph building issues
- Empty graph "success" cases
- Integration failures between components

### Test Structure

**Unit Tests (Existing - keep these):**
- Fast, isolated
- Test individual functions
- Mock external dependencies
- Good for TDD and rapid feedback

**Integration Tests (NEW - this story):**
- Test multiple components together
- Use real file systems
- Use real Neo4j (test database)
- Validate data flows correctly
- Slower but higher confidence

**E2E Tests (UPDATE - this story):**
- Test complete user journeys
- Real API server, real database
- Playwright browser automation
- Validate UI rendering
- Slowest but full validation

### Test Fixture Strategy

**Option 1: Local Fixture Repos (Recommended)**
```
tests/fixtures/repositories/
  small-js-repo/
    index.js
    utils.js
    package.json
  small-ts-repo/
    index.ts
    types.ts
    tsconfig.json
  multi-language-repo/
    app.js
    server.py
    main.go
```

**Benefits:**
- Fast (no network I/O)
- Deterministic
- Version controlled
- Can test exact scenarios

**Option 2: Public GitHub Repos**
```typescript
const testRepos = [
  'https://github.com/lodash/lodash', // Large, well-structured
  'https://github.com/expressjs/express', // Medium, complex
  'https://github.com/user/small-repo', // Small, simple
];
```

**Benefits:**
- Real-world complexity
- Tests Git clone integration

**Drawbacks:**
- Network dependency (flaky)
- Can change over time
- Slower

**Recommendation:** Use Option 1 for CI, Option 2 for manual validation

### Graph Quality Validation

```typescript
// Helper function to validate graph quality
function validateGraphQuality(graph: IVMGraph) {
  // Basic structure
  expect(graph.nodes).toBeDefined();
  expect(graph.edges).toBeDefined();
  expect(graph.nodes.length).toBeGreaterThan(0);

  // Node validation
  graph.nodes.forEach(node => {
    expect(node.id).toBeDefined();
    expect(node.label).toBeDefined();
    expect(node.position).toBeDefined();
    expect(node.position.x).toBeDefined();
    expect(node.position.y).toBeDefined();
    expect(node.position.z).toBeDefined();
    expect(['File', 'Class', 'Function', 'Variable']).toContain(node.type);
  });

  // Edge validation (if graph has relationships)
  if (graph.nodes.length > 1) {
    expect(graph.edges.length).toBeGreaterThan(0);
    graph.edges.forEach(edge => {
      expect(edge.source).toBeDefined();
      expect(edge.target).toBeDefined();
      expect(['IMPORTS', 'DEPENDS_ON', 'CALLS', 'INHERITS']).toContain(edge.type);
    });
  }

  // Validate relationships reference real nodes
  const nodeIds = new Set(graph.nodes.map(n => n.id));
  graph.edges.forEach(edge => {
    expect(nodeIds.has(edge.source)).toBe(true);
    expect(nodeIds.has(edge.target)).toBe(true);
  });
}
```

### Files Involved

**Parser Package Tests:**
- `packages/parser/src/repository/__tests__/integration/` (create directory)
- `packages/parser/src/repository/__tests__/integration/loadRepository.integration.test.ts` (create)
- `packages/parser/src/graph/__tests__/integration/buildDependencyGraph.integration.test.ts` (create)

**API Package Tests:**
- `packages/api/src/services/__tests__/integration/` (create directory)
- `packages/api/src/services/__tests__/integration/codebase-pipeline.integration.test.ts` (create)

**E2E Tests:**
- `tests/e2e/codebase-import.spec.ts` (update - un-skip P0 test)
- `tests/e2e/helpers/validateGraph.ts` (create)

**Test Fixtures:**
- `tests/fixtures/repositories/small-js-repo/` (create)
- `tests/fixtures/repositories/small-ts-repo/` (create)
- `tests/fixtures/repositories/multi-language-repo/` (create)

**Test Utilities:**
- `tests/utils/graph-validator.ts` (create)
- `tests/utils/test-db.ts` (create - Neo4j test database helpers)

### Dependencies

- **Depends On:** Story 6-1 (parser must work for tests to pass)
- **Supersedes:** Story 5.5-9 (codebase-import-validation)
- **Enables:** Regression prevention, confidence in changes

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 8-12 hours
- **Priority:** MEDIUM - Quality assurance

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-04**: Story created from Epic 6 planning
  - Brainstorming session identified critical testing gaps
  - Question Storming revealed lack of real file system tests
  - Supersedes Story 5.5-9 (codebase-import-validation)
  - Integration tests will prevent regression of parser bug

**Status:** backlog
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
