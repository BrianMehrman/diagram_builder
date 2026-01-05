# Story 6-2: Add Observability Infrastructure

## Story

**ID:** 6-2
**Key:** 6-2-add-observability-infrastructure
**Title:** Implement Structured Logging and Parser Progress Tracking
**Epic:** Epic 6 - Fix Parser & Complete Core Integration
**Phase:** Implementation
**Priority:** HIGH - Enables Future Debugging

**Description:**

Implement comprehensive observability infrastructure across the codebase-to-3D-visualization pipeline. Add structured logging (Winston/Pino), parser progress tracking, and diagnostic instrumentation to enable effective debugging and monitoring.

**Context:**

During brainstorming session, 40+ questions were identified about pipeline behavior that we couldn't answer due to lack of logging and observability. Current system operates as a "black box" - when failures occur, we have no visibility into:
- Whether parser executed
- How many files were discovered/processed
- Pipeline stage where failures occur
- Performance characteristics
- Error conditions

This story adds the instrumentation needed to answer these questions and debug future issues effectively.

---

## Acceptance Criteria

- **AC-1:** Structured logging implemented
  - Winston or Pino logging library installed and configured
  - Log levels configured per environment (debug in dev, info in prod)
  - Structured log format with timestamps, levels, context
  - Logs written to appropriate outputs (console in dev, files in prod)

- **AC-2:** Parser package instrumented
  - Log entry/exit of `loadRepository()`
  - Log file discovery results (count, paths, exclusions)
  - Log `buildDependencyGraph()` execution
  - Log `convertToIVM()` results (node/edge counts)
  - Log errors with full context and stack traces
  - Log execution timing for performance analysis

- **AC-3:** API package instrumented
  - Log codebase import requests
  - Log parser trigger events
  - Log Neo4j storage operations
  - Log graph query requests
  - Log response data summary (node/edge counts)
  - Log request/response timing

- **AC-4:** Parser progress tracking
  - Report parsing progress as percentage
  - Track files processed vs total files
  - Expose progress via API endpoint (optional)
  - Log major milestones (start, files discovered, parsing, graph building, complete)

- **AC-5:** Error visibility
  - All errors logged with full context
  - Silent failures eliminated
  - Error states surfaced to logs
  - Diagnostic information included (config, inputs, state)

---

## Tasks/Subtasks

### Task 1: Choose and install logging library
- [ ] Evaluate Winston vs Pino (recommend Winston for familiarity)
- [ ] Install logging library in parser and api packages
- [ ] Configure log levels (debug, info, warn, error)
- [ ] Configure log transports (console, file)
- [ ] Set environment-specific defaults

### Task 2: Implement parser logging
- [ ] Create logger instance in parser package
- [ ] Add logging to `loadRepository()`:
  - Entry with path/config
  - Files discovered count
  - Exit with success/failure status
- [ ] Add logging to `buildDependencyGraph()`:
  - Entry with file count
  - Graph size (nodes/edges)
  - Exit with timing
- [ ] Add logging to `convertToIVM()`:
  - Entry with graph size
  - IVM nodes/edges created
  - Exit with timing

### Task 3: Implement API logging
- [ ] Create logger instance in api package
- [ ] Add logging to codebase endpoints:
  - POST /api/workspaces/:id/codebases requests
  - Parser trigger events
  - Neo4j storage operations
  - Status updates
- [ ] Add logging to graph endpoints:
  - GET /api/graph/:repoId requests
  - Neo4j query execution
  - Response data summary
- [ ] Add request/response middleware logging

### Task 4: Add progress tracking
- [ ] Design progress reporting mechanism
- [ ] Track parsing progress (files processed / total)
- [ ] Log progress at key milestones (25%, 50%, 75%, 100%)
- [ ] (Optional) Expose progress via API endpoint
- [ ] (Optional) Store progress in Redis for polling

### Task 5: Error instrumentation
- [ ] Review all try/catch blocks
- [ ] Add context to error logs (inputs, config, state)
- [ ] Log error stack traces
- [ ] Ensure no silent failures
- [ ] Add error categorization (parser error, db error, etc.)

### Task 6: Testing and validation
- [ ] Verify logs appear during normal operation
- [ ] Verify logs include expected context
- [ ] Test log levels work correctly
- [ ] Validate error logging captures full context
- [ ] Check log output doesn't impact performance

---

## Dev Notes

### Why This Story Matters

**From Brainstorming Session - 40+ Unanswered Questions:**

**Parser Questions We Couldn't Answer:**
- How does loadRepository() scan for files?
- What glob patterns does it use?
- Are there default filters?
- What happens when it finds 0 files?

**Error Handling Questions:**
- What logs does loadRepository() output?
- Are errors swallowed silently?
- How do we know the parser even executed?
- Is there instrumentation on performance?

**Diagnostic Questions:**
- Where is processing stopping?
- Does loadRepository() execute at all?
- Are we getting to buildDependencyGraph()?
- Is the Repository node created in Neo4j?

**This story provides answers to all these questions through logging.**

### Logging Strategy

**Log Levels:**
- **DEBUG:** Detailed diagnostic information (file paths, intermediate values)
- **INFO:** Normal operations (parser started, files found, graph created)
- **WARN:** Unexpected but handled situations (0 files found, partial failure)
- **ERROR:** Failures and exceptions (parser failed, Neo4j error)

**What to Log at Each Pipeline Stage:**

**Stage 1: Upload**
- INFO: Codebase upload request received
- DEBUG: Input validation details
- INFO: Codebase record created
- INFO: Parser job triggered

**Stage 2: Parser Execution**
- INFO: Parser started (path, config)
- DEBUG: Directory scanning (paths, patterns)
- INFO: Files discovered (count, languages)
- DEBUG: File reading progress
- INFO: Dependency graph built (nodes, edges)
- INFO: IVM conversion complete (nodes, edges, coordinates)
- ERROR: Any parser failures with context

**Stage 3: Neo4j Storage**
- INFO: Storing graph in Neo4j (node count, edge count)
- DEBUG: Node creation progress
- DEBUG: Relationship creation progress
- INFO: Storage complete (repositoryId)
- ERROR: Neo4j failures with query context

**Stage 4: Graph Query**
- INFO: Graph query request (repositoryId)
- DEBUG: Neo4j query execution
- INFO: Graph data returned (node count, edge count)
- WARN: Empty graph returned
- ERROR: Query failures

### Recommended Library: Winston

**Why Winston:**
- Widely adopted, stable
- Multiple transports (console, file, http)
- Log levels built-in
- Good TypeScript support
- Can add structured metadata

**Configuration Example:**
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    }),
    new winston.transports.File({
      filename: 'error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'combined.log'
    })
  ]
});
```

### Progress Tracking Design

**Option 1: Log-based (Simple)**
- Log progress at milestones
- No API changes needed
- Good for debugging

**Option 2: API Endpoint (Better UX)**
- Expose `GET /api/codebases/:id/progress`
- Return { status, filesProcessed, totalFiles, percentage }
- Requires Redis or in-memory state
- Enables real-time UI updates

**Recommendation:** Start with Option 1, add Option 2 in Story 6-3 if needed for UX

### Files Involved

**Parser Package:**
- `packages/parser/src/utils/logger.ts` (create)
- `packages/parser/src/repository/repository-loader.ts` (add logging)
- `packages/parser/src/graph/graph-builder.ts` (add logging)
- `packages/parser/src/graph/ivm-converter.ts` (add logging)

**API Package:**
- `packages/api/src/utils/logger.ts` (create)
- `packages/api/src/routes/codebases.ts` (add logging)
- `packages/api/src/routes/graph.ts` (add logging)
- `packages/api/src/services/codebase-service.ts` (add logging)
- `packages/api/src/middleware/request-logger.ts` (create - optional)

**Configuration:**
- `packages/parser/package.json` (add winston dependency)
- `packages/api/package.json` (add winston dependency)

### Dependencies

- **Depends On:** Story 6-1 (parser must work before logging is valuable)
- **Enables:** Story 6-3 (progress tracking needed for loading states)
- **Enables:** Future debugging (can diagnose issues from logs)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 4-6 hours
- **Priority:** HIGH - Foundation for all future debugging

---

## Dev Agent Record

*Implementation notes will be added here during development*

---

## File List

*Modified/created files will be listed here after implementation*

---

## Change Log

- **2026-01-04**: Story created from Epic 6 planning
  - Brainstorming session identified 40+ unanswered questions
  - Observability critical for debugging and monitoring
  - Winston recommended for structured logging
  - Progress tracking considered for future UX improvements

**Status:** backlog
**Created:** 2026-01-04
**Last Updated:** 2026-01-04
