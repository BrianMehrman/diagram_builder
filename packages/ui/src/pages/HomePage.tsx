/**
 * Home Page
 *
 * Landing page with workspace list
 */

import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { workspaces } from '../shared/api/endpoints'
import type { Workspace } from '../shared/types/api'

export function HomePage() {
  const [workspaceList, setWorkspaceList] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadWorkspaces()
  }, [])

  const loadWorkspaces = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await workspaces.list()
      setWorkspaceList(data)

      // If no workspaces exist, create a default one
      if (data.length === 0) {
        await createDefaultWorkspace()
      }
    } catch (err) {
      // In dev mode without auth, we might get errors - create a default workspace anyway
      console.log('Failed to load workspaces, creating default workspace:', err)
      await createDefaultWorkspace()
    } finally {
      setLoading(false)
    }
  }

  const createDefaultWorkspace = async () => {
    try {
      setCreating(true)
      setError(null)
      const newWorkspace = await workspaces.create({
        name: 'Default Workspace',
        description: 'Auto-created workspace for development',
        settings: {
          defaultLodLevel: 2,
          autoRefresh: false,
          collaborationEnabled: false,
        },
      })
      setWorkspaceList([newWorkspace])
      // Automatically navigate to the new workspace
      navigate(`/workspace/${newWorkspace.id}`)
    } catch (err) {
      console.error('Failed to create default workspace:', err)
      setError('Failed to create workspace. Please check that the API is running.')
    } finally {
      setCreating(false)
    }
  }

  const handleCreateWorkspace = async () => {
    await createDefaultWorkspace()
    await loadWorkspaces()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">Diagram Builder</h1>
          <p className="mt-2 text-sm text-gray-600">3D Codebase Visualization Tool</p>
        </div>

        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <p className="mt-2 text-sm text-gray-600">Loading workspaces...</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {!loading && !error && (
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Workspaces</h2>

              {workspaceList.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">No workspaces yet</p>
                  <button
                    onClick={handleCreateWorkspace}
                    disabled={creating}
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {creating ? 'Creating...' : 'Create Workspace'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {workspaceList.map((workspace) => (
                    <Link
                      key={workspace.id}
                      to={`/workspace/${workspace.id}`}
                      className="block p-6 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{workspace.name}</h3>
                      {workspace.description && (
                        <p className="text-sm text-gray-600">{workspace.description}</p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
