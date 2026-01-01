import { useState } from 'react'
import { ExportDialog } from './ExportDialog'

/**
 * ExportButton Component
 *
 * A button that opens the export dialog when clicked.
 * Provides a simple interface for users to initiate graph export.
 */
export function ExportButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
        data-testid="export-button"
      >
        Export
      </button>
      <ExportDialog isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}
