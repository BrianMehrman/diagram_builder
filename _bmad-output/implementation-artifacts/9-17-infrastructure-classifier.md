# Story 9.17: Infrastructure Classifier Analysis Module

Status: not-started

## Story

**ID:** 9-17
**Key:** 9-17-infrastructure-classifier
**Title:** Infrastructure Classifier Analysis Module
**Epic:** Epic 9 - City Visualization Overhaul Phase 1
**Phase:** Epic 9-D: Infrastructure Landmarks & Layer Control
**Priority:** CRITICAL - Foundation for infrastructure visualization

**As a** developer viewing a codebase,
**I want** external packages classified by infrastructure type,
**So that** the city can render them as distinct landmarks.

---

## Acceptance Criteria

- **AC-1:** `pg`, `mysql`, `mongoose`, `prisma`, `sequelize`, `typeorm`, `knex` → `'database'`
- **AC-2:** `axios`, `node-fetch`, `got`, `superagent`, `request` → `'api'`
- **AC-3:** `bull`, `amqplib`, `kafkajs`, `rabbitmq`, `bee-queue` → `'queue'`
- **AC-4:** `redis`, `memcached`, `ioredis`, `lru-cache` → `'cache'`
- **AC-5:** `fs-extra`, `glob`, `chokidar` → `'filesystem'`
- **AC-6:** `passport`, `jsonwebtoken`, `bcrypt`, `oauth` → `'auth'`
- **AC-7:** `winston`, `pino`, `bunyan`, `morgan` → `'logging'`
- **AC-8:** Unknown packages → `'general'`
- **AC-9:** Output stored as `node.metadata.infrastructureType`
- **AC-10:** Co-located unit tests with comprehensive coverage

---

## Tasks/Subtasks

### Task 1: Define infrastructure types (AC: 1-8)
- [ ] Create `packages/parser/src/analysis/infrastructureClassifier.ts`
- [ ] Define `InfrastructureType` union: `'database' | 'api' | 'queue' | 'cache' | 'filesystem' | 'auth' | 'logging' | 'general'`
- [ ] Define package-to-type mapping as a constant lookup table
- [ ] Include scoped package variants (e.g., `@prisma/client`)

### Task 2: Implement classifier function (AC: 1-9)
- [ ] `classifyPackage(packageName: string): InfrastructureType`
- [ ] Exact match against lookup table
- [ ] Handle scoped packages (extract base package name)
- [ ] Handle Node.js builtins (e.g., `fs` → `'filesystem'`, `http` → `'api'`, `crypto` → `'auth'`)
- [ ] Return `'general'` for unrecognized packages

### Task 3: Create batch classifier (AC: 9)
- [ ] `classifyExternalNodes(nodes: DependencyNode[]): Map<string, InfrastructureType>`
- [ ] Processes all external nodes and returns a map of nodeId → infrastructure type
- [ ] Designed to be called after `detectExternalImports` and inject results into node metadata

### Task 4: Write unit tests (AC: 10)
- [ ] Create `packages/parser/src/analysis/infrastructureClassifier.test.ts`
- [ ] Test each category with multiple package names
- [ ] Test scoped packages
- [ ] Test Node.js builtins
- [ ] Test unknown packages → `'general'`
- [ ] Test batch classifier with mixed node list

---

## Dev Notes

### Architecture & Patterns

**Parser package location:** This module lives in `packages/parser/src/analysis/` alongside `externalDetector.ts`, `depthCalculator.ts`, and `containmentAnalyzer.ts`.

**Heuristic-based:** Classification uses a static lookup table of known package names. This is intentionally simple and easily extensible. Future versions could use package.json `keywords` or npm metadata.

**Integration point:** This classifier runs after external detection. The existing `detectExternalImports()` creates external nodes. This classifier adds `infrastructureType` to their metadata. The integration can happen in the parser pipeline or as a post-processing step.

**Metadata bag pattern:** Results go into `node.metadata.infrastructureType`. The UI reads this field to select landmark components.

### Scope Boundaries

- **DO:** Create the classifier module with lookup table
- **DO:** Write comprehensive tests
- **DO:** Handle scoped packages and Node.js builtins
- **DO NOT:** Modify `externalDetector.ts` (this is a separate module)
- **DO NOT:** Create UI components (that's stories 9-18, 9-19)
- **DO NOT:** Use npm API or network calls (static heuristics only)

### References

- `packages/parser/src/analysis/externalDetector.ts` — existing external detection module
- `packages/parser/src/graph/dependency-graph.ts` — DependencyNode type

---

## Dev Agent Record
_To be filled during implementation_

---

## Change Log
_To be filled during implementation_
