# Lint Remediation Plan

**Date:** 2026-02-23
**Starting point:** 882 errors across all packages
**After config fix:** 600 errors (282 eliminated by adding browser/Vitest globals)
**Goal:** 0 errors

---

## Current State (post config fix)

| Package | Problems | Main rules firing |
|---------|----------|-------------------|
| `api`    | ~257     | `no-unsafe-assignment`, `no-explicit-any`, `no-unsafe-member-access`, `restrict-template-expressions` |
| `cli`    | ~4       | `no-console`, `no-unsafe-member-access` |
| `core`   | ~92      | `no-non-null-assertion` (53), `no-explicit-any` (13) |
| `parser` | ~42      | `no-explicit-any` (17), `no-unsafe-call/assignment` |
| `ui`     | ~205     | `no-non-null-assertion` (52), `no-console` (23), `no-floating-promises` (11), `no-explicit-any` (10), `React` imports (8) |

---

## Phases

### Phase 1 — CLI (4 errors, ~30 min)

Smallest package, easiest wins. Good warmup.

**Files:** `packages/cli/src/**`

| Rule | Count | Fix |
|------|-------|-----|
| `no-console` | 2 | Replace `console.log` → `console.warn`/`console.error`, or remove debug logging |
| `no-unsafe-member-access` | 2 | Add type assertion or type guard on the `.output` access |

---

### Phase 2 — Parser (42 errors, ~2 hrs)

Mostly `no-explicit-any`. The parser deals with external data (file system, AST nodes) so
proper types may require interfaces describing AST shapes.

| Rule | Count | Fix strategy |
|------|-------|--------------|
| `no-explicit-any` | 17 | Replace with `unknown` + type narrowing, or create typed interfaces for AST nodes |
| `no-unsafe-call/assignment` | 7 | Flow from fixing `any` → these resolve automatically |
| `restrict-template-expressions` | 3 | Cast `unknown` values to `string` before interpolating: `String(val)` |
| `no-unsafe-member-access` | 3 | Add type guards before property access |

**Tip:** Start with `no-explicit-any` — fixing those will cascade and reduce the `unsafe-*` errors.

---

### Phase 3 — Core (92 errors, ~3 hrs)

Dominated by `no-non-null-assertion` (53 instances). The core package has graph data
structures where array access on known-length arrays triggers the rule.

| Rule | Count | Fix strategy |
|------|-------|--------------|
| `no-non-null-assertion` | 53 | Replace `arr[i]!` with `const item = arr[i]; if (!item) continue;` guards |
| `no-non-null-assertion` (Map) | 4 | Replace `map.get(key)!` with `map.get(key) ?? defaultValue` |
| `no-explicit-any` | 13 | Replace with specific types or `unknown` |
| `no-unused-vars` | 4 | Prefix with `_` or remove |
| Parsing errors | 2 | Check tsconfig.json paths in parserOptions |

**Tip:** The non-null assertions in tight loops can use a helper:
```ts
// Instead of repeated arr[i]! pattern:
for (const item of arr) { /* item is always defined */ }
```
Prefer `for...of` over index loops where possible — eliminates the pattern entirely.

---

### Phase 4 — UI (205 errors, ~4 hrs)

Mix of issues. Tackle in this order:

#### 4a. `React` imports (8 errors, ~15 min)
Files that use `React.JSX.Element` as a type without importing React. Fix: add
`import type React from 'react'` to each offending file.

```bash
# Find them:
npm run lint -w @diagram-builder/ui 2>&1 | grep "'React' is not defined"
```

#### 4b. `no-non-null-assertion` (52 errors, ~2 hrs)
Same patterns as Core. Prefer `for...of` loops over index access. For Map lookups,
use `?? fallback` or explicit `if (!val) return` guards.

#### 4c. `no-floating-promises` (11 errors, ~30 min)
Promises not awaited or handled. Fix: add `void` operator for fire-and-forget,
or `await` where the result matters.

```ts
// Before:
someAsyncFn();

// After (fire-and-forget):
void someAsyncFn();

// After (needs result):
await someAsyncFn();
```

#### 4d. `no-misused-promises` (7 errors, ~30 min)
Async functions passed as event handlers that expect `void` return. Fix: wrap in
a non-async arrow that calls and ignores the promise.

```tsx
// Before (triggers no-misused-promises):
<button onClick={async () => { await doThing(); }} />

// After:
<button onClick={() => { void doThing(); }} />
```

#### 4e. `no-explicit-any` (10 errors, ~1 hr)
Replace `any` with `unknown` + type guard, or with the specific type if known from context.

#### 4f. `no-console` (23 warnings, ~30 min)
Development debug logs left in source. Remove them or replace with a proper logger.
The project already has `console.warn` and `console.error` allowed.

---

### Phase 5 — API (257 errors, ~1–2 days)

The largest and most complex package. The errors cluster around graph data returned
from Neo4j queries — untyped query results flow as `any` through the whole service layer.

| Rule | Count | Root cause | Fix strategy |
|------|-------|------------|--------------|
| `no-unsafe-assignment` | 57 | Neo4j query results typed as `any` | Create typed interfaces for Neo4j record shapes; use `as TypedRecord` after validation |
| `no-unsafe-member-access` | ~50 | Accessing `.id`, `.type`, `.lod` on `any` values | Same — fix the root `any` type on query results |
| `no-explicit-any` | 31 | Explicit `any` in service/route handlers | Replace with proper types |
| `restrict-template-expressions` | 11 | `unknown` in template literals | Use `String(val)` before interpolating |
| `no-unused-vars` | ~10 | Unused variables in tests | Prefix with `_` or remove |
| `no-floating-promises` | ~12 | Unhandled promises in route handlers | Add `void` or `await` |

**Recommended approach:**
1. Create typed interfaces for Neo4j record shapes in `packages/api/src/types/neo4j.ts`
2. Update query functions to return those typed shapes instead of raw `any`
3. The `no-unsafe-*` errors will resolve automatically as types flow through

**Key files to target first:**
- `packages/api/src/routes/workspaces.ts` — most `unsafe-assignment` errors
- `packages/api/src/__tests__/utils/graph-quality-assertions.ts` — most `unsafe-member-access`

---

## Execution Order

```
Phase 1: CLI      ← ~30 min,  4 errors
Phase 2: Parser   ← ~2 hrs,  42 errors
Phase 3: Core     ← ~3 hrs,  92 errors
Phase 4: UI       ← ~4 hrs, 205 errors  (do 4a React imports first — 15 min)
Phase 5: API      ← ~2 days, 257 errors
```

Start with CLI to build momentum, then work smallest-to-largest. API last because
it requires the most architectural thought (Neo4j typing).

---

## Verification

After each phase:
```bash
# Lint the package you just fixed
npm run lint -w @diagram-builder/<package>

# Full type-check to ensure no regressions
npm run type-check

# Unit tests
npm test
```

After all phases:
```bash
npm run lint       # should be 0 errors
npm run type-check # should pass
npm test           # should not regress
```
