/**
 * Storage Cleanup Job
 *
 * Background job to clean up old/unused repository files
 * Implements retention policies and disk space management
 */

import { listStoredCodebases, cleanupCodebase } from './file-manager.js';
import { logger } from '../logger.js';

export interface CleanupOptions {
  /**
   * Maximum age in milliseconds before a codebase is eligible for cleanup
   * Default: 24 hours
   */
  maxAgeMs?: number;

  /**
   * If true, perform cleanup immediately
   * If false, just report what would be cleaned
   */
  dryRun?: boolean;
}

/**
 * Run cleanup job to remove old codebase files
 * Returns number of codebases cleaned up
 */
export async function runCleanupJob(options: CleanupOptions = {}): Promise<number> {
  const { maxAgeMs = 24 * 60 * 60 * 1000, dryRun = false } = options; // Default: 24 hours

  logger.info(`Starting storage cleanup job (dry run: ${dryRun})`);

  const codebases = await listStoredCodebases();
  const now = Date.now();
  let cleanedCount = 0;

  for (const { workspaceId, codebaseId, metadata } of codebases) {
    if (!metadata) continue;

    const ageMs = now - metadata.createdAt.getTime();

    if (ageMs > maxAgeMs) {
      const ageDays = Math.floor(ageMs / (24 * 60 * 60 * 1000));
      const sizeMB = (metadata.sizeBytes / (1024 * 1024)).toFixed(2);

      if (dryRun) {
        logger.info(
          `[DRY RUN] Would cleanup codebase ${codebaseId} (age: ${ageDays} days, size: ${sizeMB} MB)`
        );
      } else {
        logger.info(
          `Cleaning up codebase ${codebaseId} (age: ${ageDays} days, size: ${sizeMB} MB)`
        );
        await cleanupCodebase(workspaceId, codebaseId);
      }

      cleanedCount++;
    }
  }

  logger.info(`Cleanup job complete. ${dryRun ? 'Would cleanup' : 'Cleaned up'} ${cleanedCount} codebases`);

  return cleanedCount;
}

/**
 * Schedule periodic cleanup job
 * Returns cleanup interval ID
 */
export function scheduleCleanupJob(intervalMs: number = 60 * 60 * 1000, options: CleanupOptions = {}): NodeJS.Timeout {
  logger.info(`Scheduling cleanup job to run every ${intervalMs / 1000 / 60} minutes`);

  const interval = setInterval(async () => {
    try {
      await runCleanupJob(options);
    } catch (error) {
      logger.error('Cleanup job failed:', error);
    }
  }, intervalMs);

  // Run immediately on start
  runCleanupJob(options).catch((error) => {
    logger.error('Initial cleanup job failed:', error);
  });

  return interval;
}

/**
 * Stop scheduled cleanup job
 */
export function stopCleanupJob(interval: NodeJS.Timeout): void {
  clearInterval(interval);
  logger.info('Stopped cleanup job');
}
