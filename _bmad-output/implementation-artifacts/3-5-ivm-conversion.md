# Story 3-5: IVM Conversion

## Story

**ID:** 3-5
**Key:** 3-5-ivm-conversion
**Title:** Convert dependency graph to Internal Visualization Model (IVM)
**Epic:** Epic 3 - Parser Package (@diagram-builder/parser)
**Phase:** Phase 3 - Parser Package

**Description:**

Implement the conversion layer that transforms the parser's dependency graph into the Internal Visualization Model (IVM) format defined in @diagram-builder/core. The IVM is the canonical representation used by layout engines, exporters, and the 3D visualization system.

This story completes the parser package by bridging AST analysis with the visualization pipeline, enabling seamless integration between parsing and rendering.

**Dependencies:**
- Story 3-1 (Tree-sitter Integration) must be complete
- Story 3-2 (AST Analysis) must be complete
- Story 3-3 (Dependency Graph Construction) must be complete
- Story 3-4 (Repository Integration) must be complete
- Phase 2 (Core Package) must be complete (IVM types defined)

---

## Acceptance Criteria

- **AC-1:** Dependency nodes converted to IVM nodes
  - Map file nodes to IVM File nodes with metadata
  - Map class nodes to IVM Class nodes with methods/properties
  - Map function nodes to IVM Function nodes with parameters
  - Include all metadata: file paths, line numbers, code metrics
  - Assign unique IDs to all IVM nodes

- **AC-2:** Dependency edges converted to IVM edges
  - Map import edges to IVM DEPENDS_ON relationships
  - Map function call edges to IVM CALLS relationships
  - Map class inheritance edges to IVM EXTENDS/IMPLEMENTS relationships
  - Include edge metadata: import type, call location
  - Preserve edge directionality (source → target)

- **AC-3:** IVM metadata enrichment
  - Add repository context (repo URL, branch, commit SHA)
  - Add parsing timestamp and version
  - Add file-level statistics (LOC, complexity, file count)
  - Add codebase-level metrics aggregation
  - Attach original AST node references for traceability

- **AC-4:** IVM validation and integrity checks
  - Validate all node IDs are unique
  - Validate all edge references point to existing nodes
  - Validate metadata conforms to IVM schema
  - Check for orphaned nodes (nodes with no edges)
  - Provide detailed validation error messages

- **AC-5:** Integration tests with complete pipeline
  - Test end-to-end: repository → parsing → IVM conversion
  - Verify IVM can be consumed by @diagram-builder/core layout engine
  - Verify IVM can be consumed by exporters (PlantUML, Mermaid)
  - Test with multi-file JavaScript/TypeScript projects
  - Tests co-located with source files (.test.ts suffix)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Implement node conversion utilities
- [ ] Create `src/ivm/node-converter.ts` module
- [ ] Import IVM types from `@diagram-builder/core` (Node, Edge, Graph interfaces)
- [ ] Implement `convertFileNode(depNode: DependencyNode): IVMNode` function
- [ ] Implement `convertClassNode(depNode: DependencyNode): IVMNode` function
- [ ] Implement `convertFunctionNode(depNode: DependencyNode): IVMNode` function
- [ ] Assign unique IDs using consistent naming scheme (e.g., file:path, class:name, func:name)
- [ ] Map all metadata fields (filePath, lineNumber, loc, complexity, etc.)
- [ ] Write unit tests in `node-converter.test.ts`

### Task 2: Implement edge conversion utilities
- [ ] Create `src/ivm/edge-converter.ts` module
- [ ] Implement `convertImportEdge(depEdge: DependencyEdge): IVMEdge` function
- [ ] Implement `convertCallEdge(depEdge: DependencyEdge): IVMEdge` function
- [ ] Implement `convertInheritanceEdge(depEdge: DependencyEdge): IVMEdge` function
- [ ] Map edge types: import → DEPENDS_ON, call → CALLS, extends → EXTENDS
- [ ] Preserve source and target node IDs
- [ ] Include edge metadata (importType, callLocation, etc.)
- [ ] Write unit tests in `edge-converter.test.ts`

### Task 3: Implement metadata enrichment
- [ ] Create `src/ivm/metadata-enricher.ts` module
- [ ] Implement `enrichMetadata(ivm: IVMGraph, context: RepositoryContext): IVMGraph` function
- [ ] Add repository metadata (url, branch, commitSHA, parseTimestamp)
- [ ] Calculate codebase-level metrics (total LOC, total files, total functions/classes)
- [ ] Add parsing version info (parser package version)
- [ ] Attach original dependency graph references for debugging
- [ ] Write unit tests in `metadata-enricher.test.ts`

### Task 4: Implement IVM validation
- [ ] Create `src/ivm/validator.ts` module
- [ ] Implement `validateIVM(ivm: IVMGraph): ValidationResult` function
- [ ] Define `ValidationResult` interface (valid: boolean, errors: ValidationError[])
- [ ] Validate all node IDs are unique (Set-based check)
- [ ] Validate all edge.source and edge.target reference existing node IDs
- [ ] Validate required metadata fields are present (filePath, type, etc.)
- [ ] Check for orphaned nodes (nodes with no incoming/outgoing edges)
- [ ] Provide detailed error messages with node/edge IDs
- [ ] Write unit tests in `validator.test.ts`

### Task 5: Create unified IVM conversion pipeline
- [ ] Create `src/ivm/ivm-converter.ts` module
- [ ] Implement `convertToIVM(depGraph: DependencyGraph, context: RepositoryContext): IVMGraph` function
- [ ] Convert all nodes using node-converter utilities
- [ ] Convert all edges using edge-converter utilities
- [ ] Enrich metadata using metadata-enricher
- [ ] Validate final IVM using validator
- [ ] Throw error if validation fails (with detailed messages)
- [ ] Write integration tests in `ivm-converter.test.ts`

### Task 6: Integration tests with full pipeline
- [ ] Create `src/integration/full-pipeline.test.ts`
- [ ] Test: local repository → scan → parse → analyze → graph → IVM
- [ ] Test: verify IVM can be passed to @diagram-builder/core layout engine
- [ ] Test: verify IVM can be exported to PlantUML using core exporters
- [ ] Test with real JavaScript project (multi-file)
- [ ] Test with real TypeScript project (with types and inheritance)
- [ ] Verify end-to-end accuracy (nodes, edges, metadata)

### Task 7: Validate and run all tests
- [ ] Run `npm test` in @diagram-builder/parser package
- [ ] Verify all tests pass 100%
- [ ] Verify integration tests pass with core package
- [ ] Run TypeScript type checking (`tsc --noEmit`)
- [ ] Run ESLint validation
- [ ] Fix any failing tests or linting issues

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/parser/`
**Package Name:** `@diagram-builder/parser`

**Dependencies:**
- Story 3-1, 3-2, 3-3, 3-4 (Parser Package) - REQUIRED
- `@diagram-builder/core` - IVM types and interfaces (Phase 2)

**Technology Stack:**
- TypeScript strict mode
- @diagram-builder/core IVM interfaces
- Vitest for testing

### Key Architecture Decisions (from architecture.md)

1. **Internal Visualization Model (IVM):**
   - Defined in @diagram-builder/core package (Phase 2)
   - Language-agnostic representation of code structure
   - Nodes: File, Class, Function, Variable
   - Edges: DEPENDS_ON, CALLS, EXTENDS, IMPLEMENTS
   - Metadata: filePath, lineNumber, metrics, position (3D coordinates added by layout)

2. **IVM Node Structure:**
```typescript
interface IVMNode {
  id: string;                  // Unique identifier
  type: 'file' | 'class' | 'function' | 'variable';
  metadata: {
    name: string;
    filePath?: string;
    lineNumber?: number;
    loc?: number;              // Lines of code
    complexity?: number;       // Cyclomatic complexity
    // ... other metadata
  };
  position?: { x: number; y: number; z: number }; // Added by layout engine
}
```

3. **IVM Edge Structure:**
```typescript
interface IVMEdge {
  source: string;              // Node ID
  target: string;              // Node ID
  type: 'DEPENDS_ON' | 'CALLS' | 'EXTENDS' | 'IMPLEMENTS';
  metadata?: {
    importType?: 'named' | 'default' | 'namespace';
    callLocation?: { line: number; column: number };
    // ... other metadata
  };
}
```

4. **IVM Graph Structure:**
```typescript
interface IVMGraph {
  nodes: IVMNode[];
  edges: IVMEdge[];
  metadata: {
    repository?: string;
    branch?: string;
    commitSHA?: string;
    parseTimestamp?: string;
    parserVersion?: string;
    metrics?: {
      totalFiles: number;
      totalLOC: number;
      totalClasses: number;
      totalFunctions: number;
    };
  };
}
```

### Implementation Guidance

**Node ID Strategy:**
- Files: `file:packages/parser/src/parser.ts`
- Classes: `class:packages/parser/src/parser.ts:Parser`
- Functions: `func:packages/parser/src/parser.ts:parseFile`

**Edge Type Mapping:**
- DependencyEdge(type: 'import') → IVMEdge(type: 'DEPENDS_ON')
- DependencyEdge(type: 'call') → IVMEdge(type: 'CALLS')
- DependencyEdge(type: 'extends') → IVMEdge(type: 'EXTENDS')
- DependencyEdge(type: 'implements') → IVMEdge(type: 'IMPLEMENTS')

**Validation Strategy:**
```typescript
function validateIVM(ivm: IVMGraph): ValidationResult {
  const errors: ValidationError[] = [];
  const nodeIds = new Set(ivm.nodes.map(n => n.id));

  // Check unique IDs
  if (nodeIds.size !== ivm.nodes.length) {
    errors.push({ type: 'DUPLICATE_ID', message: 'Duplicate node IDs found' });
  }

  // Check edge references
  for (const edge of ivm.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push({ type: 'INVALID_EDGE', message: `Edge source ${edge.source} not found` });
    }
    if (!nodeIds.has(edge.target)) {
      errors.push({ type: 'INVALID_EDGE', message: `Edge target ${edge.target} not found` });
    }
  }

  return { valid: errors.length === 0, errors };
}
```

### Critical Constraints

- **TypeScript strict mode:** NO `any` types allowed
- **Co-located tests:** `.test.ts` files next to source files
- **IVM compliance:** Must match @diagram-builder/core IVM schema EXACTLY
- **Validation:** MUST validate IVM before returning (throw on failure)

### Testing Requirements

Tests must include:
- Unit tests for node conversion (file, class, function)
- Unit tests for edge conversion (all edge types)
- Unit tests for metadata enrichment
- Unit tests for validation (valid and invalid IVMs)
- Integration tests with full parsing pipeline
- Verification that IVM can be consumed by core package

### Integration with Core Package

This story completes the parser package. The resulting IVM will be:
1. Stored in Neo4j database (API package - Phase 4)
2. Processed by layout engine (Core package - Phase 2, already complete)
3. Exported to diagrams (Core package - Phase 2, already complete)
4. Visualized in 3D (UI package - Phase 5)

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 3.5)
- Core IVM Types: `packages/core/src/ivm/` (from Phase 2)

---

## Dev Agent Record

### Implementation Plan
<!-- AI Dev Agent: Document high-level approach before implementation -->

### Debug Log
<!-- AI Dev Agent: Record issues encountered and resolutions -->

### Completion Notes
<!-- AI Dev Agent: Summarize what was implemented and tested -->

---

## File List

<!-- AI Dev Agent: List ALL new/modified/deleted files (relative paths) -->
<!-- Format: [NEW|MOD|DEL] path/to/file.ts -->

---

## Change Log

<!-- AI Dev Agent: Add entry after each implementation session -->
<!-- Format: - Description of changes (Date: YYYY-MM-DD) -->

---

## Status

**Current Status:** not-started
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
