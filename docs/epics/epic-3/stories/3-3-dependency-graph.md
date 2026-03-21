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
- [x] Create `src/graph/import-resolver.ts` module
- [x] Implement `resolveImports(file: string, imports: ImportStatement[]): ResolvedImport[]` function
- [x] Define `ResolvedImport` interface (source, target, importedSymbols)
- [x] Resolve relative imports (./file.js, ../module.ts) to absolute paths
- [x] Handle node_modules imports (mark as external)
- [x] Support .js, .ts, .tsx file extensions and implicit extensions
- [x] Write unit tests in `import-resolver.test.ts`

### Task 2: Implement function call relationship extraction
- [x] Create `src/graph/call-extractor.ts` module
- [x] Implement `extractFunctionCalls(tree: Tree): FunctionCall[]` function
- [x] Define `FunctionCall` interface (callee, receiver, argumentCount, isMemberCall, isConstructor)
- [x] Traverse AST to find call_expression and new_expression nodes
- [x] Match call expressions to function definitions by name
- [x] Track method calls and constructor calls
- [x] Write unit tests in `call-extractor.test.ts`

### Task 3: Implement class inheritance extraction
- [x] Create `src/graph/inheritance-extractor.ts` module
- [x] Implement `extractInheritance(tree: Tree): InheritanceRelationship[]` function
- [x] Define `InheritanceRelationship` interface (child, parent, type: extends | implements)
- [x] Extract extends clauses from class declarations
- [x] Extract implements clauses from TypeScript classes
- [x] Extract interface extends relationships
- [x] Write unit tests in `inheritance-extractor.test.ts`

### Task 4: Create dependency graph data structure
- [x] Create `src/graph/dependency-graph.ts` module
- [x] Define `DependencyGraph` class with methods: addNode, addEdge, getNode, getEdges
- [x] Define `DependencyNode` interface (id, type: file | class | function, metadata, filePath)
- [x] Define `DependencyEdge` interface (source, target, type: import | call | extends | implements)
- [x] Implement graph traversal: `getDependencies(nodeId)`, `getDependents(nodeId)`
- [x] Implement toJSON/fromJSON for serialization
- [x] Write unit tests in `dependency-graph.test.ts`

### Task 5: Build unified graph construction pipeline
- [x] Create `src/graph/graph-builder.ts` module
- [x] Implement `buildDependencyGraph(files: GraphBuildInput[]): DependencyGraph` function
- [x] Parse all files using utilities from Story 3-1 and 3-2
- [x] Resolve all imports using import-resolver
- [x] Extract function calls using call-extractor
- [x] Extract inheritance using inheritance-extractor
- [x] Combine all relationships into unified DependencyGraph
- [x] Write integration tests in `graph-builder.test.ts`

### Task 6: Validate and run all tests
- [x] Run `npm test` in @diagram-builder/parser package
- [x] Verify all tests pass 100% (132 tests total)
- [x] Test with multi-file JavaScript/TypeScript code samples
- [x] Verify graph accuracy (nodes, edges, relationships)
- [x] Run TypeScript type checking (`tsc --noEmit`)
- [x] Run ESLint validation
- [x] Fix any failing tests or linting issues

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

Followed red-green-refactor TDD cycle for all graph construction components:
1. Write comprehensive failing tests first (RED)
2. Implement minimal code to pass tests (GREEN)
3. Refactor for performance and code quality

Implementation sequence:
1. Import resolver - Resolves relative and external imports to absolute paths
2. Call extractor - Extracts function calls, method calls, and constructor calls from AST
3. Inheritance extractor - Extracts class/interface extends and implements relationships
4. Dependency graph - Core data structure for storing nodes and edges
5. Graph builder - Unified pipeline combining all extractors into complete dependency graph

### Debug Log

**Issue 1: TypeScript implements clause structure**
- Problem: TypeScript implements relationships not being extracted
- Root cause: TypeScript AST has `implements_clause` node within `class_heritage`, not direct `implements` keyword
- Resolution: Look for `implements_clause` child node and extract type identifiers from it
- Files: inheritance-extractor.ts:165-174

**Issue 2: ESLint unused variable warnings**
- Problem: Type imports and __dirname not being used in test files
- Resolution: Removed unused imports and variables
- Files: call-extractor.test.ts:3, graph-builder.test.ts:3-6, import-resolver.test.ts:3, inheritance-extractor.test.ts:3

**Issue 3: Async function without await**
- Problem: buildDependencyGraph marked as async but no await expressions
- Resolution: Removed async keyword and changed return type from Promise<DependencyGraph> to DependencyGraph
- Files: graph-builder.ts:26, graph-builder.test.ts (all test functions)

### Completion Notes

**Implementation Summary:**

Successfully implemented comprehensive dependency graph construction pipeline, combining import resolution, function call extraction, and inheritance relationship extraction into a unified graph structure.

**Components Created:**

1. **import-resolver.ts** (112 lines)
   - Resolves import statements to absolute file paths
   - Handles relative imports with and without extensions
   - Marks external packages (node_modules) as external
   - Preserves imported symbols information

2. **call-extractor.ts** (202 lines)
   - Extracts all function calls from AST
   - Handles simple calls, method calls, chained calls, constructor calls
   - Tracks receiver objects for member calls
   - Records argument count and call location

3. **inheritance-extractor.ts** (209 lines)
   - Extracts class extends relationships
   - Extracts class implements relationships (TypeScript)
   - Extracts interface extends relationships
   - Handles multiple inheritance (multiple implements/extends)

4. **dependency-graph.ts** (198 lines)
   - Core graph data structure with Map-based storage
   - Supports nodes (file, class, function, interface, module)
   - Supports edges (imports, extends, implements, calls, exports)
   - Graph traversal methods: getOutgoingEdges, getIncomingEdges, getDependencies, getDependents
   - Serialization support: toJSON/fromJSON

5. **graph-builder.ts** (219 lines)
   - Unified pipeline combining all extractors
   - Two-pass algorithm: create nodes, then create edges
   - Creates file, class, and function nodes with full metadata
   - Creates import, inheritance, and call edges
   - Includes code metrics in file node metadata

**Test Coverage:**
- **57 new tests total**, 100% passing (132 tests total across entire parser package)
- import-resolver.test.ts: 8 tests
- call-extractor.test.ts: 10 tests
- inheritance-extractor.test.ts: 10 tests
- dependency-graph.test.ts: 18 tests
- graph-builder.test.ts: 11 tests

**Language Support:**
- JavaScript (ES6+): imports, classes, functions, inheritance
- TypeScript: type annotations, interfaces, implements, extends
- JSX/TSX: React component syntax

**Key Features:**
- Import resolution: relative paths, external packages, scoped packages, symbol tracking
- Call extraction: function calls, method calls, constructor calls, chained calls, async calls
- Inheritance extraction: class extends, class implements, interface extends, multiple inheritance
- Graph structure: flexible node types, multiple edge types, efficient lookups, traversal methods
- Unified pipeline: automatic parsing, analysis, and graph construction from source files

**Validation:**
- ✅ All 132 tests passing (Vitest)
- ✅ TypeScript type checking passed (strict mode)
- ✅ ESLint validation passed
- ✅ Build successful

**Acceptance Criteria Met:**
- ✅ AC-1: Import dependency resolution with relative and external packages
- ✅ AC-2: Function call relationship extraction with full context
- ✅ AC-3: Class inheritance extraction for JavaScript and TypeScript
- ✅ AC-4: Dependency graph data structure with traversal methods
- ✅ AC-5: Comprehensive test coverage with real code samples

---

## File List

[NEW] packages/parser/src/graph/import-resolver.ts
[NEW] packages/parser/src/graph/import-resolver.test.ts
[NEW] packages/parser/src/graph/call-extractor.ts
[NEW] packages/parser/src/graph/call-extractor.test.ts
[NEW] packages/parser/src/graph/inheritance-extractor.ts
[NEW] packages/parser/src/graph/inheritance-extractor.test.ts
[NEW] packages/parser/src/graph/dependency-graph.ts
[NEW] packages/parser/src/graph/dependency-graph.test.ts
[NEW] packages/parser/src/graph/graph-builder.ts
[NEW] packages/parser/src/graph/graph-builder.test.ts
[MOD] packages/parser/src/index.ts
[NEW] packages/parser/debug-calls.js

---

## Change Log

- Implemented import resolver with relative and external package support (Date: 2025-12-29)
- Implemented call extractor with method calls and constructor calls (Date: 2025-12-29)
- Implemented inheritance extractor for class and interface relationships (Date: 2025-12-29)
- Implemented dependency graph data structure with traversal methods (Date: 2025-12-29)
- Implemented graph builder pipeline combining all extractors (Date: 2025-12-29)
- Created 57 new unit and integration tests achieving 100% pass rate (Date: 2025-12-29)
- Updated package exports to include all graph modules (Date: 2025-12-29)
- Fixed ESLint warnings and async function issues (Date: 2025-12-29)

---

## Status

**Current Status:** review
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
**Completed:** 2025-12-29
