/**
 * ViewpointCreator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { ViewpointCreator } from './ViewpointCreator';
import { useViewpointStore } from './store';
import { useCanvasStore } from '../canvas/store';

describe('ViewpointCreator', () => {
  beforeEach(() => {
    useViewpointStore.getState().reset();
    useCanvasStore.getState().reset();
  });

  it('renders create button initially', () => {
    render(<ViewpointCreator />);

    expect(screen.getByText('Save Viewpoint')).toBeDefined();
  });

  it('opens form when button is clicked', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    expect(screen.getByText('Create Viewpoint')).toBeDefined();
    expect(screen.getByLabelText(/name/i)).toBeDefined();
  });

  it('has name input field', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    expect(nameInput).toBeDefined();
    expect(nameInput.getAttribute('placeholder')).toBe('My Viewpoint');
  });

  it('has description textarea', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const descriptionInput = screen.getByLabelText(/description/i);
    expect(descriptionInput).toBeDefined();
    expect(descriptionInput.tagName).toBe('TEXTAREA');
  });

  it('displays current camera state', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    expect(screen.getByText(/captured state/i)).toBeDefined();
    expect(screen.getByText(/camera:/i)).toBeDefined();
    expect(screen.getByText(/lod level:/i)).toBeDefined();
  });

  it('creates viewpoint on submit', async () => {
    const user = userEvent.setup();
    const onViewpointCreated = vi.fn();
    render(<ViewpointCreator onViewpointCreated={onViewpointCreated} />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Viewpoint');

    await user.click(screen.getByText('Create'));

    const viewpoints = useViewpointStore.getState().viewpoints;
    expect(viewpoints).toHaveLength(1);
    expect(viewpoints[0].name).toBe('Test Viewpoint');
  });

  it('calls onViewpointCreated callback', async () => {
    const user = userEvent.setup();
    const onViewpointCreated = vi.fn();
    render(<ViewpointCreator onViewpointCreated={onViewpointCreated} />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Viewpoint');

    await user.click(screen.getByText('Create'));

    expect(onViewpointCreated).toHaveBeenCalledWith(expect.stringContaining('viewpoint-'));
  });

  it('saves description if provided', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    const descriptionInput = screen.getByLabelText(/description/i);

    await user.type(nameInput, 'Test Viewpoint');
    await user.type(descriptionInput, 'Test description');

    await user.click(screen.getByText('Create'));

    const viewpoints = useViewpointStore.getState().viewpoints;
    expect(viewpoints[0].description).toBe('Test description');
  });

  it('does not save description if empty', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Viewpoint');

    await user.click(screen.getByText('Create'));

    const viewpoints = useViewpointStore.getState().viewpoints;
    expect(viewpoints[0].description).toBeUndefined();
  });

  it('captures camera position', async () => {
    const user = userEvent.setup();

    act(() => {
      useCanvasStore.getState().setCameraPosition({ x: 10, y: 20, z: 30 });
    });

    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Viewpoint');

    await user.click(screen.getByText('Create'));

    const viewpoints = useViewpointStore.getState().viewpoints;
    expect(viewpoints[0].cameraPosition).toEqual({ x: 10, y: 20, z: 30 });
  });

  it('captures LOD level', async () => {
    const user = userEvent.setup();

    act(() => {
      useCanvasStore.getState().setLodLevel(3);
    });

    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Viewpoint');

    await user.click(screen.getByText('Create'));

    const viewpoints = useViewpointStore.getState().viewpoints;
    expect(viewpoints[0].filters?.lodLevel).toBe(3);
  });

  it('disables create button when name is empty', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const createButton = screen.getByText('Create');
    expect(createButton).toHaveProperty('disabled', true);
  });

  it('enables create button when name is filled', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test');

    const createButton = screen.getByText('Create');
    expect(createButton).toHaveProperty('disabled', false);
  });

  it('closes form on cancel', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));
    expect(screen.getByText('Create Viewpoint')).toBeDefined();

    await user.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Create Viewpoint')).toBeNull();
  });

  it('closes form after creation', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Test Viewpoint');

    await user.click(screen.getByText('Create'));

    expect(screen.queryByText('Create Viewpoint')).toBeNull();
  });

  it('trims whitespace from name', async () => {
    const user = userEvent.setup();
    render(<ViewpointCreator />);

    await user.click(screen.getByText('Save Viewpoint'));

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, '  Test Viewpoint  ');

    await user.click(screen.getByText('Create'));

    const viewpoints = useViewpointStore.getState().viewpoints;
    expect(viewpoints[0].name).toBe('Test Viewpoint');
  });
});
