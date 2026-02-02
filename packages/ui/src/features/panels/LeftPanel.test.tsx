/**
 * LeftPanel Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LeftPanel } from './LeftPanel';
import { useUIStore } from '../../shared/stores/uiStore';

// Mock child components
vi.mock('../workspace/WorkspaceSwitcher', () => ({
  WorkspaceSwitcher: () => <div data-testid="workspace-switcher">WorkspaceSwitcher</div>,
}));

vi.mock('../workspace/CodebaseList', () => ({
  CodebaseList: (props: Record<string, unknown>) => (
    <div data-testid="codebase-list" data-workspace-id={props.workspaceId}>
      CodebaseList
    </div>
  ),
}));

vi.mock('../workspace/ImportCodebaseButton', () => ({
  ImportCodebaseButton: () => <div data-testid="import-codebase-button">ImportCodebaseButton</div>,
}));

vi.mock('../collaboration/SessionControl', () => ({
  default: () => <div data-testid="session-control">SessionControl</div>,
}));

describe('LeftPanel', () => {
  const defaultProps = {
    workspaceId: 'workspace-1',
    selectedCodebaseId: 'codebase-1',
    onCodebaseSelected: vi.fn(),
    refreshTrigger: 0,
    onImportSuccess: vi.fn(),
    onImportComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useUIStore.getState().reset();
  });

  it('should not be visible when closed', () => {
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel.className).toContain('-translate-x-full');
  });

  it('should be visible when open', () => {
    useUIStore.getState().openLeftPanel();
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel.className).toContain('translate-x-0');
    expect(panel.className).not.toContain('-translate-x-full');
  });

  it('should have 320px width (w-80)', () => {
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel.className).toContain('w-80');
  });

  it('should close when close button is clicked', () => {
    useUIStore.getState().openLeftPanel();
    render(<LeftPanel {...defaultProps} />);
    const closeButton = screen.getByLabelText('Close menu');
    fireEvent.click(closeButton);
    expect(useUIStore.getState().isLeftPanelOpen).toBe(false);
  });

  it('should render section headers', () => {
    useUIStore.getState().openLeftPanel();
    render(<LeftPanel {...defaultProps} />);
    expect(screen.getByText('Workspace')).toBeInTheDocument();
    expect(screen.getByText('Codebases')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Collaboration')).toBeInTheDocument();
  });

  it('should render child components', () => {
    useUIStore.getState().openLeftPanel();
    render(<LeftPanel {...defaultProps} />);
    expect(screen.getByTestId('workspace-switcher')).toBeInTheDocument();
    expect(screen.getByTestId('codebase-list')).toBeInTheDocument();
    expect(screen.getByTestId('import-codebase-button')).toBeInTheDocument();
    expect(screen.getByTestId('session-control')).toBeInTheDocument();
  });

  it('should have slide-in animation classes', () => {
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel.className).toContain('transition-transform');
    expect(panel.className).toContain('duration-300');
  });

  it('should use aside landmark with aria-label', () => {
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel.tagName).toBe('ASIDE');
    expect(panel).toHaveAttribute('aria-label', 'Navigation menu');
  });

  it('should set aria-hidden when closed', () => {
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel).toHaveAttribute('aria-hidden', 'true');
  });

  it('should not set aria-hidden when open', () => {
    useUIStore.getState().openLeftPanel();
    render(<LeftPanel {...defaultProps} />);
    const panel = screen.getByTestId('left-panel');
    expect(panel).toHaveAttribute('aria-hidden', 'false');
  });
});
