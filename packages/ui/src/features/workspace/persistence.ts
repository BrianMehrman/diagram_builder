/**
 * Workspace Persistence
 *
 * Utilities for persisting workspace state to localStorage
 */

import type { Workspace } from '../../shared/types';

const STORAGE_KEY = 'diagram-builder:workspaces';
const CURRENT_WORKSPACE_KEY = 'diagram-builder:current-workspace';

/**
 * Save workspaces to localStorage
 */
export function saveWorkspaces(workspaces: Workspace[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspaces));
  } catch (error) {
    console.error('Failed to save workspaces:', error);
  }
}

/**
 * Load workspaces from localStorage
 */
export function loadWorkspaces(): Workspace[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Failed to load workspaces:', error);
  }
  return [];
}

/**
 * Save current workspace ID to localStorage
 */
export function saveCurrentWorkspaceId(workspaceId: string | null): void {
  try {
    if (workspaceId) {
      localStorage.setItem(CURRENT_WORKSPACE_KEY, workspaceId);
    } else {
      localStorage.removeItem(CURRENT_WORKSPACE_KEY);
    }
  } catch (error) {
    console.error('Failed to save current workspace ID:', error);
  }
}

/**
 * Load current workspace ID from localStorage
 */
export function loadCurrentWorkspaceId(): string | null {
  try {
    return localStorage.getItem(CURRENT_WORKSPACE_KEY);
  } catch (error) {
    console.error('Failed to load current workspace ID:', error);
    return null;
  }
}

/**
 * Clear all workspace data from localStorage
 */
export function clearWorkspaceData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CURRENT_WORKSPACE_KEY);
  } catch (error) {
    console.error('Failed to clear workspace data:', error);
  }
}
