/**
 * Workspace Page
 *
 * 3D visualization canvas for a workspace
 */

import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { Canvas3D } from '../features/canvas'
import { MiniMap } from '../features/minimap'
import { Navigation } from '../features/navigation'
import { ViewpointPanel } from '../features/viewpoints'
import { WorkspaceSwitcher } from '../features/workspace'
import { ExportButton } from '../features/export'
import { SessionControl, UserPresence } from '../features/collaboration'
import { workspaces } from '../shared/api/endpoints'
import type { Workspace } from '../shared/types/api'

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadWorkspace(id)
    }
  }, [id])

  const loadWorkspace = async (workspaceId: string) => {
    try {
      setLoading(true)
      const data = await workspaces.get(workspaceId)
      setWorkspace(data)
    } catch (err) {
      setError('Failed to load workspace')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400">{error || 'Workspace not found'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white">{workspace.name}</h1>
          <WorkspaceSwitcher />
        </div>
        <div className="flex items-center gap-4">
          <ExportButton />
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        {/* 3D Canvas */}
        <Canvas3D />

        {/* UI Overlays */}
        <div className="absolute top-4 left-4 flex flex-col gap-4">
          <Navigation />
          <SessionControl />
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-4">
          <ViewpointPanel />
          <UserPresence />
        </div>

        <div className="absolute bottom-4 right-4">
          <MiniMap />
        </div>
      </div>
    </div>
  )
}
