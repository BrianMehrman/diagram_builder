import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { ErrorBoundary, GlobalErrorFallback, FeatureErrorFallback } from './shared/components';
import { Canvas3D, CameraControls, LodControls, NodeDetails, sampleGraph, useCanvasStore } from './features/canvas';
import { MiniMap } from './features/minimap';
import { SearchBar, Breadcrumbs, HUD } from './features/navigation';
import { ViewpointPanel } from './features/viewpoints';
import { WorkspaceSwitcher, useWorkspacePersistence } from './features/workspace';
import { ExportDialog } from './features/export';

function App() {
  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <GlobalErrorFallback error={error} resetError={resetError} />
      )}
      onError={(error, errorInfo) => {
        // Log to console in development
        console.error('Global error:', error, errorInfo);

        // In production, you would send to error tracking service
        // Example: Sentry.captureException(error, { extra: errorInfo });
      }}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/canvas" element={<CanvasDemo />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Diagram Builder
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          3D Codebase Visualization Tool
        </p>
        <Link
          to="/canvas"
          className="inline-block px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-colors"
        >
          View Canvas Demo
        </Link>
      </div>
    </div>
  );
}

function CanvasDemo() {
  // Enable workspace persistence
  useWorkspacePersistence();

  const [showExportDialog, setShowExportDialog] = useState(false);

  const selectNode = useCanvasStore((state) => state.selectNode);
  const selectedNodeId = useCanvasStore((state) => state.selectedNodeId);

  const handleNodeSelect = (nodeId: string) => {
    selectNode(nodeId);
  };

  const selectedNode = sampleGraph.nodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="w-screen h-screen flex flex-col">
      <header className="bg-gray-800 text-white px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm hover:text-gray-300">
              ← Back
            </Link>
            <h1 className="text-xl font-bold">3D Canvas</h1>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowExportDialog(true)}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-md transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Export
            </button>
            <div className="text-sm text-gray-300">
              {sampleGraph.metadata.totalNodes} nodes, {sampleGraph.metadata.totalEdges} edges
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1 max-w-md">
            <SearchBar
              nodes={sampleGraph.nodes}
              onNodeSelect={handleNodeSelect}
            />
          </div>
          {selectedNode && (
            <Breadcrumbs
              selectedNode={selectedNode}
              nodes={sampleGraph.nodes}
              onNodeClick={handleNodeSelect}
            />
          )}
        </div>
      </header>
      <div className="flex-1 relative flex">
        <ErrorBoundary
          fallback={(error, resetError) => (
            <FeatureErrorFallback
              error={error}
              featureName="Canvas"
              resetError={resetError}
            />
          )}
        >
          <div className="flex-1 relative">
            <Canvas3D graph={sampleGraph} />
            <HUD nodes={sampleGraph.nodes} />
            <CameraControls />
            <LodControls />
            <NodeDetails nodes={sampleGraph.nodes} />
          </div>
          <div className="w-80 p-4 overflow-y-auto space-y-4">
            <WorkspaceSwitcher className="flex-shrink-0" />
            <MiniMap nodes={sampleGraph.nodes} className="flex-shrink-0" />
            <ViewpointPanel className="flex-shrink-0" />
          </div>
        </ErrorBoundary>
      </div>

      {/* Export Dialog Modal */}
      {showExportDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <ExportDialog
              repositoryId="sample-repo"
              onClose={() => setShowExportDialog(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
