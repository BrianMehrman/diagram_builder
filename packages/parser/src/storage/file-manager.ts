/**
 * File Storage Manager
 *
 * Handles temporary file storage for cloned repositories and parsed codebases.
 * Implements cleanup strategies to prevent disk space accumulation.
 */

import fs from 'fs/promises';
import path from 'path';
import { getParserConfig } from '../config.js';
import { logger } from '../logger.js';

export interface StorageMetadata {
  workspaceId: string;
  codebaseId: string;
  createdAt: Date;
  sizeBytes: number;
}

/**
 * Get storage directory for a specific codebase
 */
export function getCodebaseStoragePath(workspaceId: string, codebaseId: string): string {
  const config = getParserConfig();
  return path.join(config.PARSER_TEMP_DIR, workspaceId, codebaseId);
}

/**
 * Initialize storage directory
 * Creates the directory structure if it doesn't exist
 */
export async function initializeStorage(workspaceId: string, codebaseId: string): Promise<string> {
  const storagePath = getCodebaseStoragePath(workspaceId, codebaseId);

  try {
    await fs.mkdir(storagePath, { recursive: true });
    logger.debug(`Initialized storage directory: ${storagePath}`);
    return storagePath;
  } catch (error) {
    logger.error(`Failed to initialize storage directory: ${storagePath}`, error);
    throw new Error(`Storage initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Clean up storage for a specific codebase
 * Called after successful or failed parsing
 */
export async function cleanupCodebase(workspaceId: string, codebaseId: string): Promise<void> {
  const storagePath = getCodebaseStoragePath(workspaceId, codebaseId);

  try {
    // Check if directory exists
    try {
      await fs.access(storagePath);
    } catch {
      // Directory doesn't exist, nothing to clean
      logger.debug(`Storage directory does not exist: ${storagePath}`);
      return;
    }

    // Remove directory recursively
    await fs.rm(storagePath, { recursive: true, force: true });
    logger.info(`Cleaned up storage for codebase ${codebaseId}: ${storagePath}`);
  } catch (error) {
    logger.error(`Failed to cleanup storage for codebase ${codebaseId}:`, error);
    // Don't throw - cleanup failures shouldn't block operations
  }
}

/**
 * Clean up storage for an entire workspace
 */
export async function cleanupWorkspace(workspaceId: string): Promise<void> {
  const config = getParserConfig();
  const workspacePath = path.join(config.PARSER_TEMP_DIR, workspaceId);

  try {
    await fs.rm(workspacePath, { recursive: true, force: true });
    logger.info(`Cleaned up storage for workspace ${workspaceId}`);
  } catch (error) {
    logger.error(`Failed to cleanup workspace ${workspaceId}:`, error);
  }
}

/**
 * Get storage metadata for a codebase
 */
export async function getStorageMetadata(workspaceId: string, codebaseId: string): Promise<StorageMetadata | null> {
  const storagePath = getCodebaseStoragePath(workspaceId, codebaseId);

  try {
    const stats = await fs.stat(storagePath);
    return {
      workspaceId,
      codebaseId,
      createdAt: stats.birthtime,
      sizeBytes: await getDirectorySize(storagePath),
    };
  } catch {
    return null;
  }
}

/**
 * Calculate total size of a directory recursively
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      if (entry.isDirectory()) {
        totalSize += await getDirectorySize(fullPath);
      } else if (entry.isFile()) {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  } catch (error) {
    logger.warn(`Failed to calculate directory size for ${dirPath}:`, error);
  }

  return totalSize;
}

/**
 * List all codebases in storage (for cleanup job)
 */
export async function listStoredCodebases(): Promise<Array<{ workspaceId: string; codebaseId: string; metadata: StorageMetadata | null }>> {
  const config = getParserConfig();
  const basePath = config.PARSER_TEMP_DIR;
  const codebases: Array<{ workspaceId: string; codebaseId: string; metadata: StorageMetadata | null }> = [];

  try {
    // Check if base directory exists
    try {
      await fs.access(basePath);
    } catch {
      return [];
    }

    // List workspace directories
    const workspaces = await fs.readdir(basePath, { withFileTypes: true });

    for (const workspace of workspaces) {
      if (!workspace.isDirectory()) continue;

      const workspaceId = workspace.name;
      const workspacePath = path.join(basePath, workspaceId);

      // List codebase directories in this workspace
      const codebaseEntries = await fs.readdir(workspacePath, { withFileTypes: true });

      for (const codebase of codebaseEntries) {
        if (!codebase.isDirectory()) continue;

        const codebaseId = codebase.name;
        const metadata = await getStorageMetadata(workspaceId, codebaseId);

        codebases.push({
          workspaceId,
          codebaseId,
          metadata,
        });
      }
    }
  } catch (error) {
    logger.error('Failed to list stored codebases:', error);
  }

  return codebases;
}
