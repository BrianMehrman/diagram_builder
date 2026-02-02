# Story 8-3: Add External Library Detection

**Status:** not-started

---

## Story

**ID:** 8-3
**Key:** 8-3-add-external-library-detection
**Title:** Detect and Flag External Library Imports
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 1 (Data Foundation)
**Priority:** HIGH - Required for city layout with neighboring buildings

**As a** developer viewing the 3D codebase visualization,
**I want** external library imports identified and flagged,
**So that** external libraries appear as separate neighboring buildings in the city layout.

**Description:**

Enhance the parser to detect external library imports (npm packages, node built-ins) and flag their corresponding nodes with `isExternal: true`. This enables the layout engine to position external libraries as separate buildings adjacent to the main codebase.

**Context:**

From UX 3D Layout Vision:
- External libraries = neighboring buildings
- Connected underground via dependency tunnels
- Different visual style from internal code
- Examples: `express`, `react`, `lodash`

Detection rules:
- Import path doesn't start with `.` or `/` = external
- Import from `node:*` = Node.js built-in
- Listed in package.json `dependencies`, `devDependencies`

---

## Acceptance Criteria

- **AC-1:** External imports detected from import statements
  - `import express from 'express'` → isExternal = true
  - `import { useState } from 'react'` → isExternal = true
  - `import './utils'` → isExternal = false
  - `import '../shared/types'` → isExternal = false

- **AC-2:** Node.js built-ins detected
  - `import fs from 'node:fs'` → isExternal = true
  - `import path from 'path'` → isExternal = true (built-in)
  - Standard built-in list maintained

- **AC-3:** External nodes created in graph
  - Stub GraphNode created for each external library
  - `type: 'file'` with `isExternal: true`
  - Label = package name (e.g., "express", "react")
  - Grouped by package (not per-import)

- **AC-4:** Import edges link internal to external
  - GraphEdge type `external_import` from internal file to external node
  - Preserves which files depend on which libraries

- **AC-5:** Package.json cross-referenced (when available)
  - Validate against dependencies/devDependencies
  - Flag as `devDependency` in metadata if applicable
  - Handle missing package.json gracefully

- **AC-6:** Unit tests verify detection
  - Test relative imports (not external)
  - Test npm package imports
  - Test Node.js built-ins
  - Test scoped packages (`@scope/package`)

---

## Technical Approach

### External Import Detector

```typescript
// packages/parser/src/analysis/externalDetector.ts

import type { GraphNode, GraphEdge } from '@diagram-builder/core';

const NODE_BUILTINS = new Set([
  'assert', 'buffer', 'child_process', 'cluster', 'crypto',
  'dns', 'events', 'fs', 'http', 'http2', 'https', 'net',
  'os', 'path', 'perf_hooks', 'process', 'querystring',
  'readline', 'stream', 'string_decoder', 'timers', 'tls',
  'tty', 'url', 'util', 'v8', 'vm', 'worker_threads', 'zlib',
]);

interface ExternalDetectionResult {
  externalNodes: GraphNode[];
  externalEdges: GraphEdge[];
}

export function detectExternalImports(
  nodes: GraphNode[],
  edges: GraphEdge[],
  packageJson?: { dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
): ExternalDetectionResult {
  const externalPackages = new Map<string, GraphNode>();
  const externalEdges: GraphEdge[] = [];

  for (const edge of edges) {
    if (edge.type !== 'imports') continue;

    const importPath = edge.metadata?.importPath as string | undefined;
    if (!importPath) continue;

    if (!isExternalImport(importPath)) continue;

    const packageName = extractPackageName(importPath);

    // Create or reuse external node
    if (!externalPackages.has(packageName)) {
      const isBuiltin = isNodeBuiltin(packageName);
      const isDevDep = packageJson?.devDependencies?.[packageName] !== undefined;

      externalPackages.set(packageName, {
        id: `external:${packageName}`,
        type: 'file',
        label: packageName,
        metadata: {
          isBuiltin,
          isDevDependency: isDevDep,
          packageVersion: packageJson?.dependencies?.[packageName]
            ?? packageJson?.devDependencies?.[packageName]
            ?? 'unknown',
        },
        lod: 0,
        depth: 0,
        isExternal: true,
      });
    }

    // Create external import edge
    externalEdges.push({
      id: `ext-import:${edge.source}:${packageName}`,
      source: edge.source,
      target: `external:${packageName}`,
      type: 'external_import',
      metadata: {
        importPath,
        originalEdgeId: edge.id,
      },
    });
  }

  return {
    externalNodes: Array.from(externalPackages.values()),
    externalEdges,
  };
}

function isExternalImport(importPath: string): boolean {
  // Relative imports start with . or /
  if (importPath.startsWith('.') || importPath.startsWith('/')) return false;
  // Node: protocol
  if (importPath.startsWith('node:')) return true;
  // Everything else is external
  return true;
}

function extractPackageName(importPath: string): string {
  // Strip node: prefix
  const path = importPath.replace(/^node:/, '');
  // Scoped packages: @scope/package
  if (path.startsWith('@')) {
    const parts = path.split('/');
    return parts.slice(0, 2).join('/');
  }
  // Regular packages: first segment
  return path.split('/')[0];
}

function isNodeBuiltin(name: string): boolean {
  return NODE_BUILTINS.has(name.replace(/^node:/, ''));
}
```

---

## Tasks/Subtasks

### Task 1: Implement external import detection
- [ ] Check import path patterns
- [ ] Handle scoped packages
- [ ] Handle Node.js built-ins

### Task 2: Create external stub nodes
- [ ] Create GraphNode per unique package
- [ ] Set isExternal = true
- [ ] Add package metadata

### Task 3: Create external import edges
- [ ] Link internal files to external nodes
- [ ] Use 'external_import' edge type
- [ ] Preserve import path metadata

### Task 4: Cross-reference package.json
- [ ] Read package.json if available
- [ ] Mark dev vs production dependencies
- [ ] Add version info to metadata

### Task 5: Integrate into parser pipeline
- [ ] Call after graph construction
- [ ] Merge external nodes into graph
- [ ] Merge external edges into graph

### Task 6: Write unit tests
- [ ] Test relative imports (not external)
- [ ] Test npm packages
- [ ] Test scoped packages (@scope/pkg)
- [ ] Test Node.js built-ins
- [ ] Test package.json cross-reference

---

## Files to Create

- `packages/parser/src/analysis/externalDetector.ts` - Detection logic
- `packages/parser/src/analysis/externalDetector.test.ts` - Unit tests

## Files to Modify

- `packages/core/src/types/graph.ts` - Add 'external_import' edge type
- `packages/parser/src/analysis/index.ts` - Export new module
- `packages/parser/src/pipeline.ts` - Integrate detection

---

## Dependencies

- Story 8-1 (GraphNode type with isExternal field)

---

## Estimation

**Complexity:** Medium
**Effort:** 3-4 hours
**Risk:** Low - String pattern matching

---

## Definition of Done

- [ ] External imports detected from import paths
- [ ] Node.js built-ins identified
- [ ] External stub nodes created
- [ ] External import edges created
- [ ] Package.json cross-referenced
- [ ] Unit tests pass
