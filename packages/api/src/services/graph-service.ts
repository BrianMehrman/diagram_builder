/**
 * Graph Query Service
 *
 * Business logic for retrieving graph data from Neo4j
 * Implements caching for performance optimization
 */

import { runQuery } from '../database/query-utils';
import { buildCacheKey } from '../cache/cache-keys';
import * as cache from '../cache/cache-utils';
import type { IVMGraph, IVMNode, IVMEdge, GraphStats, NodeType, EdgeType, LODLevel, BoundingBox } from '@diagram-builder/core';

/**
 * Simplified node structure from Neo4j
 */
interface Neo4jNode {
  id: string;
  type: NodeType;
  label: string;
  path: string;
  x?: number;
  y?: number;
  z?: number;
  lod?: LODLevel;
  parentId?: string;
  language?: string;
  loc?: number;
  complexity?: number;
  dependencyCount?: number;
  dependentCount?: number;
  startLine?: number;
  endLine?: number;
  startColumn?: number;
  endColumn?: number;
  visibility?: string;
  methodCount?: number;
  properties?: Record<string, unknown>;
}

/**
 * Simplified edge structure from Neo4j
 */
interface Neo4jEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  lod?: LODLevel;
  label?: string;
  weight?: number;
  circular?: boolean;
  reference?: string;
  properties?: Record<string, unknown>;
}

/**
 * Repository metadata from Neo4j
 */
interface Neo4jRepository {
  id: string;
  name: string;
  rootPath: string;
  repositoryUrl?: string;
  branch?: string;
  commit?: string;
  parsedAt?: string;
}

/**
 * Get full graph for a repository
 * Returns complete IVM structure with all nodes and edges
 *
 * @param repoId - Repository ID
 * @returns Complete IVM graph
 */
export async function getFullGraph(repoId: string): Promise<IVMGraph | null> {
  // Check cache first
  const cacheKey = buildCacheKey('graph', repoId);
  const cached = await cache.get<IVMGraph>(cacheKey);
  if (cached) {
    return cached;
  }

  // Query repository metadata
  const repoQuery = `
    MATCH (r:Repository {id: $repoId})
    RETURN r.id as id, r.name as name, r.rootPath as rootPath,
           r.repositoryUrl as repositoryUrl, r.branch as branch,
           r.commit as commit, r.parsedAt as parsedAt
  `;
  const repoResults = await runQuery<Neo4jRepository>(repoQuery, { repoId });

  if (!repoResults || repoResults.length === 0) {
    return null;
  }

  const repo = repoResults[0]!;

  // Query all nodes for this repository
  const nodesQuery = `
    MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(n)
    RETURN n.id as id, n.type as type, n.label as label, n.path as path,
           n.x as x, n.y as y, n.z as z, n.lod as lod, n.parentId as parentId,
           n.language as language, n.loc as loc, n.complexity as complexity,
           n.dependencyCount as dependencyCount, n.dependentCount as dependentCount,
           n.startLine as startLine, n.endLine as endLine,
           n.startColumn as startColumn, n.endColumn as endColumn,
           n.visibility as visibility, n.methodCount as methodCount,
           n.properties as properties
  `;
  const nodeResults = await runQuery<Neo4jNode>(nodesQuery, { repoId });

  // Query all edges for this repository
  const edgesQuery = `
    MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(source)
    MATCH (source)-[e]->(target)
    WHERE type(e) IN ['IMPORTS', 'EXPORTS', 'EXTENDS', 'IMPLEMENTS', 'CALLS', 'USES', 'DEPENDS_ON', 'TYPE_OF', 'RETURNS', 'PARAMETER_OF']
    RETURN id(e) as id, source.id as source, target.id as target,
           toLower(type(e)) as type, e.lod as lod, e.label as label,
           e.weight as weight, e.circular as circular, e.reference as reference,
           e.properties as properties
  `;
  const edgeResults = await runQuery<Neo4jEdge>(edgesQuery, { repoId });

  // Transform Neo4j results to graph format
  // Uses IVMNode as base but adds top-level fields for UI consumption
  const nodes = nodeResults.map(node => ({
    id: node.id,
    type: node.type,
    position: {
      x: node.x ?? 0,
      y: node.y ?? 0,
      z: node.z ?? 0,
    },
    lod: (node.lod ?? 3) as LODLevel,
    ...(node.parentId && { parentId: node.parentId }),
    ...(node.visibility && { visibility: node.visibility }),
    ...(node.methodCount !== undefined && node.methodCount !== null && { methodCount: node.methodCount }),
    metadata: {
      label: node.label,
      path: node.path,
      ...(node.language && { language: node.language }),
      ...(node.loc !== undefined && { loc: node.loc }),
      ...(node.complexity !== undefined && { complexity: node.complexity }),
      ...(node.dependencyCount !== undefined && { dependencyCount: node.dependencyCount }),
      ...(node.dependentCount !== undefined && { dependentCount: node.dependentCount }),
      ...(node.startLine !== undefined && node.endLine !== undefined && {
        location: {
          startLine: node.startLine,
          endLine: node.endLine,
          ...(node.startColumn !== undefined && { startColumn: node.startColumn }),
          ...(node.endColumn !== undefined && { endColumn: node.endColumn }),
        }
      }),
      ...(node.properties && { properties: node.properties }),
    },
  }));

  const edges: IVMEdge[] = edgeResults.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type,
    lod: (edge.lod ?? 3) as LODLevel,
    metadata: {
      ...(edge.label && { label: edge.label }),
      ...(edge.weight !== undefined && { weight: edge.weight }),
      ...(edge.circular !== undefined && { circular: edge.circular }),
      ...(edge.reference && { reference: edge.reference }),
      ...(edge.properties && { properties: edge.properties }),
    },
  }));

  // Calculate statistics
  const stats = calculateGraphStats(nodes, edges);

  // Calculate bounding box
  const bounds = calculateBoundingBox(nodes);

  // Extract unique languages
  const languages = [...new Set(nodes.map(n => n.metadata.language).filter(Boolean))] as string[];

  // Build complete IVM graph
  const graph: IVMGraph = {
    nodes,
    edges,
    metadata: {
      name: repo.name,
      schemaVersion: '1.0.0',
      generatedAt: repo.parsedAt ?? new Date().toISOString(),
      rootPath: repo.rootPath,
      ...(repo.repositoryUrl && { repositoryUrl: repo.repositoryUrl }),
      ...(repo.branch && { branch: repo.branch }),
      ...(repo.commit && { commit: repo.commit }),
      stats,
      languages,
    },
    bounds,
  };

  // Cache the result
  await cache.set(cacheKey, graph);

  return graph;
}

/**
 * Get details for a specific node
 *
 * @param repoId - Repository ID
 * @param nodeId - Node ID
 * @returns Node details or null if not found
 */
export async function getNodeDetails(repoId: string, nodeId: string): Promise<IVMNode | null> {
  // Check cache first
  const cacheKey = buildCacheKey('graph', `${repoId}:node:${nodeId}`);
  const cached = await cache.get<IVMNode>(cacheKey);
  if (cached) {
    return cached;
  }

  // Query node with repository validation
  const query = `
    MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(n {id: $nodeId})
    RETURN n.id as id, n.type as type, n.label as label, n.path as path,
           n.x as x, n.y as y, n.z as z, n.lod as lod, n.parentId as parentId,
           n.language as language, n.loc as loc, n.complexity as complexity,
           n.dependencyCount as dependencyCount, n.dependentCount as dependentCount,
           n.startLine as startLine, n.endLine as endLine,
           n.startColumn as startColumn, n.endColumn as endColumn,
           n.properties as properties
  `;
  const results = await runQuery<Neo4jNode>(query, { repoId, nodeId });

  if (!results || results.length === 0) {
    return null;
  }

  const node = results[0]!;
  const ivmNode: IVMNode = {
    id: node.id,
    type: node.type,
    position: {
      x: node.x ?? 0,
      y: node.y ?? 0,
      z: node.z ?? 0,
    },
    lod: (node.lod ?? 3) as LODLevel,
    ...(node.parentId && { parentId: node.parentId }),
    metadata: {
      label: node.label,
      path: node.path,
      ...(node.language && { language: node.language }),
      ...(node.loc !== undefined && { loc: node.loc }),
      ...(node.complexity !== undefined && { complexity: node.complexity }),
      ...(node.dependencyCount !== undefined && { dependencyCount: node.dependencyCount }),
      ...(node.dependentCount !== undefined && { dependentCount: node.dependentCount }),
      ...(node.startLine !== undefined && node.endLine !== undefined && {
        location: {
          startLine: node.startLine,
          endLine: node.endLine,
          ...(node.startColumn !== undefined && { startColumn: node.startColumn }),
          ...(node.endColumn !== undefined && { endColumn: node.endColumn }),
        }
      }),
      ...(node.properties && { properties: node.properties }),
    },
  };

  // Cache the result
  await cache.set(cacheKey, ivmNode);

  return ivmNode;
}

/**
 * Get dependencies for a specific node
 * Returns all nodes that the specified node depends on
 *
 * @param repoId - Repository ID
 * @param nodeId - Node ID
 * @returns Array of dependent nodes
 */
export async function getNodeDependencies(repoId: string, nodeId: string): Promise<IVMNode[]> {
  // Check cache first
  const cacheKey = buildCacheKey('graph', `${repoId}:deps:${nodeId}`);
  const cached = await cache.get<IVMNode[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Query dependencies with repository validation
  const query = `
    MATCH (r:Repository {id: $repoId})-[:CONTAINS*]->(source {id: $nodeId})
    MATCH (source)-[e]->(target)
    WHERE type(e) IN ['IMPORTS', 'DEPENDS_ON', 'USES', 'CALLS', 'EXTENDS', 'IMPLEMENTS']
    RETURN DISTINCT target.id as id, target.type as type, target.label as label,
           target.path as path, target.x as x, target.y as y, target.z as z,
           target.lod as lod, target.parentId as parentId,
           target.language as language, target.loc as loc,
           target.complexity as complexity,
           target.dependencyCount as dependencyCount,
           target.dependentCount as dependentCount,
           target.startLine as startLine, target.endLine as endLine,
           target.startColumn as startColumn, target.endColumn as endColumn,
           target.properties as properties
  `;
  const results = await runQuery<Neo4jNode>(query, { repoId, nodeId });

  const dependencies: IVMNode[] = results.map(node => ({
    id: node.id,
    type: node.type,
    position: {
      x: node.x ?? 0,
      y: node.y ?? 0,
      z: node.z ?? 0,
    },
    lod: (node.lod ?? 3) as LODLevel,
    ...(node.parentId && { parentId: node.parentId }),
    metadata: {
      label: node.label,
      path: node.path,
      ...(node.language && { language: node.language }),
      ...(node.loc !== undefined && { loc: node.loc }),
      ...(node.complexity !== undefined && { complexity: node.complexity }),
      ...(node.dependencyCount !== undefined && { dependencyCount: node.dependencyCount }),
      ...(node.dependentCount !== undefined && { dependentCount: node.dependentCount }),
      ...(node.startLine !== undefined && node.endLine !== undefined && {
        location: {
          startLine: node.startLine,
          endLine: node.endLine,
          ...(node.startColumn !== undefined && { startColumn: node.startColumn }),
          ...(node.endColumn !== undefined && { endColumn: node.endColumn }),
        }
      }),
      ...(node.properties && { properties: node.properties }),
    },
  }));

  // Cache the result
  await cache.set(cacheKey, dependencies);

  return dependencies;
}

/**
 * Execute a custom Cypher query
 * Query must be scoped to the specified repository for security
 *
 * @param repoId - Repository ID
 * @param cypherQuery - Cypher query string
 * @param params - Query parameters
 * @returns Query results as raw objects
 */
export async function executeCustomQuery(
  repoId: string,
  cypherQuery: string,
  params: Record<string, unknown> = {}
): Promise<Record<string, unknown>[]> {
  // Create cache key based on query and params
  const queryHash = createQueryHash(cypherQuery, params);
  const cacheKey = buildCacheKey('query', `${repoId}:${queryHash}`);

  const cached = await cache.get<Record<string, unknown>[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // Inject repoId into params for security
  const queryParams = { ...params, repoId };

  // Validate that query references the repository (basic security check)
  if (!cypherQuery.includes('$repoId') && !cypherQuery.includes('{repoId}')) {
    throw new Error('Query must be scoped to repository using $repoId parameter');
  }

  // Execute query
  const results = await runQuery<Record<string, unknown>>(cypherQuery, queryParams);

  // Cache the result
  await cache.set(cacheKey, results);

  return results;
}

/**
 * Calculate statistics for the graph
 */
function calculateGraphStats(nodes: IVMNode[], edges: IVMEdge[]): GraphStats {
  const nodesByType: Record<NodeType, number> = {} as Record<NodeType, number>;
  const edgesByType: Record<EdgeType, number> = {} as Record<EdgeType, number>;

  nodes.forEach(node => {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
  });

  edges.forEach(edge => {
    edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
  });

  const totalLoc = nodes.reduce((sum, node) => sum + (node.metadata.loc || 0), 0);
  const nodesWithComplexity = nodes.filter(n => n.metadata.complexity !== undefined);
  const avgComplexity = nodesWithComplexity.length > 0
    ? nodesWithComplexity.reduce((sum, n) => sum + (n.metadata.complexity || 0), 0) / nodesWithComplexity.length
    : undefined;

  return {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    nodesByType,
    edgesByType,
    ...(totalLoc > 0 && { totalLoc }),
    ...(avgComplexity !== undefined && { avgComplexity }),
  };
}

/**
 * Calculate bounding box for all nodes
 */
function calculateBoundingBox(nodes: IVMNode[]): BoundingBox {
  if (nodes.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }

  const positions = nodes.map(n => n.position);

  return {
    min: {
      x: Math.min(...positions.map(p => p.x)),
      y: Math.min(...positions.map(p => p.y)),
      z: Math.min(...positions.map(p => p.z)),
    },
    max: {
      x: Math.max(...positions.map(p => p.x)),
      y: Math.max(...positions.map(p => p.y)),
      z: Math.max(...positions.map(p => p.z)),
    },
  };
}

/**
 * Create a hash from query and params for caching
 */
function createQueryHash(query: string, params: Record<string, unknown>): string {
  const content = JSON.stringify({ query, params });

  // Simple hash function (for production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(36);
}
