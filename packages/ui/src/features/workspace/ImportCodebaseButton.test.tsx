/**
 * ImportCodebaseButton Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ImportCodebaseButton } from './ImportCodebaseButton'

const defaultProps = {
  workspaceId: 'test-workspace-id',
}

describe('ImportCodebaseButton', () => {
  it('should render import button', () => {
    render(<ImportCodebaseButton {...defaultProps} />)

    const button = screen.getByTestId('import-codebase-button')
    expect(button).toBeInTheDocument()
    expect(button).toHaveTextContent('Import Codebase')
  })

  it('should open modal when button is clicked', () => {
    render(<ImportCodebaseButton {...defaultProps} />)

    const button = screen.getByTestId('import-codebase-button')
    fireEvent.click(button)

    const modal = screen.getByTestId('import-codebase-modal')
    expect(modal).toBeInTheDocument()
  })

  it('should close modal when close button is clicked', () => {
    render(<ImportCodebaseButton {...defaultProps} />)

    // Open modal
    const button = screen.getByTestId('import-codebase-button')
    fireEvent.click(button)

    expect(screen.getByTestId('import-codebase-modal')).toBeInTheDocument()

    // Close modal
    const closeButton = screen.getByTestId('close-modal-button')
    fireEvent.click(closeButton)

    expect(screen.queryByTestId('import-codebase-modal')).not.toBeInTheDocument()
  })

  it('should accept onImportComplete callback prop', () => {
    const onImportComplete = vi.fn()
    render(
      <ImportCodebaseButton
        {...defaultProps}
        onImportComplete={onImportComplete}
      />
    )

    // Button should render with the callback prop
    const button = screen.getByTestId('import-codebase-button')
    expect(button).toBeInTheDocument()
  })
})
