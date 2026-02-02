/**
 * useGlobalKeyboardShortcuts Hook Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalKeyboardShortcuts } from './useGlobalKeyboardShortcuts';
import { useSearchStore } from '../../features/navigation/searchStore';
import { useCanvasStore } from '../../features/canvas/store';
import { useUIStore } from '../stores/uiStore';
import { useToastStore } from '../../features/feedback/toastStore';
import type { GraphNode } from '../types';

// Mock clipboard
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

// Mock window.location
const originalLocation = window.location;
beforeEach(() => {
  Object.defineProperty(window, 'location', {
    value: {
      origin: 'http://localhost:3000',
      pathname: '/workspace/123',
    },
    writable: true,
  });
});
afterEach(() => {
  Object.defineProperty(window, 'location', {
    value: originalLocation,
    writable: true,
  });
});

// Sample nodes
const mockNodes: GraphNode[] = [
  {
    id: 'file-1',
    type: 'file',
    label: 'index.ts',
    metadata: {},
    position: { x: 0, y: 0, z: 0 },
    lod: 0,
  },
  {
    id: 'class-1',
    type: 'class',
    label: 'MyClass',
    metadata: { file: 'file-1' },
    position: { x: 1, y: 1, z: 1 },
    lod: 1,
  },
];

/**
 * Simulate a keydown event
 */
function simulateKeyDown(
  key: string,
  options: {
    ctrlKey?: boolean;
    metaKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    target?: HTMLElement;
  } = {}
): void {
  const event = new KeyboardEvent('keydown', {
    key,
    ctrlKey: options.ctrlKey ?? false,
    metaKey: options.metaKey ?? false,
    shiftKey: options.shiftKey ?? false,
    altKey: options.altKey ?? false,
    bubbles: true,
    cancelable: true,
  });

  if (options.target) {
    Object.defineProperty(event, 'target', { value: options.target });
  }

  window.dispatchEvent(event);
}

describe('useGlobalKeyboardShortcuts', () => {
  beforeEach(() => {
    // Reset all stores
    useSearchStore.getState().closeSearch();
    useCanvasStore.getState().reset();
    useUIStore.getState().reset();
    useToastStore.getState().clearAllToasts();
    mockClipboard.writeText.mockClear();
  });

  describe('ESC key', () => {
    it('closes help modal when open', () => {
      useUIStore.getState().openHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(true);

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('Escape');

      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });

    it('closes search modal when open (and help closed)', () => {
      useSearchStore.getState().openSearch();
      expect(useSearchStore.getState().isOpen).toBe(true);

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('Escape');

      expect(useSearchStore.getState().isOpen).toBe(false);
    });

    it('deselects node when no modals open', () => {
      useCanvasStore.getState().selectNode('file-1');
      expect(useCanvasStore.getState().selectedNodeId).toBe('file-1');

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('Escape');

      expect(useCanvasStore.getState().selectedNodeId).toBeNull();
    });

    it('prioritizes help modal over search modal', () => {
      useUIStore.getState().openHelpModal();
      useSearchStore.getState().openSearch();

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('Escape');

      // Help modal closed, search still open
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
      expect(useSearchStore.getState().isOpen).toBe(true);
    });

    it('works even when typing in input fields', () => {
      useUIStore.getState().openHelpModal();

      const input = document.createElement('input');
      document.body.appendChild(input);

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('Escape', { target: input });

      expect(useUIStore.getState().isHelpModalOpen).toBe(false);

      document.body.removeChild(input);
    });
  });

  describe('Home key', () => {
    it('calls onFlyToNode with root node', () => {
      const onFlyToNode = vi.fn();

      renderHook(() =>
        useGlobalKeyboardShortcuts({
          nodes: mockNodes,
          onFlyToNode,
        })
      );

      simulateKeyDown('Home');

      expect(onFlyToNode).toHaveBeenCalledWith('file-1', { x: 0, y: 0, z: 0 });
    });

    it('prefers file nodes as root', () => {
      const onFlyToNode = vi.fn();
      const nodesWithClassFirst: GraphNode[] = [
        mockNodes[1]!, // class
        mockNodes[0]!, // file
      ];

      renderHook(() =>
        useGlobalKeyboardShortcuts({
          nodes: nodesWithClassFirst,
          onFlyToNode,
        })
      );

      simulateKeyDown('Home');

      // Should still find the file node
      expect(onFlyToNode).toHaveBeenCalledWith('file-1', { x: 0, y: 0, z: 0 });
    });

    it('does nothing when no nodes provided', () => {
      const onFlyToNode = vi.fn();

      renderHook(() =>
        useGlobalKeyboardShortcuts({
          nodes: [],
          onFlyToNode,
        })
      );

      simulateKeyDown('Home');

      expect(onFlyToNode).not.toHaveBeenCalled();
    });

    it('does not trigger when modal is open', () => {
      const onFlyToNode = vi.fn();
      useSearchStore.getState().openSearch();

      renderHook(() =>
        useGlobalKeyboardShortcuts({
          nodes: mockNodes,
          onFlyToNode,
        })
      );

      simulateKeyDown('Home');

      expect(onFlyToNode).not.toHaveBeenCalled();
    });

    it('does not trigger when typing in input', () => {
      const onFlyToNode = vi.fn();
      const input = document.createElement('input');
      document.body.appendChild(input);

      renderHook(() =>
        useGlobalKeyboardShortcuts({
          nodes: mockNodes,
          onFlyToNode,
        })
      );

      simulateKeyDown('Home', { target: input });

      expect(onFlyToNode).not.toHaveBeenCalled();

      document.body.removeChild(input);
    });
  });

  describe('C key - toggle control mode', () => {
    it('toggles from orbit to fly mode', () => {
      expect(useCanvasStore.getState().controlMode).toBe('orbit');

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('c');

      expect(useCanvasStore.getState().controlMode).toBe('fly');
    });

    it('toggles from fly to orbit mode', () => {
      useCanvasStore.getState().setControlMode('fly');

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('c');

      expect(useCanvasStore.getState().controlMode).toBe('orbit');
    });

    it('shows toast notification on toggle', () => {
      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('c');

      const toasts = useToastStore.getState().toasts;
      expect(toasts.length).toBe(1);
      expect(toasts[0]?.type).toBe('success');
      expect(toasts[0]?.title).toContain('Fly');
    });

    it('does not trigger with Ctrl+C', () => {
      expect(useCanvasStore.getState().controlMode).toBe('orbit');

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('c', { ctrlKey: true });

      expect(useCanvasStore.getState().controlMode).toBe('orbit');
    });

    it('does not trigger when modal is open', () => {
      useSearchStore.getState().openSearch();

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('c');

      expect(useCanvasStore.getState().controlMode).toBe('orbit');
    });
  });

  describe('Ctrl+Shift+S - share viewpoint', () => {
    it('copies viewpoint link to clipboard', async () => {
      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('S', { ctrlKey: true, shiftKey: true });

      // Wait for async clipboard operation
      await vi.waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });

      const link = mockClipboard.writeText.mock.calls[0]?.[0] as string;
      expect(link).toContain('http://localhost:3000/workspace/123');
      expect(link).toContain('cx=');
      expect(link).toContain('cy=');
      expect(link).toContain('zoom=');
    });

    it('includes selected node in link', async () => {
      useCanvasStore.getState().selectNode('file-1');

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('S', { ctrlKey: true, shiftKey: true });

      await vi.waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });

      const link = mockClipboard.writeText.mock.calls[0]?.[0] as string;
      expect(link).toContain('node=file-1');
    });

    it('shows success toast on copy', async () => {
      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('S', { ctrlKey: true, shiftKey: true });

      await vi.waitFor(() => {
        const toasts = useToastStore.getState().toasts;
        expect(toasts.length).toBe(1);
        expect(toasts[0]?.type).toBe('success');
        expect(toasts[0]?.title).toContain('copied');
      });
    });

    it('works with Meta key (Mac)', async () => {
      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('S', { metaKey: true, shiftKey: true });

      await vi.waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });
  });

  describe('? key - open help modal', () => {
    it('opens help modal', () => {
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('?');

      expect(useUIStore.getState().isHelpModalOpen).toBe(true);
    });

    it('also works with Shift+/', () => {
      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('/', { shiftKey: true });

      expect(useUIStore.getState().isHelpModalOpen).toBe(true);
    });

    it('does not trigger when typing in input', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);

      renderHook(() => useGlobalKeyboardShortcuts());
      simulateKeyDown('?', { target: input });

      expect(useUIStore.getState().isHelpModalOpen).toBe(false);

      document.body.removeChild(input);
    });
  });

  describe('enabled option', () => {
    it('disables all shortcuts when enabled=false', () => {
      renderHook(() =>
        useGlobalKeyboardShortcuts({ enabled: false })
      );

      simulateKeyDown('c');
      expect(useCanvasStore.getState().controlMode).toBe('orbit');

      simulateKeyDown('?');
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });
  });

  describe('cleanup', () => {
    it('removes event listener on unmount', () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useGlobalKeyboardShortcuts());

      expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      unmount();

      expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });
  });
});
