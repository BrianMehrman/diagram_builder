/**
 * Import Codebase Button
 *
 * Button to trigger codebase import modal
 */

import { useState } from 'react'
import { ImportCodebaseModal } from './ImportCodebaseModal'

interface ImportCodebaseButtonProps {
  workspaceId: string
  onImportSuccess?: () => void
  /** Called when import completes successfully with repositoryId */
  onImportComplete?: (repositoryId: string) => void
}

export function ImportCodebaseButton({
  workspaceId,
  onImportSuccess,
  onImportComplete,
}: ImportCodebaseButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSuccess = () => {
    // Don't close modal here - let the modal handle its own closing after showing success message
    if (onImportSuccess) {
      onImportSuccess()
    }
  }

  const handleImportComplete = (repositoryId: string) => {
    if (onImportComplete) {
      onImportComplete(repositoryId)
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        data-testid="import-codebase-button"
      >
        Import Codebase
      </button>

      {isModalOpen && (
        <ImportCodebaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          workspaceId={workspaceId}
          onSuccess={handleSuccess}
          onImportComplete={handleImportComplete}
        />
      )}
    </>
  )
}
