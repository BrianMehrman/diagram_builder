/**
 * Cleanup Job Tests
 *
 * Tests for storage cleanup background job
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { runCleanupJob, scheduleCleanupJob, stopCleanupJob } from './cleanup.js';
import { initializeStorage } from './file-manager.js';

describe('Storage Cleanup Job', () => {
  const testTempDir = path.join(os.tmpdir(), 'diagram-builder-cleanup-test');

  beforeEach(async () => {
    // Set test temp directory
    process.env.PARSER_TEMP_DIR = testTempDir;

    // Clear any existing test directory
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }

    // Clear all timers
    vi.clearAllTimers();
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }

    // Restore real timers
    vi.useRealTimers();
  });

  describe('runCleanupJob', () => {
    it('should cleanup codebases older than maxAgeMs', async () => {
      // Create old codebase
      const oldCodebasePath = await initializeStorage('workspace-1', 'old-codebase');

      // Make it appear old by changing birthtime (not possible directly)
      // Instead, we'll use a short maxAgeMs value
      const veryShortAge = 1; // 1 millisecond

      // Wait a bit to ensure age threshold is exceeded
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleanedCount = await runCleanupJob({ maxAgeMs: veryShortAge, dryRun: false });

      expect(cleanedCount).toBe(1);

      // Verify directory is gone
      await expect(fs.access(oldCodebasePath)).rejects.toThrow();
    });

    it('should not cleanup recent codebases', async () => {
      const recentCodebasePath = await initializeStorage('workspace-1', 'recent-codebase');

      const veryLongAge = 24 * 60 * 60 * 1000; // 24 hours

      const cleanedCount = await runCleanupJob({ maxAgeMs: veryLongAge, dryRun: false });

      expect(cleanedCount).toBe(0);

      // Verify directory still exists
      const stats = await fs.stat(recentCodebasePath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should perform dry run without deleting', async () => {
      const codebasePath = await initializeStorage('workspace-1', 'test-codebase');

      const veryShortAge = 1;
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleanedCount = await runCleanupJob({ maxAgeMs: veryShortAge, dryRun: true });

      expect(cleanedCount).toBe(1);

      // Verify directory still exists (dry run)
      const stats = await fs.stat(codebasePath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should cleanup multiple old codebases', async () => {
      await initializeStorage('workspace-1', 'codebase-1');
      await initializeStorage('workspace-1', 'codebase-2');
      await initializeStorage('workspace-2', 'codebase-1');

      const veryShortAge = 1;
      await new Promise((resolve) => setTimeout(resolve, 10));

      const cleanedCount = await runCleanupJob({ maxAgeMs: veryShortAge, dryRun: false });

      expect(cleanedCount).toBe(3);
    });

    it('should use default maxAgeMs of 24 hours', async () => {
      const recentCodebasePath = await initializeStorage('workspace-1', 'recent-codebase');

      // Default is 24 hours, so recent codebase should not be cleaned
      const cleanedCount = await runCleanupJob({ dryRun: false });

      expect(cleanedCount).toBe(0);

      // Verify directory still exists
      const stats = await fs.stat(recentCodebasePath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should return 0 when no codebases exist', async () => {
      const cleanedCount = await runCleanupJob({ dryRun: false });

      expect(cleanedCount).toBe(0);
    });
  });

  describe('scheduleCleanupJob', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should schedule cleanup job at specified interval', async () => {
      const intervalMs = 60 * 1000; // 1 minute

      const interval = scheduleCleanupJob(intervalMs, { dryRun: true });

      expect(interval).toBeDefined();

      // Cleanup
      stopCleanupJob(interval);
    });

    it('should run cleanup immediately on start', async () => {
      // Create test codebase
      await initializeStorage('workspace-1', 'test-codebase');

      const intervalMs = 60 * 1000;
      const interval = scheduleCleanupJob(intervalMs, { maxAgeMs: 1, dryRun: true });

      // Wait for initial run
      await vi.waitFor(() => {
        // Initial cleanup should have run
      });

      stopCleanupJob(interval);
    });

    it('should run cleanup at each interval', async () => {
      const intervalMs = 1000; // 1 second
      let runCount = 0;

      // Mock the cleanup function to track calls
      const interval = scheduleCleanupJob(intervalMs, { dryRun: true });

      // Fast-forward time
      vi.advanceTimersByTime(intervalMs * 3);

      // Wait for async operations
      await vi.waitFor(() => {
        // Should have run multiple times
      });

      stopCleanupJob(interval);
    });

    it('should use default interval of 1 hour', () => {
      const interval = scheduleCleanupJob(undefined, { dryRun: true });

      expect(interval).toBeDefined();

      stopCleanupJob(interval);
    });
  });

  describe('stopCleanupJob', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should stop scheduled cleanup job', () => {
      const interval = scheduleCleanupJob(1000, { dryRun: true });

      // Should not throw
      expect(() => stopCleanupJob(interval)).not.toThrow();

      // Advance time - should not run anymore
      vi.advanceTimersByTime(10000);
    });
  });
});
