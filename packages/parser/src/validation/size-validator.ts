/**
 * Repository Size Validation
 *
 * Validates repository and file sizes to prevent DoS attacks and out-of-memory errors
 */

import fs from 'fs/promises';
import { getParserConfig } from '../config.js';
import { logger } from '../logger.js';

export interface SizeValidationError {
  type: 'repo_size' | 'file_count' | 'file_size';
  message: string;
  actual: number;
  limit: number;
}

/**
 * Validate repository size before cloning
 * For Git repos, this would require calling GitHub/GitLab API
 * For local paths, this checks actual directory size
 */
export async function validateRepositorySize(sizeBytes: number): Promise<SizeValidationError | null> {
  const config = getParserConfig();
  const limitBytes = config.MAX_REPO_SIZE_MB * 1024 * 1024;

  if (sizeBytes > limitBytes) {
    const actualMB = (sizeBytes / (1024 * 1024)).toFixed(2);
    const limitMB = config.MAX_REPO_SIZE_MB;

    const error: SizeValidationError = {
      type: 'repo_size',
      message: `Repository too large: ${actualMB}MB exceeds limit of ${limitMB}MB`,
      actual: sizeBytes,
      limit: limitBytes,
    };

    logger.warn(error.message);
    return error;
  }

  return null;
}

/**
 * Validate file count during parsing
 */
export function validateFileCount(fileCount: number): SizeValidationError | null {
  const config = getParserConfig();

  if (fileCount > config.MAX_FILE_COUNT) {
    const error: SizeValidationError = {
      type: 'file_count',
      message: `Too many files: ${fileCount} exceeds limit of ${config.MAX_FILE_COUNT}`,
      actual: fileCount,
      limit: config.MAX_FILE_COUNT,
    };

    logger.warn(error.message);
    return error;
  }

  return null;
}

/**
 * Validate individual file size before reading
 * Returns true if file should be skipped (too large)
 */
export async function shouldSkipLargeFile(filePath: string): Promise<boolean> {
  const config = getParserConfig();

  try {
    const stats = await fs.stat(filePath);
    const limitBytes = config.MAX_FILE_SIZE_MB * 1024 * 1024;

    if (stats.size > limitBytes) {
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
      logger.warn(`Skipping large file: ${filePath} (${sizeMB}MB exceeds limit of ${config.MAX_FILE_SIZE_MB}MB)`);
      return true;
    }

    return false;
  } catch (error) {
    logger.error(`Failed to check file size: ${filePath}`, error);
    return false; // Don't skip if we can't check size
  }
}

/**
 * Calculate directory size recursively
 */
export async function calculateDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = `${dirPath}/${entry.name}`;

      if (entry.isDirectory()) {
        totalSize += await calculateDirectorySize(fullPath);
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
 * Validate repository before parsing
 * Checks all size constraints
 */
export async function validateRepository(dirPath: string, files: string[]): Promise<SizeValidationError[]> {
  const errors: SizeValidationError[] = [];

  // Validate file count
  const fileCountError = validateFileCount(files.length);
  if (fileCountError) {
    errors.push(fileCountError);
  }

  // Validate repository size
  const dirSize = await calculateDirectorySize(dirPath);
  const sizeError = await validateRepositorySize(dirSize);
  if (sizeError) {
    errors.push(sizeError);
  }

  return errors;
}
