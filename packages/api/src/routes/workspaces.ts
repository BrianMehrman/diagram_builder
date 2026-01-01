/**
 * Workspace Management Endpoints
 *
 * Implements REST API endpoints for workspace operations:
 * - POST /api/workspaces - Create workspace
 * - GET /api/workspaces - List user's workspaces
 * - GET /api/workspaces/:id - Get workspace
 * - PUT /api/workspaces/:id - Update workspace
 * - DELETE /api/workspaces/:id - Delete workspace
 * - POST /api/workspaces/:id/members - Add member
 * - DELETE /api/workspaces/:id/members/:userId - Remove member
 * - PUT /api/workspaces/:id/members/:userId - Update member role
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createWorkspace,
  getWorkspace,
  updateWorkspace,
  deleteWorkspace,
  listUserWorkspaces,
  addWorkspaceMember,
  removeWorkspaceMember,
  updateMemberRole,
} from '../services/workspace-service';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors';
import { asyncHandler } from '../utils/async-handler';
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  AddMemberInput,
  UpdateMemberInput,
} from '../types/workspace';

const workspacesRouter = Router();

/**
 * POST /api/workspaces
 * Create a new workspace
 */
workspacesRouter.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { name, description, repositories, settings, sessionState } = req.body;

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    throw new ValidationError('Invalid request', 'Workspace name is required');
  }

  if (name.length > 100) {
    throw new ValidationError('Invalid request', 'Workspace name must be 100 characters or less');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  const input: CreateWorkspaceInput = {
    name: name.trim(),
    ...(description && { description }),
    ...(repositories && { repositories }),
    ...(settings && { settings }),
    ...(sessionState && { sessionState }),
  };

  const workspace = await createWorkspace(input, userId);

  res.status(201).json(workspace);
}));

/**
 * GET /api/workspaces
 * List all workspaces for the authenticated user
 */
workspacesRouter.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  const workspaces = await listUserWorkspaces(userId);

  res.json({
    count: workspaces.length,
    workspaces,
  });
}));

/**
 * GET /api/workspaces/:id
 * Get a workspace by ID
 */
workspacesRouter.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Workspace ID is required');
  }

  const workspace = await getWorkspace(id);

  if (!workspace) {
    throw new NotFoundError(
      'Workspace not found',
      `Workspace with ID ${id} does not exist`
    );
  }

  // Check if user has access (is a member)
  const userId = req.user?.userId;
  const isMember = workspace.members.some((m) => m.userId === userId);

  if (!isMember) {
    throw new ForbiddenError(
      'Access denied',
      'You do not have permission to access this workspace'
    );
  }

  res.json(workspace);
}));

/**
 * PUT /api/workspaces/:id
 * Update a workspace
 */
workspacesRouter.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, description, repositories, settings, sessionState } = req.body;

  if (!id) {
    throw new ValidationError('Invalid request', 'Workspace ID is required');
  }

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new ValidationError('Invalid request', 'Workspace name cannot be empty');
    }
    if (name.length > 100) {
      throw new ValidationError('Invalid request', 'Workspace name must be 100 characters or less');
    }
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  const input: UpdateWorkspaceInput = {};
  if (name !== undefined) input.name = name.trim();
  if (description !== undefined) input.description = description;
  if (repositories !== undefined) input.repositories = repositories;
  if (settings !== undefined) input.settings = settings;
  if (sessionState !== undefined) input.sessionState = sessionState;

  try {
    const workspace = await updateWorkspace(id, input, userId);

    if (!workspace) {
      throw new NotFoundError(
        'Workspace not found',
        `Workspace with ID ${id} does not exist`
      );
    }

    res.json(workspace);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new ForbiddenError(
        'Access denied',
        'Only workspace owners and admins can update workspaces'
      );
    }
    throw error;
  }
}));

/**
 * DELETE /api/workspaces/:id
 * Delete a workspace
 */
workspacesRouter.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Workspace ID is required');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  try {
    const deleted = await deleteWorkspace(id, userId);

    if (!deleted) {
      throw new NotFoundError(
        'Workspace not found',
        `Workspace with ID ${id} does not exist`
      );
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new ForbiddenError(
        'Access denied',
        'Only the workspace owner can delete the workspace'
      );
    }
    throw error;
  }
}));

/**
 * POST /api/workspaces/:id/members
 * Add a member to the workspace
 */
workspacesRouter.post('/:id/members', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { userId: memberUserId, role } = req.body;

  if (!id) {
    throw new ValidationError('Invalid request', 'Workspace ID is required');
  }

  if (!memberUserId || typeof memberUserId !== 'string') {
    throw new ValidationError('Invalid request', 'User ID is required');
  }

  if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
    throw new ValidationError('Invalid request', 'Valid role is required (admin, editor, or viewer)');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  const input: AddMemberInput = {
    userId: memberUserId,
    role,
  };

  try {
    const members = await addWorkspaceMember(id, input, userId);

    res.status(201).json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError(
          'Workspace not found',
          `Workspace with ID ${id} does not exist`
        );
      }
      if (error.message.includes('Unauthorized')) {
        throw new ForbiddenError(
          'Access denied',
          'Only workspace owners and admins can add members'
        );
      }
      if (error.message.includes('already a member')) {
        throw new ValidationError('Invalid request', 'User is already a member of this workspace');
      }
    }
    throw error;
  }
}));

/**
 * DELETE /api/workspaces/:id/members/:userId
 * Remove a member from the workspace
 */
workspacesRouter.delete('/:id/members/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: memberUserId } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Workspace ID is required');
  }

  if (!memberUserId) {
    throw new ValidationError('Invalid request', 'User ID is required');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  try {
    const members = await removeWorkspaceMember(id, memberUserId, userId);

    res.json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError(
          'Workspace not found',
          `Workspace with ID ${id} does not exist`
        );
      }
      if (error.message.includes('Unauthorized')) {
        throw new ForbiddenError(
          'Access denied',
          'Only workspace owners and admins can remove members'
        );
      }
      if (error.message.includes('Cannot remove')) {
        throw new ValidationError('Invalid request', error.message);
      }
    }
    throw error;
  }
}));

/**
 * PUT /api/workspaces/:id/members/:userId
 * Update a member's role
 */
workspacesRouter.put('/:id/members/:userId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id, userId: memberUserId } = req.params;
  const { role } = req.body;

  if (!id) {
    throw new ValidationError('Invalid request', 'Workspace ID is required');
  }

  if (!memberUserId) {
    throw new ValidationError('Invalid request', 'User ID is required');
  }

  if (!role || !['admin', 'editor', 'viewer'].includes(role)) {
    throw new ValidationError('Invalid request', 'Valid role is required (admin, editor, or viewer)');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  const input: UpdateMemberInput = { role };

  try {
    const members = await updateMemberRole(id, memberUserId, input, userId);

    res.json({ members });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError(
          'Workspace not found',
          `Workspace with ID ${id} does not exist`
        );
      }
      if (error.message.includes('Unauthorized')) {
        throw new ForbiddenError(
          'Access denied',
          'Only the workspace owner can update member roles'
        );
      }
      if (error.message.includes('Cannot change')) {
        throw new ValidationError('Invalid request', error.message);
      }
    }
    throw error;
  }
}));

export { workspacesRouter };
