/**
 * Graph Query Endpoints
 *
 * Implements REST API endpoints for graph data retrieval:
 * - GET /api/graph/:repoId - Get full graph
 * - GET /api/graph/:repoId/node/:nodeId - Get node details
 * - GET /api/graph/:repoId/dependencies/:nodeId - Get dependencies
 * - POST /api/graph/:repoId/query - Custom Cypher query
 */

import { Router, Request, Response } from 'express'
import { logger } from '../logger'
import { authenticate } from '../middleware/auth'
import {
  getFullGraph,
  getNodeDetails,
  getNodeDependencies,
  executeCustomQuery,
  getParseResult,
} from '../services/graph-service'
import { customQuerySchema } from '../validation/graph-schemas'
import { ValidationError, NotFoundError } from '../errors'
import { asyncHandler } from '../utils/async-handler'
import { createViewResolver } from '@diagram-builder/core'
import type { SemanticTier } from '@diagram-builder/core'

const graphRouter = Router()

/**
 * GET /api/graph/:repoId
 * Get complete graph for a repository
 */
graphRouter.get(
  '/:repoId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId } = req.params

    if (!repoId) {
      throw new ValidationError('Invalid request', 'Repository ID is required')
    }

    const start = Date.now()
    logger.info('Graph query request', { repoId, route: 'GET /:repoId' })

    const graph = await getFullGraph(repoId)

    if (!graph) {
      logger.warn('Graph query returned no data', { repoId })
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${repoId} does not exist or has no graph data`
      )
    }

    logger.info('Graph query complete', {
      repoId,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      durationMs: Date.now() - start,
    })
    res.json(graph)
  })
)

/**
 * GET /api/graph/:repoId/node/:nodeId
 * Get details for a specific node
 */
graphRouter.get(
  '/:repoId/node/:nodeId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId, nodeId } = req.params

    if (!repoId || !nodeId) {
      throw new ValidationError('Invalid request', 'Repository ID and Node ID are required')
    }

    const start = Date.now()
    logger.info('Graph query request', { repoId, route: 'GET /:repoId/node/:nodeId', nodeId })

    const node = await getNodeDetails(repoId, nodeId)

    if (!node) {
      logger.warn('Node not found', { repoId, nodeId })
      throw new NotFoundError(
        'Node not found',
        `Node with ID ${nodeId} does not exist in repository ${repoId}`
      )
    }

    logger.info('Graph query complete', { repoId, route: 'GET /:repoId/node/:nodeId', nodeId, durationMs: Date.now() - start })
    res.json(node)
  })
)

/**
 * GET /api/graph/:repoId/dependencies/:nodeId
 * Get all dependencies for a specific node
 */
graphRouter.get(
  '/:repoId/dependencies/:nodeId',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId, nodeId } = req.params

    if (!repoId || !nodeId) {
      throw new ValidationError('Invalid request', 'Repository ID and Node ID are required')
    }

    const start = Date.now()
    logger.info('Graph query request', { repoId, route: 'GET /:repoId/dependencies/:nodeId', nodeId })

    const dependencies = await getNodeDependencies(repoId, nodeId)

    logger.info('Graph query complete', { repoId, route: 'GET /:repoId/dependencies/:nodeId', nodeId, count: dependencies.length, durationMs: Date.now() - start })
    res.json({
      nodeId,
      count: dependencies.length,
      dependencies,
    })
  })
)

/**
 * POST /api/graph/:repoId/query
 * Execute a custom Cypher query scoped to a repository
 */
graphRouter.post(
  '/:repoId/query',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId } = req.params

    if (!repoId) {
      throw new ValidationError('Invalid request', 'Repository ID is required')
    }

    // Validate request body
    const validation = customQuerySchema.safeParse(req.body)

    if (!validation.success) {
      throw new ValidationError(
        'Invalid query request',
        validation.error.issues
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join(', ')
      )
    }

    const { query, params = {} } = validation.data

    const start = Date.now()
    logger.info('Graph query request', { repoId, route: 'POST /:repoId/query' })
    try {
      const results = await executeCustomQuery(repoId, query, params)

      logger.info('Graph query complete', { repoId, route: 'POST /:repoId/query', resultCount: results.length, durationMs: Date.now() - start })
      res.json({
        count: results.length,
        results,
      })
    } catch (error) {
      logger.error('Graph query failed', { category: 'neo4j', repoId, error: (error as Error).message })
      if (error instanceof Error) {
        throw new ValidationError('Query execution failed', error.message)
      }
      throw error
    }
  })
)

/**
 * GET /api/graph/:repoId/parse-result
 * Get ParseResult (graph + hierarchy + pre-computed tiers)
 */
graphRouter.get(
  '/:repoId/parse-result',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId } = req.params
    if (!repoId) throw new ValidationError('Invalid request', 'Repository ID is required')

    const result = await getParseResult(repoId)
    if (!result) throw new NotFoundError('Repository not found', `No graph data for ${repoId}`)

    res.json(result)
  })
)

/**
 * GET /api/graph/:repoId/tier/:tier
 * Get a single pre-computed tier view (0-5)
 */
graphRouter.get(
  '/:repoId/tier/:tier',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { repoId, tier } = req.params
    const tierNum = Number(tier)

    if (!repoId) throw new ValidationError('Invalid request', 'Repository ID is required')
    if (isNaN(tierNum) || tierNum < 0 || tierNum > 5) {
      throw new ValidationError('Invalid tier', 'Tier must be an integer between 0 and 5')
    }

    const result = await getParseResult(repoId)
    if (!result) throw new NotFoundError('Repository not found', `No graph data for ${repoId}`)

    const resolver = createViewResolver(result)
    const tierGraph = resolver.getTier(tierNum as SemanticTier)

    res.json(tierGraph)
  })
)

export { graphRouter }
