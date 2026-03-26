# Fix Duplicate Node Rendering in Mermaid Exporter

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent the same node from being emitted more than once when `graph.nodes` contains duplicate entries.

**Architecture:** The `renderNodes` function in `generateFlowchart` iterates over `nodesByParent` buckets without checking whether a node has already been rendered. Adding a guard at the top of the loop — `if (renderedNodes.has(nodeId)) continue` — is the minimal, safe fix. No restructuring needed.

**Tech Stack:** TypeScript, Vitest

---

## Files

- Modify: `packages/core/src/exporters/mermaid.ts` — add dedup guard in `renderNodes` (lines ~233–251)
- Modify: `packages/core/src/exporters/__tests__/mermaid.test.ts` — add regression test

---

## Chunk 1: Add Regression Test and Fix

### Task 1: Write the failing test

**Files:**
- Modify: `packages/core/src/exporters/__tests__/mermaid.test.ts`

- [ ] **Step 1: Add a failing test for duplicate nodes**

Open `packages/core/src/exporters/__tests__/mermaid.test.ts` and add a test inside the `describe('export() - Flowchart')` block:

```typescript
it('should not render duplicate nodes when graph.nodes contains duplicates', () => {
  const dupNode = { id: 'file1', type: 'file' as const, metadata: { label: 'File 1' } }
  const graph = createTestGraph([dupNode, dupNode]) // same node twice

  const result = exporter.export(graph, { useSubgraphs: false })
  const lines = result.content.split('\n').filter((l) => l.includes('file1['))

  // Should appear exactly once, not twice
  expect(lines).toHaveLength(1)
})
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
cd packages/core && npx vitest run src/exporters/__tests__/mermaid.test.ts
```

Expected: test fails — `file1["File 1"]` appears twice in the output.

---

### Task 2: Implement the fix

**Files:**
- Modify: `packages/core/src/exporters/mermaid.ts`

- [ ] **Step 3: Add the deduplication guard in `renderNodes`**

In `generateFlowchart`, locate the `renderNodes` inner function (around line 230). At the top of the `for (const node of children)` loop, add the guard:

```typescript
// Before (line ~233):
for (const node of children) {
  const nodeId = sanitizeId(node.id)
  const label = escapeLabel(node.metadata.label)

// After:
for (const node of children) {
  const nodeId = sanitizeId(node.id)
  if (renderedNodes.has(nodeId)) continue   // <-- ADD THIS LINE
  const label = escapeLabel(node.metadata.label)
```

- [ ] **Step 4: Run the test to confirm it passes**

```bash
cd packages/core && npx vitest run src/exporters/__tests__/mermaid.test.ts
```

Expected: all tests pass, including the new duplicate-node test.

- [ ] **Step 5: Run the full core test suite to check for regressions**

```bash
cd packages/core && npm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add packages/core/src/exporters/mermaid.ts \
        packages/core/src/exporters/__tests__/mermaid.test.ts
git commit -m "fix: skip duplicate nodes in mermaid flowchart renderNodes"
```
