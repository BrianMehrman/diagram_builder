# Story 3-3: Dependency Graph Construction

## Story

**ID:** 3-3
**Key:** 3-3-dependency-graph
**Title:** Build dependency graph from import statements and function calls
**Epic:** Epic 3 - Parser Package (@diagram-builder/parser)
**Phase:** Phase 3 - Parser Package

**Description:**

Construct a dependency graph data structure by analyzing import statements, function calls, and class inheritance relationships extracted from JavaScript/TypeScript code. This graph represents the relationships between files, modules, classes, and functions - the core data structure that will be stored in Neo4j and visualized in 3D.

The dependency graph bridges the gap between raw AST analysis (Story 3-2) and the visualization-ready Internal Visualization Model (Story 3-5).

**Dependencies:**
- Story 3-1 (Tree-sitter Integration) must be complete
- Story 3-2 (AST Analysis) must be complete

---

## Acceptance Criteria

- **AC-1:** Import dependency parsing implemented
  - Parse ES6 import statements to extract source module paths
  - Resolve relative imports to absolute file paths
  - Handle named imports, default imports, namespace imports
  - Support CommonJS require() statements
  - Create file-to-file dependency edges

- **AC-2:** Function call relationship extraction implemented
  - Extract function call expressions from AST
  - Link function calls to their definitions (when in same codebase)
  - Track cross-file function invocations
  - Handle method calls on class instances
  - Create function-to-function dependency edges

- **AC-3:** Class inheritance relationship extraction implemented
  - Extract class extends clauses
  - Extract TypeScript implements clauses
  - Link child classes to parent classes
  - Track interface implementations
  - Create class-to-class inheritance edges

- **AC-4:** Dependency graph data structure implemented
  - Define `DependencyGraph` TypeScript interface
  - Define `DependencyNode` interface (id, type, metadata)
  - Define `DependencyEdge` interface (source, target, type)
  - Support efficient graph operations (add node, add edge, query)
  - Provide graph traversal utilities (find dependencies, find dependents)

- **AC-5:** Integration tests with real codebases
  - Test with multi-file JavaScript project
  - Test with TypeScript project (types and imports)
  - Verify circular dependency detection
  - Verify cross-file relationship accuracy
  - Tests co-located with source files (.test.ts suffix)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Implement import dependency resolution
- [ ] Create `src/graph/import-resolver.ts` module
- [ ] Implement `resolveImports(file: string, imports: ImportStatement[]): ResolvedImport[]` function
- [ ] Define `ResolvedImport` interface (source, target, importedSymbols)
- [ ] Resolve relative imports (./file.js, ../module.ts) to absolute paths
- [ ] Handle node_modules imports (mark as external)
- [ ] Support .js, .ts, .tsx file extensions and implicit extensions
- [ ] Write unit tests in `import-resolver.test.ts`

### Task 2: Implement function call relationship extraction
- [ ] Create `src/graph/call-graph-builder.ts` module
- [ ] Implement `buildCallGraph(files: FileAnalysis[]): CallRelationship[]` function
- [ ] Define `CallRelationship` interface (caller, callee, callSite)
- [ ] Traverse AST to find call_expression nodes
- [ ] Match call expressions to function definitions by name
- [ ] Track cross-file function calls using import analysis
- [ ] Write unit tests in `call-graph-builder.test.ts`

### Task 3: Implement class inheritance extraction
- [ ] Create `src/graph/inheritance-builder.ts` module
- [ ] Implement `buildInheritanceGraph(files: FileAnalysis[]): InheritanceRelationship[]` function
- [ ] Define `InheritanceRelationship` interface (child, parent, type: extends | implements)
- [ ] Extract extends clauses from class definitions
- [ ] Extract implements clauses from TypeScript classes
- [ ] Resolve parent class references across files
- [ ] Write unit tests in `inheritance-builder.test.ts`

### Task 4: Create dependency graph data structure
- [ ] Create `src/graph/dependency-graph.ts` module
- [ ] Define `DependencyGraph` class with methods: addNode, addEdge, getNode, getEdges
- [ ] Define `DependencyNode` interface (id, type: file | class | function, metadata, filePath)
- [ ] Define `DependencyEdge` interface (source, target, type: import | call | extends | implements)
- [ ] Implement graph traversal: `getDependencies(nodeId)`, `getDependents(nodeId)`
- [ ] Implement circular dependency detection
- [ ] Write unit tests in `dependency-graph.test.ts`

### Task 5: Build unified graph construction pipeline
- [ ] Create `src/graph/graph-builder.ts` module
- [ ] Implement `buildDependencyGraph(files: string[]): DependencyGraph` function
- [ ] Parse all files using utilities from Story 3-1 and 3-2
- [ ] Resolve all imports using import-resolver
- [ ] Build call graph using call-graph-builder
- [ ] Build inheritance graph using inheritance-builder
- [ ] Combine all relationships into unified DependencyGraph
- [ ] Write integration tests in `graph-builder.test.ts`

### Task 6: Validate and run all tests
- [ ] Run `npm test` in @diagram-builder/parser package
- [ ] Verify all tests pass 100%
- [ ] Test with real multi-file JavaScript/TypeScript projects
- [ ] Verify graph accuracy (nodes, edges, relationships)
- [ ] Run TypeScript type checking (`tsc --noEmit`)
- [ ] Run ESLint validation
- [ ] Fix any failing tests or linting issues

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/parser/`
**Package Name:** `@diagram-builder/parser`

**Dependencies:**
- Story 3-1 (Tree-sitter Integration) - REQUIRED
- Story 3-2 (AST Analysis) - REQUIRED
- Node.js path/fs modules for file resolution

**Technology Stack:**
- TypeScript strict mode
- Vitest for testing
- Node.js path utilities for import resolution

### Key Architecture Decisions

1. **Graph Structure:**
   - Nodes represent: files, classes, functions
   - Edges represent: imports, function calls, inheritance
   - Edge types enable different visualization layouts later

2. **Import Resolution Strategy:**
   - Resolve relative imports using Node.js path resolution
   - Handle implicit .js/.ts extensions
   - Mark external (node_modules) imports but don't traverse them
   - Support both ES6 and CommonJS modules

3. **Performance Requirements (NFR-P1):**
   - Maintain <2 seconds per 100 files target
   - Use efficient data structures (Map/Set for lookups)
   - Avoid redundant file parsing (reuse results from Story 3-2)

4. **Scalability (NFR-SC1):**
   - Must handle up to 10k files, 100k+ nodes
   - Graph data structure must support efficient queries
   - Consider memory usage for large codebases

### Implementation Guidance

**Import Resolution Algorithm:**
1. Parse import source string (e.g., "./utils/helper")
2. Resolve relative to current file directory
3. Try file extensions: .ts, .tsx, .js, .jsx, /index.ts, /index.js
4. Return absolute path if found, otherwise mark as external

**Dependency Node Types:**
- `file` - Represents a source file
- `class` - Represents a class definition
- `function` - Represents a function/method

**Dependency Edge Types:**
- `import` - File imports another file
- `call` - Function calls another function
- `extends` - Class extends another class
- `implements` - Class implements an interface

**Circular Dependency Detection:**
```typescript
function detectCircular(graph: DependencyGraph, nodeId: string, visited: Set<string>): boolean {
  if (visited.has(nodeId)) return true;
  visited.add(nodeId);

  const deps = graph.getDependencies(nodeId);
  for (const dep of deps) {
    if (detectCircular(graph, dep, visited)) return true;
  }

  visited.delete(nodeId);
  return false;
}
```

### Critical Constraints

- **TypeScript strict mode:** NO `any` types allowed
- **Co-located tests:** `.test.ts` files next to source files
- **Feature-based organization:** Graph utilities grouped together
- **Efficient lookups:** Use Map/Set for O(1) node/edge access

### Testing Requirements

Integration tests must include:
- Multi-file project with circular dependencies
- TypeScript project with interfaces and class inheritance
- CommonJS and ES6 module mixing
- External npm package imports (node_modules)
- Nested directory structures with relative imports

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 3.3)

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
