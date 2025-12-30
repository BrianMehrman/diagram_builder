/**
 * Validation Schemas for Viewpoint Endpoints
 *
 * Zod schemas for validating viewpoint requests
 */

import { z } from 'zod';

/**
 * Camera state schema
 */
const cameraStateSchema = z.object({
  position: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  target: z.object({
    x: z.number(),
    y: z.number(),
    z: z.number(),
  }),
  fov: z.number().min(1).max(180).optional(),
  zoom: z.number().min(0.1).max(100).optional(),
});

/**
 * Graph filters schema
 */
const graphFiltersSchema = z.object({
  nodeTypes: z.array(z.string()).optional(),
  edgeTypes: z.array(z.string()).optional(),
  maxLod: z.number().min(0).max(5).optional(),
  pathPattern: z.string().optional(),
  languages: z.array(z.string()).optional(),
  visibleNodes: z.array(z.string()).optional(),
  hiddenNodes: z.array(z.string()).optional(),
}).optional();

/**
 * Annotation schema
 */
const annotationSchema = z.object({
  id: z.string(),
  type: z.enum(['note', 'highlight', 'arrow', 'label']),
  target: z.object({
    nodeId: z.string().optional(),
    position: z.object({
      x: z.number(),
      y: z.number(),
      z: z.number(),
    }).optional(),
  }),
  content: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  createdAt: z.string().datetime(),
  createdBy: z.string().optional(),
});

/**
 * Schema for creating a viewpoint
 */
export const createViewpointSchema = z.object({
  repositoryId: z.string().min(1, 'Repository ID is required'),
  name: z.string().min(1, 'Viewpoint name is required').max(100, 'Name must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  camera: cameraStateSchema,
  filters: graphFiltersSchema,
  annotations: z.array(annotationSchema).optional(),
});

/**
 * Schema for updating a viewpoint
 */
export const updateViewpointSchema = z.object({
  name: z.string().min(1, 'Viewpoint name cannot be empty').max(100, 'Name must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  camera: cameraStateSchema.optional(),
  filters: graphFiltersSchema,
  annotations: z.array(annotationSchema).optional(),
  isPublic: z.boolean().optional(),
});
