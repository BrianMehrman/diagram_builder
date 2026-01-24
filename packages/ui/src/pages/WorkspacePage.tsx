/**
 * Workspace Page
 *
 * 3D visualization canvas for a workspace
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router'
import { Canvas3D, EmptyState, CodebaseStatusIndicator, ErrorNotification, SuccessNotification } from '../features/canvas'
import { MiniMap } from '../features/minimap'
import { Navigation } from '../features/navigation'
import { ViewpointPanel } from '../features/viewpoints'
import { WorkspaceSwitcher, ImportCodebaseButton } from '../features/workspace'
import { ExportButton } from '../features/export'
import { SessionControl, UserPresence } from '../features/collaboration'
import { HUD } from '../features/navigation/HUD'
import { workspaces, codebases, graph } from '../shared/api/endpoints'
import type { Workspace, Graph } from '../shared/types'

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [graphData, setGraphData] = useState<Graph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

  // Panel states
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [rightPanelOpen, setRightPanelOpen] = useState(false)
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false)

  // Track if we've loaded graph data for completed status
  const loadedForCompletedRef = useRef(false)

  // Debug: Log graphData changes
  useEffect(() => {
    console.log('[WorkspacePage] graphData state changed:', {
      hasData: !!graphData,
      nodeCount: graphData?.nodes?.length || 0,
      actualNodes: graphData?.nodes || 'undefined',
      graphDataKeys: graphData ? Object.keys(graphData) : 'null'
    })
  }, [graphData])

  useEffect(() => {
    console.log('[WorkspacePage] Mount effect - workspace ID:', id)
    if (id) {
      loadWorkspace(id)
    }
  }, [id])

  // Polling effect: automatically refresh when processing
  useEffect(() => {
    if (!id) return

    // If status just became 'completed' and we haven't loaded yet, load graph data
    if (processingStatus === 'completed' && !loadedForCompletedRef.current) {
      console.log('[WorkspacePage] Status completed, loading graph data...')
      loadedForCompletedRef.current = true
      loadGraphData(id)
      return
    }

    // Reset the ref if status goes back to pending/processing
    if (processingStatus && processingStatus !== 'completed' && processingStatus !== 'failed') {
      loadedForCompletedRef.current = false
    }

    // Stop polling if status is null, completed, or failed
    if (!processingStatus || processingStatus === 'completed' || processingStatus === 'failed') {
      return
    }

    // Poll every 2 seconds while processing
    console.log('[WorkspacePage] Starting poll interval for status:', processingStatus)
    const pollInterval = setInterval(() => {
      console.log('[WorkspacePage] Polling for codebase status...')
      loadGraphData(id)
    }, 2000)

    return () => {
      console.log('[WorkspacePage] Clearing poll interval')
      clearInterval(pollInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, processingStatus]) // Intentionally excluding loadGraphData to prevent loops

  const loadWorkspace = async (workspaceId: string) => {
    try {
      setLoading(true)
      const data = await workspaces.get(workspaceId)
      setWorkspace(data)

      // Load graph data from codebases
      await loadGraphData(workspaceId)
    } catch (err) {
      setError('Failed to load workspace')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadGraphData = useCallback(async (workspaceId: string) => {
    console.log('[WorkspacePage] ========== loadGraphData called ==========')
    console.log('[WorkspacePage] Workspace ID:', workspaceId)
    try {
      // Get codebases for this workspace
      console.log('[WorkspacePage] Fetching codebases list...')
      const codebasesList = await codebases.list(workspaceId)
      console.log('[WorkspacePage] Codebases response:', { count: codebasesList.codebases?.length || 0 })

      // Find the first completed codebase with a repository
      const completedCodebase = codebasesList.codebases?.find(
        (cb: any) => cb.status === 'completed' && cb.repositoryId
      )
      console.log('[WorkspacePage] Completed codebase found:', !!completedCodebase)
      if (completedCodebase) {
        console.log('[WorkspacePage] Codebase details:', {
          id: completedCodebase.codebaseId,
          repositoryId: completedCodebase.repositoryId,
          source: completedCodebase.source
        })
      }

      if (completedCodebase?.repositoryId) {
        // Fetch the graph data for this repository
        console.log('[WorkspacePage] Loading graph for repository:', completedCodebase.repositoryId)
        const graphResponse = await graph.getFullGraph(completedCodebase.repositoryId)
        console.log('[WorkspacePage] Graph loaded:', {
          nodes: graphResponse.nodes?.length || 0,
          edges: graphResponse.edges?.length || 0
        })
        console.log('[WorkspacePage] Calling setGraphData with:', graphResponse ? 'valid data' : 'null')
        setGraphData(graphResponse)
        console.log('[WorkspacePage] setGraphData called')
        setProcessingStatus('completed')
        setImportError(null)
        // Show success notification
        setShowSuccess(true)
        console.log('[WorkspacePage] All state updates queued')
      } else {
        // Check for failed codebases
        const failedCodebase = codebasesList.codebases?.find(
          (cb: any) => cb.status === 'failed'
        )

        if (failedCodebase) {
          setProcessingStatus('failed')
          setImportError(failedCodebase.error || 'Failed to import codebase')
        } else {
          // Check if there's a processing codebase
          const processingCodebase = codebasesList.codebases?.find(
            (cb: any) => cb.status === 'pending' || cb.status === 'processing'
          )

          if (processingCodebase) {
            // Update status indicator - polling will happen via useEffect
            setProcessingStatus(processingCodebase.status)
            setImportError(null)
            console.log('[WorkspacePage] Codebase processing, status:', processingCodebase.status)
          } else {
            // No codebases at all
            setProcessingStatus(null)
            setImportError(null)
            console.log('[WorkspacePage] No codebases found')
          }
        }
      }
    } catch (err) {
      console.error('Failed to load graph data:', err)
      // Don't set error state - just log it (workspace can load without graph)
    }
  }, []) // Empty dependencies - function is stable

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
      {/* Compact Top Bar */}
      <header
        className="bg-gray-800 border-b border-gray-700 px-3 py-2 flex items-center justify-between"
        data-testid="workspace-header"
      >
        <div className="flex items-center gap-3">
          {/* Left Panel Toggle */}
          <button
            onClick={() => setLeftPanelOpen(!leftPanelOpen)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300"
            title="Toggle menu"
            data-testid="toggle-left-panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          <h1
            className="text-sm font-semibold text-white truncate max-w-xs"
            data-testid="workspace-name"
          >
            {workspace.name}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Right Panel Toggle */}
          <button
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            className="p-1.5 hover:bg-gray-700 rounded transition-colors text-gray-300"
            title="Toggle tools"
            data-testid="toggle-right-panel"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* 3D Canvas or Empty State */}
        {graphData ? (
          <Canvas3D graph={graphData} />
        ) : (
          <EmptyState onImportClick={() => setLeftPanelOpen(true)} />
        )}

        {/* Processing Status Indicator */}
        {processingStatus && processingStatus !== 'completed' && processingStatus !== 'failed' && (
          <CodebaseStatusIndicator status={processingStatus} />
        )}

        {/* Error Notification */}
        {importError && (
          <ErrorNotification
            message={importError}
            onRetry={() => loadWorkspace(workspace?.id || '')}
            onDismiss={() => setImportError(null)}
          />
        )}

        {/* Success Notification */}
        {showSuccess && graphData && (
          <SuccessNotification
            message={`Graph loaded with ${graphData.nodes?.length || 0} nodes`}
            onDismiss={() => setShowSuccess(false)}
          />
        )}

        {/* Left Side Panel */}
        <div
          className={`absolute top-0 left-0 h-full w-80 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
            leftPanelOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Menu</h2>
              <button
                onClick={() => setLeftPanelOpen(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Workspace Switcher */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Workspace
                </h3>
                <WorkspaceSwitcher />
              </div>

              {/* Import Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Actions
                </h3>
                <ImportCodebaseButton
                  workspaceId={workspace.id}
                  onImportSuccess={() => loadWorkspace(workspace.id)}
                />
              </div>

              {/* Collaboration */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Collaboration
                </h3>
                <SessionControl />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-80 bg-gray-800 shadow-2xl transform transition-transform duration-300 ease-in-out z-30 ${
            rightPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-semibold text-white">Tools</h2>
              <button
                onClick={() => setRightPanelOpen(false)}
                className="p-1 hover:bg-gray-700 rounded text-gray-400"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Export */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Export
                </h3>
                <ExportButton />
              </div>

              {/* Viewpoints */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Viewpoints
                </h3>
                <ViewpointPanel />
              </div>

              {/* User Presence */}
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Users
                </h3>
                <UserPresence />
              </div>
            </div>
          </div>
        </div>

        {/* HUD (Top Left) */}
        <div className="absolute top-4 left-4 z-20">
          <HUD nodes={graphData?.nodes || []} />
        </div>

        {/* Navigation Panel (Top Center) */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-md">
          <Navigation />
        </div>

        {/* Collapsible MiniMap (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => setMiniMapCollapsed(!miniMapCollapsed)}
              className="w-full px-3 py-2 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors border-b border-gray-200"
            >
              <span className="text-xs font-semibold text-gray-900">MiniMap</span>
              <svg
                className={`w-4 h-4 transition-transform ${miniMapCollapsed ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            {!miniMapCollapsed && (
              <div className="w-64 h-64">
                <MiniMap nodes={graphData?.nodes || []} />
              </div>
            )}
          </div>
        </div>

        {/* Overlay for closing panels */}
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="absolute inset-0 bg-black/30 z-20"
            onClick={() => {
              setLeftPanelOpen(false)
              setRightPanelOpen(false)
            }}
          />
        )}
      </div>
    </div>
  )
}
