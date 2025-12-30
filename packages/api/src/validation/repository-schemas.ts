/**
 * Request validation schemas for repository endpoints
 */

import { z } from 'zod';

/**
 * Schema for POST /api/repositories
 * Either URL or path is required (XOR)
 */
export const parseRepositorySchema = z.object({
  url: z.string().url().optional(),
  path: z.string().min(1).optional(),
  branch: z.string().optional(),
  token: z.string().optional()
}).refine(
  (data) => (data.url && !data.path) || (!data.url && data.path),
  {
    message: 'Either url or path is required (not both)',
    path: ['url']
  }
);

export type ParseRepositoryInput = z.infer<typeof parseRepositorySchema>;
