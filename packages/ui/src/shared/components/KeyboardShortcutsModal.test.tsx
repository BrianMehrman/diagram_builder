/**
 * KeyboardShortcutsModal Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { useUIStore } from '../stores/uiStore';

describe('KeyboardShortcutsModal', () => {
  beforeEach(() => {
    useUIStore.getState().reset();
  });

  it('renders nothing when closed', () => {
    render(<KeyboardShortcutsModal />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal when open', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays all shortcut categories', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Camera Controls')).toBeInTheDocument();
    expect(screen.getByText('Sharing')).toBeInTheDocument();
    expect(screen.getByText('Help')).toBeInTheDocument();
  });

  it('displays search shortcuts', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Open search')).toBeInTheDocument();
    expect(screen.getByText('Navigate results')).toBeInTheDocument();
    expect(screen.getByText('Select result')).toBeInTheDocument();
    expect(screen.getByText('Close search')).toBeInTheDocument();
  });

  it('displays navigation shortcuts', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Fly to root node')).toBeInTheDocument();
    expect(screen.getByText('Deselect node')).toBeInTheDocument();
    expect(screen.getByText('Select node')).toBeInTheDocument();
    expect(screen.getByText('Fly to node')).toBeInTheDocument();
  });

  it('displays camera control shortcuts', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Toggle Orbit/Fly mode')).toBeInTheDocument();
    expect(screen.getByText('Zoom in/out')).toBeInTheDocument();
    expect(screen.getByText('Pan camera')).toBeInTheDocument();
  });

  it('displays sharing shortcuts', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Copy viewpoint link')).toBeInTheDocument();
  });

  it('displays help shortcut', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Open this help modal')).toBeInTheDocument();
  });

  it('displays keyboard keys as badges', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    // Check for keyboard key elements - Radix renders portal in document.body
    const kbds = document.querySelectorAll('kbd');
    expect(kbds.length).toBeGreaterThan(0);

    // Verify some specific keys exist (using getAllByText for multiple occurrences)
    expect(screen.getAllByText('Esc').length).toBeGreaterThan(0);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getAllByText('C').length).toBeGreaterThan(0);
  });

  it('closes modal when clicking "Got it" button', async () => {
    const user = userEvent.setup();
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    const gotItButton = screen.getByRole('button', { name: 'Got it' });
    await user.click(gotItButton);

    await waitFor(() => {
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });
  });

  it('closes modal when clicking close button', async () => {
    const user = userEvent.setup();
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    const closeButton = screen.getByRole('button', { name: 'Close' });
    await user.click(closeButton);

    await waitFor(() => {
      expect(useUIStore.getState().isHelpModalOpen).toBe(false);
    });
  });

  it('shows Windows/Linux note in footer', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText(/Windows\/Linux/)).toBeInTheDocument();
    expect(screen.getByText(/Ctrl/)).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-describedby');
  });

  it('renders description text', () => {
    useUIStore.getState().openHelpModal();

    render(<KeyboardShortcutsModal />);

    expect(screen.getByText(/Press \? anytime/)).toBeInTheDocument();
  });
});
