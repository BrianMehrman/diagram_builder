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
import { loadRepository, type RepositoryConfig } from '@diagram-builder/parser';
import * as cache from '../cache/cache-utils';
import { buildCacheKey } from '../cache/cache-keys';
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

  return {
    id: codebaseId,
    workspaceId,
    source: input.source,
    type: input.type,
    branch: input.branch,
    status: 'pending',
    importedAt: now,
    updatedAt: now,
  };
}

/**
 * Trigger async parser import (internal)
 * This runs in the background and updates codebase status
 */
async function triggerParserImport(
  codebaseId: string,
  input: CreateCodebaseInput
): Promise<void> {
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

    // Create Repository node in Neo4j
    const repositoryId = uuidv4();
    await runQuery(
      `
      CREATE (r:Repository {
        id: $id,
        type: $type,
        source: $source,
        branch: $branch,
        fileCount: $fileCount,
        scannedAt: $scannedAt
      })
      RETURN r
      `,
      {
        id: repositoryId,
        type: repoContext.metadata.type,
        source: repoContext.metadata.type === 'git' ? repoContext.metadata.url : input.source,
        branch: repoContext.metadata.branch || null,
        fileCount: repoContext.metadata.fileCount,
        scannedAt: repoContext.metadata.scannedAt.toISOString(),
      }
    );

    // Link Codebase to Repository
    await runQuery(
      `
      MATCH (c:Codebase {id: $codebaseId})
      MATCH (r:Repository {id: $repositoryId})
      CREATE (c)-[:PARSED_INTO]->(r)
      RETURN c, r
      `,
      {
        codebaseId,
        repositoryId,
      }
    );

    // Update codebase status to completed
    await updateCodebaseStatus(codebaseId, {
      status: 'completed',
      repositoryId,
    });

    // Cleanup cloned repository if needed
    if (repoContext.cleanup) {
      await repoContext.cleanup();
    }
  } catch (error) {
    // Update status to failed with error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
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

  const codebases = rows.map((row) => ({
    id: row.id as string,
    workspaceId: row.workspaceId as string,
    source: row.source as string,
    type: row.type as 'local' | 'git',
    branch: row.branch as string | undefined,
    status: row.status as 'pending' | 'processing' | 'completed' | 'failed',
    error: row.error as string | undefined,
    repositoryId: row.repositoryId as string | undefined,
    importedAt: row.importedAt as string,
    updatedAt: row.updatedAt as string,
  }));

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

  const row = rows[0];

  // Verify codebase belongs to workspace
  if (row.workspaceId !== workspaceId) {
    throw new NotFoundError('Codebase not found', `Codebase ${codebaseId} not found in workspace ${workspaceId}`);
  }

  const codebase: Codebase = {
    id: row.id as string,
    workspaceId: row.workspaceId as string,
    source: row.source as string,
    type: row.type as 'local' | 'git',
    branch: row.branch as string | undefined,
    status: row.status as 'pending' | 'processing' | 'completed' | 'failed',
    error: row.error as string | undefined,
    repositoryId: row.repositoryId as string | undefined,
    importedAt: row.importedAt as string,
    updatedAt: row.updatedAt as string,
  };

  // Cache result (5-minute TTL)
  await cache.set(cacheKey, codebase);

  return codebase;
}

/**
 * Delete a codebase
 */
export async function deleteCodebase(
  workspaceId: string,
  codebaseId: string
): Promise<void> {
  // First verify codebase exists and belongs to workspace
  await getCodebaseById(workspaceId, codebaseId);

  // Delete codebase (cascade delete handled by DETACH)
  await runQuery(
    `
    MATCH (c:Codebase {id: $codebaseId})
    DETACH DELETE c
    `,
    { codebaseId }
  );

  // Invalidate caches
  const codebaseCacheKey = buildCacheKey('codebase', codebaseId);
  const workspaceCodebasesKey = buildCacheKey('workspace', `${workspaceId}:codebases`);
  await Promise.all([
    cache.invalidate(codebaseCacheKey),
    cache.invalidate(workspaceCodebasesKey),
  ]);
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
    const workspaceId = rows[0].workspaceId as string;
    const codebaseCacheKey = buildCacheKey('codebase', codebaseId);
    const workspaceCodebasesKey = buildCacheKey('workspace', `${workspaceId}:codebases`);
    await Promise.all([
      cache.invalidate(codebaseCacheKey),
      cache.invalidate(workspaceCodebasesKey),
    ]);
  }
}
