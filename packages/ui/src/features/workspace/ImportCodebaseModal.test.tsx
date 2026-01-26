/**
 * ImportCodebaseModal Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImportCodebaseModal } from './ImportCodebaseModal'
import { codebases } from '../../shared/api/endpoints'

// Mock the API module
vi.mock('../../shared/api/endpoints', () => ({
  codebases: {
    create: vi.fn(),
    get: vi.fn(),
  },
}))

// Mock the toast store and useImportProgress hook
const mockShowSuccess = vi.fn()
const mockShowError = vi.fn()
const mockCancelProgress = vi.fn()

vi.mock('../feedback', () => ({
  useToastStore: (selector: (state: { showSuccess: () => void; showError: () => void }) => unknown) =>
    selector({
      showSuccess: mockShowSuccess,
      showError: mockShowError,
    }),
  useImportProgress: () => ({
    progress: 50,
    status: 'Parsing codebase...',
    stage: 'processing',
    isComplete: false,
    isError: false,
    error: null,
    repositoryId: null,
    cancel: mockCancelProgress,
  }),
  ImportProgress: ({ open, progress, status, onCancel }: { open: boolean; progress: number; status: string; onCancel: () => void }) =>
    open ? (
      <div data-testid="import-progress-modal">
        <div data-testid="progress-value">{progress}</div>
        <div data-testid="status-text">{status}</div>
        <button onClick={onCancel} data-testid="cancel-progress">
          Cancel
        </button>
      </div>
    ) : null,
}))

describe('ImportCodebaseModal', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()
  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    workspaceId: 'test-workspace',
    onSuccess: mockOnSuccess,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockShowSuccess.mockClear()
    mockShowError.mockClear()
    mockCancelProgress.mockClear()
  })

  it('should not render when isOpen is false', () => {
    render(<ImportCodebaseModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId('import-codebase-modal')).not.toBeInTheDocument()
  })

  it('should render modal when isOpen is true', () => {
    render(<ImportCodebaseModal {...defaultProps} />)
    expect(screen.getByTestId('import-codebase-modal')).toBeInTheDocument()
    expect(screen.getByText('Import Codebase')).toBeInTheDocument()
  })

  it('should close modal when close button is clicked', () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    const closeButton = screen.getByTestId('close-modal-button')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should have local type selected by default', () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    const localRadio = screen.getByTestId('type-local') as HTMLInputElement
    const gitRadio = screen.getByTestId('type-git') as HTMLInputElement

    expect(localRadio.checked).toBe(true)
    expect(gitRadio.checked).toBe(false)
  })

  it('should switch between local and git types', () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    const gitRadio = screen.getByTestId('type-git')
    fireEvent.click(gitRadio)

    expect((screen.getByTestId('type-git') as HTMLInputElement).checked).toBe(true)
    expect((screen.getByTestId('type-local') as HTMLInputElement).checked).toBe(false)
  })

  it('should show branch input for git type', () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    // Branch input should not be visible for local type
    expect(screen.queryByTestId('branch-input')).not.toBeInTheDocument()

    // Switch to git type
    const gitRadio = screen.getByTestId('type-git')
    fireEvent.click(gitRadio)

    // Branch input should now be visible
    expect(screen.getByTestId('branch-input')).toBeInTheDocument()
  })

  it('should show validation error for empty source', async () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('source-error')).toHaveTextContent('Source is required')
    })
  })

  it('should validate local path format', async () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: 'https://github.com/user/repo.git' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('source-error')).toHaveTextContent('Local path cannot be a URL')
    })
  })

  it('should validate git URL format', async () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    // Switch to git type
    const gitRadio = screen.getByTestId('type-git')
    fireEvent.click(gitRadio)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: 'invalid-url' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('source-error')).toHaveTextContent('Invalid Git repository URL')
    })
  })

  it('should successfully submit import request', async () => {
    vi.mocked(codebases.create).mockResolvedValue({
      codebaseId: 'cb-123',
      workspaceId: 'test-workspace',
      source: '/path/to/repo',
      type: 'local',
      status: 'pending',
      importedAt: new Date().toISOString(),
    })

    render(<ImportCodebaseModal {...defaultProps} />)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(codebases.create).toHaveBeenCalledWith('test-workspace', {
        source: '/path/to/repo',
        type: 'local',
      })
    })

    // Should show progress modal after API call
    await waitFor(() => {
      expect(screen.getByTestId('import-progress-modal')).toBeInTheDocument()
    })
  })

  it('should successfully import git repository with branch', async () => {
    vi.mocked(codebases.create).mockResolvedValue({
      codebaseId: 'cb-456',
      workspaceId: 'test-workspace',
      source: 'https://github.com/user/repo.git',
      type: 'git',
      branch: 'develop',
      status: 'pending',
      importedAt: new Date().toISOString(),
    })

    render(<ImportCodebaseModal {...defaultProps} />)

    // Switch to git type
    const gitRadio = screen.getByTestId('type-git')
    fireEvent.click(gitRadio)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: 'https://github.com/user/repo.git' } })

    const branchInput = screen.getByTestId('branch-input')
    fireEvent.change(branchInput, { target: { value: 'develop' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(codebases.create).toHaveBeenCalledWith('test-workspace', {
        source: 'https://github.com/user/repo.git',
        type: 'git',
        branch: 'develop',
      })
    })
  })

  it('should include credentials when token is provided', async () => {
    vi.mocked(codebases.create).mockResolvedValue({
      codebaseId: 'cb-789',
      workspaceId: 'test-workspace',
      source: 'https://github.com/user/private-repo.git',
      type: 'git',
      status: 'pending',
      importedAt: new Date().toISOString(),
    })

    render(<ImportCodebaseModal {...defaultProps} />)

    // Switch to git type
    const gitRadio = screen.getByTestId('type-git')
    fireEvent.click(gitRadio)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: 'https://github.com/user/private-repo.git' } })

    // Enable the token input by checking the checkbox
    const showTokenCheckbox = screen.getByTestId('show-token-checkbox')
    fireEvent.click(showTokenCheckbox)

    const tokenInput = screen.getByTestId('token-input')
    fireEvent.change(tokenInput, { target: { value: 'ghp_test_token_123' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(codebases.create).toHaveBeenCalledWith('test-workspace', {
        source: 'https://github.com/user/private-repo.git',
        type: 'git',
        branch: 'main',
        credentials: {
          type: 'oauth',
          token: 'ghp_test_token_123',
        },
      })
    })
  })

  it('should show loading state during import', async () => {
    vi.mocked(codebases.create).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                codebaseId: 'cb-loading',
                workspaceId: 'test-workspace',
                source: '/path/to/repo',
                type: 'local',
                status: 'pending',
                importedAt: new Date().toISOString(),
              }),
            100
          )
        )
    )

    render(<ImportCodebaseModal {...defaultProps} />)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    // Should show loading state
    expect(submitButton).toBeDisabled()
    expect(screen.getByText('Importing...')).toBeInTheDocument()

    // Should show progress modal after API completes
    await waitFor(() => {
      expect(screen.getByTestId('import-progress-modal')).toBeInTheDocument()
    })
  })

  it('should display error message on import failure', async () => {
    const errorMessage = 'Failed to connect to repository'
    vi.mocked(codebases.create).mockRejectedValue(new Error(errorMessage))

    render(<ImportCodebaseModal {...defaultProps} />)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toHaveTextContent(errorMessage)
    })
  })

  it('should clear validation error when source is updated', async () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    // Trigger validation error
    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByTestId('source-error')).toBeInTheDocument()
    })

    // Update source input
    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: '/new/path' } })

    // Error should be cleared
    expect(screen.queryByTestId('source-error')).not.toBeInTheDocument()
  })

  it('should reset form state on close', () => {
    render(<ImportCodebaseModal {...defaultProps} />)

    // Fill in form
    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

    // Close modal
    const closeButton = screen.getByTestId('close-modal-button')
    fireEvent.click(closeButton)

    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should not close modal while import is in progress', () => {
    vi.mocked(codebases.create).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 1000))
    )

    render(<ImportCodebaseModal {...defaultProps} />)

    const sourceInput = screen.getByTestId('source-input')
    fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

    const submitButton = screen.getByTestId('submit-button')
    fireEvent.click(submitButton)

    // Try to close while loading
    const closeButton = screen.getByTestId('close-modal-button')
    expect(closeButton).toBeDisabled()
  })

  describe('Toast Notifications', () => {
    it('should show success toast when import starts', async () => {
      vi.mocked(codebases.create).mockResolvedValue({
        codebaseId: 'cb-123',
        workspaceId: 'test-workspace',
        source: '/path/to/repo',
        type: 'local',
        status: 'pending',
        importedAt: new Date().toISOString(),
      })

      render(<ImportCodebaseModal {...defaultProps} />)

      const sourceInput = screen.getByTestId('source-input')
      fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Import Started',
          'Codebase import has started. Tracking progress...'
        )
      })
    })

    it('should show error toast on failed import', async () => {
      const errorMessage = 'Network error occurred'
      vi.mocked(codebases.create).mockRejectedValue(new Error(errorMessage))

      render(<ImportCodebaseModal {...defaultProps} />)

      const sourceInput = screen.getByTestId('source-input')
      fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockShowError).toHaveBeenCalledWith(
          'Import Failed',
          `${errorMessage}. Please check your input and try again.`
        )
      })
    })
  })

  describe('Progress Modal', () => {
    it('should show progress modal after successful import request', async () => {
      vi.mocked(codebases.create).mockResolvedValue({
        codebaseId: 'cb-123',
        workspaceId: 'test-workspace',
        source: '/path/to/repo',
        type: 'local',
        status: 'pending',
        importedAt: new Date().toISOString(),
      })

      render(<ImportCodebaseModal {...defaultProps} />)

      const sourceInput = screen.getByTestId('source-input')
      fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('import-progress-modal')).toBeInTheDocument()
      })

      // Should show progress value from hook
      expect(screen.getByTestId('progress-value')).toHaveTextContent('50')
      expect(screen.getByTestId('status-text')).toHaveTextContent('Parsing codebase...')
    })

    it('should cancel progress when cancel button is clicked', async () => {
      vi.mocked(codebases.create).mockResolvedValue({
        codebaseId: 'cb-123',
        workspaceId: 'test-workspace',
        source: '/path/to/repo',
        type: 'local',
        status: 'pending',
        importedAt: new Date().toISOString(),
      })

      render(<ImportCodebaseModal {...defaultProps} />)

      const sourceInput = screen.getByTestId('source-input')
      fireEvent.change(sourceInput, { target: { value: '/path/to/repo' } })

      const submitButton = screen.getByTestId('submit-button')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByTestId('import-progress-modal')).toBeInTheDocument()
      })

      const cancelButton = screen.getByTestId('cancel-progress')
      fireEvent.click(cancelButton)

      expect(mockCancelProgress).toHaveBeenCalled()
    })
  })
})
