/**
 * File Manager Tests
 *
 * Tests for file storage management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import {
  getCodebaseStoragePath,
  initializeStorage,
  cleanupCodebase,
  cleanupWorkspace,
  getStorageMetadata,
  listStoredCodebases,
} from './file-manager.js';

describe('File Storage Manager', () => {
  const testWorkspaceId = 'test-workspace-123';
  const testCodebaseId = 'test-codebase-456';
  const testTempDir = path.join(os.tmpdir(), 'diagram-builder-test');

  beforeEach(async () => {
    // Set test temp directory
    process.env.PARSER_TEMP_DIR = testTempDir;

    // Clear any existing test directory
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore if doesn't exist
    }
  });

  afterEach(async () => {
    // Cleanup test directory
    try {
      await fs.rm(testTempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('getCodebaseStoragePath', () => {
    it('should return correct storage path', () => {
      const storagePath = getCodebaseStoragePath(testWorkspaceId, testCodebaseId);

      expect(storagePath).toBe(path.join(testTempDir, testWorkspaceId, testCodebaseId));
    });

    it('should handle different workspace and codebase IDs', () => {
      const path1 = getCodebaseStoragePath('workspace-1', 'codebase-1');
      const path2 = getCodebaseStoragePath('workspace-2', 'codebase-2');

      expect(path1).not.toBe(path2);
      expect(path1).toContain('workspace-1/codebase-1');
      expect(path2).toContain('workspace-2/codebase-2');
    });
  });

  describe('initializeStorage', () => {
    it('should create storage directory', async () => {
      const storagePath = await initializeStorage(testWorkspaceId, testCodebaseId);

      expect(storagePath).toBe(getCodebaseStoragePath(testWorkspaceId, testCodebaseId));

      // Verify directory exists
      const stats = await fs.stat(storagePath);
      expect(stats.isDirectory()).toBe(true);
    });

    it('should create nested directories recursively', async () => {
      const storagePath = await initializeStorage(testWorkspaceId, testCodebaseId);

      // Verify parent directories exist
      const workspacePath = path.join(testTempDir, testWorkspaceId);
      const workspaceStats = await fs.stat(workspacePath);
      expect(workspaceStats.isDirectory()).toBe(true);

      // Verify codebase directory exists
      const codebaseStats = await fs.stat(storagePath);
      expect(codebaseStats.isDirectory()).toBe(true);
    });

    it('should succeed if directory already exists', async () => {
      // Initialize twice
      const path1 = await initializeStorage(testWorkspaceId, testCodebaseId);
      const path2 = await initializeStorage(testWorkspaceId, testCodebaseId);

      expect(path1).toBe(path2);

      // Verify directory still exists
      const stats = await fs.stat(path1);
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe('cleanupCodebase', () => {
    it('should remove codebase directory', async () => {
      // Create directory
      const storagePath = await initializeStorage(testWorkspaceId, testCodebaseId);

      // Add a test file
      await fs.writeFile(path.join(storagePath, 'test.txt'), 'test content');

      // Cleanup
      await cleanupCodebase(testWorkspaceId, testCodebaseId);

      // Verify directory is gone
      await expect(fs.access(storagePath)).rejects.toThrow();
    });

    it('should succeed if directory does not exist', async () => {
      // Should not throw
      await expect(cleanupCodebase(testWorkspaceId, testCodebaseId)).resolves.toBeUndefined();
    });

    it('should remove nested files and directories', async () => {
      const storagePath = await initializeStorage(testWorkspaceId, testCodebaseId);

      // Create nested structure
      const nestedDir = path.join(storagePath, 'nested', 'deep');
      await fs.mkdir(nestedDir, { recursive: true });
      await fs.writeFile(path.join(nestedDir, 'file.txt'), 'content');

      // Cleanup
      await cleanupCodebase(testWorkspaceId, testCodebaseId);

      // Verify everything is gone
      await expect(fs.access(storagePath)).rejects.toThrow();
    });
  });

  describe('cleanupWorkspace', () => {
    it('should remove entire workspace directory', async () => {
      // Create multiple codebases in same workspace
      await initializeStorage(testWorkspaceId, 'codebase-1');
      await initializeStorage(testWorkspaceId, 'codebase-2');
      await initializeStorage(testWorkspaceId, 'codebase-3');

      const workspacePath = path.join(testTempDir, testWorkspaceId);

      // Cleanup workspace
      await cleanupWorkspace(testWorkspaceId);

      // Verify workspace is gone
      await expect(fs.access(workspacePath)).rejects.toThrow();
    });

    it('should succeed if workspace does not exist', async () => {
      await expect(cleanupWorkspace('non-existent-workspace')).resolves.toBeUndefined();
    });
  });

  describe('getStorageMetadata', () => {
    it('should return metadata for existing codebase', async () => {
      const storagePath = await initializeStorage(testWorkspaceId, testCodebaseId);

      // Add some files
      await fs.writeFile(path.join(storagePath, 'file1.txt'), 'content 1');
      await fs.writeFile(path.join(storagePath, 'file2.txt'), 'content 2');

      const metadata = await getStorageMetadata(testWorkspaceId, testCodebaseId);

      expect(metadata).not.toBeNull();
      expect(metadata?.workspaceId).toBe(testWorkspaceId);
      expect(metadata?.codebaseId).toBe(testCodebaseId);
      expect(metadata?.createdAt).toBeInstanceOf(Date);
      expect(metadata?.sizeBytes).toBeGreaterThan(0);
    });

    it('should return null for non-existent codebase', async () => {
      const metadata = await getStorageMetadata('non-existent', 'non-existent');

      expect(metadata).toBeNull();
    });

    it('should calculate correct directory size', async () => {
      const storagePath = await initializeStorage(testWorkspaceId, testCodebaseId);

      // Create files with known sizes
      const content1 = 'x'.repeat(100); // 100 bytes
      const content2 = 'y'.repeat(200); // 200 bytes
      await fs.writeFile(path.join(storagePath, 'file1.txt'), content1);
      await fs.writeFile(path.join(storagePath, 'file2.txt'), content2);

      const metadata = await getStorageMetadata(testWorkspaceId, testCodebaseId);

      expect(metadata?.sizeBytes).toBe(300);
    });
  });

  describe('listStoredCodebases', () => {
    it('should list all codebases across workspaces', async () => {
      // Create multiple workspaces and codebases
      await initializeStorage('workspace-1', 'codebase-1');
      await initializeStorage('workspace-1', 'codebase-2');
      await initializeStorage('workspace-2', 'codebase-1');

      const codebases = await listStoredCodebases();

      expect(codebases).toHaveLength(3);

      const ids = codebases.map((c) => `${c.workspaceId}/${c.codebaseId}`);
      expect(ids).toContain('workspace-1/codebase-1');
      expect(ids).toContain('workspace-1/codebase-2');
      expect(ids).toContain('workspace-2/codebase-1');
    });

    it('should return empty array if temp directory does not exist', async () => {
      // Don't create any directories
      await fs.rm(testTempDir, { recursive: true, force: true });

      const codebases = await listStoredCodebases();

      expect(codebases).toEqual([]);
    });

    it('should include metadata for each codebase', async () => {
      await initializeStorage(testWorkspaceId, testCodebaseId);

      const codebases = await listStoredCodebases();

      expect(codebases).toHaveLength(1);
      expect(codebases[0].metadata).not.toBeNull();
      expect(codebases[0].metadata?.workspaceId).toBe(testWorkspaceId);
      expect(codebases[0].metadata?.codebaseId).toBe(testCodebaseId);
    });

    it('should skip non-directory entries', async () => {
      // Create workspace directory
      const workspacePath = path.join(testTempDir, testWorkspaceId);
      await fs.mkdir(workspacePath, { recursive: true });

      // Add a file in workspace directory (should be skipped)
      await fs.writeFile(path.join(workspacePath, 'not-a-codebase.txt'), 'content');

      // Add actual codebase
      await initializeStorage(testWorkspaceId, testCodebaseId);

      const codebases = await listStoredCodebases();

      // Should only find the actual codebase
      expect(codebases).toHaveLength(1);
      expect(codebases[0].codebaseId).toBe(testCodebaseId);
    });
  });
});
