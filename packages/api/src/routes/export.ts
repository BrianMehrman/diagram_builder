/**
 * Export Endpoints
 *
 * Implements REST API endpoints for exporting graphs:
 * - POST /api/export/plantuml - Export as PlantUML
 * - POST /api/export/mermaid - Export as Mermaid
 * - POST /api/export/drawio - Export as Draw.io
 * - POST /api/export/gltf - Export as GLTF 3D model
 * - POST /api/export/image - Export as PNG or SVG
 */

import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import {
  exportPlantUML,
  exportMermaid,
  exportDrawio,
  exportGLTF,
  exportImage,
  type ExportRequest,
  type ImageExportRequest,
} from '../services/export-service';
import { ValidationError, NotFoundError } from '../errors';
import { asyncHandler } from '../utils/async-handler';

const exportRouter = Router();

/**
 * POST /api/export/plantuml
 * Export graph as PlantUML
 */
exportRouter.post('/plantuml', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, lodLevel, filters, options } = req.body;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const request: ExportRequest = {
    repoId,
    lodLevel,
    filters,
    options,
  };

  try {
    const result = await exportPlantUML(request);

    res.status(200).json({
      content: result.content,
      filename: result.filename,
      mimeType: result.mimeType,
      extension: result.extension,
      stats: result.stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${repoId} does not exist or has no graph data`
      );
    }
    throw error;
  }
}));

/**
 * POST /api/export/mermaid
 * Export graph as Mermaid
 */
exportRouter.post('/mermaid', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, lodLevel, filters, options } = req.body;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const request: ExportRequest = {
    repoId,
    lodLevel,
    filters,
    options,
  };

  try {
    const result = await exportMermaid(request);

    res.status(200).json({
      content: result.content,
      filename: result.filename,
      mimeType: result.mimeType,
      extension: result.extension,
      stats: result.stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${repoId} does not exist or has no graph data`
      );
    }
    throw error;
  }
}));

/**
 * POST /api/export/drawio
 * Export graph as Draw.io XML
 */
exportRouter.post('/drawio', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, lodLevel, filters, options } = req.body;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const request: ExportRequest = {
    repoId,
    lodLevel,
    filters,
    options,
  };

  try {
    const result = await exportDrawio(request);

    res.status(200).json({
      content: result.content,
      filename: result.filename,
      mimeType: result.mimeType,
      extension: result.extension,
      stats: result.stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${repoId} does not exist or has no graph data`
      );
    }
    throw error;
  }
}));

/**
 * POST /api/export/gltf
 * Export graph as GLTF 3D model
 */
exportRouter.post('/gltf', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, lodLevel, filters, options } = req.body;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  const request: ExportRequest = {
    repoId,
    lodLevel,
    filters,
    options,
  };

  try {
    const result = await exportGLTF(request);

    res.status(200).json({
      content: result.content,
      filename: result.filename,
      mimeType: result.mimeType,
      extension: result.extension,
      stats: result.stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${repoId} does not exist or has no graph data`
      );
    }
    throw error;
  }
}));

/**
 * POST /api/export/image
 * Export graph as PNG or SVG image
 */
exportRouter.post('/image', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { repoId, lodLevel, filters, format, options } = req.body;

  if (!repoId) {
    throw new ValidationError('Invalid request', 'Repository ID is required');
  }

  if (!format || (format !== 'png' && format !== 'svg')) {
    throw new ValidationError(
      'Invalid request',
      'Format is required and must be either "png" or "svg"'
    );
  }

  const request: ImageExportRequest = {
    repoId,
    lodLevel,
    filters,
    format,
    options,
  };

  try {
    const result = await exportImage(request);

    res.status(200).json({
      content: result.content,
      filename: result.filename,
      mimeType: result.mimeType,
      extension: result.extension,
      stats: result.stats,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('not found')) {
      throw new NotFoundError(
        'Repository not found',
        `Repository with ID ${repoId} does not exist or has no graph data`
      );
    }
    throw error;
  }
}));

export { exportRouter };
