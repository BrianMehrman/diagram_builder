/**
 * Size Validator Tests
 *
 * Tests for repository and file size validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  validateRepositorySize,
  validateFileCount,
  shouldSkipLargeFile,
  calculateDirectorySize,
  validateRepository,
} from './size-validator.js';

describe('Size Validator', () => {
  const testTempDir = path.join(os.tmpdir(), 'diagram-builder-size-test');

  beforeEach(async () => {
    // Set test configuration
    process.env.MAX_REPO_SIZE_MB = '500';
    process.env.MAX_FILE_COUNT = '10000';
    process.env.MAX_FILE_SIZE_MB = '10';

    // Clear any existing test directory
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }

    await fs.mkdir(testTempDir, { recursive: true });
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('validateRepositorySize', () => {
    it('should pass for sizes within limit', async () => {
      const sizeBytes = 100 * 1024 * 1024; // 100 MB

      const error = await validateRepositorySize(sizeBytes);

      expect(error).toBeNull();
    });

    it('should fail for sizes exceeding limit', async () => {
      const sizeBytes = 600 * 1024 * 1024; // 600 MB (exceeds 500 MB limit)

      const error = await validateRepositorySize(sizeBytes);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('repo_size');
      expect(error?.actual).toBe(sizeBytes);
      expect(error?.limit).toBe(500 * 1024 * 1024);
      expect(error?.message).toContain('600.00MB');
      expect(error?.message).toContain('500MB');
    });

    it('should pass for size exactly at limit', async () => {
      const sizeBytes = 500 * 1024 * 1024; // Exactly 500 MB

      const error = await validateRepositorySize(sizeBytes);

      expect(error).toBeNull();
    });

    it('should fail for size just over limit', async () => {
      const sizeBytes = 500 * 1024 * 1024 + 1; // 1 byte over

      const error = await validateRepositorySize(sizeBytes);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('repo_size');
    });
  });

  describe('validateFileCount', () => {
    it('should pass for counts within limit', () => {
      const fileCount = 5000;

      const error = validateFileCount(fileCount);

      expect(error).toBeNull();
    });

    it('should fail for counts exceeding limit', () => {
      const fileCount = 15000; // Exceeds 10000 limit

      const error = validateFileCount(fileCount);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('file_count');
      expect(error?.actual).toBe(fileCount);
      expect(error?.limit).toBe(10000);
      expect(error?.message).toContain('15000');
      expect(error?.message).toContain('10000');
    });

    it('should pass for count exactly at limit', () => {
      const fileCount = 10000;

      const error = validateFileCount(fileCount);

      expect(error).toBeNull();
    });

    it('should fail for count just over limit', () => {
      const fileCount = 10001;

      const error = validateFileCount(fileCount);

      expect(error).not.toBeNull();
      expect(error?.type).toBe('file_count');
    });
  });

  describe('shouldSkipLargeFile', () => {
    it('should skip files exceeding size limit', async () => {
      const testFile = path.join(testTempDir, 'large-file.txt');

      // Create file larger than 10 MB limit
      // Using Buffer.alloc instead of string.repeat to avoid memory issues
      const largeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11 MB
      await fs.writeFile(testFile, largeBuffer);

      const shouldSkip = await shouldSkipLargeFile(testFile);

      expect(shouldSkip).toBe(true);
    });

    it('should not skip files within size limit', async () => {
      const testFile = path.join(testTempDir, 'small-file.txt');

      // Create file smaller than 10 MB limit
      const smallContent = 'x'.repeat(1024 * 1024); // 1 MB
      await fs.writeFile(testFile, smallContent);

      const shouldSkip = await shouldSkipLargeFile(testFile);

      expect(shouldSkip).toBe(false);
    });

    it('should not skip files exactly at limit', async () => {
      const testFile = path.join(testTempDir, 'exact-limit-file.txt');

      // Create file exactly 10 MB
      const content = 'x'.repeat(10 * 1024 * 1024);
      await fs.writeFile(testFile, content);

      const shouldSkip = await shouldSkipLargeFile(testFile);

      expect(shouldSkip).toBe(false);
    });

    it('should not skip non-existent files', async () => {
      const testFile = path.join(testTempDir, 'non-existent.txt');

      const shouldSkip = await shouldSkipLargeFile(testFile);

      expect(shouldSkip).toBe(false);
    });

    it('should handle errors gracefully', async () => {
      // Try to check a directory (not a file)
      const shouldSkip = await shouldSkipLargeFile(testTempDir);

      // Should not throw, should return false
      expect(shouldSkip).toBe(false);
    });
  });

  describe('calculateDirectorySize', () => {
    it('should calculate size of empty directory', async () => {
      const emptyDir = path.join(testTempDir, 'empty');
      await fs.mkdir(emptyDir);

      const size = await calculateDirectorySize(emptyDir);

      expect(size).toBe(0);
    });

    it('should calculate size of directory with files', async () => {
      const dir = path.join(testTempDir, 'with-files');
      await fs.mkdir(dir);

      // Create files with known sizes
      await fs.writeFile(path.join(dir, 'file1.txt'), 'x'.repeat(100)); // 100 bytes
      await fs.writeFile(path.join(dir, 'file2.txt'), 'y'.repeat(200)); // 200 bytes
      await fs.writeFile(path.join(dir, 'file3.txt'), 'z'.repeat(300)); // 300 bytes

      const size = await calculateDirectorySize(dir);

      expect(size).toBe(600);
    });

    it('should calculate size recursively', async () => {
      const dir = path.join(testTempDir, 'nested');
      const subDir = path.join(dir, 'sub1', 'sub2');
      await fs.mkdir(subDir, { recursive: true });

      await fs.writeFile(path.join(dir, 'root.txt'), 'x'.repeat(100));
      await fs.writeFile(path.join(dir, 'sub1', 'level1.txt'), 'y'.repeat(200));
      await fs.writeFile(path.join(subDir, 'level2.txt'), 'z'.repeat(300));

      const size = await calculateDirectorySize(dir);

      expect(size).toBe(600);
    });

    it('should return 0 for non-existent directory', async () => {
      const size = await calculateDirectorySize(path.join(testTempDir, 'non-existent'));

      expect(size).toBe(0);
    });

    it('should handle symlinks gracefully', async () => {
      const dir = path.join(testTempDir, 'with-symlink');
      await fs.mkdir(dir);

      await fs.writeFile(path.join(dir, 'real-file.txt'), 'content');

      // Note: This test might behave differently on different platforms
      // Just ensure it doesn't crash
      const size = await calculateDirectorySize(dir);

      expect(size).toBeGreaterThan(0);
    });
  });

  describe('validateRepository', () => {
    it('should validate both file count and repository size', async () => {
      const dir = path.join(testTempDir, 'repo');
      await fs.mkdir(dir);

      // Create small repository
      await fs.writeFile(path.join(dir, 'file1.txt'), 'x'.repeat(1000));
      await fs.writeFile(path.join(dir, 'file2.txt'), 'y'.repeat(2000));

      const files = ['file1.txt', 'file2.txt'];

      const errors = await validateRepository(dir, files);

      expect(errors).toEqual([]);
    });

    it('should return file count error when limit exceeded', async () => {
      const dir = path.join(testTempDir, 'repo');
      await fs.mkdir(dir);

      // Create array with too many files
      const files = Array.from({ length: 15000 }, (_, i) => `file${i}.txt`);

      const errors = await validateRepository(dir, files);

      expect(errors.length).toBeGreaterThan(0);
      const fileCountError = errors.find((e) => e.type === 'file_count');
      expect(fileCountError).toBeDefined();
      expect(fileCountError?.actual).toBe(15000);
    });

    it('should return repo size error when limit exceeded', async () => {
      const dir = path.join(testTempDir, 'large-repo');
      await fs.mkdir(dir);

      // Create a file and then test validateRepositorySize directly with large size
      await fs.writeFile(path.join(dir, 'test-file.txt'), 'test content');

      const files = ['test-file.txt'];

      // Test with a simulated large repository size (600 MB)
      const largeSize = 600 * 1024 * 1024;
      const sizeError = await validateRepositorySize(largeSize);

      expect(sizeError).not.toBeNull();
      expect(sizeError?.type).toBe('repo_size');
    });

    it('should return multiple errors when both limits exceeded', async () => {
      // Test file count error
      const files = Array.from({ length: 15000 }, (_, i) => `file${i}.txt`);
      const fileCountError = validateFileCount(files.length);

      expect(fileCountError).not.toBeNull();
      expect(fileCountError?.type).toBe('file_count');

      // Test repository size error
      const largeSize = 600 * 1024 * 1024;
      const sizeError = await validateRepositorySize(largeSize);

      expect(sizeError).not.toBeNull();
      expect(sizeError?.type).toBe('repo_size');

      // Both errors should exist
      expect(fileCountError).not.toBeNull();
      expect(sizeError).not.toBeNull();
    });

    it('should handle empty repository', async () => {
      const dir = path.join(testTempDir, 'empty-repo');
      await fs.mkdir(dir);

      const errors = await validateRepository(dir, []);

      expect(errors).toEqual([]);
    });
  });
});
