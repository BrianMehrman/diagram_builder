/**
 * WorkspaceConfig Component
 *
 * UI for creating and configuring workspaces
 */

import { useState } from 'react';
import { useWorkspaceStore } from './store';
import type { WorkspaceSettings } from '../../shared/types';

interface WorkspaceConfigProps {
  workspaceId?: string;
  onClose?: () => void;
  onSave?: (workspaceId: string) => void;
}

/**
 * WorkspaceConfig component
 */
export function WorkspaceConfig({
  workspaceId,
  onClose,
  onSave,
}: WorkspaceConfigProps) {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const createWorkspace = useWorkspaceStore((state) => state.createWorkspace);
  const updateWorkspace = useWorkspaceStore((state) => state.updateWorkspace);

  const existingWorkspace = workspaceId
    ? workspaces.find((w) => w.id === workspaceId)
    : undefined;

  const [name, setName] = useState(existingWorkspace?.name || '');
  const [description, setDescription] = useState(
    existingWorkspace?.description || ''
  );
  const [settings, setSettings] = useState<WorkspaceSettings>(
    existingWorkspace?.settings || {
      defaultLodLevel: 2,
      autoRefresh: false,
      collaborationEnabled: false,
    }
  );

  const handleSave = () => {
    if (!name.trim()) {
      return;
    }

    if (workspaceId && existingWorkspace) {
      // Update existing workspace
      const updateData = {
        name: name.trim(),
        settings,
        ...(description.trim() && { description: description.trim() }),
      };
      updateWorkspace(workspaceId, updateData);
      if (onSave) {
        onSave(workspaceId);
      }
    } else {
      // Create new workspace
      const createData = {
        name: name.trim(),
        settings,
        ...(description.trim() && { description: description.trim() }),
      };
      const workspace = createWorkspace(createData);
      if (onSave) {
        onSave(workspace.id);
      }
    }

    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {workspaceId ? 'Edit Workspace' : 'New Workspace'}
      </h2>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label
            htmlFor="workspace-name"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Name *
          </label>
          <input
            id="workspace-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Workspace"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            autoFocus
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="workspace-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional description..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>

        {/* Settings */}
        <div className="pt-4 border-t border-gray-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Settings
          </h3>

          <div className="space-y-3">
            {/* Default LOD Level */}
            <div>
              <label
                htmlFor="default-lod"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Default LOD Level
              </label>
              <select
                id="default-lod"
                value={settings.defaultLodLevel}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultLodLevel: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value={0}>Level 0 (Minimal)</option>
                <option value={1}>Level 1 (Low)</option>
                <option value={2}>Level 2 (Medium)</option>
                <option value={3}>Level 3 (High)</option>
                <option value={4}>Level 4 (Maximum)</option>
              </select>
            </div>

            {/* Auto Refresh */}
            <div className="flex items-center">
              <input
                id="auto-refresh"
                type="checkbox"
                checked={settings.autoRefresh}
                onChange={(e) =>
                  setSettings({ ...settings, autoRefresh: e.target.checked })
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="auto-refresh"
                className="ml-2 block text-sm text-gray-700"
              >
                Auto-refresh on file changes
              </label>
            </div>

            {/* Collaboration */}
            <div className="flex items-center">
              <input
                id="collaboration"
                type="checkbox"
                checked={settings.collaborationEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    collaborationEnabled: e.target.checked,
                  })
                }
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label
                htmlFor="collaboration"
                className="ml-2 block text-sm text-gray-700"
              >
                Enable collaboration
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
          >
            {workspaceId ? 'Save Changes' : 'Create Workspace'}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-md transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
