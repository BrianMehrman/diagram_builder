/**
 * ExportDialog Component
 *
 * UI for exporting graphs to various formats
 */

import { useState, useEffect } from 'react'
import { useExportStore, EXPORT_FORMATS, getFormatInfo } from './store'
import type { GraphFilters } from './types'

interface ExportDialogProps {
  repositoryId?: string
  isOpen?: boolean
  onClose?: () => void
  className?: string
}

/**
 * Format the file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i] ?? 'Bytes'}`
}

/**
 * Download content as file
 */
function downloadFile(content: string | Buffer, filename: string, mimeType: string): void {
  const blob = new Blob([content as BlobPart], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * ExportDialog component
 */
export function ExportDialog({
  repositoryId = 'default',
  isOpen = true,
  onClose,
  className = '',
}: ExportDialogProps) {
  const selectedFormat = useExportStore((state) => state.selectedFormat)
  const selectedLodLevel = useExportStore((state) => state.selectedLodLevel)
  const status = useExportStore((state) => state.status)
  const result = useExportStore((state) => state.result)
  const error = useExportStore((state) => state.error)
  const progress = useExportStore((state) => state.progress)

  const setFormat = useExportStore((state) => state.setFormat)
  const setLodLevel = useExportStore((state) => state.setLodLevel)
  const startExport = useExportStore((state) => state.startExport)
  const clearResult = useExportStore((state) => state.clearResult)

  const [showPreview, setShowPreview] = useState(false)
  const [filters] = useState<GraphFilters>({})

  const formatInfo = getFormatInfo(selectedFormat)
  const isExporting = status === 'exporting'
  const hasResult = status === 'success' && result !== null

  // Clear result when format changes
  useEffect(() => {
    clearResult()
  }, [selectedFormat, clearResult])

  const handleExport = async () => {
    await startExport({
      format: selectedFormat,
      lodLevel: selectedLodLevel,
      repositoryId,
      filters,
    })
  }

  const handleDownload = () => {
    if (!result) return
    downloadFile(result.content, result.filename, result.mimeType)
  }

  const handleClose = () => {
    clearResult()
    if (onClose) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50`}>
      <div
        className={`bg-white rounded-lg shadow-lg max-w-2xl w-full m-4 ${className}`}
        data-testid="export-dialog"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Export Graph</h2>
            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 rounded transition-colors"
              title="Close"
              data-testid="close-export-dialog"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-2 gap-2">
              {EXPORT_FORMATS.map((format) => (
                <button
                  key={format.id}
                  onClick={() => setFormat(format.id)}
                  disabled={isExporting}
                  data-testid={`export-format-${format.id}`}
                  className={`p-3 border rounded-lg text-left transition-colors ${
                    selectedFormat === format.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="font-semibold text-sm text-gray-900">{format.name}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{format.description}</div>
                  <div className="text-xs text-gray-500 mt-1">{format.extension}</div>
                </button>
              ))}
            </div>
          </div>

          {/* LOD Level Selection */}
          <div>
            <label htmlFor="lod-level" className="block text-sm font-medium text-gray-700 mb-1">
              Detail Level (LOD)
            </label>
            <select
              id="lod-level"
              value={selectedLodLevel}
              onChange={(e) => setLodLevel(parseInt(e.target.value))}
              disabled={isExporting}
              data-testid="lod-level-select"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
            >
              <option value={0}>Level 0 - Minimal</option>
              <option value={1}>Level 1 - Low</option>
              <option value={2}>Level 2 - Medium</option>
              <option value={3}>Level 3 - High</option>
              <option value={4}>Level 4 - Very High</option>
              <option value={5}>Level 5 - Maximum</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Higher levels include more details and relationships
            </p>
          </div>

          {/* Error Display */}
          {status === 'error' && error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="text-sm font-medium text-red-800">Export Failed</div>
                  <div className="text-sm text-red-700 mt-1">{error}</div>
                </div>
              </div>
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Exporting...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Success with Stats */}
          {hasResult && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <div className="flex items-start gap-2">
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium text-green-800">Export Complete</div>
                  <div className="text-xs text-green-700 mt-1 space-y-0.5">
                    <div>Nodes: {result.stats.nodeCount}</div>
                    <div>Edges: {result.stats.edgeCount}</div>
                    <div>Size: {formatFileSize(result.stats.size)}</div>
                    <div>Duration: {result.stats.duration}ms</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {hasResult && formatInfo.supportsPreview && formatInfo.category === 'text' && (
            <div>
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                {showPreview ? 'Hide Preview' : 'Show Preview'}
              </button>
              {showPreview && (
                <pre className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md text-xs overflow-x-auto max-h-64 overflow-y-auto">
                  {result.content.toString()}
                </pre>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {!hasResult ? (
              <>
                <button
                  onClick={handleExport}
                  disabled={isExporting}
                  data-testid="export-submit-button"
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isExporting}
                  data-testid="export-cancel-button"
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-700 font-semibold rounded-md transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleDownload}
                  className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => clearResult()}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors"
                >
                  Export Another
                </button>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
