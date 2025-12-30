/**
 * Repository Parsing Endpoints
 *
 * Implements REST API endpoints for repository parsing operations:
 * - POST /api/repositories - Parse new repository
 * - GET /api/repositories/:id - Get repository metadata
 * - DELETE /api/repositories/:id - Delete repository
 * - POST /api/repositories/:id/refresh - Re-parse repository
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { parseAndStoreRepository, getRepositoryMetadata, deleteRepository, refreshRepository } from '../services/repository-service';
import { parseRepositorySchema } from '../validation/repository-schemas';
import { ValidationError, NotFoundError } from '../errors';
import { asyncHandler } from '../utils/async-handler';

const repositoriesRouter = Router();

/**
 * POST /api/repositories
 * Parse a new repository and store IVM in Neo4j
 */
repositoriesRouter.post('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validation = parseRepositorySchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError(
      'Invalid repository parsing request',
      validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    );
  }

  const { url, path, branch, token } = validation.data;

  // Build request object with only defined properties
  const request: Record<string, string> = {};
  if (url) request.url = url;
  if (path) request.path = path;
  if (branch) request.branch = branch;
  if (token) request.token = token;

  // Parse and store repository
  const result = await parseAndStoreRepository(request);

  res.status(202).json({
    id: result.id,
    status: result.status,
    message: 'Repository parsing initiated'
  });
}));

/**
 * GET /api/repositories/:id
 * Get repository metadata from Neo4j
 */
repositoriesRouter.get('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const metadata = await getRepositoryMetadata(id);

  if (!metadata) {
    throw new NotFoundError(
      'Repository not found',
      `Repository with ID ${id} does not exist`
    );
  }

  res.json(metadata);
}));

/**
 * DELETE /api/repositories/:id
 * Delete repository and all associated nodes from Neo4j
 */
repositoriesRouter.delete('/:id', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const deleted = await deleteRepository(id);

  if (!deleted) {
    throw new NotFoundError(
      'Repository not found',
      `Repository with ID ${id} does not exist`
    );
  }

  res.status(204).send();
}));

/**
 * POST /api/repositories/:id/refresh
 * Re-parse repository and update Neo4j data
 */
repositoriesRouter.post('/:id/refresh', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const id = req.params.id;

  if (!id) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  try {
    const result = await refreshRepository(id);

    res.status(202).json({
      id: result.id,
      status: result.status,
      message: 'Repository refresh initiated'
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Repository not found') {
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${id} does not exist`
      );
    }
    throw error;
  }
}));

export { repositoriesRouter };
