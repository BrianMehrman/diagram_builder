/**
 * Viewpoint Service
 *
 * Business logic for managing viewpoints (saved views of the graph)
 * Implements CRUD operations and share token generation
 */

import { v4 as uuidv4 } from 'uuid';
import { runQuery } from '../database/query-utils';
import { buildCacheKey } from '../cache/cache-keys';
import * as cache from '../cache/cache-utils';
import type { Viewpoint, CreateViewpointInput, UpdateViewpointInput } from '../types/viewpoint';

/**
 * Create a new viewpoint
 *
 * @param input - Viewpoint creation data
 * @param userId - User ID of the creator
 * @returns Created viewpoint
 */
export async function createViewpoint(
  input: CreateViewpointInput,
  userId: string
): Promise<Viewpoint> {
  const viewpointId = uuidv4();
  const now = new Date().toISOString();

  const viewpoint: Viewpoint = {
    id: viewpointId,
    repositoryId: input.repositoryId,
    name: input.name,
    ...(input.description && { description: input.description }),
    camera: input.camera,
    ...(input.filters && { filters: input.filters }),
    ...(input.annotations && input.annotations.length > 0 && { annotations: input.annotations }),
    createdBy: userId,
    createdAt: now,
    updatedAt: now,
  };

  // Store in Neo4j
  const query = `
    CREATE (v:Viewpoint {
      id: $id,
      repositoryId: $repositoryId,
      name: $name,
      description: $description,
      camera: $camera,
      filters: $filters,
      annotations: $annotations,
      createdBy: $createdBy,
      createdAt: $createdAt,
      updatedAt: $updatedAt,
      isPublic: false
    })
    RETURN v
  `;

  await runQuery(query, {
    id: viewpoint.id,
    repositoryId: viewpoint.repositoryId,
    name: viewpoint.name,
    description: viewpoint.description || null,
    camera: JSON.stringify(viewpoint.camera),
    filters: viewpoint.filters ? JSON.stringify(viewpoint.filters) : null,
    annotations: viewpoint.annotations ? JSON.stringify(viewpoint.annotations) : null,
    createdBy: viewpoint.createdBy,
    createdAt: viewpoint.createdAt,
    updatedAt: viewpoint.updatedAt,
  });

  // Invalidate cache for repository viewpoints list
  await cache.invalidatePattern(buildCacheKey('viewpoint', `${input.repositoryId}:*`));

  return viewpoint;
}

/**
 * Get a viewpoint by ID
 *
 * @param viewpointId - Viewpoint ID
 * @returns Viewpoint or null if not found
 */
export async function getViewpoint(viewpointId: string): Promise<Viewpoint | null> {
  // Check cache first
  const cacheKey = buildCacheKey('viewpoint', viewpointId);
  const cached = await cache.get<Viewpoint>(cacheKey);
  if (cached) {
    return cached;
  }

  const query = `
    MATCH (v:Viewpoint {id: $id})
    RETURN v.id as id, v.repositoryId as repositoryId, v.name as name,
           v.description as description, v.camera as camera, v.filters as filters,
           v.annotations as annotations, v.createdBy as createdBy,
           v.createdAt as createdAt, v.updatedAt as updatedAt,
           v.shareToken as shareToken, v.isPublic as isPublic
  `;

  const results = await runQuery<{
    id: string;
    repositoryId: string;
    name: string;
    description: string | null;
    camera: string;
    filters: string | null;
    annotations: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    shareToken: string | null;
    isPublic: boolean | null;
  }>(query, { id: viewpointId });

  if (!results || results.length === 0) {
    return null;
  }

  const result = results[0]!;
  const viewpoint: Viewpoint = {
    id: result.id,
    repositoryId: result.repositoryId,
    name: result.name,
    ...(result.description && { description: result.description }),
    camera: JSON.parse(result.camera),
    ...(result.filters && { filters: JSON.parse(result.filters) }),
    ...(result.annotations && { annotations: JSON.parse(result.annotations) }),
    createdBy: result.createdBy,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    ...(result.shareToken && { shareToken: result.shareToken }),
    ...(result.isPublic !== null && { isPublic: result.isPublic }),
  };

  // Cache the result
  await cache.set(cacheKey, viewpoint);

  return viewpoint;
}

/**
 * Update a viewpoint
 *
 * @param viewpointId - Viewpoint ID
 * @param input - Update data
 * @param userId - User ID making the update
 * @returns Updated viewpoint or null if not found
 */
export async function updateViewpoint(
  viewpointId: string,
  input: UpdateViewpointInput,
  userId: string
): Promise<Viewpoint | null> {
  // First, get the existing viewpoint to verify ownership
  const existing = await getViewpoint(viewpointId);
  if (!existing) {
    return null;
  }

  // Check if user owns this viewpoint
  if (existing.createdBy !== userId) {
    throw new Error('Unauthorized: You can only update your own viewpoints');
  }

  const now = new Date().toISOString();

  // Build update query dynamically based on provided fields
  const setClauses: string[] = ['v.updatedAt = $updatedAt'];
  const params: Record<string, unknown> = {
    id: viewpointId,
    updatedAt: now,
  };

  if (input.name !== undefined) {
    setClauses.push('v.name = $name');
    params.name = input.name;
  }

  if (input.description !== undefined) {
    setClauses.push('v.description = $description');
    params.description = input.description || null;
  }

  if (input.camera !== undefined) {
    setClauses.push('v.camera = $camera');
    params.camera = JSON.stringify(input.camera);
  }

  if (input.filters !== undefined) {
    setClauses.push('v.filters = $filters');
    params.filters = input.filters ? JSON.stringify(input.filters) : null;
  }

  if (input.annotations !== undefined) {
    setClauses.push('v.annotations = $annotations');
    params.annotations = input.annotations && input.annotations.length > 0
      ? JSON.stringify(input.annotations)
      : null;
  }

  if (input.isPublic !== undefined) {
    setClauses.push('v.isPublic = $isPublic');
    params.isPublic = input.isPublic;
  }

  const query = `
    MATCH (v:Viewpoint {id: $id})
    SET ${setClauses.join(', ')}
    RETURN v
  `;

  await runQuery(query, params);

  // Invalidate cache
  await cache.invalidate(buildCacheKey('viewpoint', viewpointId));
  await cache.invalidatePattern(buildCacheKey('viewpoint', `${existing.repositoryId}:*`));

  // Return updated viewpoint
  return getViewpoint(viewpointId);
}

/**
 * Delete a viewpoint
 *
 * @param viewpointId - Viewpoint ID
 * @param userId - User ID making the deletion
 * @returns True if deleted, false if not found
 */
export async function deleteViewpoint(
  viewpointId: string,
  userId: string
): Promise<boolean> {
  // First, get the existing viewpoint to verify ownership
  const existing = await getViewpoint(viewpointId);
  if (!existing) {
    return false;
  }

  // Check if user owns this viewpoint
  if (existing.createdBy !== userId) {
    throw new Error('Unauthorized: You can only delete your own viewpoints');
  }

  const query = `
    MATCH (v:Viewpoint {id: $id})
    DETACH DELETE v
  `;

  await runQuery(query, { id: viewpointId });

  // Invalidate cache
  await cache.invalidate(buildCacheKey('viewpoint', viewpointId));
  await cache.invalidatePattern(buildCacheKey('viewpoint', `${existing.repositoryId}:*`));

  return true;
}

/**
 * Generate a share token for a viewpoint
 *
 * @param viewpointId - Viewpoint ID
 * @param userId - User ID making the request
 * @returns Share token
 */
export async function generateShareToken(
  viewpointId: string,
  userId: string
): Promise<string> {
  // First, get the existing viewpoint to verify ownership
  const existing = await getViewpoint(viewpointId);
  if (!existing) {
    throw new Error('Viewpoint not found');
  }

  // Check if user owns this viewpoint
  if (existing.createdBy !== userId) {
    throw new Error('Unauthorized: You can only share your own viewpoints');
  }

  // Generate or return existing share token
  if (existing.shareToken) {
    return existing.shareToken;
  }

  const shareToken = uuidv4();

  const query = `
    MATCH (v:Viewpoint {id: $id})
    SET v.shareToken = $shareToken, v.isPublic = true
    RETURN v
  `;

  await runQuery(query, {
    id: viewpointId,
    shareToken,
  });

  // Invalidate cache
  await cache.invalidate(buildCacheKey('viewpoint', viewpointId));

  return shareToken;
}

/**
 * Get a viewpoint by share token (public access)
 *
 * @param shareToken - Share token
 * @returns Viewpoint or null if not found
 */
export async function getViewpointByShareToken(shareToken: string): Promise<Viewpoint | null> {
  const query = `
    MATCH (v:Viewpoint {shareToken: $shareToken, isPublic: true})
    RETURN v.id as id, v.repositoryId as repositoryId, v.name as name,
           v.description as description, v.camera as camera, v.filters as filters,
           v.annotations as annotations, v.createdBy as createdBy,
           v.createdAt as createdAt, v.updatedAt as updatedAt,
           v.shareToken as shareToken, v.isPublic as isPublic
  `;

  const results = await runQuery<{
    id: string;
    repositoryId: string;
    name: string;
    description: string | null;
    camera: string;
    filters: string | null;
    annotations: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    shareToken: string;
    isPublic: boolean;
  }>(query, { shareToken });

  if (!results || results.length === 0) {
    return null;
  }

  const result = results[0]!;
  return {
    id: result.id,
    repositoryId: result.repositoryId,
    name: result.name,
    ...(result.description && { description: result.description }),
    camera: JSON.parse(result.camera),
    ...(result.filters && { filters: JSON.parse(result.filters) }),
    ...(result.annotations && { annotations: JSON.parse(result.annotations) }),
    createdBy: result.createdBy,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    shareToken: result.shareToken,
    isPublic: result.isPublic,
  };
}

/**
 * List all viewpoints for a repository
 *
 * @param repositoryId - Repository ID
 * @param userId - Optional user ID to filter by creator
 * @returns Array of viewpoints
 */
export async function listViewpoints(
  repositoryId: string,
  userId?: string
): Promise<Viewpoint[]> {
  const cacheKey = buildCacheKey('viewpoint', `${repositoryId}:list:${userId || 'all'}`);
  const cached = await cache.get<Viewpoint[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const query = userId
    ? `
      MATCH (v:Viewpoint {repositoryId: $repositoryId, createdBy: $userId})
      RETURN v.id as id, v.repositoryId as repositoryId, v.name as name,
             v.description as description, v.camera as camera, v.filters as filters,
             v.annotations as annotations, v.createdBy as createdBy,
             v.createdAt as createdAt, v.updatedAt as updatedAt,
             v.shareToken as shareToken, v.isPublic as isPublic
      ORDER BY v.updatedAt DESC
    `
    : `
      MATCH (v:Viewpoint {repositoryId: $repositoryId})
      RETURN v.id as id, v.repositoryId as repositoryId, v.name as name,
             v.description as description, v.camera as camera, v.filters as filters,
             v.annotations as annotations, v.createdBy as createdBy,
             v.createdAt as createdAt, v.updatedAt as updatedAt,
             v.shareToken as shareToken, v.isPublic as isPublic
      ORDER BY v.updatedAt DESC
    `;

  const results = await runQuery<{
    id: string;
    repositoryId: string;
    name: string;
    description: string | null;
    camera: string;
    filters: string | null;
    annotations: string | null;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    shareToken: string | null;
    isPublic: boolean | null;
  }>(query, { repositoryId, ...(userId && { userId }) });

  const viewpoints: Viewpoint[] = results.map(result => ({
    id: result.id,
    repositoryId: result.repositoryId,
    name: result.name,
    ...(result.description && { description: result.description }),
    camera: JSON.parse(result.camera),
    ...(result.filters && { filters: JSON.parse(result.filters) }),
    ...(result.annotations && { annotations: JSON.parse(result.annotations) }),
    createdBy: result.createdBy,
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    ...(result.shareToken && { shareToken: result.shareToken }),
    ...(result.isPublic !== null && { isPublic: result.isPublic }),
  }));

  // Cache the result
  await cache.set(cacheKey, viewpoints);

  return viewpoints;
}
