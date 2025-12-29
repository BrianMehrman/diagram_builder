# Story 3-2: AST Analysis for JavaScript/TypeScript

## Story

**ID:** 3-2
**Key:** 3-2-ast-analysis
**Title:** Extract code structure and metrics from JavaScript/TypeScript AST
**Epic:** Epic 3 - Parser Package (@diagram-builder/parser)
**Phase:** Phase 3 - Parser Package

**Description:**

Build AST analysis capabilities to extract semantic information from parsed JavaScript and TypeScript code. This story implements the intelligence layer that traverses Tree-sitter ASTs to identify classes, functions, imports/exports, and calculate code metrics.

The extracted information forms the foundation for dependency graph construction (Story 3-3) and ultimate conversion to the Internal Visualization Model (Story 3-5).

**Dependencies:**
- Story 3-1 (Tree-sitter Integration) must be complete

---

## Acceptance Criteria

- **AC-1:** Class definition extraction implemented
  - Extract class names from class declarations
  - Extract method names, parameters, and visibility (public/private/protected)
  - Extract property names and types (when available)
  - Handle ES6 classes and TypeScript class syntax
  - Handle class inheritance and implements clauses

- **AC-2:** Function declaration extraction implemented
  - Extract function names from declarations and expressions
  - Extract function parameters with types (TypeScript)
  - Extract return types (TypeScript)
  - Handle arrow functions, async functions, generators
  - Distinguish between top-level and nested functions

- **AC-3:** Import/Export statement extraction implemented
  - Extract import sources (module paths)
  - Extract imported identifiers (named imports, default imports, namespace imports)
  - Extract export declarations (named exports, default exports, re-exports)
  - Handle dynamic imports
  - Support both ES6 modules and CommonJS (require/module.exports)

- **AC-4:** Code metrics calculation implemented
  - Lines of Code (LOC) per file
  - Cyclomatic complexity per function
  - Number of classes per file
  - Number of functions per file
  - Nesting depth tracking
  - Metrics stored in structured format for later use

- **AC-5:** Comprehensive test coverage
  - Unit tests for class extraction (Vitest)
  - Unit tests for function extraction
  - Unit tests for import/export extraction
  - Unit tests for metrics calculation
  - Tests use real JavaScript/TypeScript code samples
  - Tests co-located with source files (.test.ts suffix)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Implement class definition extraction
- [ ] Create `src/analysis/class-extractor.ts` module
- [ ] Implement `extractClasses(ast: Tree): ClassDefinition[]` function
- [ ] Define `ClassDefinition` TypeScript interface (name, methods, properties, extends, implements)
- [ ] Traverse AST to find class_declaration nodes
- [ ] Extract method definitions from class bodies
- [ ] Extract property definitions with types
- [ ] Handle TypeScript access modifiers (public/private/protected)
- [ ] Write unit tests in `class-extractor.test.ts`

### Task 2: Implement function declaration extraction
- [ ] Create `src/analysis/function-extractor.ts` module
- [ ] Implement `extractFunctions(ast: Tree): FunctionDefinition[]` function
- [ ] Define `FunctionDefinition` TypeScript interface (name, params, returnType, async, generator)
- [ ] Traverse AST to find function_declaration, arrow_function, function_expression nodes
- [ ] Extract parameter lists with TypeScript type annotations
- [ ] Extract return type annotations (TypeScript)
- [ ] Distinguish between top-level and nested functions
- [ ] Write unit tests in `function-extractor.test.ts`

### Task 3: Implement import/export statement extraction
- [ ] Create `src/analysis/import-export-extractor.ts` module
- [ ] Implement `extractImports(ast: Tree): ImportStatement[]` function
- [ ] Implement `extractExports(ast: Tree): ExportStatement[]` function
- [ ] Define `ImportStatement` and `ExportStatement` TypeScript interfaces
- [ ] Handle ES6 import syntax (named, default, namespace)
- [ ] Handle ES6 export syntax (named, default, re-exports)
- [ ] Handle CommonJS require() calls (for compatibility)
- [ ] Extract module path strings for dependency analysis
- [ ] Write unit tests in `import-export-extractor.test.ts`

### Task 4: Implement code metrics calculation
- [ ] Create `src/analysis/metrics-calculator.ts` module
- [ ] Implement `calculateMetrics(ast: Tree, content: string): CodeMetrics` function
- [ ] Define `CodeMetrics` TypeScript interface (loc, complexity, classCount, functionCount, depth)
- [ ] Calculate Lines of Code (LOC) from content string
- [ ] Implement cyclomatic complexity calculation (count decision points)
- [ ] Calculate nesting depth by traversing AST levels
- [ ] Count classes and functions using extraction utilities
- [ ] Write unit tests in `metrics-calculator.test.ts`

### Task 5: Create unified analysis interface
- [ ] Create `src/analysis/analyzer.ts` module
- [ ] Implement `analyzeFile(filePath: string): FileAnalysis` function
- [ ] Define `FileAnalysis` interface (combines classes, functions, imports, exports, metrics)
- [ ] Integrate parser from Story 3-1
- [ ] Combine all extraction utilities into single analysis pipeline
- [ ] Add error handling for analysis failures
- [ ] Write integration tests in `analyzer.test.ts`

### Task 6: Validate and run all tests
- [ ] Run `npm test` in @diagram-builder/parser package
- [ ] Verify all tests pass 100%
- [ ] Verify test coverage includes all analysis functions
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
- `@diagram-builder/core` - Will be used in Story 3-5

**Technology Stack:**
- Tree-sitter AST traversal
- TypeScript strict mode
- Vitest for testing

### Key Architecture Decisions

1. **AST Traversal Strategy:**
   - Use Tree-sitter's cursor-based traversal for performance
   - Visit each node type (class_declaration, function_declaration, etc.)
   - Extract metadata into strongly-typed interfaces

2. **Metrics Requirements (NFR-P1):**
   - Keep extraction lightweight to maintain <2s per 100 files target
   - Avoid deep nested iterations where possible
   - Cache AST traversal results when analyzing same tree multiple times

3. **Code Quality (NFR-S15, Architecture):**
   - TypeScript strict mode - NO `any` types
   - Comprehensive error handling for malformed code
   - All extraction functions must handle incomplete/error AST nodes

### Implementation Guidance

**AST Node Types (Tree-sitter JavaScript/TypeScript):**
- `class_declaration` - ES6 classes
- `function_declaration` - Named functions
- `arrow_function` - Arrow function expressions
- `method_definition` - Class methods
- `import_statement` - ES6 imports
- `export_statement` - ES6 exports
- `call_expression` - Function calls (for require())

**Example Class Extraction Pattern:**
```typescript
export function extractClasses(ast: Tree): ClassDefinition[] {
  const classes: ClassDefinition[] = [];
  const cursor = ast.walk();

  // Traverse to find class_declaration nodes
  // Extract name, methods, properties from each class node
  // Build ClassDefinition objects

  return classes;
}
```

**Cyclomatic Complexity Calculation:**
- Count decision points: if, else, case, while, for, &&, ||, ?, catch
- Add 1 for function entry point
- Formula: complexity = decisions + 1

### Critical Constraints

- **TypeScript strict mode:** NO `any` types allowed
- **Co-located tests:** `.test.ts` files next to source files
- **Feature-based organization:** Analysis utilities grouped together
- **Performance:** AST traversal must be efficient (single-pass where possible)

### Testing Requirements

Tests must include:
- Real JavaScript code samples (ES6 classes, functions, imports)
- Real TypeScript code samples (with type annotations, interfaces)
- Edge cases: empty files, syntax errors, nested structures
- Metrics validation against known code samples

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 3.2)

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
