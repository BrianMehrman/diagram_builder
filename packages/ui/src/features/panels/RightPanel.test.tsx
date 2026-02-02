/**
 * RightPanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RightPanel } from './RightPanel';
import { useUIStore } from '../../shared/stores/uiStore';

// Mock child components
vi.mock('../export/ExportButton', () => ({
  ExportButton: () => <div data-testid="export-button">ExportButton</div>,
}));

vi.mock('../viewpoints/ViewpointPanel', () => ({
  ViewpointPanel: () => <div data-testid="viewpoint-panel">ViewpointPanel</div>,
}));

vi.mock('../collaboration/UserPresence', () => ({
  default: () => <div data-testid="user-presence">UserPresence</div>,
}));

describe('RightPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().reset();
  });

  it('should not be visible when closed', () => {
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel.className).toContain('translate-x-full');
  });

  it('should be visible when open', () => {
    useUIStore.getState().openRightPanel();
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel.className).toContain('translate-x-0');
    expect(panel.className).not.toContain('-translate-x-full');
  });

  it('should have 320px width (w-80)', () => {
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel.className).toContain('w-80');
  });

  it('should close when close button is clicked', () => {
    useUIStore.getState().openRightPanel();
    render(<RightPanel />);
    const closeButton = screen.getByLabelText('Close tools panel');
    fireEvent.click(closeButton);
    expect(useUIStore.getState().isRightPanelOpen).toBe(false);
  });

  it('should render section headers', () => {
    useUIStore.getState().openRightPanel();
    render(<RightPanel />);
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Viewpoints')).toBeInTheDocument();
    expect(screen.getByText('Users')).toBeInTheDocument();
  });

  it('should render child components', () => {
    useUIStore.getState().openRightPanel();
    render(<RightPanel />);
    expect(screen.getByTestId('export-button')).toBeInTheDocument();
    expect(screen.getByTestId('viewpoint-panel')).toBeInTheDocument();
    expect(screen.getByTestId('user-presence')).toBeInTheDocument();
  });

  it('should have slide-in animation classes', () => {
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel.className).toContain('transition-transform');
    expect(panel.className).toContain('duration-300');
  });

  it('should use aside landmark with aria-label', () => {
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel.tagName).toBe('ASIDE');
    expect(panel).toHaveAttribute('aria-label', 'Tools panel');
  });

  it('should set aria-hidden when closed', () => {
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('should not set aria-hidden when open', () => {
    useUIStore.getState().openRightPanel();
    render(<RightPanel />);
    const panel = screen.getByTestId('right-panel');
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });
});
