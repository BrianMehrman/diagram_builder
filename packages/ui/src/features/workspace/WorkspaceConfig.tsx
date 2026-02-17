/**
 * WorkspaceConfig Component
 *
 * UI for creating and configuring workspaces
 */

import { useState, useEffect } from 'react';
import { workspaces as workspacesApi } from '../../shared/api/endpoints';
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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [settings, setSettings] = useState<WorkspaceSettings>({
    defaultLodLevel: 2,
    autoRefresh: false,
    collaborationEnabled: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(!workspaceId);

  // Load existing workspace data from API when editing
  useEffect(() => {
    if (!workspaceId) return;
    workspacesApi.get(workspaceId).then((workspace) => {
      setName(workspace.name);
      setDescription(workspace.description ?? '');
      setSettings(workspace.settings);
      setLoaded(true);
    }).catch((err) => {
      console.error('Failed to load workspace:', err);
      setError('Failed to load workspace');
      setLoaded(true);
    });
  }, [workspaceId]);

  const handleSave = async () => {
    if (!name.trim() || saving) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (workspaceId) {
        // Update existing workspace via API
        await workspacesApi.update(workspaceId, {
          name: name.trim(),
          settings,
          ...(description.trim() && { description: description.trim() }),
        });
        onSave?.(workspaceId);
      } else {
        // Create new workspace via API
        const workspace = await workspacesApi.create({
          name: name.trim(),
          settings,
          ...(description.trim() && { description: description.trim() }),
        });
        onSave?.(workspace.id);
      }
      onClose?.();
    } catch (err) {
      console.error('Failed to save workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to save workspace');
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6 text-center text-gray-500">
        Loading workspace...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        {workspaceId ? 'Edit Workspace' : 'New Workspace'}
      </h2>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

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
            onClick={() => void handleSave()}
            disabled={!name.trim() || saving}
            className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-md transition-colors"
          >
            {saving
              ? 'Saving...'
              : workspaceId
                ? 'Save Changes'
                : 'Create Workspace'}
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
