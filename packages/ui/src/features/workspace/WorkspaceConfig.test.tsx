/**
 * WorkspaceConfig Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkspaceConfig } from './WorkspaceConfig';
import type { Workspace } from '../../shared/types';

// Mock the API endpoints module
vi.mock('../../shared/api/endpoints', () => ({
  workspaces: {
    create: vi.fn(),
    update: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
}));

// Import the mocked module
import { workspaces as workspacesApi } from '../../shared/api/endpoints';
const mockCreate = vi.mocked(workspacesApi.create);
const mockUpdate = vi.mocked(workspacesApi.update);
const mockGet = vi.mocked(workspacesApi.get);

function buildWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  const now = new Date().toISOString();
  return {
    id: 'ws-1',
    name: 'Test Workspace',
    ownerId: 'dev-user',
    repositories: [],
    members: [],
    settings: {
      defaultLodLevel: 2,
      autoRefresh: false,
      collaborationEnabled: false,
    },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('WorkspaceConfig', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockCreate.mockResolvedValue(buildWorkspace({ id: 'ws-new', name: 'Created' }));
    mockUpdate.mockResolvedValue(buildWorkspace());
  });

  it('renders with new workspace title', () => {
    render(<WorkspaceConfig />);

    expect(screen.getByText('New Workspace')).toBeDefined();
  });

  it('renders with edit workspace title when editing', async () => {
    mockGet.mockResolvedValue(buildWorkspace({ name: 'Test Workspace' }));

    render(<WorkspaceConfig workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByText('Edit Workspace')).toBeDefined();
    });
  });

  it('has name input field', () => {
    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toBeDefined();
    expect(nameInput.getAttribute('placeholder')).toBe('My Workspace');
  });

  it('has description textarea', () => {
    render(<WorkspaceConfig />);

    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toBeDefined();
    expect(descriptionInput.tagName).toBe('TEXTAREA');
  });

  it('has LOD level selector', () => {
    render(<WorkspaceConfig />);

    const lodSelect = screen.getByLabelText(/default lod level/i);
    expect(lodSelect).toBeDefined();
    expect(lodSelect.tagName).toBe('SELECT');
  });

  it('has auto-refresh checkbox', () => {
    render(<WorkspaceConfig />);

    const autoRefreshCheckbox = screen.getByLabelText(/auto-refresh/i);
    expect(autoRefreshCheckbox).toBeDefined();
    expect(autoRefreshCheckbox.getAttribute('type')).toBe('checkbox');
  });

  it('has collaboration checkbox', () => {
    render(<WorkspaceConfig />);

    const collaborationCheckbox = screen.getByLabelText(/collaboration/i);
    expect(collaborationCheckbox).toBeDefined();
    expect(collaborationCheckbox.getAttribute('type')).toBe('checkbox');
  });

  it('creates workspace via API on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<WorkspaceConfig onSave={onSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Workspace');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Workspace' })
      );
    });
  });

  it('calls onSave callback with workspace ID from API', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    mockCreate.mockResolvedValue(buildWorkspace({ id: 'ws-new' }));

    render(<WorkspaceConfig onSave={onSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('ws-new');
    });
  });

  it('sends description to API if provided', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Test Workspace');
    await user.type(descriptionInput, 'Test description');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Workspace',
          description: 'Test description',
        })
      );
    });
  });

  it('does not send description if empty', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
      const arg = mockCreate.mock.calls[0]![0];
      expect(arg.description).toBeUndefined();
    });
  });

  it('sends custom settings to API', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    const lodSelect = screen.getByLabelText(/default lod level/i);
    const autoRefreshCheckbox = screen.getByLabelText(/auto-refresh/i);

    await user.type(nameInput, 'Test');
    await user.selectOptions(lodSelect, '3');
    await user.click(autoRefreshCheckbox);

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: expect.objectContaining({
            defaultLodLevel: 3,
            autoRefresh: true,
          }),
        })
      );
    });
  });

  it('loads existing workspace data from API when editing', async () => {
    mockGet.mockResolvedValue(
      buildWorkspace({
        name: 'Existing Workspace',
        description: 'Existing description',
      })
    );

    render(<WorkspaceConfig workspaceId="ws-1" />);

    await waitFor(() => {
      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Existing Workspace');
    });

    const descriptionInput = screen.getByLabelText(
      /description/i
    ) as HTMLTextAreaElement;
    expect(descriptionInput.value).toBe('Existing description');
  });

  it('calls update API when editing', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue(buildWorkspace({ name: 'Original Name' }));

    render(<WorkspaceConfig workspaceId="ws-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Original Name')).toBeDefined();
    });

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    await user.click(screen.getByText('Save Changes'));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        'ws-1',
        expect.objectContaining({ name: 'Updated Name' })
      );
    });
  });

  it('disables create button when name is empty', () => {
    render(<WorkspaceConfig />);

    const createButton = screen.getByText('Create Workspace');
    expect(createButton).toHaveProperty('disabled', true);
  });

  it('enables create button when name is filled', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    const createButton = screen.getByText('Create Workspace');
    expect(createButton).toHaveProperty('disabled', false);
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<WorkspaceConfig onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose after successful save', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<WorkspaceConfig onClose={onClose} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('trims whitespace from name', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, '  Test Workspace  ');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Workspace' })
      );
    });
  });

  it('shows error message when API fails', async () => {
    const user = userEvent.setup();
    mockCreate.mockRejectedValue(new Error('Network error'));

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeDefined();
    });
  });

  it('shows saving state during API call', async () => {
    const user = userEvent.setup();
    // Never resolve so we can check the saving state
    mockCreate.mockReturnValue(new Promise(() => {}));

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    await waitFor(() => {
      expect(screen.getByText('Saving...')).toBeDefined();
    });
  });
});
