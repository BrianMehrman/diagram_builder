/**
 * WorkspaceConfig Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { WorkspaceConfig } from './WorkspaceConfig';
import { useWorkspaceStore } from './store';

describe('WorkspaceConfig', () => {
  beforeEach(() => {
    useWorkspaceStore.getState().reset();
  });

  it('renders with new workspace title', () => {
    render(<WorkspaceConfig />);

    expect(screen.getByText('New Workspace')).toBeDefined();
  });

  it('renders with edit workspace title when editing', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Test Workspace',
    });

    render(<WorkspaceConfig workspaceId={workspace.id} />);

    expect(screen.getByText('Edit Workspace')).toBeDefined();
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

  it('creates workspace on submit', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<WorkspaceConfig onSave={onSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'My Workspace');

    await user.click(screen.getByText('Create Workspace'));

    const workspaces = useWorkspaceStore.getState().workspaces;
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].name).toBe('My Workspace');
  });

  it('calls onSave callback with workspace ID', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<WorkspaceConfig onSave={onSave} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    expect(onSave).toHaveBeenCalledWith(expect.stringContaining('workspace-'));
  });

  it('saves description if provided', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Test Workspace');
    await user.type(descriptionInput, 'Test description');

    await user.click(screen.getByText('Create Workspace'));

    const workspaces = useWorkspaceStore.getState().workspaces;
    expect(workspaces[0].description).toBe('Test description');
  });

  it('does not save description if empty', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    await user.click(screen.getByText('Create Workspace'));

    const workspaces = useWorkspaceStore.getState().workspaces;
    expect(workspaces[0].description).toBeUndefined();
  });

  it('saves custom settings', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    const lodSelect = screen.getByLabelText(/default lod level/i);
    const autoRefreshCheckbox = screen.getByLabelText(/auto-refresh/i);

    await user.type(nameInput, 'Test');
    await user.selectOptions(lodSelect, '3');
    await user.click(autoRefreshCheckbox);

    await user.click(screen.getByText('Create Workspace'));

    const workspaces = useWorkspaceStore.getState().workspaces;
    expect(workspaces[0].settings.defaultLodLevel).toBe(3);
    expect(workspaces[0].settings.autoRefresh).toBe(true);
  });

  it('loads existing workspace data when editing', () => {
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Existing Workspace',
      description: 'Existing description',
    });

    render(<WorkspaceConfig workspaceId={workspace.id} />);

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
    const descriptionInput = screen.getByLabelText(
      /description/i
    ) as HTMLTextAreaElement;

    expect(nameInput.value).toBe('Existing Workspace');
    expect(descriptionInput.value).toBe('Existing description');
  });

  it('updates workspace when editing', async () => {
    const user = userEvent.setup();
    const workspace = useWorkspaceStore.getState().createWorkspace({
      name: 'Original Name',
    });

    render(<WorkspaceConfig workspaceId={workspace.id} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');

    await user.click(screen.getByText('Save Changes'));

    const workspaces = useWorkspaceStore.getState().workspaces;
    expect(workspaces[0].name).toBe('Updated Name');
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

    expect(onClose).toHaveBeenCalled();
  });

  it('trims whitespace from name', async () => {
    const user = userEvent.setup();

    render(<WorkspaceConfig />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, '  Test Workspace  ');

    await user.click(screen.getByText('Create Workspace'));

    const workspaces = useWorkspaceStore.getState().workspaces;
    expect(workspaces[0].name).toBe('Test Workspace');
  });
});
