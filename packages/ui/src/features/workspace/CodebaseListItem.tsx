/**
 * CodebaseListItem Component
 *
 * Individual codebase list item with status indicator and management actions
 */

import type { Codebase } from './CodebaseList'

export interface CodebaseListItemProps {
  codebase: Codebase
  selected: boolean
  onSelect: () => void
  onDelete: () => void
  onRetry: () => void
}

const statusConfig = {
  none: {
    icon: '○',
    color: 'text-gray-400',
    label: 'Not uploaded',
    testId: 'status-none',
  },
  pending: {
    icon: '◔',
    color: 'text-blue-400',
    label: 'Pending',
    testId: 'status-pending',
  },
  processing: {
    icon: '◑',
    color: 'text-yellow-400 animate-spin',
    label: 'Parsing...',
    testId: 'status-processing',
  },
  completed: {
    icon: '●',
    color: 'text-green-500',
    label: 'Complete',
    testId: 'status-completed',
  },
  failed: {
    icon: '⚠',
    color: 'text-red-500',
    label: 'Failed',
    testId: 'status-failed',
  },
}

export function CodebaseListItem({
  codebase,
  selected,
  onSelect,
  onDelete,
  onRetry,
}: CodebaseListItemProps) {
  const status = statusConfig[codebase.status]

  // Extract repo name from source (e.g., "github.com/user/repo" -> "repo")
  const repoName = codebase.source.split('/').pop() || codebase.source

  return (
    <div
      role="button"
      tabIndex={0}
      className={`w-full text-left p-3 rounded border transition-colors cursor-pointer ${
        selected
          ? 'selected border-blue-500 bg-blue-500/10'
          : 'border-gray-700 bg-gray-800/50 hover:bg-gray-800'
      }`}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onSelect()
        }
      }}
      aria-label={repoName}
    >
      <div className="flex items-start gap-2">
        {/* Status Indicator */}
        <span
          className={`text-lg ${status.color}`}
          data-testid={status.testId}
          aria-label={status.label}
        >
          {status.icon}
        </span>

        {/* Codebase Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">{repoName}</h4>
          <p className="text-xs text-gray-400">{status.label}</p>

          {/* File and Node Counts */}
          {(codebase.fileCount !== null || codebase.nodeCount !== null) && (
            <div className="flex gap-3 mt-1 text-xs text-gray-500">
              {codebase.fileCount !== null && (
                <span>{codebase.fileCount} files</span>
              )}
              {codebase.nodeCount !== null && (
                <span>{codebase.nodeCount} nodes</span>
              )}
            </div>
          )}

          {/* Error Message */}
          {codebase.status === 'failed' && codebase.errorMessage && (
            <p className="mt-1 text-xs text-red-400">{codebase.errorMessage}</p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-1">
          {codebase.status === 'failed' && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onRetry()
              }}
              className="px-2 py-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              aria-label="Retry"
            >
              Retry
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="px-2 py-1 text-xs text-red-400 hover:text-red-300 transition-colors"
            aria-label="Delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}
