/**
 * CodebaseList Component Tests
 *
 * Tests for the codebase list management component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodebaseList } from './CodebaseList'
import * as api from '../../shared/api/endpoints'

// Mock the API
vi.mock('../../shared/api/endpoints', () => ({
  codebases: {
    list: vi.fn(),
    delete: vi.fn(),
    retry: vi.fn(),
  },
}))

describe('CodebaseList', () => {
  const mockWorkspaceId = 'workspace-123'
  const mockCodebases = [
    {
      codebaseId: 'cb-1',
      workspaceId: mockWorkspaceId,
      status: 'completed',
      source: 'github.com/user/repo1',
      repositoryId: 'repo-1',
      createdAt: new Date('2024-01-01'),
      fileCount: 150,
      nodeCount: 300,
    },
    {
      codebaseId: 'cb-2',
      workspaceId: mockWorkspaceId,
      status: 'pending',
      source: 'github.com/user/repo2',
      repositoryId: null,
      createdAt: new Date('2024-01-02'),
      fileCount: null,
      nodeCount: null,
    },
    {
      codebaseId: 'cb-3',
      workspaceId: mockWorkspaceId,
      status: 'failed',
      source: 'github.com/user/repo3',
      repositoryId: null,
      createdAt: new Date('2024-01-03'),
      errorMessage: 'Parse error',
      fileCount: null,
      nodeCount: null,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render loading state initially', () => {
      vi.mocked(api.codebases.list).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should render codebase list when loaded', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/repo2/i)).toBeInTheDocument()
      expect(screen.getByText(/repo3/i)).toBeInTheDocument()
    })

    it('should display status indicators for each codebase', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        // Check for status indicators (using test IDs or accessible names)
        expect(screen.getByTestId('status-completed')).toBeInTheDocument()
        expect(screen.getByTestId('status-pending')).toBeInTheDocument()
        expect(screen.getByTestId('status-failed')).toBeInTheDocument()
      })
    })

    it('should show empty state when no codebases exist', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: [],
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/no codebases/i)).toBeInTheDocument()
      })
    })

    it('should show error state when fetch fails', async () => {
      vi.mocked(api.codebases.list).mockRejectedValue(new Error('Network error'))

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })
    })
  })

  describe('Codebase Selection', () => {
    it('should call onCodebaseSelected when codebase is clicked', async () => {
      const onSelected = vi.fn()
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(
        <CodebaseList workspaceId={mockWorkspaceId} onCodebaseSelected={onSelected} />
      )

      await waitFor(() => {
        expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      })

      const codebaseItem = screen.getByRole('button', { name: /repo1/i })
      await userEvent.click(codebaseItem)

      expect(onSelected).toHaveBeenCalledWith('cb-1')
    })

    it('should highlight selected codebase', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} selectedId="cb-1" />)

      await waitFor(() => {
        const item = screen.getByRole('button', { name: /repo1/i })
        expect(item).toHaveClass('selected')
      })
    })
  })

  describe('Delete Functionality', () => {
    it('should show delete button for each codebase', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
        expect(deleteButtons).toHaveLength(3)
      })
    })

    it('should call delete API when delete is confirmed', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })
      vi.mocked(api.codebases.delete).mockResolvedValue({ success: true })

      // Mock window.confirm to return true
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await userEvent.click(deleteButtons[0])

      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('Delete')
      )
      expect(api.codebases.delete).toHaveBeenCalledWith(mockWorkspaceId, 'cb-1')
    })

    it('should not delete when user cancels confirmation', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      vi.spyOn(window, 'confirm').mockReturnValue(false)

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await userEvent.click(deleteButtons[0])

      expect(api.codebases.delete).not.toHaveBeenCalled()
    })

    it('should refresh list after successful deletion', async () => {
      const firstResponse = { codebases: mockCodebases }
      const secondResponse = {
        codebases: mockCodebases.filter((cb) => cb.codebaseId !== 'cb-1'),
      }

      vi.mocked(api.codebases.list)
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse)
      vi.mocked(api.codebases.delete).mockResolvedValue({ success: true })
      vi.spyOn(window, 'confirm').mockReturnValue(true)

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      })

      const deleteButtons = screen.getAllByRole('button', { name: /delete/i })
      await userEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(screen.queryByText(/repo1/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Retry Functionality', () => {
    it('should show retry button only for failed codebases', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        const retryButtons = screen.getAllByRole('button', { name: /retry/i })
        expect(retryButtons).toHaveLength(1) // Only the failed codebase
      })
    })

    it('should call retry API when retry button is clicked', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })
      vi.mocked(api.codebases.retry).mockResolvedValue({ success: true, status: 'pending' })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/repo3/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)

      expect(api.codebases.retry).toHaveBeenCalledWith(mockWorkspaceId, 'cb-3')
    })

    it('should refresh list after successful retry', async () => {
      const firstResponse = { codebases: mockCodebases }
      const secondResponse = {
        codebases: mockCodebases.map((cb) =>
          cb.codebaseId === 'cb-3' ? { ...cb, status: 'pending' } : cb
        ),
      }

      vi.mocked(api.codebases.list)
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse)
      vi.mocked(api.codebases.retry).mockResolvedValue({ success: true, status: 'pending' })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByTestId('status-failed')).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)

      await waitFor(() => {
        expect(screen.queryByTestId('status-failed')).not.toBeInTheDocument()
        expect(screen.getAllByTestId('status-pending')).toHaveLength(2)
      })
    })
  })

  describe('File Count and Node Count Display', () => {
    it('should display file count and node count when available', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: mockCodebases,
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/150 files/i)).toBeInTheDocument()
        expect(screen.getByText(/300 nodes/i)).toBeInTheDocument()
      })
    })

    it('should not display counts when not available', async () => {
      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: [mockCodebases[1]], // Pending codebase with no counts
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/repo2/i)).toBeInTheDocument()
      })

      expect(screen.queryByText(/files/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/nodes/i)).not.toBeInTheDocument()
    })
  })

  describe('Refresh Trigger', () => {
    it('should reload codebases when refreshTrigger changes', async () => {
      vi.mocked(api.codebases.list).mockResolvedValueOnce({
        codebases: [mockCodebases[0]], // First load: only completed
      })

      const { rerender } = render(
        <CodebaseList workspaceId={mockWorkspaceId} refreshTrigger={0} />
      )

      await waitFor(() => {
        expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      })

      // Only one codebase should be visible
      expect(screen.queryByText(/repo2/i)).not.toBeInTheDocument()

      // Mock returns all codebases on second call
      vi.mocked(api.codebases.list).mockResolvedValueOnce({
        codebases: mockCodebases, // All codebases
      })

      // Trigger refresh by changing refreshTrigger
      rerender(<CodebaseList workspaceId={mockWorkspaceId} refreshTrigger={1} />)

      await waitFor(() => {
        expect(screen.getByText(/repo2/i)).toBeInTheDocument()
      })

      // All three codebases should be visible now
      expect(screen.getByText(/repo1/i)).toBeInTheDocument()
      expect(screen.getByText(/repo3/i)).toBeInTheDocument()

      // API should have been called twice
      expect(api.codebases.list).toHaveBeenCalledTimes(2)
    })
  })

  describe('Progress Display', () => {
    it('should display progress bar when codebase is processing', async () => {
      const processingCodebase = {
        codebaseId: 'cb-processing',
        workspaceId: mockWorkspaceId,
        status: 'processing' as const,
        source: 'github.com/user/processing-repo',
        repositoryId: null,
        importedAt: '2024-01-01T00:00:00Z',
        progress: {
          percentage: 45,
          stage: 'parsing' as const,
          message: 'Reading files (100/200)',
          filesProcessed: 100,
          totalFiles: 200,
        },
      }

      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: [processingCodebase],
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/processing-repo/i)).toBeInTheDocument()
      })

      // Check progress message is displayed
      expect(screen.getByText(/Reading files/i)).toBeInTheDocument()

      // Check progress percentage is displayed
      expect(screen.getByText(/45%/)).toBeInTheDocument()

      // Check progress bar exists
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '45')

      // Check file count is displayed
      expect(screen.getByText(/100 \/ 200 files/i)).toBeInTheDocument()
    })

    it('should display stage name', async () => {
      const processingCodebase = {
        codebaseId: 'cb-processing',
        workspaceId: mockWorkspaceId,
        status: 'processing' as const,
        source: 'github.com/user/repo',
        repositoryId: null,
        importedAt: '2024-01-01T00:00:00Z',
        progress: {
          percentage: 70,
          stage: 'graph-building' as const,
          message: 'Building dependency graph...',
        },
      }

      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: [processingCodebase],
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/graph-building/i)).toBeInTheDocument()
      })
    })

    it('should not display progress bar when codebase is completed', async () => {
      const completedCodebase = {
        codebaseId: 'cb-completed',
        workspaceId: mockWorkspaceId,
        status: 'completed' as const,
        source: 'github.com/user/completed-repo',
        repositoryId: 'repo-1',
        importedAt: '2024-01-01T00:00:00Z',
      }

      vi.mocked(api.codebases.list).mockResolvedValue({
        codebases: [completedCodebase],
      })

      render(<CodebaseList workspaceId={mockWorkspaceId} />)

      await waitFor(() => {
        expect(screen.getByText(/completed-repo/i)).toBeInTheDocument()
      })

      // Progress bar should not be present
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })
  })
})
