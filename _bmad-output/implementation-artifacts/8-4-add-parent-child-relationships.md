# Story 8-4: Add Parent-Child Relationships

**Status:** not-started

---

## Story

**ID:** 8-4
**Key:** 8-4-add-parent-child-relationships
**Title:** Establish Parent-Child Relationships Between Nodes
**Epic:** Epic 8 - City-to-Cell 3D Layout
**Phase:** Implementation - Phase 1 (Data Foundation)
**Priority:** HIGH - Required for cell view

**As a** developer viewing the 3D codebase visualization,
**I want** nodes to have explicit parent-child relationships,
**So that** the cell view can show methods/functions as organelles inside their containing class.

**Description:**

Enhance the parser to populate the `parentId` field on GraphNodes, establishing containment relationships. This enables the cell view to render class internals as organelles floating within the cell membrane.

**Context:**

From UX 3D Layout Vision:
- Inside a class, methods appear as organelles
- Organelles are contained within the cell membrane
- Parent-child relationships define containment

Containment hierarchy:
- File contains Classes, Functions, Variables
- Class contains Methods, Properties
- Function contains nested Functions (closures)

---

## Acceptance Criteria

- **AC-1:** Parser populates parentId for contained elements
  - Methods have parentId pointing to their Class
  - Class-level properties have parentId pointing to Class
  - Module-level items have parentId pointing to File

- **AC-2:** Containment edges created
  - GraphEdge with type 'contains' links parent to children
  - Enables querying "what's inside this class?"

- **AC-3:** Hierarchy traversable in both directions
  - Child → Parent via `parentId`
  - Parent → Children via 'contains' edges

- **AC-4:** Nested structures handled correctly
  - Nested classes (class inside class)
  - Closures (function inside function)
  - Max depth tracked for complex nesting

- **AC-5:** Unit tests verify parent-child linking
  - Test class with methods
  - Test file with multiple classes
  - Test nested functions
  - Test module-level vs class-level

---

## Technical Approach

### AST Traversal for Containment

```typescript
// packages/parser/src/analysis/containmentAnalyzer.ts

interface ContainmentContext {
  parentStack: string[];  // Stack of parent node IDs
}

export function analyzeContainment(
  ast: AST,
  nodes: Map<string, GraphNode>
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const containmentEdges: GraphEdge[] = [];
  const context: ContainmentContext = { parentStack: [] };

  traverseAST(ast, {
    enter(node, astNode) {
      // Set parent ID from stack
      if (context.parentStack.length > 0) {
        const parentId = context.parentStack[context.parentStack.length - 1];
        node.parentId = parentId;

        // Create containment edge
        containmentEdges.push({
          id: `contains:${parentId}:${node.id}`,
          source: parentId,
          target: node.id,
          type: 'contains',
          metadata: {}
        });
      }

      // Push container nodes onto stack
      if (isContainerNode(node)) {
        context.parentStack.push(node.id);
      }
    },

    leave(node) {
      if (isContainerNode(node)) {
        context.parentStack.pop();
      }
    }
  });

  return {
    nodes: Array.from(nodes.values()),
    edges: containmentEdges
  };
}

function isContainerNode(node: GraphNode): boolean {
  return ['file', 'class', 'function'].includes(node.type);
}
```

### Edge Type Extension

```typescript
// Update GraphEdge type
export type EdgeType =
  | 'imports'
  | 'calls'
  | 'extends'
  | 'implements'
  | 'contains'           // New: parent contains child
  | 'external_import';   // From Story 8-3
```

---

## Tasks/Subtasks

### Task 1: Implement containment analyzer
- [ ] Create AST traversal with parent stack
- [ ] Populate parentId on child nodes
- [ ] Create 'contains' edges

### Task 2: Update edge types
- [ ] Add 'contains' to EdgeType union
- [ ] Update any edge type validation

### Task 3: Handle special cases
- [ ] Nested classes
- [ ] Arrow functions vs function declarations
- [ ] Module-level variables

### Task 4: Integrate into parser pipeline
- [ ] Call containment analyzer after AST analysis
- [ ] Merge containment edges into graph
- [ ] Preserve parentId through IVM conversion

### Task 5: Write unit tests
- [ ] Test class with methods
- [ ] Test file with classes
- [ ] Test nested structures
- [ ] Test edge creation

---

## Files to Create

- `packages/parser/src/analysis/containmentAnalyzer.ts` - Main analysis
- `packages/parser/src/analysis/containmentAnalyzer.test.ts` - Unit tests

## Files to Modify

- `packages/core/src/types/graph.ts` - Add 'contains' edge type
- `packages/parser/src/analysis/index.ts` - Export new module
- `packages/parser/src/pipeline.ts` - Integrate containment analysis

---

## Dependencies

- Story 8-1 (GraphNode type with parentId field)

---

## Estimation

**Complexity:** Medium
**Effort:** 4-5 hours
**Risk:** Medium - AST traversal complexity

---

## Definition of Done

- [ ] parentId populated for all contained nodes
- [ ] 'contains' edges created
- [ ] Nested structures handled correctly
- [ ] Unit tests pass
- [ ] Parser pipeline integration complete
