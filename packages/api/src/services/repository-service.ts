/**
 * Repository Service
 *
 * Orchestrates repository parsing operations using the parser package
 * and stores results in Neo4j
 *
 * NOTE: This is a simplified implementation. Full parser integration will be completed
 * in subsequent iterations.
 */

import { v4 as uuidv4 } from 'uuid';
import { runQuery } from '../database/query-utils';
import { invalidatePattern } from '../cache/cache-utils';

/**
 * Request to parse a repository
 */
export interface ParseRepositoryRequest {
  url?: string;
  path?: string;
  branch?: string;
  token?: string;
}

/**
 * Repository metadata returned from Neo4j
 */
export interface RepositoryMetadata {
  id: string;
  name: string;
  url: string | null;
  path: string | null;
  branch: string | null;
  createdAt: string;
  lastUpdated: string;
  fileCount: number;
  nodeCount: number;
  status: 'parsing' | 'completed' | 'failed';
}

/**
 * Parse a repository and store IVM in Neo4j
 *
 * @param request - Repository parsing request
 * @returns Repository ID and status
 */
export async function parseAndStoreRepository(request: ParseRepositoryRequest): Promise<{ id: string; status: string }> {
  const { url, path, branch } = request;

  // Generate unique repository ID
  const repoId = uuidv4();

  try {
    // TODO: Integrate with parser package
    // For now, create a minimal repository entry
    await runQuery(
      `
        CREATE (r:Repository {
          id: $id,
          name: $name,
          url: $url,
          path: $path,
          branch: $branch,
          createdAt: datetime(),
          lastUpdated: datetime(),
          status: 'completed'
        })
      `,
      {
        id: repoId,
        name: url || path || 'Unknown Repository',
        url: url || null,
        path: path || null,
        branch: branch || 'main'
      }
    );

    return {
      id: repoId,
      status: 'completed'
    };
  } catch (error) {
    // Store failed parsing status
    const metadata: Record<string, string> = {};
    if (url) metadata.url = url;
    if (path) metadata.path = path;
    if (branch) metadata.branch = branch;

    await storeParsingFailure(repoId, metadata, error);

    throw error;
  }
}

/**
 * Store parsing failure in Neo4j
 */
async function storeParsingFailure(
  repoId: string,
  metadata: Record<string, string>,
  error: unknown
): Promise<void> {
  await runQuery(
    `
      CREATE (r:Repository {
        id: $id,
        name: $name,
        url: $url,
        path: $path,
        branch: $branch,
        createdAt: datetime(),
        lastUpdated: datetime(),
        status: 'failed',
        error: $error
      })
    `,
    {
      id: repoId,
      name: 'Failed Repository',
      url: metadata['url'] || null,
      path: metadata['path'] || null,
      branch: metadata['branch'] || 'main',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  );
}

/**
 * Get repository metadata from Neo4j
 *
 * @param repoId - Repository ID
 * @returns Repository metadata or null if not found
 */
export async function getRepositoryMetadata(repoId: string): Promise<RepositoryMetadata | null> {
  const results = await runQuery<{
    r: {
      id: string;
      name: string;
      url: string | null;
      path: string | null;
      branch: string | null;
      createdAt: string;
      lastUpdated: string;
      status: string;
    };
    fileCount: number;
    nodeCount: number;
  }>(
    `
      MATCH (r:Repository {id: $id})
      OPTIONAL MATCH (r)-[:CONTAINS]->(f:File)
      WITH r, count(f) as fileCount
      OPTIONAL MATCH (r)-[:CONTAINS*]->(n)
      RETURN r, fileCount, count(n) as nodeCount
    `,
    { id: repoId }
  );

  if (results.length === 0) {
    return null;
  }

  const result = results[0];

  if (!result) {
    return null;
  }

  return {
    id: result.r.id,
    name: result.r.name,
    url: result.r.url,
    path: result.r.path,
    branch: result.r.branch,
    createdAt: result.r.createdAt,
    lastUpdated: result.r.lastUpdated,
    fileCount: result.fileCount,
    nodeCount: result.nodeCount,
    status: result.r.status as 'parsing' | 'completed' | 'failed'
  };
}

/**
 * Delete repository and all associated nodes from Neo4j
 *
 * @param repoId - Repository ID
 * @returns true if repository was deleted, false if not found
 */
export async function deleteRepository(repoId: string): Promise<boolean> {
  // Check if repository exists
  const metadata = await getRepositoryMetadata(repoId);
  if (!metadata) {
    return false;
  }

  // Delete repository and all connected nodes
  await runQuery(
    `
      MATCH (r:Repository {id: $id})
      OPTIONAL MATCH (r)-[*]->(n)
      DETACH DELETE r, n
    `,
    { id: repoId }
  );

  // Invalidate cache
  await invalidatePattern(`diagram-builder:*:${repoId}:*`);
  await invalidatePattern(`diagram-builder:graph:${repoId}`);

  return true;
}

/**
 * Refresh (re-parse) repository
 *
 * @param repoId - Repository ID
 * @returns Parsing status
 */
export async function refreshRepository(repoId: string): Promise<{ id: string; status: string }> {
  // Get existing repository metadata
  const metadata = await getRepositoryMetadata(repoId);
  if (!metadata) {
    throw new Error('Repository not found');
  }

  // Delete existing repository data
  await deleteRepository(repoId);

  // Re-parse repository with same configuration
  const request: ParseRepositoryRequest = {};
  if (metadata.url) request.url = metadata.url;
  if (metadata.path) request.path = metadata.path;
  if (metadata.branch) request.branch = metadata.branch;

  return parseAndStoreRepository(request);
}
