/**
 * Memory Monitor
 *
 * Monitors memory usage during parsing operations
 * Provides warnings and recommendations for large repositories
 */

import { logger } from '../logger.js';

export interface MemoryStats {
  heapUsedMB: number;
  heapTotalMB: number;
  externalMB: number;
  arrayBuffersMB: number;
  rssMB: number;
}

export interface MemoryThresholds {
  warningThresholdMB: number;
  criticalThresholdMB: number;
}

/**
 * Default memory thresholds
 */
const DEFAULT_THRESHOLDS: MemoryThresholds = {
  warningThresholdMB: 512,  // 512 MB - log warning
  criticalThresholdMB: 1024, // 1 GB - consider failing
};

/**
 * Get current memory usage statistics
 */
export function getMemoryStats(): MemoryStats {
  const usage = process.memoryUsage();

  return {
    heapUsedMB: Math.round(usage.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(usage.heapTotal / 1024 / 1024),
    externalMB: Math.round(usage.external / 1024 / 1024),
    arrayBuffersMB: Math.round((usage.arrayBuffers || 0) / 1024 / 1024),
    rssMB: Math.round(usage.rss / 1024 / 1024),
  };
}

/**
 * Check memory usage and log warnings if thresholds exceeded
 * Returns true if memory is within safe limits
 */
export function checkMemoryUsage(
  thresholds: MemoryThresholds = DEFAULT_THRESHOLDS
): { isHealthy: boolean; stats: MemoryStats } {
  const stats = getMemoryStats();

  if (stats.heapUsedMB >= thresholds.criticalThresholdMB) {
    logger.error(
      `🚨 CRITICAL: Memory usage at ${stats.heapUsedMB}MB (threshold: ${thresholds.criticalThresholdMB}MB)`
    );
    logger.error('Consider reducing repository size or increasing memory limits');
    return { isHealthy: false, stats };
  }

  if (stats.heapUsedMB >= thresholds.warningThresholdMB) {
    logger.warn(
      `⚠️  WARNING: High memory usage at ${stats.heapUsedMB}MB (threshold: ${thresholds.warningThresholdMB}MB)`
    );
    return { isHealthy: true, stats };
  }

  return { isHealthy: true, stats };
}

/**
 * Monitor memory usage during async operation
 * Logs memory stats before and after, with optional interval monitoring
 */
export async function monitorMemoryDuring<T>(
  operation: () => Promise<T>,
  options: {
    label: string;
    intervalMs?: number;
    thresholds?: MemoryThresholds;
  }
): Promise<T> {
  const { label, intervalMs, thresholds = DEFAULT_THRESHOLDS } = options;

  // Log initial memory
  const initialStats = getMemoryStats();
  logger.debug(`[${label}] Starting - Memory: ${initialStats.heapUsedMB}MB`);

  // Set up interval monitoring if requested
  let intervalId: NodeJS.Timeout | undefined;
  if (intervalMs) {
    intervalId = setInterval(() => {
      checkMemoryUsage(thresholds);
    }, intervalMs);
  }

  try {
    // Execute operation
    const result = await operation();

    // Log final memory
    const finalStats = getMemoryStats();
    const deltaHeapMB = finalStats.heapUsedMB - initialStats.heapUsedMB;
    const deltaSign = deltaHeapMB > 0 ? '+' : '';

    logger.debug(
      `[${label}] Complete - Memory: ${finalStats.heapUsedMB}MB (${deltaSign}${deltaHeapMB}MB)`
    );

    // Check if final memory is within limits
    checkMemoryUsage(thresholds);

    return result;
  } finally {
    if (intervalId) {
      clearInterval(intervalId);
    }
  }
}

/**
 * Force garbage collection (if --expose-gc flag is enabled)
 * Useful for cleaning up after large parsing operations
 */
export function forceGarbageCollection(): boolean {
  if (global.gc) {
    logger.debug('Running garbage collection...');
    global.gc();
    return true;
  }

  return false;
}

/**
 * Calculate recommended memory limit for repository size
 * Returns recommended heap size in MB
 */
export function calculateRecommendedMemoryMB(repoSizeMB: number, fileCount: number): number {
  // Base memory: 256 MB
  const baseMB = 256;

  // Repository content: ~2x the repo size (for parsing overhead)
  const repoMemoryMB = repoSizeMB * 2;

  // File overhead: ~0.5 MB per 1000 files (for file metadata)
  const fileOverheadMB = Math.ceil((fileCount / 1000) * 0.5);

  const recommendedMB = baseMB + repoMemoryMB + fileOverheadMB;

  // Round up to nearest 128 MB
  return Math.ceil(recommendedMB / 128) * 128;
}

/**
 * Log memory requirements documentation
 */
export function logMemoryRequirements(repoSizeMB: number, fileCount: number): void {
  const recommendedMB = calculateRecommendedMemoryMB(repoSizeMB, fileCount);

  logger.info('📊 Memory Requirements:');
  logger.info(`  Repository Size: ${repoSizeMB}MB`);
  logger.info(`  File Count: ${fileCount.toLocaleString()}`);
  logger.info(`  Recommended Heap: ${recommendedMB}MB`);
  logger.info(`  Node.js Flag: --max-old-space-size=${recommendedMB}`);
}
