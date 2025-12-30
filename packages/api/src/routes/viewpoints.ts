/**
 * Viewpoint Management Endpoints
 *
 * Implements REST API endpoints for viewpoint operations:
 * - POST /api/viewpoints - Create viewpoint
 * - GET /api/viewpoints/:id - Get viewpoint
 * - PUT /api/viewpoints/:id - Update viewpoint
 * - DELETE /api/viewpoints/:id - Delete viewpoint
 * - GET /api/viewpoints/share/:id - Generate share URL
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  createViewpoint,
  getViewpoint,
  updateViewpoint,
  deleteViewpoint,
  generateShareToken,
  getViewpointByShareToken,
  listViewpoints,
} from '../services/viewpoint-service';
import { createViewpointSchema, updateViewpointSchema } from '../validation/viewpoint-schemas';
import { ValidationError, NotFoundError, ForbiddenError } from '../errors';
import { asyncHandler } from '../utils/async-handler';
import type { CreateViewpointInput, UpdateViewpointInput } from '../types/viewpoint';

const viewpointsRouter = Router();

/**
 * POST /api/viewpoints
 * Create a new viewpoint
 */
viewpointsRouter.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validation = createViewpointSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError(
      'Invalid viewpoint data',
      validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    );
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  const viewpoint = await createViewpoint(validation.data as CreateViewpointInput, userId);

  res.status(201).json(viewpoint);
}));

/**
 * GET /api/viewpoints/:id
 * Get a viewpoint by ID
 */
viewpointsRouter.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Viewpoint ID is required');
  }

  const viewpoint = await getViewpoint(id);

  if (!viewpoint) {
    throw new NotFoundError(
      'Viewpoint not found',
      `Viewpoint with ID ${id} does not exist`
    );
  }

  // Check if user has access (owner or public viewpoint)
  const userId = req.user?.userId;
  if (viewpoint.createdBy !== userId && !viewpoint.isPublic) {
    throw new ForbiddenError(
      'Access denied',
      'You do not have permission to access this viewpoint'
    );
  }

  res.json(viewpoint);
}));

/**
 * PUT /api/viewpoints/:id
 * Update a viewpoint
 */
viewpointsRouter.put('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Viewpoint ID is required');
  }

  // Validate request body
  const validation = updateViewpointSchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError(
      'Invalid viewpoint data',
      validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    );
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  try {
    const viewpoint = await updateViewpoint(id, validation.data as UpdateViewpointInput, userId);

    if (!viewpoint) {
      throw new NotFoundError(
        'Viewpoint not found',
        `Viewpoint with ID ${id} does not exist`
      );
    }

    res.json(viewpoint);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new ForbiddenError(
        'Access denied',
        'You can only update your own viewpoints'
      );
    }
    throw error;
  }
}));

/**
 * DELETE /api/viewpoints/:id
 * Delete a viewpoint
 */
viewpointsRouter.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Viewpoint ID is required');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  try {
    const deleted = await deleteViewpoint(id, userId);

    if (!deleted) {
      throw new NotFoundError(
        'Viewpoint not found',
        `Viewpoint with ID ${id} does not exist`
      );
    }

    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      throw new ForbiddenError(
        'Access denied',
        'You can only delete your own viewpoints'
      );
    }
    throw error;
  }
}));

/**
 * POST /api/viewpoints/:id/share
 * Generate a share token for a viewpoint
 */
viewpointsRouter.post('/:id/share', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  if (!id) {
    throw new ValidationError('Invalid request', 'Viewpoint ID is required');
  }

  const userId = req.user?.userId;
  if (!userId) {
    throw new ValidationError('Invalid request', 'User ID not found in token');
  }

  try {
    const shareToken = await generateShareToken(id, userId);

    res.json({
      shareToken,
      shareUrl: `/viewpoints/share/${shareToken}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        throw new NotFoundError(
          'Viewpoint not found',
          `Viewpoint with ID ${id} does not exist`
        );
      }
      if (error.message.includes('Unauthorized')) {
        throw new ForbiddenError(
          'Access denied',
          'You can only share your own viewpoints'
        );
      }
    }
    throw error;
  }
}));

/**
 * GET /api/viewpoints/share/:token
 * Get a viewpoint by share token (public access)
 */
viewpointsRouter.get('/share/:token', asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;

  if (!token) {
    throw new ValidationError('Invalid request', 'Share token is required');
  }

  const viewpoint = await getViewpointByShareToken(token);

  if (!viewpoint) {
    throw new NotFoundError(
      'Viewpoint not found',
      'Invalid share token or viewpoint is not public'
    );
  }

  res.json(viewpoint);
}));

/**
 * GET /api/repositories/:repositoryId/viewpoints
 * List all viewpoints for a repository
 */
viewpointsRouter.get('/repository/:repositoryId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repositoryId } = req.params;

  if (!repositoryId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const userId = req.user?.userId;
  const viewpoints = await listViewpoints(repositoryId, userId);

  res.json({
    count: viewpoints.length,
    viewpoints,
  });
}));

export { viewpointsRouter };
