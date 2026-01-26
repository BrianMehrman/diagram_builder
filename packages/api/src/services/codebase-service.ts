/**
 * Codebase Service
 *
 * Handles codebase import operations:
 * - Import codebase from local path or Git URL
 * - List codebases in workspace
 * - Get codebase by ID
 * - Delete codebase
 * - Update codebase status
 */

import { v4 as uuidv4 } from 'uuid';
import { runQuery } from '../database/query-utils';
import { NotFoundError, ValidationError } from '../errors';
import { loadRepository, buildDependencyGraph, convertToIVM, type RepositoryConfig } from '@diagram-builder/parser';
import { readFile } from 'fs/promises';
import * as cache from '../cache/cache-utils';
import { buildCacheKey } from '../cache/cache-keys';
import { logger } from '../logger';
import type {
  Codebase,
  CreateCodebaseInput,
  UpdateCodebaseStatusInput,
} from '../types/codebase';

/**
 * Import a codebase into a workspace
 */
export async function importCodebase(
  workspaceId: string,
  userId: string,
  input: CreateCodebaseInput
): Promise<Codebase> {
  logger.info('Importing codebase', { workspaceId, userId, source: input.source, type: input.type });

  const codebaseId = uuidv4();
  const now = new Date().toISOString();

  // Create Codebase node and link to Workspace
  await runQuery(
    `
    CREATE (c:Codebase {
      id: $id,
      workspaceId: $workspaceId,
      source: $source,
      type: $type,
      branch: $branch,
      status: 'pending',
      error: null,
      repositoryId: null,
      importedAt: $importedAt,
      updatedAt: $updatedAt
    })
    WITH c
    MATCH (w:Workspace {id: $workspaceId})
    CREATE (w)-[:CONTAINS]->(c)
    RETURN c
    `,
    {
      id: codebaseId,
      workspaceId,
      source: input.source,
      type: input.type,
      branch: input.branch || null,
      importedAt: now,
      updatedAt: now,
    }
  );

  // Invalidate workspace codebases cache
  const workspaceCodebasesKey = buildCacheKey('workspace', `${workspaceId}:codebases`);
  await cache.invalidate(workspaceCodebasesKey);

  // Trigger async parser import (fire and forget - updates status when complete)
  triggerParserImport(codebaseId, input).catch((error) => {
    // Log error but don't fail the request
    console.error(`Parser import failed for codebase ${codebaseId}:`, error);
  });

  const codebase: Codebase = {
    id: codebaseId,
    workspaceId,
    source: input.source,
    type: input.type,
    status: 'pending',
    importedAt: now,
    updatedAt: now,
  };
  if (input.branch) {
    codebase.branch = input.branch;
  }
  return codebase;
}

/**
 * Trigger async parser import (internal)
 * This runs in the background and updates codebase status
 */
async function triggerParserImport(
  codebaseId: string,
  input: CreateCodebaseInput
): Promise<void> {
  const startTime = Date.now();
  logger.info('Starting parser import', { codebaseId, source: input.source, type: input.type });

  try {
    // Update status to processing
    await updateCodebaseStatus(codebaseId, { status: 'processing' });

    // Build parser config
    const repoConfig: RepositoryConfig = {
      ...(input.type === 'local' ? { path: input.source } : { url: input.source }),
      ...(input.branch && { branch: input.branch }),
      ...(input.credentials && {
        auth: {
          ...(input.credentials.token && { token: input.credentials.token }),
          ...(input.credentials.sshKeyPath && { sshKeyPath: input.credentials.sshKeyPath }),
        },
      }),
    };

    // Load repository (clone if Git, scan if local)
    const repoContext = await loadRepository(repoConfig);
    logger.info('Repository loaded', {
      codebaseId,
      fileCount: repoContext.files.length,
      type: repoContext.metadata.type,
      path: repoContext.path
    });

    // Read file contents, skipping files that can't be read
    const fileInputs: Array<{ filePath: string; content: string }> = [];
    const skippedFiles: string[] = [];

    for (const filePath of repoContext.files) {
      try {
        const content = await readFile(filePath, 'utf-8');
        // Skip files with null bytes (likely binary)
        if (content.includes('\0')) {
          logger.warn('Skipping binary file', { filePath, codebaseId });
          skippedFiles.push(filePath);
          continue;
        }
        fileInputs.push({ filePath, content });
      } catch (err) {
        logger.warn('Failed to read file, skipping', { filePath, codebaseId, error: (err as Error).message });
        skippedFiles.push(filePath);
      }
    }

    logger.debug('File contents read', {
      codebaseId,
      fileCount: fileInputs.length,
      skippedCount: skippedFiles.length
    });

    // Build dependency graph
    const depGraph = buildDependencyGraph(fileInputs);
    logger.info('Dependency graph built', {
      codebaseId,
      nodeCount: depGraph.getNodes().length,
      edgeCount: depGraph.getEdges().length
    });

    // Convert to IVM
    const ivm = convertToIVM(depGraph, repoContext, {
      name: input.source.split('/').pop() || 'repository',
    });
    logger.info('IVM created', {
      codebaseId,
      ivmNodes: ivm.nodes.length,
      ivmEdges: ivm.edges.length
    });

    // Create Repository node in Neo4j (use MERGE for idempotency)
    const repositoryId = uuidv4();
    await runQuery(
      `
      MERGE (r:Repository {id: $id})
      SET r.name = $name,
          r.rootPath = $rootPath,
          r.repositoryUrl = $repositoryUrl,
          r.branch = $branch,
          r.parsedAt = datetime(),
          r.type = $type,
          r.fileCount = $fileCount
      RETURN r
      `,
      {
        id: repositoryId,
        name: ivm.metadata.name,
        rootPath: repoContext.path,
        repositoryUrl: repoContext.metadata.type === 'git' ? repoContext.metadata.url : null,
        branch: repoContext.metadata.branch || null,
        type: repoContext.metadata.type,
        fileCount: repoContext.metadata.fileCount,
      }
    );

    // Store IVM nodes in Neo4j (use MERGE to handle retries/duplicates)
    for (const node of ivm.nodes) {
      const nodeType = node.type.charAt(0).toUpperCase() + node.type.slice(1); // Capitalize for Neo4j label

      await runQuery(
        `
        MATCH (r:Repository {id: $repoId})
        MERGE (n:${nodeType} {id: $id})
        SET n.label = $label,
            n.path = $path,
            n.type = $type,
            n.x = $x,
            n.y = $y,
            n.z = $z,
            n.lod = $lod,
            n.parentId = $parentId,
            n.language = $language,
            n.loc = $loc,
            n.complexity = $complexity,
            n.metadata = $metadata
        MERGE (r)-[:CONTAINS]->(n)
        `,
        {
          repoId: repositoryId,
          id: node.id,
          label: node.metadata.label,
          path: node.metadata.path,
          type: node.type,
          x: node.position.x,
          y: node.position.y,
          z: node.position.z,
          lod: node.lod,
          parentId: node.parentId || null,
          language: node.metadata.language || null,
          loc: node.metadata.loc || null,
          complexity: node.metadata.complexity || null,
          metadata: JSON.stringify(node.metadata || {}),
        }
      );
    }

    // Store IVM edges in Neo4j (use MERGE to handle retries/duplicates)
    for (const edge of ivm.edges) {
      const edgeType = edge.type.toUpperCase().replace(/-/g, '_'); // Format for Neo4j relationship

      await runQuery(
        `
        MATCH (source {id: $sourceId})
        MATCH (target {id: $targetId})
        MERGE (source)-[rel:${edgeType} {id: $id}]->(target)
        SET rel.label = $label,
            rel.lod = $lod,
            rel.metadata = $metadata
        `,
        {
          id: edge.id,
          sourceId: edge.source,
          targetId: edge.target,
          label: edge.metadata.label || null,
          lod: edge.lod || null,
          metadata: JSON.stringify(edge.metadata || {}),
        }
      );
    }

    // Link Codebase to Repository (use MERGE for idempotency)
    await runQuery(
      `
      MATCH (c:Codebase {id: $codebaseId})
      MATCH (r:Repository {id: $repositoryId})
      MERGE (c)-[:PARSED_INTO]->(r)
      RETURN c, r
      `,
      {
        codebaseId,
        repositoryId,
      }
    );
    logger.info('Graph stored in Neo4j', { codebaseId, repositoryId });

    // Update codebase status to completed
    await updateCodebaseStatus(codebaseId, {
      status: 'completed',
      repositoryId,
    });

    const duration = Date.now() - startTime;
    logger.info('Parser import completed', {
      codebaseId,
      repositoryId,
      duration: `${duration}ms`,
      fileCount: repoContext.files.length,
      nodeCount: ivm.nodes.length,
      edgeCount: ivm.edges.length
    });

    // Cleanup cloned repository if needed
    if (repoContext.cleanup) {
      await repoContext.cleanup();
      logger.debug('Cleaned up temporary files', { codebaseId });
    }
  } catch (error) {
    // Update status to failed with error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('Parser import failed', {
      codebaseId,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });

    await updateCodebaseStatus(codebaseId, {
      status: 'failed',
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * List all codebases in a workspace
 */
export async function listWorkspaceCodebases(workspaceId: string): Promise<Codebase[]> {
  // Check cache first
  const cacheKey = buildCacheKey('workspace', `${workspaceId}:codebases`);
  const cached = await cache.get<Codebase[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await runQuery(
    `
    MATCH (w:Workspace {id: $workspaceId})-[:CONTAINS]->(c:Codebase)
    OPTIONAL MATCH (c)-[:PARSED_INTO]->(r:Repository)
    RETURN c.id as id,
           c.workspaceId as workspaceId,
           c.source as source,
           c.type as type,
           c.branch as branch,
           c.status as status,
           c.error as error,
           r.id as repositoryId,
           c.importedAt as importedAt,
           c.updatedAt as updatedAt
    ORDER BY c.importedAt DESC
    `,
    { workspaceId }
  );

  interface CodebaseRow {
    id: string;
    workspaceId: string;
    source: string;
    type: 'local' | 'git';
    branch: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error: string | null;
    repositoryId: string | null;
    importedAt: string;
    updatedAt: string;
  }

  const codebases: Codebase[] = (rows as CodebaseRow[]).map((row) => {
    const codebase: Codebase = {
      id: row.id,
      workspaceId: row.workspaceId,
      source: row.source,
      type: row.type,
      status: row.status,
      importedAt: row.importedAt,
      updatedAt: row.updatedAt,
    };
    if (row.branch) codebase.branch = row.branch;
    if (row.error) codebase.error = row.error;
    if (row.repositoryId) codebase.repositoryId = row.repositoryId;
    return codebase;
  });

  // Cache results (5-minute TTL)
  await cache.set(cacheKey, codebases);

  return codebases;
}

/**
 * Get a specific codebase by ID
 */
export async function getCodebaseById(
  workspaceId: string,
  codebaseId: string
): Promise<Codebase> {
  // Check cache first
  const cacheKey = buildCacheKey('codebase', codebaseId);
  const cached = await cache.get<Codebase>(cacheKey);
  if (cached) {
    return cached;
  }

  const rows = await runQuery(
    `
    MATCH (c:Codebase {id: $codebaseId})
    OPTIONAL MATCH (c)-[:PARSED_INTO]->(r:Repository)
    RETURN c.id as id,
           c.workspaceId as workspaceId,
           c.source as source,
           c.type as type,
           c.branch as branch,
           c.status as status,
           c.error as error,
           r.id as repositoryId,
           c.importedAt as importedAt,
           c.updatedAt as updatedAt
    `,
    { codebaseId }
  );

  if (rows.length === 0) {
    throw new NotFoundError('Codebase not found', `Codebase with ID ${codebaseId} does not exist`);
  }

  interface CodebaseRow {
    id: string;
    workspaceId: string;
    source: string;
    type: 'local' | 'git';
    branch: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    error: string | null;
    repositoryId: string | null;
    importedAt: string;
    updatedAt: string;
  }

  const row = rows[0] as CodebaseRow;

  // Verify codebase belongs to workspace
  if (row.workspaceId !== workspaceId) {
    throw new NotFoundError('Codebase not found', `Codebase ${codebaseId} not found in workspace ${workspaceId}`);
  }

  const codebase: Codebase = {
    id: row.id,
    workspaceId: row.workspaceId,
    source: row.source,
    type: row.type,
    status: row.status,
    importedAt: row.importedAt,
    updatedAt: row.updatedAt,
  };
  if (row.branch) codebase.branch = row.branch;
  if (row.error) codebase.error = row.error;
  if (row.repositoryId) codebase.repositoryId = row.repositoryId;

  // Cache result (5-minute TTL)
  await cache.set(cacheKey, codebase);

  return codebase;
}

/**
 * Delete a codebase
 * Removes the codebase node, associated repository, and all graph data
 */
export async function deleteCodebase(
  workspaceId: string,
  codebaseId: string
): Promise<void> {
  // First verify codebase exists and belongs to workspace
  const codebase = await getCodebaseById(workspaceId, codebaseId);

  // If codebase has a repository, delete the repository and all its graph data
  if (codebase.repositoryId) {
    logger.info('Deleting repository and graph data', {
      codebaseId,
      repositoryId: codebase.repositoryId
    });

    // Delete all nodes linked to the repository (File, Class, Function, etc.)
    // and the repository itself
    await runQuery(
      `
      MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(n)
      DETACH DELETE n, r
      `,
      { repositoryId: codebase.repositoryId }
    );

    logger.info('Repository and graph data deleted', {
      codebaseId,
      repositoryId: codebase.repositoryId
    });
  }

  // Delete the codebase node
  await runQuery(
    `
    MATCH (c:Codebase {id: $codebaseId})
    DETACH DELETE c
    `,
    { codebaseId }
  );

  logger.info('Codebase deleted', { codebaseId, workspaceId });

  // Invalidate caches
  const codebaseCacheKey = buildCacheKey('codebase', codebaseId);
  const workspaceCodebasesKey = buildCacheKey('workspace', `${workspaceId}:codebases`);
  await Promise.all([
    cache.invalidate(codebaseCacheKey),
    cache.invalidate(workspaceCodebasesKey),
  ]);
}

/**
 * Retry a failed codebase import
 * Resets the codebase status to pending and re-triggers the parser
 */
export async function retryCodebaseImport(
  workspaceId: string,
  codebaseId: string
): Promise<{ success: boolean; status: string }> {
  // Get the codebase to verify it exists and get import config
  const codebase = await getCodebaseById(workspaceId, codebaseId);

  // Verify codebase is in failed state
  if (codebase.status !== 'failed') {
    throw new ValidationError(
      'Invalid request',
      `Cannot retry codebase with status "${codebase.status}". Only failed imports can be retried.`
    );
  }

  logger.info('Retrying codebase import', {
    codebaseId,
    workspaceId,
    source: codebase.source
  });

  // If there's an existing repository from a previous attempt, clean it up
  if (codebase.repositoryId) {
    logger.info('Cleaning up previous repository attempt', {
      codebaseId,
      repositoryId: codebase.repositoryId
    });

    await runQuery(
      `
      MATCH (r:Repository {id: $repositoryId})-[:CONTAINS]->(n)
      DETACH DELETE n, r
      `,
      { repositoryId: codebase.repositoryId }
    );
  }

  // Reset codebase status to pending
  await runQuery(
    `
    MATCH (c:Codebase {id: $codebaseId})
    SET c.status = 'pending',
        c.error = null,
        c.repositoryId = null,
        c.updatedAt = $updatedAt
    RETURN c
    `,
    {
      codebaseId,
      updatedAt: new Date().toISOString(),
    }
  );

  // Invalidate caches
  const codebaseCacheKey = buildCacheKey('codebase', codebaseId);
  const workspaceCodebasesKey = buildCacheKey('workspace', `${workspaceId}:codebases`);
  await Promise.all([
    cache.invalidate(codebaseCacheKey),
    cache.invalidate(workspaceCodebasesKey),
  ]);

  // Re-trigger parser import
  const input: CreateCodebaseInput = {
    source: codebase.source,
    type: codebase.type,
    ...(codebase.branch && { branch: codebase.branch }),
  };

  triggerParserImport(codebaseId, input).catch((error) => {
    logger.error('Parser import retry failed', {
      codebaseId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  });

  return { success: true, status: 'pending' };
}

/**
 * Update codebase status (internal use for parser callbacks)
 */
export async function updateCodebaseStatus(
  codebaseId: string,
  statusUpdate: UpdateCodebaseStatusInput
): Promise<void> {
  const rows = await runQuery(
    `
    MATCH (c:Codebase {id: $codebaseId})
    SET c.status = $status,
        c.error = $error,
        c.repositoryId = $repositoryId,
        c.updatedAt = $updatedAt
    RETURN c.workspaceId as workspaceId
    `,
    {
      codebaseId,
      status: statusUpdate.status,
      error: statusUpdate.error || null,
      repositoryId: statusUpdate.repositoryId || null,
      updatedAt: new Date().toISOString(),
    }
  );

  // Invalidate caches
  if (rows.length > 0) {
    const row = rows[0] as { workspaceId: string };
    const codebaseCacheKey = buildCacheKey('codebase', codebaseId);
    const workspaceCodebasesKey = buildCacheKey('workspace', `${row.workspaceId}:codebases`);
    await Promise.all([
      cache.invalidate(codebaseCacheKey),
      cache.invalidate(workspaceCodebasesKey),
    ]);
  }
}
