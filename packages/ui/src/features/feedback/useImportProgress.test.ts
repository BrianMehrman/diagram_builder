/**
 * useImportProgress Hook Tests
 *
 * Tests for the import progress polling hook that tracks
 * codebase import status and progress.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useImportProgress } from './useImportProgress';
import { codebases } from '../../shared/api/endpoints';

// Mock the API endpoints
vi.mock('../../shared/api/endpoints', () => ({
  codebases: {
    get: vi.fn(),
  },
}));

describe('useImportProgress', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('initial state', () => {
    it('should start with null progress when not started', () => {
      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: null,
          enabled: false,
        })
      );

      expect(result.current.progress).toBe(0);
      expect(result.current.status).toBe('');
      expect(result.current.stage).toBe('pending');
      expect(result.current.isComplete).toBe(false);
      expect(result.current.isError).toBe(false);
    });

    it('should not poll when disabled', async () => {
      renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: false,
        })
      );

      // Wait a bit to ensure no API call
      await new Promise((r) => setTimeout(r, 100));

      expect(codebases.get).not.toHaveBeenCalled();
    });

    it('should not poll when codebaseId is null', async () => {
      renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: null,
          enabled: true,
        })
      );

      // Wait a bit to ensure no API call
      await new Promise((r) => setTimeout(r, 100));

      expect(codebases.get).not.toHaveBeenCalled();
    });
  });

  describe('polling behavior', () => {
    it('should poll immediately when enabled with codebaseId', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'pending',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
      });

      renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(codebases.get).toHaveBeenCalledWith('ws-1', 'cb-1');
      });
    });

    it('should stop polling when completed', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'completed',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
        repositoryId: 'repo-1',
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isComplete).toBe(true);
      });

      // Should have called once
      expect(codebases.get).toHaveBeenCalledTimes(1);
    });

    it('should stop polling when failed', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'failed',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
        error: 'Import failed',
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should have called once
      expect(codebases.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('progress mapping', () => {
    it('should map pending status to 5% progress', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'pending',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.progress).toBe(5);
        expect(result.current.stage).toBe('pending');
        expect(result.current.status).toBe('Initializing import...');
      });
    });

    it('should map processing status to 50% progress', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'processing',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
        expect(result.current.stage).toBe('processing');
        expect(result.current.status).toBe('Parsing codebase...');
      });
    });

    it('should map completed status to 100% progress', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'completed',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
        repositoryId: 'repo-1',
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.progress).toBe(100);
        expect(result.current.stage).toBe('complete');
        expect(result.current.status).toBe('Import complete!');
        expect(result.current.isComplete).toBe(true);
        expect(result.current.repositoryId).toBe('repo-1');
      });
    });

    it('should map failed status to error state', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'failed',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
        error: 'Repository not found',
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe('Repository not found');
        expect(result.current.stage).toBe('failed');
      });
    });
  });

  describe('callbacks', () => {
    it('should call onComplete when import completes', async () => {
      const onComplete = vi.fn();

      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'completed',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
        repositoryId: 'repo-1',
      });

      renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
          onComplete,
        })
      );

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalledWith('repo-1');
      });
    });

    it('should call onError when import fails', async () => {
      const onError = vi.fn();

      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'failed',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
        error: 'Parse error',
      });

      renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
          onError,
        })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Parse error');
      });
    });

    it('should call onError on API error', async () => {
      const onError = vi.fn();

      vi.mocked(codebases.get).mockRejectedValue(new Error('Network error'));

      renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
          onError,
        })
      );

      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith('Network error');
      });
    });
  });

  describe('reset', () => {
    it('should reset state when codebaseId changes to null', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'processing',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
      });

      const { result, rerender } = renderHook(
        ({ codebaseId }) =>
          useImportProgress({
            workspaceId: 'ws-1',
            codebaseId,
            enabled: true,
          }),
        { initialProps: { codebaseId: 'cb-1' as string | null } }
      );

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
      });

      // Change to null (reset)
      rerender({ codebaseId: null });

      expect(result.current.progress).toBe(0);
      expect(result.current.status).toBe('');
      expect(result.current.stage).toBe('pending');
    });
  });

  describe('cancel', () => {
    it('should provide cancel function', async () => {
      vi.mocked(codebases.get).mockResolvedValue({
        codebaseId: 'cb-1',
        workspaceId: 'ws-1',
        status: 'processing',
        source: '/path/to/repo',
        type: 'local',
        importedAt: new Date().toISOString(),
      });

      const { result } = renderHook(() =>
        useImportProgress({
          workspaceId: 'ws-1',
          codebaseId: 'cb-1',
          enabled: true,
        })
      );

      await waitFor(() => {
        expect(result.current.progress).toBe(50);
      });

      // Call cancel
      act(() => {
        result.current.cancel();
      });

      // Progress tracking should be cancelled
      expect(typeof result.current.cancel).toBe('function');
    });
  });
});
