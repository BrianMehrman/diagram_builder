/**
 * useGlobalKeyboardShortcuts Hook
 *
 * Global keyboard shortcuts for all core navigation and control actions.
 *
 * Shortcuts:
 * - ⌘K / Ctrl+K: Open search (handled separately by useGlobalSearchShortcut)
 * - ESC: Close modals, cancel flight, deselect nodes
 * - Home: Fly to root node (first entry point)
 * - C: Toggle Orbit/Fly control mode
 * - Ctrl+Shift+S: Copy viewpoint link to clipboard
 * - ? (Shift+/): Open keyboard shortcuts help modal
 */

import { useEffect, useCallback } from 'react';
import { useSearchStore } from '../../features/navigation/searchStore';
import { useCanvasStore } from '../../features/canvas/store';
import { useUIStore } from '../stores/uiStore';
import { useToastStore } from '../../features/feedback/toastStore';
import type { GraphNode, Position3D } from '../types';

/**
 * Callback for flying to a node
 */
type FlyToNodeCallback = (nodeId: string, position: Position3D) => void;

/**
 * Options for the global keyboard shortcuts hook
 */
interface UseGlobalKeyboardShortcutsOptions {
  /** All graph nodes (for finding root node) */
  nodes?: GraphNode[];
  /** Callback to fly camera to a node */
  onFlyToNode?: FlyToNodeCallback;
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Check if user is typing in an input field
 */
function isTypingInInput(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  return (
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.contentEditable === 'true'
  );
}

/**
 * Generate a shareable viewpoint link from current camera state
 */
function generateViewpointLink(): string {
  const { camera, selectedNodeId, lodLevel } = useCanvasStore.getState();
  const params = new URLSearchParams();

  // Camera position
  params.set('cx', camera.position.x.toFixed(2));
  params.set('cy', camera.position.y.toFixed(2));
  params.set('cz', camera.position.z.toFixed(2));

  // Camera target
  params.set('tx', camera.target.x.toFixed(2));
  params.set('ty', camera.target.y.toFixed(2));
  params.set('tz', camera.target.z.toFixed(2));

  // Zoom
  params.set('zoom', camera.zoom.toFixed(2));

  // LOD level
  params.set('lod', lodLevel.toString());

  // Selected node (if any)
  if (selectedNodeId) {
    params.set('node', selectedNodeId);
  }

  return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

/**
 * Hook to handle all global keyboard shortcuts
 */
export function useGlobalKeyboardShortcuts(
  options: UseGlobalKeyboardShortcutsOptions = {}
): void {
  const { nodes = [], onFlyToNode, enabled = true } = options;

  // Store actions
  const closeSearch = useSearchStore((state) => state.closeSearch);
  const isSearchOpen = useSearchStore((state) => state.isOpen);
  const selectNode = useCanvasStore((state) => state.selectNode);
  const toggleControlMode = useCanvasStore((state) => state.toggleControlMode);
  const controlMode = useCanvasStore((state) => state.controlMode);
  const toggleXRay = useCanvasStore((state) => state.toggleXRay);
  const isXRayMode = useCanvasStore((state) => state.isXRayMode);
  const toggleUnderground = useCanvasStore((state) => state.toggleUnderground);
  const isUndergroundMode = useCanvasStore((state) => state.isUndergroundMode);
  const isFlying = useCanvasStore((state) => state.isFlying);
  const openHelpModal = useUIStore((state) => state.openHelpModal);
  const closeHelpModal = useUIStore((state) => state.closeHelpModal);
  const isHelpModalOpen = useUIStore((state) => state.isHelpModalOpen);
  const isLeftPanelOpen = useUIStore((state) => state.isLeftPanelOpen);
  const isRightPanelOpen = useUIStore((state) => state.isRightPanelOpen);
  const closeAllPanels = useUIStore((state) => state.closeAllPanels);
  const showSuccess = useToastStore((state) => state.showSuccess);
  const showError = useToastStore((state) => state.showError);

  /**
   * Find root node (first file-level node, or first node)
   */
  const findRootNode = useCallback((): GraphNode | null => {
    if (nodes.length === 0) return null;

    // Prefer file-type nodes as root
    const fileNode = nodes.find((n) => n.type === 'file');
    if (fileNode) return fileNode;

    // Otherwise return first node
    return nodes[0] ?? null;
  }, [nodes]);

  /**
   * Handle ESC key - close modals, close panels, cancel flight, deselect
   */
  const handleEscape = useCallback(() => {
    // Priority: 1. Close help modal
    if (isHelpModalOpen) {
      closeHelpModal();
      return;
    }

    // Priority: 2. Close search modal
    if (isSearchOpen) {
      closeSearch();
      return;
    }

    // Priority: 3. Close side panels
    if (isLeftPanelOpen || isRightPanelOpen) {
      closeAllPanels();
      return;
    }

    // Priority: 4. Deselect node (if not flying - flight ESC handled by useCameraFlight)
    if (!isFlying) {
      selectNode(null);
    }
  }, [isHelpModalOpen, closeHelpModal, isSearchOpen, closeSearch, isLeftPanelOpen, isRightPanelOpen, closeAllPanels, isFlying, selectNode]);

  /**
   * Handle Home key - fly to root node
   */
  const handleHome = useCallback(() => {
    const rootNode = findRootNode();
    if (rootNode && onFlyToNode) {
      // Prefer layout positions (from CityView), fall back to graph node position
      const layoutPos = useCanvasStore.getState().layoutPositions.get(rootNode.id);
      const position: Position3D = layoutPos ?? rootNode.position ?? { x: 0, y: 0, z: 0 };
      onFlyToNode(rootNode.id, position);
    }
  }, [findRootNode, onFlyToNode]);

  /**
   * Handle C key - toggle control mode
   */
  const handleToggleControlMode = useCallback(() => {
    toggleControlMode();
    const newMode = controlMode === 'orbit' ? 'Fly' : 'Orbit';
    showSuccess(`Switched to ${newMode} mode`, 'Press C to toggle');
  }, [toggleControlMode, controlMode, showSuccess]);

  /**
   * Handle X key - toggle x-ray mode
   */
  const handleToggleXRay = useCallback(() => {
    toggleXRay();
    const newState = !isXRayMode ? 'ON' : 'OFF';
    showSuccess(`X-Ray mode ${newState}`, 'Press X to toggle');
  }, [toggleXRay, isXRayMode, showSuccess]);

  /**
   * Handle U key - toggle underground mode
   */
  const handleToggleUnderground = useCallback(() => {
    toggleUnderground();
    const newState = !isUndergroundMode ? 'ON' : 'OFF';
    showSuccess(`Underground mode ${newState}`, 'Press U to toggle');
  }, [toggleUnderground, isUndergroundMode, showSuccess]);

  /**
   * Handle Ctrl+Shift+S - copy viewpoint link
   */
  const handleShareViewpoint = useCallback(async () => {
    const link = generateViewpointLink();
    const success = await copyToClipboard(link);

    if (success) {
      showSuccess('Viewpoint link copied!', 'Share this link to restore the current view');
    } else {
      showError('Failed to copy link', 'Please try again');
    }
  }, [showSuccess, showError]);

  /**
   * Handle ? key - open help modal
   */
  const handleOpenHelp = useCallback(() => {
    openHelpModal();
  }, [openHelpModal]);

  /**
   * Main keydown handler
   */
  useEffect(() => {
    if (!enabled) return;

    function handleKeyDown(event: KeyboardEvent): void {
      // Don't handle shortcuts when typing in inputs (except ESC)
      if (isTypingInInput(event) && event.key !== 'Escape') {
        return;
      }

      // ESC - Close modals, deselect
      if (event.key === 'Escape') {
        handleEscape();
        return;
      }

      // Don't handle other shortcuts when modals or panels are open
      if (isSearchOpen || isHelpModalOpen || isLeftPanelOpen || isRightPanelOpen) {
        return;
      }

      // Home - Fly to root node
      if (event.key === 'Home') {
        event.preventDefault();
        handleHome();
        return;
      }

      // C - Toggle control mode (only lowercase c, not Ctrl+C)
      if (event.key === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handleToggleControlMode();
        return;
      }

      // X - Toggle x-ray mode (only lowercase x, not Ctrl+X)
      if (event.key === 'x' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handleToggleXRay();
        return;
      }

      // U - Toggle underground mode (only lowercase u, not Ctrl+U)
      if (event.key === 'u' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        handleToggleUnderground();
        return;
      }

      // Ctrl+Shift+S - Share viewpoint
      if (
        event.key === 'S' &&
        event.shiftKey &&
        (event.ctrlKey || event.metaKey)
      ) {
        event.preventDefault();
        handleShareViewpoint();
        return;
      }

      // ? (Shift+/) - Open help modal
      if (event.key === '?' || (event.shiftKey && event.key === '/')) {
        event.preventDefault();
        handleOpenHelp();
        return;
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    enabled,
    isSearchOpen,
    isHelpModalOpen,
    isLeftPanelOpen,
    isRightPanelOpen,
    handleEscape,
    handleHome,
    handleToggleControlMode,
    handleToggleXRay,
    handleToggleUnderground,
    handleShareViewpoint,
    handleOpenHelp,
  ]);
}
