/**
 * WorkspaceSwitcher Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';
import type { Workspace } from '../../shared/types';

// Mock react-router navigate
const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ id: 'workspace-1' }),
  };
});

// Mock API endpoints
vi.mock('../../shared/api/endpoints', () => ({
  workspaces: {
    list: vi.fn(),
  },
}));

// Mock WorkspaceConfig
vi.mock('./WorkspaceConfig', () => ({
  WorkspaceConfig: ({ onClose, onSave }: { onClose: () => void; onSave: (id: string) => void }) => (
    <div data-testid="workspace-config">
      <button onClick={onClose}>Cancel</button>
      <button onClick={() => onSave('new-workspace-id')}>Save</button>
    </div>
  ),
}));

import { workspaces as workspacesApi } from '../../shared/api/endpoints';

const mockWorkspaces: Workspace[] = [
  {
    id: 'workspace-1',
    name: 'My Workspace',
    description: 'Primary workspace',
    ownerId: 'user-1',
    repositories: ['repo-1'],
    members: [{ userId: 'user-1', role: 'owner', joinedAt: '2026-01-01T00:00:00Z' }],
    settings: { defaultLodLevel: 3, autoRefresh: false, collaborationEnabled: false },
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Team Workspace',
    description: 'Shared workspace',
    ownerId: 'user-1',
    repositories: ['repo-2', 'repo-3'],
    members: [{ userId: 'user-1', role: 'owner', joinedAt: '2026-01-01T00:00:00Z' }],
    settings: { defaultLodLevel: 2, autoRefresh: true, collaborationEnabled: true },
    createdAt: '2026-01-02T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
  },
];

describe('WorkspaceSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (workspacesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue(mockWorkspaces);
  });

  it('should fetch and display workspaces from API', async () => {
    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('workspace-item-workspace-1')).toBeInTheDocument();
      expect(screen.getByTestId('workspace-item-workspace-2')).toBeInTheDocument();
    });
  });

  it('should highlight the current workspace', async () => {
    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>
    );

    await waitFor(() => {
      const currentWorkspaceItem = screen.getByTestId('workspace-item-workspace-1');
      expect(currentWorkspaceItem.className).toContain('border-primary-500');
    });
  });

  it('should navigate to workspace on switch click', async () => {
    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Team Workspace')).toBeInTheDocument();
    });

    const switchButton = screen.getByLabelText('Switch to this workspace');
    fireEvent.click(switchButton);

    expect(mockNavigate).toHaveBeenCalledWith('/workspace/workspace-2');
  });

  it('should show Create New button', async () => {
    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('+ New')).toBeInTheDocument();
    });
  });

  it('should show empty state when no workspaces', async () => {
    (workspacesApi.list as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No workspaces yet')).toBeInTheDocument();
    });
  });

  it('should show loading state initially', () => {
    // Make the API call hang
    (workspacesApi.list as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter>
        <WorkspaceSwitcher />
      </MemoryRouter>
    );

    // Loading spinner is present (the spinner div with animate-spin class)
    const loadingElements = screen.getAllByText('Loading...');
    expect(loadingElements.length).toBeGreaterThanOrEqual(1);
  });
});
