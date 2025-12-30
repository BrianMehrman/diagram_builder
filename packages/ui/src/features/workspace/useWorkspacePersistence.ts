/**
 * useWorkspacePersistence Hook
 *
 * Hook that handles automatic persistence of workspace state
 */

import { useEffect } from 'react';
import { useWorkspaceStore } from './store';
import {
  loadWorkspaces,
  saveWorkspaces,
  loadCurrentWorkspaceId,
  saveCurrentWorkspaceId,
} from './persistence';

/**
 * Hook to enable workspace persistence
 */
export function useWorkspacePersistence(): void {
  const workspaces = useWorkspaceStore((state) => state.workspaces);
  const currentWorkspaceId = useWorkspaceStore(
    (state) => state.currentWorkspaceId
  );
  const loadWorkspacesAction = useWorkspaceStore(
    (state) => state.loadWorkspaces
  );
  const setCurrentWorkspace = useWorkspaceStore(
    (state) => state.setCurrentWorkspace
  );

  // Load workspaces on mount
  useEffect(() => {
    const savedWorkspaces = loadWorkspaces();
    if (savedWorkspaces.length > 0) {
      loadWorkspacesAction(savedWorkspaces);

      const savedCurrentId = loadCurrentWorkspaceId();
      if (savedCurrentId && savedWorkspaces.some((w) => w.id === savedCurrentId)) {
        setCurrentWorkspace(savedCurrentId);
      }
    }
  }, [loadWorkspacesAction, setCurrentWorkspace]);

  // Save workspaces whenever they change
  useEffect(() => {
    if (workspaces.length > 0) {
      saveWorkspaces(workspaces);
    }
  }, [workspaces]);

  // Save current workspace ID whenever it changes
  useEffect(() => {
    saveCurrentWorkspaceId(currentWorkspaceId);
  }, [currentWorkspaceId]);
}
