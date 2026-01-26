/**
 * Viewpoint Page
 *
 * Displays a saved viewpoint
 */

import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router'
import { Canvas3D } from '../features/canvas'
import { viewpoints } from '../shared/api/endpoints'
import type { Viewpoint } from '../shared/types'

export function ViewpointPage() {
  const { id } = useParams<{ id: string }>()
  const [viewpoint, setViewpoint] = useState<Viewpoint | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      loadViewpoint(id)
    }
  }, [id])

  const loadViewpoint = async (viewpointId: string) => {
    try {
      setLoading(true)
      const data = await viewpoints.get(viewpointId)
      setViewpoint(data)
    } catch (err) {
      setError('Failed to load viewpoint')
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
          <p className="mt-4 text-white">Loading viewpoint...</p>
        </div>
      </div>
    )
  }

  if (error || !viewpoint) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || 'Viewpoint not found'}</p>
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">{viewpoint.name}</h1>
          {viewpoint.description && (
            <p className="text-sm text-gray-400 mt-1">{viewpoint.description}</p>
          )}
        </div>
        <Link to="/" className="text-sm text-gray-400 hover:text-white">
          Back to Home
        </Link>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative">
        <Canvas3D />
      </div>
    </div>
  )
}
