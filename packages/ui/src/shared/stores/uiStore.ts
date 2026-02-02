/**
 * UI Store
 *
 * Zustand store for global UI state (modals, panels, etc.)
 */

import { create } from 'zustand';

/**
 * UI store state and actions
 */
interface UIStore {
  // Help modal state
  isHelpModalOpen: boolean;
  openHelpModal: () => void;
  closeHelpModal: () => void;
  toggleHelpModal: () => void;

  // Side panel state
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
  openLeftPanel: () => void;
  closeLeftPanel: () => void;
  toggleLeftPanel: () => void;
  openRightPanel: () => void;
  closeRightPanel: () => void;
  toggleRightPanel: () => void;
  closeAllPanels: () => void;

  // Reset
  reset: () => void;
}

/**
 * UI store
 */
export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  isHelpModalOpen: false,
  isLeftPanelOpen: false,
  isRightPanelOpen: false,

  // Help modal actions
  openHelpModal: () => set({ isHelpModalOpen: true }),
  closeHelpModal: () => set({ isHelpModalOpen: false }),
  toggleHelpModal: () => set((state) => ({ isHelpModalOpen: !state.isHelpModalOpen })),

  // Side panel actions
  openLeftPanel: () => set({ isLeftPanelOpen: true }),
  closeLeftPanel: () => set({ isLeftPanelOpen: false }),
  toggleLeftPanel: () => set((state) => ({ isLeftPanelOpen: !state.isLeftPanelOpen })),
  openRightPanel: () => set({ isRightPanelOpen: true }),
  closeRightPanel: () => set({ isRightPanelOpen: false }),
  toggleRightPanel: () => set((state) => ({ isRightPanelOpen: !state.isRightPanelOpen })),
  closeAllPanels: () => set({ isLeftPanelOpen: false, isRightPanelOpen: false }),

  // Reset
  reset: () => set({ isHelpModalOpen: false, isLeftPanelOpen: false, isRightPanelOpen: false }),
}));
