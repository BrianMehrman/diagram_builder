/**
 * Graph Query Endpoints
 *
 * Implements REST API endpoints for graph data retrieval:
 * - GET /api/graph/:repoId - Get full graph
 * - GET /api/graph/:repoId/node/:nodeId - Get node details
 * - GET /api/graph/:repoId/dependencies/:nodeId - Get dependencies
 * - POST /api/graph/:repoId/query - Custom Cypher query
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  getFullGraph,
  getNodeDetails,
  getNodeDependencies,
  executeCustomQuery,
} from '../services/graph-service';
import { customQuerySchema } from '../validation/graph-schemas';
import { ValidationError, NotFoundError } from '../errors';
import { asyncHandler } from '../utils/async-handler';

const graphRouter = Router();

/**
 * GET /api/graph/:repoId
 * Get complete graph for a repository
 */
graphRouter.get('/:repoId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId } = req.params;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const graph = await getFullGraph(repoId);

  if (!graph) {
    throw new NotFoundError(
      'Repository not found',
      `Repository with ID ${repoId} does not exist or has no graph data`
    );
  }

  res.json(graph);
}));

/**
 * GET /api/graph/:repoId/node/:nodeId
 * Get details for a specific node
 */
graphRouter.get('/:repoId/node/:nodeId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, nodeId } = req.params;

  if (!repoId || !nodeId) {
    throw new ValidationError('Invalid request', 'Repository ID and Node ID are required');
  }

  const node = await getNodeDetails(repoId, nodeId);

  if (!node) {
    throw new NotFoundError(
      'Node not found',
      `Node with ID ${nodeId} does not exist in repository ${repoId}`
    );
  }

  res.json(node);
}));

/**
 * GET /api/graph/:repoId/dependencies/:nodeId
 * Get all dependencies for a specific node
 */
graphRouter.get('/:repoId/dependencies/:nodeId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, nodeId } = req.params;

  if (!repoId || !nodeId) {
    throw new ValidationError('Invalid request', 'Repository ID and Node ID are required');
  }

  const dependencies = await getNodeDependencies(repoId, nodeId);

  res.json({
    nodeId,
    count: dependencies.length,
    dependencies,
  });
}));

/**
 * POST /api/graph/:repoId/query
 * Execute a custom Cypher query scoped to a repository
 */
graphRouter.post('/:repoId/query', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId } = req.params;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  // Validate request body
  const validation = customQuerySchema.safeParse(req.body);

  if (!validation.success) {
    throw new ValidationError(
      'Invalid query request',
      validation.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ')
    );
  }

  const { query, params = {} } = validation.data;

  try {
    const results = await executeCustomQuery(repoId, query, params);

    res.json({
      count: results.length,
      results,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw new ValidationError('Query execution failed', error.message);
    }
    throw error;
  }
}));

export { graphRouter };
