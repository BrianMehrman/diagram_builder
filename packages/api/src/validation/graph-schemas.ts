/**
 * Validation Schemas for Graph Query Endpoints
 *
 * Zod schemas for validating graph query requests
 */

import { z } from 'zod';

/**
 * Schema for custom Cypher query requests
 */
const baseSchema = z.object({
  query: z.string().min(1, 'Query cannot be empty'),
  params: z.record(z.string(), z.any()).optional(),
});

export const customQuerySchema = baseSchema.refine(
  (data) => data.query.includes('$repoId') || data.query.includes('{repoId}'),
  {
    message: 'Query must include $repoId or {repoId} parameter for security',
    path: ['query'],
  }
);

export type CustomQueryInput = z.infer<typeof customQuerySchema>;
