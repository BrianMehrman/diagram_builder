/**
 * CodebaseList Component
 *
 * Displays list of codebases in a workspace with management actions
 */

import { useEffect, useState } from 'react'
import { codebases } from '../../shared/api/endpoints'
import { CodebaseListItem } from './CodebaseListItem'
import type { Codebase as ApiCodebase } from '../../shared/types/api'

/** Extended codebase type for UI display */
export interface Codebase {
  codebaseId: string
  workspaceId: string
  status: 'none' | 'pending' | 'processing' | 'completed' | 'failed'
  source: string
  repositoryId: string | null
  createdAt: Date
  fileCount?: number | null
  nodeCount?: number | null
  errorMessage?: string | null
}

export interface CodebaseListProps {
  workspaceId: string
  selectedId?: string | undefined
  onCodebaseSelected?: (codebaseId: string) => void
  refreshTrigger?: number | undefined // Optional timestamp to force refresh
}

/** Transform API codebase to UI codebase */
function transformCodebase(apiCodebase: ApiCodebase): Codebase {
  return {
    codebaseId: apiCodebase.codebaseId,
    workspaceId: apiCodebase.workspaceId,
    status: apiCodebase.status,
    source: apiCodebase.source,
    repositoryId: apiCodebase.repositoryId ?? null,
    createdAt: new Date(apiCodebase.importedAt),
    errorMessage: apiCodebase.error ?? null,
  }
}

export function CodebaseList({
  workspaceId,
  selectedId,
  onCodebaseSelected,
  refreshTrigger,
}: CodebaseListProps) {
  const [codebaseList, setCodebaseList] = useState<Codebase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadCodebases = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await codebases.list(workspaceId)
      const transformed = (response.codebases || []).map(transformCodebase)
      setCodebaseList(transformed)
    } catch (err) {
      setError('Failed to load codebases')
      console.error('Failed to load codebases:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCodebases()
  }, [workspaceId, refreshTrigger])

  const handleDelete = async (codebaseId: string) => {
    const confirmed = window.confirm(
      'Delete this codebase? This action cannot be undone.'
    )

    if (!confirmed) return

    try {
      await codebases.delete(workspaceId, codebaseId)
      await loadCodebases() // Refresh list
    } catch (err) {
      console.error('Failed to delete codebase:', err)
      alert('Failed to delete codebase. Please try again.')
    }
  }

  const handleRetry = async (codebaseId: string) => {
    try {
      await codebases.retry(workspaceId, codebaseId)
      await loadCodebases() // Refresh list
    } catch (err) {
      console.error('Failed to retry codebase:', err)
      alert('Failed to retry import. Please try again.')
    }
  }

  const handleSelect = (codebaseId: string) => {
    if (onCodebaseSelected) {
      onCodebaseSelected(codebaseId)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        <p className="mt-2 text-sm text-gray-400">Loading codebases...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={loadCodebases}
          className="mt-2 text-xs text-blue-400 hover:text-blue-300"
        >
          Try again
        </button>
      </div>
    )
  }

  if (codebaseList.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-gray-400">
          No codebases imported yet
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Use the Import button to get started
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {codebaseList.map((codebase) => (
        <CodebaseListItem
          key={codebase.codebaseId}
          codebase={codebase}
          selected={codebase.codebaseId === selectedId}
          onSelect={() => handleSelect(codebase.codebaseId)}
          onDelete={() => handleDelete(codebase.codebaseId)}
          onRetry={() => handleRetry(codebase.codebaseId)}
        />
      ))}
    </div>
  )
}
