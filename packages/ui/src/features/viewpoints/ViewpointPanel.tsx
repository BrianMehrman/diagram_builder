/**
 * ViewpointPanel Component
 *
 * Combined panel for viewpoint creation and management
 */

import { useState } from 'react'
import { ViewpointCreator } from './ViewpointCreator'
import { ViewpointList } from './ViewpointList'

interface ViewpointPanelProps {
  className?: string
}

/**
 * ViewpointPanel component
 */
export function ViewpointPanel({ className = '' }: ViewpointPanelProps) {
  const [showCreator, setShowCreator] = useState(false)

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`} data-testid="viewpoint-panel">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Viewpoints</h2>
          {!showCreator && (
            <button
              onClick={() => setShowCreator(true)}
              className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition-colors"
            >
              + New
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {showCreator ? (
          <ViewpointCreator onViewpointCreated={() => setShowCreator(false)} className="mb-4" />
        ) : null}

        <ViewpointList />
      </div>
    </div>
  )
}
