/**
 * Graph Quality Assertion Utilities
 *
 * Reusable assertion functions for validating graph data quality
 * across parser, API, and E2E tests.
 */

import { expect } from 'vitest';

/**
 * Valid node types
 */
const VALID_NODE_TYPES = ['file', 'class', 'function', 'method', 'variable'] as const;

/**
 * Valid edge types
 */
const VALID_EDGE_TYPES = ['contains', 'imports', 'depends_on', 'calls', 'extends', 'implements'] as const;

/**
 * Assert graph has minimum node and edge counts
 */
export function assertMinimumGraphSize(
  nodes: any[],
  edges: any[],
  minNodes: number,
  minEdges: number
) {
  expect(nodes.length, `Expected at least ${minNodes} nodes, got ${nodes.length}`).toBeGreaterThanOrEqual(minNodes);
  expect(edges.length, `Expected at least ${minEdges} edges, got ${edges.length}`).toBeGreaterThanOrEqual(minEdges);
}

/**
 * Assert all nodes have required fields
 */
export function assertNodeStructure(nodes: any[]) {
  nodes.forEach((node, index) => {
    expect(node, `Node ${index} is null or undefined`).toBeTruthy();
    expect(node.id, `Node ${index} missing 'id' field`).toBeTruthy();
    expect(node.type, `Node ${index} missing 'type' field`).toBeTruthy();
    expect(node.label, `Node ${index} missing 'label' field`).toBeTruthy();
    expect(node, `Node ${index} missing 'metadata' field`).toHaveProperty('metadata');
    expect(node, `Node ${index} missing 'lod' field`).toHaveProperty('lod');

    // Validate types
    expect(typeof node.id, `Node ${index} 'id' must be string`).toBe('string');
    expect(typeof node.type, `Node ${index} 'type' must be string`).toBe('string');
    expect(typeof node.label, `Node ${index} 'label' must be string`).toBe('string');
    expect(typeof node.lod, `Node ${index} 'lod' must be number`).toBe('number');
    expect(node.lod, `Node ${index} 'lod' must be >= 0`).toBeGreaterThanOrEqual(0);

    // Validate node type is valid
    expect(
      VALID_NODE_TYPES.includes(node.type),
      `Node ${index} has invalid type '${node.type}'. Valid types: ${VALID_NODE_TYPES.join(', ')}`
    ).toBe(true);

    // Validate position if present
    if (node.position) {
      expect(typeof node.position.x, `Node ${index} position.x must be number`).toBe('number');
      expect(typeof node.position.y, `Node ${index} position.y must be number`).toBe('number');
      expect(typeof node.position.z, `Node ${index} position.z must be number`).toBe('number');
      expect(isFinite(node.position.x), `Node ${index} position.x must be finite`).toBe(true);
      expect(isFinite(node.position.y), `Node ${index} position.y must be finite`).toBe(true);
      expect(isFinite(node.position.z), `Node ${index} position.z must be finite`).toBe(true);
    }
  });
}

/**
 * Assert all edges have required fields
 */
export function assertEdgeStructure(edges: any[]) {
  edges.forEach((edge, index) => {
    expect(edge, `Edge ${index} is null or undefined`).toBeTruthy();
    expect(edge.id, `Edge ${index} missing 'id' field`).toBeTruthy();
    expect(edge.source, `Edge ${index} missing 'source' field`).toBeTruthy();
    expect(edge.target, `Edge ${index} missing 'target' field`).toBeTruthy();
    expect(edge.type, `Edge ${index} missing 'type' field`).toBeTruthy();
    expect(edge, `Edge ${index} missing 'metadata' field`).toHaveProperty('metadata');

    // Validate types
    expect(typeof edge.id, `Edge ${index} 'id' must be string`).toBe('string');
    expect(typeof edge.source, `Edge ${index} 'source' must be string`).toBe('string');
    expect(typeof edge.target, `Edge ${index} 'target' must be string`).toBe('string');
    expect(typeof edge.type, `Edge ${index} 'type' must be string`).toBe('string');

    // Validate edge type is valid
    expect(
      VALID_EDGE_TYPES.includes(edge.type),
      `Edge ${index} has invalid type '${edge.type}'. Valid types: ${VALID_EDGE_TYPES.join(', ')}`
    ).toBe(true);
  });
}

/**
 * Assert all edge references exist in nodes
 */
export function assertEdgeReferences(nodes: any[], edges: any[]) {
  const nodeIds = new Set(nodes.map((n) => n.id));

  edges.forEach((edge, index) => {
    expect(
      nodeIds.has(edge.source),
      `Edge ${index} source '${edge.source}' does not exist in nodes`
    ).toBe(true);
    expect(
      nodeIds.has(edge.target),
      `Edge ${index} target '${edge.target}' does not exist in nodes`
    ).toBe(true);
  });
}

/**
 * Assert no self-referencing edges (node points to itself)
 */
export function assertNoSelfReferences(edges: any[]) {
  edges.forEach((edge, index) => {
    expect(
      edge.source !== edge.target,
      `Edge ${index} is self-referencing (source === target: '${edge.source}')`
    ).toBe(true);
  });
}

/**
 * Assert all node IDs are unique
 */
export function assertUniqueNodeIds(nodes: any[]) {
  const ids = nodes.map((n) => n.id);
  const uniqueIds = new Set(ids);

  expect(
    uniqueIds.size,
    `Duplicate node IDs found. Expected ${ids.length} unique IDs, got ${uniqueIds.size}`
  ).toBe(ids.length);
}

/**
 * Assert all edge IDs are unique
 */
export function assertUniqueEdgeIds(edges: any[]) {
  const ids = edges.map((e) => e.id);
  const uniqueIds = new Set(ids);

  expect(
    uniqueIds.size,
    `Duplicate edge IDs found. Expected ${ids.length} unique IDs, got ${uniqueIds.size}`
  ).toBe(ids.length);
}

/**
 * Assert graph metadata is correct
 */
export function assertGraphMetadata(metadata: any, expectedNodes: number, expectedEdges: number) {
  expect(metadata, 'Metadata is null or undefined').toBeTruthy();
  expect(metadata, 'Metadata missing repositoryId').toHaveProperty('repositoryId');
  expect(metadata, 'Metadata missing totalNodes').toHaveProperty('totalNodes');
  expect(metadata, 'Metadata missing totalEdges').toHaveProperty('totalEdges');
  expect(metadata.totalNodes, `Metadata totalNodes (${metadata.totalNodes}) !== actual nodes (${expectedNodes})`).toBe(expectedNodes);
  expect(metadata.totalEdges, `Metadata totalEdges (${metadata.totalEdges}) !== actual edges (${expectedEdges})`).toBe(expectedEdges);
}

/**
 * Assert LOD levels are valid and consistent
 */
export function assertLODConsistency(nodes: any[]) {
  // Group nodes by type
  const fileNodes = nodes.filter((n) => n.type === 'file');
  const classNodes = nodes.filter((n) => n.type === 'class');
  const functionNodes = nodes.filter((n) => n.type === 'function');
  const methodNodes = nodes.filter((n) => n.type === 'method');
  const variableNodes = nodes.filter((n) => n.type === 'variable');

  // Assert LOD ranges by type (based on IVM spec)
  fileNodes.forEach((node) => {
    expect(node.lod, `File node '${node.id}' should have LOD 0, got ${node.lod}`).toBe(0);
  });

  classNodes.forEach((node) => {
    expect(node.lod, `Class node '${node.id}' should have LOD <= 1, got ${node.lod}`).toBeLessThanOrEqual(1);
  });

  functionNodes.forEach((node) => {
    expect(node.lod, `Function node '${node.id}' should have LOD <= 2, got ${node.lod}`).toBeLessThanOrEqual(2);
  });

  methodNodes.forEach((node) => {
    expect(node.lod, `Method node '${node.id}' should have LOD <= 3, got ${node.lod}`).toBeLessThanOrEqual(3);
  });

  variableNodes.forEach((node) => {
    expect(node.lod, `Variable node '${node.id}' should have LOD <= 4, got ${node.lod}`).toBeLessThanOrEqual(4);
  });
}

/**
 * Assert no orphaned nodes (nodes with no incoming or outgoing edges)
 * Excludes file nodes which can be at the root
 */
export function assertNoOrphanedNodes(nodes: any[], edges: any[]) {
  const connectedNodeIds = new Set<string>();

  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  const orphanedNodes = nodes.filter(
    (node) => node.type !== 'file' && !connectedNodeIds.has(node.id)
  );

  expect(
    orphanedNodes.length,
    `Found ${orphanedNodes.length} orphaned nodes: ${orphanedNodes.map((n) => n.id).join(', ')}`
  ).toBe(0);
}

/**
 * Comprehensive graph quality validation
 * Runs all assertions for complete quality check
 */
export function assertGraphQuality(graph: {
  nodes: any[];
  edges: any[];
  metadata?: any;
}, options?: {
  minNodes?: number;
  minEdges?: number;
  checkMetadata?: boolean;
  checkLOD?: boolean;
  checkOrphans?: boolean;
}) {
  const {
    minNodes = 1,
    minEdges = 0,
    checkMetadata = true,
    checkLOD = true,
    checkOrphans = true,
  } = options || {};

  // Basic size check
  assertMinimumGraphSize(graph.nodes, graph.edges, minNodes, minEdges);

  // Structure validation
  assertNodeStructure(graph.nodes);
  assertEdgeStructure(graph.edges);

  // Integrity checks
  assertEdgeReferences(graph.nodes, graph.edges);
  assertNoSelfReferences(graph.edges);
  assertUniqueNodeIds(graph.nodes);
  assertUniqueEdgeIds(graph.edges);

  // Optional metadata check
  if (checkMetadata && graph.metadata) {
    assertGraphMetadata(graph.metadata, graph.nodes.length, graph.edges.length);
  }

  // Optional LOD consistency check
  if (checkLOD) {
    assertLODConsistency(graph.nodes);
  }

  // Optional orphan check
  if (checkOrphans) {
    assertNoOrphanedNodes(graph.nodes, graph.edges);
  }
}
