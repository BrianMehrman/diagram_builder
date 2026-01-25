/**
 * CodebaseListItem Component Tests
 *
 * Tests for individual codebase list item with status indicators and actions
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CodebaseListItem } from './CodebaseListItem'
import type { Codebase } from './CodebaseList'

describe('CodebaseListItem', () => {
  const mockCodebase: Codebase = {
    codebaseId: 'cb-1',
    workspaceId: 'ws-1',
    status: 'completed',
    source: 'github.com/user/test-repo',
    repositoryId: 'repo-1',
    createdAt: new Date('2024-01-01'),
    fileCount: 150,
    nodeCount: 300,
  }

  describe('Display', () => {
    it('should display codebase source', () => {
      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByText(/test-repo/i)).toBeInTheDocument()
    })

    it('should display file count when available', () => {
      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByText(/150 files/i)).toBeInTheDocument()
    })

    it('should display node count when available', () => {
      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByText(/300 nodes/i)).toBeInTheDocument()
    })

    it('should not display counts when not available', () => {
      const codebaseNoCounts = {
        ...mockCodebase,
        fileCount: null,
        nodeCount: null,
      }

      render(
        <CodebaseListItem
          codebase={codebaseNoCounts}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.queryByText(/files/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/nodes/i)).not.toBeInTheDocument()
    })
  })

  describe('Status Indicators', () => {
    it('should display completed status indicator', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'completed' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByTestId('status-completed')).toBeInTheDocument()
    })

    it('should display pending status indicator', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'pending' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByTestId('status-pending')).toBeInTheDocument()
    })

    it('should display processing status indicator', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'processing' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByTestId('status-processing')).toBeInTheDocument()
    })

    it('should display failed status indicator', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'failed' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByTestId('status-failed')).toBeInTheDocument()
    })
  })

  describe('Selection', () => {
    it('should call onSelect when clicked', async () => {
      const onSelect = vi.fn()

      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={onSelect}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      const item = screen.getByRole('button', { name: /test-repo/i })
      await userEvent.click(item)

      expect(onSelect).toHaveBeenCalledTimes(1)
    })

    it('should apply selected class when selected', () => {
      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={true}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      const item = screen.getByRole('button', { name: /test-repo/i })
      expect(item).toHaveClass('selected')
    })

    it('should not apply selected class when not selected', () => {
      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      const item = screen.getByRole('button', { name: /test-repo/i })
      expect(item).not.toHaveClass('selected')
    })
  })

  describe('Delete Button', () => {
    it('should show delete button', () => {
      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('should call onDelete when delete button is clicked', async () => {
      const onDelete = vi.fn()

      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={vi.fn()}
          onDelete={onDelete}
          onRetry={vi.fn()}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await userEvent.click(deleteButton)

      expect(onDelete).toHaveBeenCalledTimes(1)
    })

    it('should not trigger onSelect when delete button is clicked', async () => {
      const onSelect = vi.fn()
      const onDelete = vi.fn()

      render(
        <CodebaseListItem
          codebase={mockCodebase}
          selected={false}
          onSelect={onSelect}
          onDelete={onDelete}
          onRetry={vi.fn()}
        />
      )

      const deleteButton = screen.getByRole('button', { name: /delete/i })
      await userEvent.click(deleteButton)

      expect(onDelete).toHaveBeenCalledTimes(1)
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('Retry Button', () => {
    it('should show retry button only for failed status', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'failed' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should not show retry button for completed status', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'completed' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })

    it('should not show retry button for pending status', () => {
      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'pending' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = vi.fn()

      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'failed' }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
    })

    it('should not trigger onSelect when retry button is clicked', async () => {
      const onSelect = vi.fn()
      const onRetry = vi.fn()

      render(
        <CodebaseListItem
          codebase={{ ...mockCodebase, status: 'failed' }}
          selected={false}
          onSelect={onSelect}
          onDelete={vi.fn()}
          onRetry={onRetry}
        />
      )

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await userEvent.click(retryButton)

      expect(onRetry).toHaveBeenCalledTimes(1)
      expect(onSelect).not.toHaveBeenCalled()
    })
  })

  describe('Error Message', () => {
    it('should display error message when present and status is failed', () => {
      render(
        <CodebaseListItem
          codebase={{
            ...mockCodebase,
            status: 'failed',
            errorMessage: 'Parse error: invalid syntax',
          }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.getByText(/parse error: invalid syntax/i)).toBeInTheDocument()
    })

    it('should not display error message when status is not failed', () => {
      render(
        <CodebaseListItem
          codebase={{
            ...mockCodebase,
            status: 'completed',
            errorMessage: 'Should not show',
          }}
          selected={false}
          onSelect={vi.fn()}
          onDelete={vi.fn()}
          onRetry={vi.fn()}
        />
      )

      expect(screen.queryByText(/should not show/i)).not.toBeInTheDocument()
    })
  })
})
