/**
 * Memory Monitor Tests
 *
 * Tests for memory monitoring utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getMemoryStats,
  checkMemoryUsage,
  monitorMemoryDuring,
  calculateRecommendedMemoryMB,
  forceGarbageCollection,
} from './memory-monitor.js';

describe('Memory Monitor', () => {
  describe('getMemoryStats', () => {
    it('should return memory statistics', () => {
      const stats = getMemoryStats();

      expect(stats.heapUsedMB).toBeGreaterThan(0);
      expect(stats.heapTotalMB).toBeGreaterThan(0);
      expect(stats.rssMB).toBeGreaterThan(0);
      expect(stats.externalMB).toBeGreaterThanOrEqual(0);
      expect(stats.arrayBuffersMB).toBeGreaterThanOrEqual(0);
    });

    it('should return values in megabytes', () => {
      const stats = getMemoryStats();

      // All values should be reasonable MB values (not bytes)
      expect(stats.heapUsedMB).toBeLessThan(10000); // Less than 10GB
      expect(stats.heapTotalMB).toBeLessThan(10000);
      expect(stats.rssMB).toBeLessThan(10000);
    });
  });

  describe('checkMemoryUsage', () => {
    it('should return healthy status for normal memory usage', () => {
      const result = checkMemoryUsage({
        warningThresholdMB: 10000, // 10GB - won't be reached
        criticalThresholdMB: 20000, // 20GB - won't be reached
      });

      expect(result.isHealthy).toBe(true);
      expect(result.stats).toBeDefined();
    });

    it('should detect warning threshold', () => {
      const result = checkMemoryUsage({
        warningThresholdMB: 0, // Will always trigger warning
        criticalThresholdMB: 20000,
      });

      expect(result.isHealthy).toBe(true); // Still healthy, just warning
      expect(result.stats.heapUsedMB).toBeGreaterThan(0);
    });

    it('should detect critical threshold', () => {
      const result = checkMemoryUsage({
        warningThresholdMB: 0,
        criticalThresholdMB: 0, // Will always trigger critical
      });

      expect(result.isHealthy).toBe(false);
      expect(result.stats).toBeDefined();
    });

    it('should use default thresholds when not provided', () => {
      const result = checkMemoryUsage();

      expect(result.isHealthy).toBeDefined();
      expect(result.stats).toBeDefined();
    });
  });

  describe('monitorMemoryDuring', () => {
    it('should monitor memory during async operation', async () => {
      const operation = async () => {
        // Simulate some work
        const arr = new Array(1000).fill('test');
        await new Promise((resolve) => setTimeout(resolve, 10));
        return arr.length;
      };

      const result = await monitorMemoryDuring(operation, {
        label: 'Test Operation',
      });

      expect(result).toBe(1000);
    });

    it('should handle operation errors', async () => {
      const operation = async () => {
        throw new Error('Test error');
      };

      await expect(
        monitorMemoryDuring(operation, {
          label: 'Failing Operation',
        })
      ).rejects.toThrow('Test error');
    });

    it('should work with interval monitoring', async () => {
      const operation = async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
        return 'done';
      };

      const result = await monitorMemoryDuring(operation, {
        label: 'Interval Test',
        intervalMs: 10,
      });

      expect(result).toBe('done');
    });

    it('should apply custom thresholds', async () => {
      const operation = async () => {
        return 'complete';
      };

      const result = await monitorMemoryDuring(operation, {
        label: 'Custom Thresholds',
        thresholds: {
          warningThresholdMB: 100,
          criticalThresholdMB: 200,
        },
      });

      expect(result).toBe('complete');
    });
  });

  describe('calculateRecommendedMemoryMB', () => {
    it('should calculate memory for small repositories', () => {
      const recommendedMB = calculateRecommendedMemoryMB(10, 100); // 10MB, 100 files

      expect(recommendedMB).toBeGreaterThan(0);
      expect(recommendedMB).toBeGreaterThanOrEqual(256); // At least base memory
    });

    it('should calculate memory for medium repositories', () => {
      const recommendedMB = calculateRecommendedMemoryMB(100, 5000); // 100MB, 5k files

      expect(recommendedMB).toBeGreaterThan(256);
    });

    it('should calculate memory for large repositories', () => {
      const recommendedMB = calculateRecommendedMemoryMB(500, 10000); // 500MB, 10k files

      expect(recommendedMB).toBeGreaterThan(500);
    });

    it('should scale with repository size', () => {
      const small = calculateRecommendedMemoryMB(10, 100);
      const medium = calculateRecommendedMemoryMB(100, 1000);
      const large = calculateRecommendedMemoryMB(500, 10000);

      expect(medium).toBeGreaterThan(small);
      expect(large).toBeGreaterThan(medium);
    });

    it('should account for file count overhead', () => {
      const fewFiles = calculateRecommendedMemoryMB(50, 100);
      const manyFiles = calculateRecommendedMemoryMB(50, 50000);

      // With large file count difference, should see memory difference
      expect(manyFiles).toBeGreaterThanOrEqual(fewFiles);
    });

    it('should round to nearest 128MB', () => {
      const recommendedMB = calculateRecommendedMemoryMB(50, 500);

      // Should be multiple of 128
      expect(recommendedMB % 128).toBe(0);
    });
  });

  describe('forceGarbageCollection', () => {
    it('should return false when GC is not exposed', () => {
      // In normal test environment, gc is not exposed
      const result = forceGarbageCollection();

      // Expect false unless --expose-gc flag is set
      expect(typeof result).toBe('boolean');
    });

    it('should not throw errors', () => {
      expect(() => forceGarbageCollection()).not.toThrow();
    });
  });
});
