/**
 * UI Store Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  describe('help modal state', () => {
    it('initializes with help modal closed', () => {
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });

    it('opens help modal', () => {
      useUIStore.getState().openHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(true);
    });

    it('closes help modal', () => {
      useUIStore.getState().openHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(true);

      useUIStore.getState().closeHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });

    it('toggles help modal from closed to open', () => {
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
      useUIStore.getState().toggleHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(true);
    });

    it('toggles help modal from open to closed', () => {
      useUIStore.getState().openHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(true);
      useUIStore.getState().toggleHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });
  });

  describe('reset', () => {
    it('resets all state to initial values', () => {
      useUIStore.getState().openHelpModal();
      expect(useUIStore.getState().isHelpModalOpen).toBe(true);

      useUIStore.getState().reset();
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });
  });
});
