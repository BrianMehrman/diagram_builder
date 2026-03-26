# Fix Invalid `style` Directives on Subgraph IDs in Mermaid Exporter

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop emitting `style <id> fill:...` for node IDs that were rendered as `subgraph` blocks — Mermaid does not support the `style` directive on subgraph IDs and rejects the diagram as invalid.

**Architecture:** Track which node IDs are rendered as subgraphs in a `subgraphIds` Set inside `generateFlowchart`. In the styling loop at the end of the function, skip any node whose sanitized ID is in that set. No other logic changes required.

**Tech Stack:** TypeScript, Vitest

---

## Files

- Modify: `packages/core/src/exporters/mermaid.ts` — track subgraph IDs, skip them in the styling loop (lines ~204–326)
- Modify: `packages/core/src/exporters/__tests__/mermaid.test.ts` — add regression test

---

## Background: What Mermaid allows

In Mermaid flowchart syntax, `style <nodeId> fill:color` is valid **only for regular nodes** (rectangles, stadiums, etc.). When a node is rendered as a `subgraph ... end` block, its ID refers to the subgraph container — applying `style` to it produces a parse error that makes the entire diagram invalid.

Example of the bad output this fix eliminates:
```
subgraph file__src_errors_ts["errors.ts"]
    ...
end
...
style file__src_errors_ts fill:#C73E1D,stroke:#CCCCCC  ← INVALID
```

---

## Chunk 1: Add Regression Test and Fix

### Task 1: Write the failing test

**Files:**
- Modify: `packages/core/src/exporters/__tests__/mermaid.test.ts`

- [ ] **Step 1: Add a failing test for subgraph style directives**

Open `packages/core/src/exporters/__tests__/mermaid.test.ts` and add a test inside the `describe('export() - Flowchart')` block:

```typescript
it('should not emit style directive for nodes rendered as subgraphs', () => {
  // parent node has a child — it will be rendered as a subgraph
  const graph = createTestGraph([
    { id: 'file1', type: 'file', metadata: { label: 'File 1' } },
    { id: 'fn1', type: 'function', parentId: 'file1', metadata: { label: 'myFn' } },
  ])

  const result = exporter.export(graph, { useSubgraphs: true })

  // file1 is rendered as a subgraph — its ID must NOT appear in a style directive
  expect(result.content).not.toMatch(/^\s*style file1\s/m)

  // fn1 is a regular leaf node — it CAN have a style directive
  expect(result.content).toMatch(/^\s*style fn1\s/m)
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd packages/core && npx vitest run src/exporters/__tests__/mermaid.test.ts
```

Expected: test fails — `style file1 fill:...` is present in the output.

---

### Task 2: Implement the fix

**Files:**
- Modify: `packages/core/src/exporters/mermaid.ts`

- [ ] **Step 3: Declare `subgraphIds` Set at the top of `generateFlowchart`**

Just after the `renderedNodes` Set is declared (around line 225), add:

```typescript
// Track IDs rendered as subgraph blocks — style directives are invalid for these
const subgraphIds = new Set<string>()
```

- [ ] **Step 4: Populate `subgraphIds` inside `renderNodes`**

Inside the `renderNodes` inner function, in the branch that emits a `subgraph` block, record the ID:

```typescript
// Before:
if (useSubgraphs && hasChildren && canNest) {
  lines.push(`${indent}subgraph ${nodeId}["${label}"]`)
  renderNodes(node.id, depth + 1, indent + '    ')
  lines.push(`${indent}end`)
}

// After:
if (useSubgraphs && hasChildren && canNest) {
  subgraphIds.add(nodeId)                               // <-- ADD THIS LINE
  lines.push(`${indent}subgraph ${nodeId}["${label}"]`)
  renderNodes(node.id, depth + 1, indent + '    ')
  lines.push(`${indent}end`)
}
```

- [ ] **Step 5: Skip subgraph IDs in the styling loop**

Locate the styling loop at the bottom of `generateFlowchart` (around line 317):

```typescript
// Before:
for (const node of graph.nodes) {
  const nodeId = sanitizeId(node.id)
  const color = getNodeColor(node.type, colors)
  lines.push(
    `    style ${nodeId} fill:${formatColor(color)},stroke:${formatColor(colors.border ?? '#CCCCCC')}`
  )
}

// After:
for (const node of graph.nodes) {
  const nodeId = sanitizeId(node.id)
  if (subgraphIds.has(nodeId)) continue                 // <-- ADD THIS LINE
  const color = getNodeColor(node.type, colors)
  lines.push(
    `    style ${nodeId} fill:${formatColor(color)},stroke:${formatColor(colors.border ?? '#CCCCCC')}`
  )
}
```

- [ ] **Step 6: Run the test to confirm it passes**

```bash
cd packages/core && npx vitest run src/exporters/__tests__/mermaid.test.ts
```

Expected: all tests pass, including the new subgraph-style test.

- [ ] **Step 7: Run the full core test suite to check for regressions**

```bash
cd packages/core && npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add packages/core/src/exporters/mermaid.ts \
        packages/core/src/exporters/__tests__/mermaid.test.ts
git commit -m "fix: skip style directives for subgraph nodes in mermaid flowchart"
```
