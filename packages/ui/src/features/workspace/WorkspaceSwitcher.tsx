/**
 * WorkspaceSwitcher Component
 *
 * UI for switching between workspaces and managing workspace list
 */

import { useState } from 'react';
import { useWorkspaceStore } from './store';
import { WorkspaceConfig } from './WorkspaceConfig';

interface WorkspaceSwitcherProps {
  className?: string;
}

/**
 * Format date for display
 */
function formatDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString();
}

/**
 * WorkspaceSwitcher component
 */
export function WorkspaceSwitcher({ className = '' }: WorkspaceSwitcherProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();

  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace
  );
  const deleteWorkspace = useWorkspaceStore((state) => state.deleteWorkspace);

  const currentWorkspace = workspaces.find((w) => w.id === currentWorkspaceId);

  const handleCreateNew = () => {
    setEditingId(undefined);
    setShowConfig(true);
  };

  const handleEdit = (workspaceId: string) => {
    setEditingId(workspaceId);
    setShowConfig(true);
  };

  const handleDelete = (workspaceId: string) => {
    if (confirm('Are you sure you want to delete this workspace?')) {
      deleteWorkspace(workspaceId);
    }
  };

  const handleSwitch = (workspaceId: string) => {
    setCurrentWorkspace(workspaceId);
  };

  const handleConfigSave = (workspaceId: string) => {
    setShowConfig(false);
    setEditingId(undefined);
    // Optionally switch to the newly created/edited workspace
    if (!currentWorkspaceId) {
      setCurrentWorkspace(workspaceId);
    }
  };

  if (showConfig) {
    return (
      <WorkspaceConfig
        {...(editingId && { workspaceId: editingId })}
        onClose={() => {
          setShowConfig(false);
          setEditingId(undefined);
        }}
        onSave={handleConfigSave}
      />
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Workspaces</h2>
          <button
            onClick={handleCreateNew}
            className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded transition-colors"
          >
            + New
          </button>
        </div>
        {currentWorkspace && (
          <div className="mt-2 text-sm text-gray-600">
            Current: <span className="font-medium">{currentWorkspace.name}</span>
          </div>
        )}
      </div>

      {/* Workspace List */}
      <div className="p-4">
        {workspaces.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-8">
            <svg
              className="w-12 h-12 mx-auto mb-3 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <p>No workspaces yet</p>
            <p className="text-xs mt-1">Create a workspace to get started</p>
          </div>
        ) : (
          <div className="space-y-2">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className={`border rounded-lg p-3 ${
                  workspace.id === currentWorkspaceId
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                } transition-colors`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {workspace.name}
                    </h3>
                    {workspace.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {workspace.description}
                      </p>
                    )}
                    <div className="text-xs text-gray-500 mt-2 space-y-0.5">
                      <div>
                        {workspace.repositories.length} repositories
                      </div>
                      <div>Created: {formatDate(workspace.createdAt)}</div>
                      {workspace.lastAccessedAt && (
                        <div>
                          Last accessed: {formatDate(workspace.lastAccessedAt)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {workspace.id !== currentWorkspaceId && (
                      <button
                        onClick={() => handleSwitch(workspace.id)}
                        className="p-1.5 text-primary-600 hover:bg-primary-100 rounded transition-colors"
                        title="Switch to this workspace"
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
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(workspace.id)}
                      className="p-1.5 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                      title="Edit workspace"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(workspace.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded transition-colors"
                      title="Delete workspace"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Settings summary */}
                <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-600 flex gap-4">
                  <div>LOD: Level {workspace.settings.defaultLodLevel}</div>
                  {workspace.settings.autoRefresh && (
                    <div>Auto-refresh</div>
                  )}
                  {workspace.settings.collaborationEnabled && (
                    <div>Collaboration</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
