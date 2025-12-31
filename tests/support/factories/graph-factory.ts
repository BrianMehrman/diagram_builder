/**
 * Graph Data Factory
 *
 * Factory functions for generating test graph data (nodes, edges, repositories).
 * Uses @faker-js/faker for dynamic, parallel-safe data generation.
 */

import { faker } from '@faker-js/faker';

export type GraphNode = {
  id: string;
  label: string;
  type: 'file' | 'class' | 'function';
  language: string;
  lineCount?: number;
  position?: { x: number; y: number; z: number };
};

export type GraphEdge = {
  id: string;
  source: string;
  target: string;
  type: 'contains' | 'depends_on' | 'calls';
};

export type Graph = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metadata: {
    totalNodes: number;
    totalEdges: number;
    repositoryId: string;
  };
};

export type Repository = {
  id: string;
  url: string;
  path: string;
  branch: string;
  status: 'parsing' | 'completed' | 'failed';
  nodeCount: number;
  edgeCount: number;
  createdAt: Date;
};

/**
 * Create a graph node with overrides
 */
export const createGraphNode = (overrides: Partial<GraphNode> = {}): GraphNode => ({
  id: faker.string.uuid(),
  label: faker.system.fileName(),
  type: faker.helpers.arrayElement(['file', 'class', 'function'] as const),
  language: faker.helpers.arrayElement(['typescript', 'javascript', 'python', 'java']),
  lineCount: faker.number.int({ min: 10, max: 500 }),
  position: {
    x: faker.number.float({ min: -100, max: 100 }),
    y: faker.number.float({ min: -100, max: 100 }),
    z: faker.number.float({ min: -100, max: 100 }),
  },
  ...overrides,
});

/**
 * Create multiple graph nodes
 */
export const createGraphNodes = (count: number, overrides: Partial<GraphNode> = {}): GraphNode[] =>
  Array.from({ length: count }, () => createGraphNode(overrides));

/**
 * Create a graph edge with overrides
 */
export const createGraphEdge = (
  sourceNode?: GraphNode,
  targetNode?: GraphNode,
  overrides: Partial<GraphEdge> = {},
): GraphEdge => {
  const source = sourceNode?.id || faker.string.uuid();
  const target = targetNode?.id || faker.string.uuid();

  return {
    id: faker.string.uuid(),
    source,
    target,
    type: faker.helpers.arrayElement(['contains', 'depends_on', 'calls'] as const),
    ...overrides,
  };
};

/**
 * Create a complete graph with nodes and edges
 */
export const createGraph = (
  nodeCount: number = 10,
  edgeCount: number = 5,
  overrides: Partial<Graph> = {},
): Graph => {
  const nodes = createGraphNodes(nodeCount);
  const edges: GraphEdge[] = [];

  // Create edges between random nodes
  for (let i = 0; i < edgeCount; i++) {
    const sourceNode = faker.helpers.arrayElement(nodes);
    const targetNode = faker.helpers.arrayElement(nodes);

    if (sourceNode.id !== targetNode.id) {
      edges.push(createGraphEdge(sourceNode, targetNode));
    }
  }

  return {
    nodes,
    edges,
    metadata: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      repositoryId: faker.string.uuid(),
    },
    ...overrides,
  };
};

/**
 * Create a repository with overrides
 */
export const createRepository = (overrides: Partial<Repository> = {}): Repository => ({
  id: faker.string.uuid(),
  url: faker.internet.url({ protocol: 'https' }),
  path: `/repos/${faker.system.directoryPath()}`,
  branch: faker.helpers.arrayElement(['main', 'develop', 'feature/test']),
  status: 'completed',
  nodeCount: faker.number.int({ min: 10, max: 1000 }),
  edgeCount: faker.number.int({ min: 5, max: 500 }),
  createdAt: faker.date.recent(),
  ...overrides,
});

/**
 * Create a repository parse request payload
 */
export const createParseRequest = (overrides: Record<string, string> = {}) => ({
  url: faker.internet.url({ protocol: 'https' }),
  branch: faker.helpers.arrayElement(['main', 'develop']),
  ...overrides,
});
