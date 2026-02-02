/**
 * Workspace Page
 *
 * 3D visualization canvas for a workspace
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'react-router'
import { Canvas3D, EmptyState, CodebaseStatusIndicator, ErrorNotification, SuccessNotification } from '../features/canvas'
import { MiniMap } from '../features/minimap'
import { Navigation, SearchBarModal, useCameraFlight } from '../features/navigation'
import { LeftPanel, RightPanel } from '../features/panels'
import { HUD } from '../features/navigation/HUD'
import { useGlobalSearchShortcut, useGlobalKeyboardShortcuts } from '../shared/hooks'
import { useUIStore } from '../shared/stores/uiStore'
import { workspaces, codebases, graph } from '../shared/api/endpoints'
import type { Workspace, Graph, Position3D } from '../shared/types'

export function WorkspacePage() {
  const { id } = useParams<{ id: string }>()
  const [workspace, setWorkspace] = useState<Workspace | null>(null)
  const [graphData, setGraphData] = useState<Graph | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState<'pending' | 'processing' | 'completed' | 'failed' | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)
  const [selectedCodebaseId, setSelectedCodebaseId] = useState<string | null>(null)
  const [listRefreshTrigger, setListRefreshTrigger] = useState(0)

  // Panel states (from global UI store for ESC handling)
  const leftPanelOpen = useUIStore((state) => state.isLeftPanelOpen)
  const rightPanelOpen = useUIStore((state) => state.isRightPanelOpen)
  const toggleLeftPanel = useUIStore((state) => state.toggleLeftPanel)
  const toggleRightPanel = useUIStore((state) => state.toggleRightPanel)
  const openLeftPanel = useUIStore((state) => state.openLeftPanel)
  const closeAllPanels = useUIStore((state) => state.closeAllPanels)
  const [miniMapCollapsed, setMiniMapCollapsed] = useState(false)

  // Track if we've loaded graph data for completed status
  const loadedForCompletedRef = useRef(false)

  // Track if camera should fly to root after import completes
  const [pendingCameraFlight, setPendingCameraFlight] = useState(false)

  // Global search shortcut (⌘K / Ctrl+K)
  useGlobalSearchShortcut()

  // Camera flight animation for search results
  const { flyToNode } = useCameraFlight()

  // Global keyboard shortcuts (ESC, Home, C, ?, Ctrl+Shift+S)
  useGlobalKeyboardShortcuts({
    nodes: graphData?.nodes || [],
    onFlyToNode: flyToNode,
  })

  // Handle node selection from search modal
  const handleSearchNodeSelect = useCallback((nodeId: string, position?: Position3D) => {
    if (position) {
      flyToNode(nodeId, position)
    }
  }, [flyToNode])

  // Handle import completion - trigger camera flight after graph loads
  const handleImportComplete = useCallback((_repositoryId: string) => {
    // Set flag to trigger camera flight when graph data becomes available
    setPendingCameraFlight(true)
  }, [])

  // Debug: Log graphData changes
  useEffect(() => {
    console.log('[WorkspacePage] graphData state changed:', {
      hasData: !!graphData,
      nodeCount: graphData?.nodes?.length || 0,
      actualNodes: graphData?.nodes || 'undefined',
      graphDataKeys: graphData ? Object.keys(graphData) : 'null'
    })
  }, [graphData])

  // Effect: Trigger camera flight to root node after import completes
  useEffect(() => {
    if (pendingCameraFlight && graphData?.nodes && graphData.nodes.length > 0) {
      // Find the root node - use the first file node as the entry point
      // Files are the top-level containers in the graph structure
      const rootNode = graphData.nodes.find(node => node.type === 'file') || graphData.nodes[0]

      if (rootNode) {
        console.log('[WorkspacePage] Flying camera to root node after import:', rootNode.id)

        // Use node position or default to origin
        const position: Position3D = rootNode.position || { x: 0, y: 0, z: 0 }

        // Trigger camera flight
        flyToNode(rootNode.id, position)
      }

      // Clear the flag
      setPendingCameraFlight(false)
    }
  }, [pendingCameraFlight, graphData, flyToNode])

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

  const handleCodebaseSelected = async (codebaseId: string) => {
    console.log('[WorkspacePage] Codebase selected:', codebaseId)
    if (workspace?.id) {
      await loadGraphData(workspace.id, codebaseId)
    }
  }

  const loadGraphData = useCallback(async (workspaceId: string, codebaseId?: string) => {
    console.log('[WorkspacePage] ========== loadGraphData called ==========')
    console.log('[WorkspacePage] Workspace ID:', workspaceId, 'Codebase ID:', codebaseId)
    try {
      // Get codebases for this workspace
      console.log('[WorkspacePage] Fetching codebases list...')
      const codebasesList = await codebases.list(workspaceId)
      console.log('[WorkspacePage] Codebases response:', { count: codebasesList.codebases?.length || 0 })

      // Trigger CodebaseList refresh
      setListRefreshTrigger(prev => prev + 1)

      // Find the codebase to load
      let completedCodebase
      if (codebaseId) {
        // Load specific codebase if ID provided
        completedCodebase = codebasesList.codebases?.find(
          (cb: any) => cb.codebaseId === codebaseId && cb.status === 'completed' && cb.repositoryId
        )
        console.log('[WorkspacePage] Requested codebase found:', !!completedCodebase)
      } else {
        // Find the first completed codebase with a repository
        completedCodebase = codebasesList.codebases?.find(
          (cb: any) => cb.status === 'completed' && cb.repositoryId
        )
        console.log('[WorkspacePage] First completed codebase found:', !!completedCodebase)
      }

      if (completedCodebase) {
        console.log('[WorkspacePage] Codebase details:', {
          id: completedCodebase.codebaseId,
          repositoryId: completedCodebase.repositoryId,
          source: completedCodebase.source
        })
        // Update selected codebase ID
        setSelectedCodebaseId(completedCodebase.codebaseId)
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
      <div className="h-screen flex items-center justify-center bg-gray-900" role="status" aria-label="Loading workspace">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white" aria-hidden="true"></div>
          <p className="mt-4 text-white">Loading workspace...</p>
        </div>
      </div>
    )
  }

  if (error || !workspace) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-900" role="alert">
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
        role="banner"
      >
        <div className="flex items-center gap-3">
          {/* Left Panel Toggle */}
          <button
            onClick={toggleLeftPanel}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={leftPanelOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={leftPanelOpen}
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
            onClick={toggleRightPanel}
            className="p-2 hover:bg-gray-700 rounded transition-colors text-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={rightPanelOpen ? 'Close tools' : 'Open tools'}
            aria-expanded={rightPanelOpen}
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
      <main id="main-content" className="flex-1 relative overflow-hidden" role="main">
        {/* 3D Canvas or Empty State */}
        {graphData ? (
          <Canvas3D graph={graphData} />
        ) : (
          <EmptyState onImportClick={openLeftPanel} />
        )}

        {/* Status/Notification Region */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {/* Processing Status Indicator */}
          {processingStatus && processingStatus !== 'completed' && processingStatus !== 'failed' && (
            <CodebaseStatusIndicator status={processingStatus} />
          )}
        </div>

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
        <LeftPanel
          workspaceId={workspace.id}
          selectedCodebaseId={selectedCodebaseId || undefined}
          onCodebaseSelected={handleCodebaseSelected}
          refreshTrigger={listRefreshTrigger}
          onImportSuccess={() => loadWorkspace(workspace.id)}
          onImportComplete={handleImportComplete}
        />

        {/* Right Side Panel */}
        <RightPanel />

        {/* HUD (Top Left) */}
        <HUD nodes={graphData?.nodes || []} className="z-20" />

        {/* Navigation Panel (Top Center) */}
        <nav id="search" className="absolute top-4 left-1/2 -translate-x-1/2 z-20 max-w-md" aria-label="Graph navigation">
          <Navigation
            nodes={graphData?.nodes || []}
            onNodeSelect={handleSearchNodeSelect}
          />
        </nav>

        {/* Collapsible MiniMap (Bottom Right) */}
        <div className="absolute bottom-4 right-4 z-20">
          <div className="bg-white rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => setMiniMapCollapsed(!miniMapCollapsed)}
              className="w-full px-3 py-2 flex items-center justify-between bg-gray-100 hover:bg-gray-200 transition-colors border-b border-gray-200 min-h-[44px]"
              aria-label={miniMapCollapsed ? 'Expand minimap' : 'Collapse minimap'}
              aria-expanded={!miniMapCollapsed}
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

        {/* Overlay backdrop for closing panels */}
        {(leftPanelOpen || rightPanelOpen) && (
          <div
            className="absolute inset-0 bg-black/30 z-20"
            data-testid="panel-overlay"
            onClick={closeAllPanels}
          />
        )}
      </main>

      {/* Global Search Modal (⌘K) */}
      <SearchBarModal
        nodes={graphData?.nodes || []}
        onNodeSelect={handleSearchNodeSelect}
      />
    </div>
  )
}
