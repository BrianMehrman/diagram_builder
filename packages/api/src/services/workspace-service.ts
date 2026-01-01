/**
 * Workspace Service
 *
 * Business logic for managing collaborative workspaces
 * Implements CRUD operations and member management
 */

import { v4 as uuidv4 } from 'uuid';
import { runQuery } from '../database/query-utils';
import { buildCacheKey } from '../cache/cache-keys';
import * as cache from '../cache/cache-utils';
import type {
  Workspace,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceMember,
  AddMemberInput,
  UpdateMemberInput,
} from '../types/workspace';

/**
 * Create a new workspace
 *
 * @param input - Workspace creation data
 * @param userId - User ID of the creator
 * @returns Created workspace
 */
export async function createWorkspace(
  input: CreateWorkspaceInput,
  userId: string
): Promise<Workspace> {
  const workspaceId = uuidv4();
  const now = new Date().toISOString();

  const workspace: Workspace = {
    id: workspaceId,
    name: input.name,
    ...(input.description && { description: input.description }),
    ownerId: userId,
    repositories: input.repositories || [],
    members: [
      {
        userId,
        role: 'owner',
        joinedAt: now,
      },
    ],
    settings: input.settings || {},
    sessionState: input.sessionState || {},
    createdAt: now,
    updatedAt: now,
  };

  // Store in Neo4j
  const query = `
    CREATE (w:Workspace {
      id: $id,
      name: $name,
      description: $description,
      ownerId: $ownerId,
      repositories: $repositories,
      members: $members,
      settings: $settings,
      sessionState: $sessionState,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN w
  `;

  await runQuery(query, {
    id: workspace.id,
    name: workspace.name,
    description: workspace.description || null,
    ownerId: workspace.ownerId,
    repositories: JSON.stringify(workspace.repositories),
    members: JSON.stringify(workspace.members),
    settings: JSON.stringify(workspace.settings),
    sessionState: JSON.stringify(workspace.sessionState),
    createdAt: workspace.createdAt,
    updatedAt: workspace.updatedAt,
  });

  return workspace;
}

/**
 * Get a workspace by ID
 *
 * @param workspaceId - Workspace ID
 * @returns Workspace or null if not found
 */
export async function getWorkspace(workspaceId: string): Promise<Workspace | null> {
  // Check cache first
  const cacheKey = buildCacheKey('workspace', workspaceId);
  const cached = await cache.get<Workspace>(cacheKey);
  if (cached) {
    return cached;
  }

  const query = `
    MATCH (w:Workspace {id: $id})
    RETURN w.id as id, w.name as name, w.description as description,
           w.ownerId as ownerId, w.repositories as repositories,
           w.members as members, w.settings as settings,
           w.sessionState as sessionState,
           w.createdAt as createdAt, w.updatedAt as updatedAt,
           w.lastAccessedAt as lastAccessedAt
  `;

  const results = await runQuery<{
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    repositories: string;
    members: string;
    settings: string;
    sessionState: string;
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string | null;
  }>(query, { id: workspaceId });

  if (!results || results.length === 0) {
    return null;
  }

  const result = results[0]!;
  const workspace: Workspace = {
    id: result.id,
    name: result.name,
    ...(result.description && { description: result.description }),
    ownerId: result.ownerId,
    repositories: JSON.parse(result.repositories),
    members: JSON.parse(result.members),
    settings: JSON.parse(result.settings),
    sessionState: JSON.parse(result.sessionState),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    ...(result.lastAccessedAt && { lastAccessedAt: result.lastAccessedAt }),
  };

  // Cache the result with 15 minute TTL
  await cache.set(cacheKey, workspace, 900);

  // Update last accessed timestamp
  await updateLastAccessed(workspaceId);

  return workspace;
}

/**
 * Update last accessed timestamp (non-blocking)
 */
async function updateLastAccessed(workspaceId: string): Promise<void> {
  const now = new Date().toISOString();
  const query = `
    MATCH (w:Workspace {id: $id})
    SET w.lastAccessedAt = $lastAccessedAt
  `;

  // Fire and forget - don't await
  runQuery(query, { id: workspaceId, lastAccessedAt: now }).catch(() => {
    // Ignore errors in background update
  });
}

/**
 * Update a workspace
 *
 * @param workspaceId - Workspace ID
 * @param input - Update data
 * @param userId - User ID making the update
 * @returns Updated workspace or null if not found
 */
export async function updateWorkspace(
  workspaceId: string,
  input: UpdateWorkspaceInput,
  userId: string
): Promise<Workspace | null> {
  // First, get the existing workspace to verify permissions
  const existing = await getWorkspace(workspaceId);
  if (!existing) {
    return null;
  }

  // Check if user has permission (owner or admin)
  const member = existing.members.find((m) => m.userId === userId);
  if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
    throw new Error('Unauthorized: Only workspace owners and admins can update workspaces');
  }

  const now = new Date().toISOString();

  // Build update query dynamically based on provided fields
  const setClauses: string[] = ['w.updatedAt = $updatedAt'];
  const params: Record<string, unknown> = {
    id: workspaceId,
    updatedAt: now,
  };

  if (input.name !== undefined) {
    setClauses.push('w.name = $name');
    params.name = input.name;
  }

  if (input.description !== undefined) {
    setClauses.push('w.description = $description');
    params.description = input.description || null;
  }

  if (input.repositories !== undefined) {
    setClauses.push('w.repositories = $repositories');
    params.repositories = JSON.stringify(input.repositories);
  }

  if (input.settings !== undefined) {
    setClauses.push('w.settings = $settings');
    params.settings = JSON.stringify(input.settings);
  }

  if (input.sessionState !== undefined) {
    setClauses.push('w.sessionState = $sessionState');
    params.sessionState = JSON.stringify(input.sessionState);
  }

  const query = `
    MATCH (w:Workspace {id: $id})
    SET ${setClauses.join(', ')}
    RETURN w
  `;

  await runQuery(query, params);

  // Invalidate cache
  await cache.invalidate(buildCacheKey('workspace', workspaceId));

  // Return updated workspace
  return getWorkspace(workspaceId);
}

/**
 * Delete a workspace
 *
 * @param workspaceId - Workspace ID
 * @param userId - User ID making the deletion
 * @returns True if deleted, false if not found
 */
export async function deleteWorkspace(
  workspaceId: string,
  userId: string
): Promise<boolean> {
  // First, get the existing workspace to verify ownership
  const existing = await getWorkspace(workspaceId);
  if (!existing) {
    return false;
  }

  // Check if user is the owner
  if (existing.ownerId !== userId) {
    throw new Error('Unauthorized: Only the workspace owner can delete the workspace');
  }

  const query = `
    MATCH (w:Workspace {id: $id})
    DETACH DELETE w
  `;

  await runQuery(query, { id: workspaceId });

  // Invalidate cache
  await cache.invalidate(buildCacheKey('workspace', workspaceId));

  return true;
}

/**
 * List workspaces for a user
 *
 * @param userId - User ID
 * @returns Array of workspaces where user is a member
 */
export async function listUserWorkspaces(userId: string): Promise<Workspace[]> {
  const cacheKey = buildCacheKey('workspace', `user:${userId}:list`);
  const cached = await cache.get<Workspace[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const query = `
    MATCH (w:Workspace)
    WHERE w.ownerId = $userId OR $userId IN [m IN w.members | m.userId]
    RETURN w.id as id, w.name as name, w.description as description,
           w.ownerId as ownerId, w.repositories as repositories,
           w.members as members, w.settings as settings,
           w.sessionState as sessionState,
           w.createdAt as createdAt, w.updatedAt as updatedAt,
           w.lastAccessedAt as lastAccessedAt
    ORDER BY w.lastAccessedAt DESC, w.updatedAt DESC
  `;

  const results = await runQuery<{
    id: string;
    name: string;
    description: string | null;
    ownerId: string;
    repositories: string;
    members: string;
    settings: string;
    sessionState: string;
    createdAt: string;
    updatedAt: string;
    lastAccessedAt: string | null;
  }>(query, { userId });

  const workspaces: Workspace[] = results.map((result) => ({
    id: result.id,
    name: result.name,
    ...(result.description && { description: result.description }),
    ownerId: result.ownerId,
    repositories: JSON.parse(result.repositories),
    members: JSON.parse(result.members),
    settings: JSON.parse(result.settings),
    sessionState: JSON.parse(result.sessionState),
    createdAt: result.createdAt,
    updatedAt: result.updatedAt,
    ...(result.lastAccessedAt && { lastAccessedAt: result.lastAccessedAt }),
  }));

  // Cache the result
  await cache.set(cacheKey, workspaces, 900);

  return workspaces;
}

/**
 * Add a member to a workspace
 *
 * @param workspaceId - Workspace ID
 * @param input - Member to add
 * @param userId - User ID making the request
 * @returns Updated members list
 */
export async function addWorkspaceMember(
  workspaceId: string,
  input: AddMemberInput,
  userId: string
): Promise<WorkspaceMember[]> {
  // Get existing workspace
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Check permissions
  const requestor = workspace.members.find((m) => m.userId === userId);
  if (!requestor || (requestor.role !== 'owner' && requestor.role !== 'admin')) {
    throw new Error('Unauthorized: Only owners and admins can add members');
  }

  // Check if user is already a member
  if (workspace.members.some((m) => m.userId === input.userId)) {
    throw new Error('User is already a member of this workspace');
  }

  // Add new member
  const newMember: WorkspaceMember = {
    userId: input.userId,
    role: input.role,
    joinedAt: new Date().toISOString(),
  };

  const updatedMembers = [...workspace.members, newMember];

  const query = `
    MATCH (w:Workspace {id: $id})
    SET w.members = $members, w.updatedAt = $updatedAt
    RETURN w
  `;

  await runQuery(query, {
    id: workspaceId,
    members: JSON.stringify(updatedMembers),
    updatedAt: new Date().toISOString(),
  });

  // Invalidate cache
  await cache.invalidate(buildCacheKey('workspace', workspaceId));

  return updatedMembers;
}

/**
 * Remove a member from a workspace
 *
 * @param workspaceId - Workspace ID
 * @param memberUserId - User ID to remove
 * @param userId - User ID making the request
 * @returns Updated members list
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  memberUserId: string,
  userId: string
): Promise<WorkspaceMember[]> {
  // Get existing workspace
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Check permissions
  const requestor = workspace.members.find((m) => m.userId === userId);
  if (!requestor || (requestor.role !== 'owner' && requestor.role !== 'admin')) {
    throw new Error('Unauthorized: Only owners and admins can remove members');
  }

  // Cannot remove the owner
  if (memberUserId === workspace.ownerId) {
    throw new Error('Cannot remove the workspace owner');
  }

  // Remove member
  const updatedMembers = workspace.members.filter((m) => m.userId !== memberUserId);

  const query = `
    MATCH (w:Workspace {id: $id})
    SET w.members = $members, w.updatedAt = $updatedAt
    RETURN w
  `;

  await runQuery(query, {
    id: workspaceId,
    members: JSON.stringify(updatedMembers),
    updatedAt: new Date().toISOString(),
  });

  // Invalidate cache
  await cache.invalidate(buildCacheKey('workspace', workspaceId));

  return updatedMembers;
}

/**
 * Update a member's role
 *
 * @param workspaceId - Workspace ID
 * @param memberUserId - User ID whose role to update
 * @param input - New role
 * @param userId - User ID making the request
 * @returns Updated members list
 */
export async function updateMemberRole(
  workspaceId: string,
  memberUserId: string,
  input: UpdateMemberInput,
  userId: string
): Promise<WorkspaceMember[]> {
  // Get existing workspace
  const workspace = await getWorkspace(workspaceId);
  if (!workspace) {
    throw new Error('Workspace not found');
  }

  // Only owner can update roles
  if (workspace.ownerId !== userId) {
    throw new Error('Unauthorized: Only the workspace owner can update member roles');
  }

  // Cannot change owner's role
  if (memberUserId === workspace.ownerId) {
    throw new Error('Cannot change the workspace owner\'s role');
  }

  // Update member role
  const updatedMembers = workspace.members.map((m) =>
    m.userId === memberUserId ? { ...m, role: input.role } : m
  );

  const query = `
    MATCH (w:Workspace {id: $id})
    SET w.members = $members, w.updatedAt = $updatedAt
    RETURN w
  `;

  await runQuery(query, {
    id: workspaceId,
    members: JSON.stringify(updatedMembers),
    updatedAt: new Date().toISOString(),
  });

  // Invalidate cache
  await cache.invalidate(buildCacheKey('workspace', workspaceId));

  return updatedMembers;
}
