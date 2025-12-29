# Story 3-1: Tree-sitter Integration

## Story

**ID:** 3-1
**Key:** 3-1-tree-sitter-integration
**Title:** Set up Tree-sitter parser with JavaScript/TypeScript language bindings
**Epic:** Epic 3 - Parser Package (@diagram-builder/parser)
**Phase:** Phase 3 - Parser Package

**Description:**

Integrate Tree-sitter universal parser library into the @diagram-builder/parser package to enable multi-language code parsing. This story focuses on the MVP language support (JavaScript and TypeScript only), establishing the foundation for AST extraction and dependency analysis in subsequent stories.

Tree-sitter provides incremental parsing with robust error recovery, making it ideal for analyzing large codebases efficiently. This integration creates the core parsing infrastructure that all subsequent parser features will build upon.

---

## Acceptance Criteria

- **AC-1:** Tree-sitter core library and language bindings installed
  - `tree-sitter` npm package added to @diagram-builder/parser dependencies
  - `tree-sitter-javascript` language binding installed
  - `tree-sitter-typescript` language binding installed
  - All dependencies use compatible versions

- **AC-2:** Parser initialization utilities implemented
  - Factory function creates parser instances for JavaScript/TypeScript
  - Parser configuration supports both .js and .ts/.tsx file extensions
  - Error handling for parser initialization failures
  - Type-safe TypeScript interfaces for parser operations

- **AC-3:** File parsing functions operational
  - Function accepts file path and returns parsed AST
  - Function accepts string content and returns parsed AST
  - Automatic language detection based on file extension (.js, .ts, .tsx)
  - Proper cleanup and resource management for parser instances

- **AC-4:** Comprehensive test coverage
  - Unit tests for parser initialization (Vitest)
  - Unit tests for JavaScript file parsing
  - Unit tests for TypeScript file parsing
  - Unit tests for error handling (invalid syntax, missing files)
  - Tests co-located with source files (.test.ts suffix)
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Install Tree-sitter dependencies
- [x] Add `tree-sitter` to @diagram-builder/parser package.json
- [x] Add `tree-sitter-javascript` language binding
- [x] Add `tree-sitter-typescript` language binding
- [x] Add TypeScript type definitions (`@types/tree-sitter` if available)
- [x] Run `npm install` in parser workspace
- [x] Verify installations in package-lock.json

### Task 2: Create parser initialization utilities
- [x] Create `src/parser/parser-factory.ts` module
- [x] Implement `createParser(language: 'javascript' | 'typescript')` factory function
- [x] Define TypeScript interfaces: `ParserInstance`, `ParserConfig`, `ParseResult`
- [x] Implement language-to-parser mapping configuration
- [x] Add error handling for initialization failures
- [x] Write unit tests for parser factory in `parser-factory.test.ts`

### Task 3: Implement file parsing functions
- [x] Create `src/parser/file-parser.ts` module
- [x] Implement `parseFile(filePath: string): Promise<ParseResult>` function
- [x] Implement `parseContent(content: string, language: string): ParseResult` function
- [x] Add file extension detection logic (.js → javascript, .ts/.tsx → typescript, tsx → tsx)
- [x] Implement AST extraction from Tree-sitter parse tree
- [x] Add resource cleanup (parser disposal) after parsing
- [x] Write unit tests for file-parser in `file-parser.test.ts`

### Task 4: Add comprehensive error handling
- [x] Create custom error classes: `ParserInitError`, `ParseError`, `UnsupportedLanguageError`, `UnsupportedFileExtensionError`
- [x] Handle syntax errors in parsed files (Tree-sitter error nodes)
- [x] Handle missing file errors with clear messages
- [x] Handle unsupported file extensions gracefully
- [x] Add error recovery strategies for malformed code
- [x] Write unit tests for error scenarios in `errors.test.ts`

### Task 5: Validate and run all tests
- [x] Run `npm test` in @diagram-builder/parser package
- [x] Verify all tests pass 100%
- [x] Verify test coverage includes all functions
- [x] Run TypeScript type checking (`tsc --noEmit`)
- [x] Run ESLint validation
- [x] Fix any failing tests or linting issues

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/parser/`
**Package Name:** `@diagram-builder/parser`

**Dependencies from Phase 2:**
- `@diagram-builder/core` - Will consume IVM types in Story 3-5

**Technology Stack:**
- Tree-sitter: Universal incremental parser
- tree-sitter-javascript: JavaScript grammar
- tree-sitter-typescript: TypeScript/TSX grammar
- Vitest: Testing framework (co-located tests)

### Key Architecture Decisions (from architecture.md)

1. **Language-Agnostic IR Approach:**
   - Tree-sitter provides the universal parsing layer
   - AST will be converted to Internal Visualization Model (IVM) in Story 3-5
   - This decouples language-specific parsing from visualization logic

2. **Performance Requirements (NFR-P1, NFR-P2):**
   - Parsing must achieve <2 seconds per 100 files
   - Tree-sitter's incremental parsing supports this requirement
   - Parser instances should be reusable to avoid initialization overhead

3. **Testing Strategy:**
   - Co-located tests next to source files (NOT in separate test directories)
   - Use Vitest for all tests
   - 100% test coverage required before marking complete

### Implementation Guidance

**Parser Factory Pattern:**
```typescript
// Example structure (not prescriptive)
export function createParser(language: 'javascript' | 'typescript'): ParserInstance {
  const parser = new Parser();
  const grammar = getLanguageGrammar(language);
  parser.setLanguage(grammar);
  return { parser, language };
}
```

**File Parsing Flow:**
1. Detect language from file extension
2. Create/retrieve parser instance
3. Parse file content to Tree-sitter tree
4. Extract root AST node
5. Return structured parse result
6. Clean up resources

**Error Handling:**
- Tree-sitter is fault-tolerant (parses malformed code)
- Check for ERROR nodes in parse tree to detect syntax issues
- Provide actionable error messages with file path and line numbers

### Critical Constraints

- **TypeScript strict mode:** NO `any` types allowed
- **Co-located tests:** `.test.ts` files next to source files
- **Feature-based organization:** NOT type-based (no /utils/, /types/ directories)
- **No additional dependencies:** Only Tree-sitter libraries for this story

### Testing Requirements

All tests must:
- Use Vitest framework
- Be co-located with source files (`.test.ts` suffix)
- Pass 100% before marking tasks complete
- Cover happy path AND error scenarios
- Include real JavaScript/TypeScript code samples

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 3.1)

---

## Dev Agent Record

### Implementation Plan

Followed red-green-refactor TDD cycle for all components:
1. Write failing tests first (RED)
2. Implement minimal code to pass tests (GREEN)
3. Refactor for code quality while keeping tests green

Implementation sequence:
1. Parser factory with language grammar mapping
2. File parsing with extension detection
3. Custom error classes for better error handling
4. Comprehensive test coverage (23 tests total)
5. ESLint configuration updates for monorepo test files

### Debug Log

**Issue 1: TSX file parsing**
- Problem: TSX files were being parsed with TypeScript grammar, causing syntax errors
- Root cause: Tree-sitter-typescript has separate grammars for TS and TSX
- Resolution: Added 'tsx' as separate Language type, mapped .tsx extension to tsx grammar
- Files: parser-factory.ts:5, parser-factory.ts:60-61, file-parser.ts:70-71

**Issue 2: TypeScript strict mode errors**
- Problem: Optional properties with exactOptionalPropertyTypes caused type errors
- Resolution: Changed from `prop?: type` to `prop: type | undefined`
- Files: errors.ts:30-32

**Issue 3: Parser.Language type not found**
- Problem: tree-sitter types don't export Language type
- Resolution: Used `unknown` type for grammar return value
- Files: parser-factory.ts:54

**Issue 4: ESLint configuration for test files**
- Problem: Test files not found in parserOptions.project
- Resolution: Created separate ESLint config block for test files without type-checking project
- Files: eslint.config.js:38-55

**Issue 5: __dirname in ES modules**
- Problem: __dirname not available in ES module context
- Resolution: Used import.meta.url with fileURLToPath to compute __dirname
- Files: file-parser.test.ts:4-8

### Completion Notes

**Implementation Summary:**

Successfully implemented Tree-sitter integration for @diagram-builder/parser package with full JavaScript and TypeScript support (including TSX).

**Components Created:**
1. `parser-factory.ts` - Parser instance factory with language grammar mapping
2. `file-parser.ts` - File and content parsing functions with extension detection
3. `errors.ts` - Custom error classes (5 types)
4. `index.ts` - Public API exports

**Test Coverage:**
- 23 tests total, 100% passing
- parser-factory.test.ts: 4 tests
- file-parser.test.ts: 10 tests
- errors.test.ts: 9 tests

**Language Support:**
- JavaScript (.js, .jsx, .mjs, .cjs)
- TypeScript (.ts, .mts, .cts)
- TSX (.tsx)

**Key Features:**
- Automatic language detection from file extension
- Syntax error detection in parsed code
- Comprehensive error handling with custom error classes
- Type-safe interfaces (TypeScript strict mode)
- Resource cleanup after parsing

**Validation:**
- ✅ All 23 tests passing (Vitest)
- ✅ TypeScript type checking passed (tsc --noEmit)
- ✅ ESLint validation passed
- ✅ Build successful (npm run build)

**Acceptance Criteria Met:**
- ✅ AC-1: Tree-sitter dependencies installed and verified
- ✅ AC-2: Parser initialization utilities implemented
- ✅ AC-3: File parsing functions operational
- ✅ AC-4: Comprehensive test coverage with co-located tests

---

## File List

[NEW] packages/parser/src/parser/parser-factory.ts
[NEW] packages/parser/src/parser/parser-factory.test.ts
[NEW] packages/parser/src/parser/file-parser.ts
[NEW] packages/parser/src/parser/file-parser.test.ts
[NEW] packages/parser/src/parser/errors.ts
[NEW] packages/parser/src/parser/errors.test.ts
[NEW] packages/parser/src/index.ts
[MOD] eslint.config.js

---

## Change Log

- Implemented Tree-sitter integration with JavaScript and TypeScript support (Date: 2025-12-29)
- Created parser factory with language grammar mapping for JS, TS, and TSX (Date: 2025-12-29)
- Implemented file parsing with automatic language detection from file extensions (Date: 2025-12-29)
- Added comprehensive error handling with 5 custom error classes (Date: 2025-12-29)
- Created 23 unit tests achieving 100% pass rate (Date: 2025-12-29)
- Updated ESLint configuration to support monorepo test files (Date: 2025-12-29)

---

## Status

**Current Status:** review
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
**Completed:** 2025-12-29
