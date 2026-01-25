/**
 * useGlobalSearchShortcut Tests
 *
 * Tests for the global ⌘K keyboard shortcut hook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGlobalSearchShortcut } from './useGlobalSearchShortcut';
import { useSearchStore } from '../../features/navigation/searchStore';

describe('useGlobalSearchShortcut', () => {
  beforeEach(() => {
    // Reset search store before each test
    useSearchStore.getState().closeSearch();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens search modal on Cmd+K (Mac)', () => {
    renderHook(() => useGlobalSearchShortcut());

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('opens search modal on Ctrl+K (Windows/Linux)', () => {
    renderHook(() => useGlobalSearchShortcut());

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });

    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(true);
    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('does not open on K without modifier', () => {
    renderHook(() => useGlobalSearchShortcut());

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(false);
  });

  it('does not open on Cmd+other key', () => {
    renderHook(() => useGlobalSearchShortcut());

    const event = new KeyboardEvent('keydown', {
      key: 'j',
      metaKey: true,
      bubbles: true,
    });
    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(false);
  });

  it('does not trigger when typing in input field', () => {
    renderHook(() => useGlobalSearchShortcut());

    // Create an input element as the target
    const input = document.createElement('input');
    document.body.appendChild(input);
    input.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });

    // Simulate event from input
    Object.defineProperty(event, 'target', {
      value: input,
      writable: false,
    });

    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(false);

    // Cleanup
    document.body.removeChild(input);
  });

  it('does not trigger when typing in textarea', () => {
    renderHook(() => useGlobalSearchShortcut());

    // Create a textarea element as the target
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);
    textarea.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });

    // Simulate event from textarea
    Object.defineProperty(event, 'target', {
      value: textarea,
      writable: false,
    });

    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(false);

    // Cleanup
    document.body.removeChild(textarea);
  });

  it('does not trigger in contentEditable elements', () => {
    renderHook(() => useGlobalSearchShortcut());

    // Create a contentEditable div as the target
    const editableDiv = document.createElement('div');
    editableDiv.contentEditable = 'true';
    document.body.appendChild(editableDiv);
    editableDiv.focus();

    const event = new KeyboardEvent('keydown', {
      key: 'k',
      metaKey: true,
      bubbles: true,
    });

    // Simulate event from contentEditable
    Object.defineProperty(event, 'target', {
      value: editableDiv,
      writable: false,
    });

    window.dispatchEvent(event);

    expect(useSearchStore.getState().isOpen).toBe(false);

    // Cleanup
    document.body.removeChild(editableDiv);
  });

  it('cleans up event listener on unmount', () => {
    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = renderHook(() => useGlobalSearchShortcut());
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function)
    );
  });
});
