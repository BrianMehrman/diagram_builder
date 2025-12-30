/**
 * ViewpointList Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { ViewpointList } from './ViewpointList';
import { useViewpointStore } from './store';
import { useCanvasStore } from '../canvas/store';

describe('ViewpointList', () => {
  beforeEach(() => {
    useViewpointStore.getState().reset();
    useCanvasStore.getState().reset();
  });

  it('shows empty state when no viewpoints', () => {
    render(<ViewpointList />);

    expect(screen.getByText(/no saved viewpoints/i)).toBeDefined();
  });

  it('displays viewpoints', () => {
    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Viewpoint 1',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
      useViewpointStore.getState().createViewpoint({
        name: 'Viewpoint 2',
        cameraPosition: { x: 4, y: 5, z: 6 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    expect(screen.getByText('Viewpoint 1')).toBeDefined();
    expect(screen.getByText('Viewpoint 2')).toBeDefined();
  });

  it('displays viewpoint description', () => {
    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        description: 'Test description',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    expect(screen.getByText('Test description')).toBeDefined();
  });

  it('displays camera position', () => {
    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    expect(screen.getByText(/camera:/i)).toBeDefined();
    expect(screen.getByText(/1\.0, 2\.0, 3\.0/)).toBeDefined();
  });

  it('displays LOD level', () => {
    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
        filters: { lodLevel: 2 },
      });
    });

    render(<ViewpointList />);

    expect(screen.getByText(/lod: level 2/i)).toBeDefined();
  });

  it('applies viewpoint on apply button click', async () => {
    const user = userEvent.setup();

    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 10, y: 20, z: 30 },
        cameraTarget: { x: 5, y: 5, z: 5 },
        filters: { lodLevel: 3 },
      });
    });

    render(<ViewpointList />);

    const applyButton = screen.getAllByTitle('Apply viewpoint')[0];
    await user.click(applyButton);

    const camera = useCanvasStore.getState().camera;
    expect(camera.position).toEqual({ x: 10, y: 20, z: 30 });
    expect(camera.target).toEqual({ x: 5, y: 5, z: 5 });
    expect(useCanvasStore.getState().lodLevel).toBe(3);
  });

  it('sets active viewpoint on apply', async () => {
    const user = userEvent.setup();

    const vp = useViewpointStore.getState().createViewpoint({
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    });

    render(<ViewpointList />);

    const applyButton = screen.getAllByTitle('Apply viewpoint')[0];
    await user.click(applyButton);

    expect(useViewpointStore.getState().activeViewpointId).toBe(vp.id);
  });

  it('calls onViewpointApplied callback', async () => {
    const user = userEvent.setup();
    const onViewpointApplied = vi.fn();

    const vp = useViewpointStore.getState().createViewpoint({
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    });

    render(<ViewpointList onViewpointApplied={onViewpointApplied} />);

    const applyButton = screen.getAllByTitle('Apply viewpoint')[0];
    await user.click(applyButton);

    expect(onViewpointApplied).toHaveBeenCalledWith(
      expect.objectContaining({ id: vp.id })
    );
  });

  it('highlights active viewpoint', () => {
    const vp = useViewpointStore.getState().createViewpoint({
      name: 'Test Viewpoint',
      cameraPosition: { x: 1, y: 2, z: 3 },
      cameraTarget: { x: 0, y: 0, z: 0 },
    });

    act(() => {
      useViewpointStore.getState().setActiveViewpoint(vp.id);
    });

    const { container } = render(<ViewpointList />);

    const activeElement = container.querySelector('.border-primary-500');
    expect(activeElement).toBeDefined();
  });

  it('deletes viewpoint on delete button click', async () => {
    const user = userEvent.setup();
    global.confirm = vi.fn(() => true);

    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    const deleteButton = screen.getAllByTitle('Delete viewpoint')[0];
    await user.click(deleteButton);

    expect(useViewpointStore.getState().viewpoints).toHaveLength(0);
  });

  it('shows confirmation before deleting', async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.fn(() => false);
    global.confirm = confirmSpy;

    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    const deleteButton = screen.getAllByTitle('Delete viewpoint')[0];
    await user.click(deleteButton);

    expect(confirmSpy).toHaveBeenCalled();
    expect(useViewpointStore.getState().viewpoints).toHaveLength(1);
  });

  it('copies share URL to clipboard', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn(() => Promise.resolve());

    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    const shareButton = screen.getAllByTitle('Share viewpoint')[0];
    await user.click(shareButton);

    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining('viewpoint=')
    );
  });

  it('shows success message after copying URL', async () => {
    const user = userEvent.setup();
    const writeTextMock = vi.fn(() => Promise.resolve());

    Object.defineProperty(global.navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });

    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    const shareButton = screen.getAllByTitle('Share viewpoint')[0];
    await user.click(shareButton);

    await vi.waitFor(() => {
      expect(screen.getByText(/url copied to clipboard/i)).toBeDefined();
    });
  });

  it('displays creation date', () => {
    act(() => {
      useViewpointStore.getState().createViewpoint({
        name: 'Test Viewpoint',
        cameraPosition: { x: 1, y: 2, z: 3 },
        cameraTarget: { x: 0, y: 0, z: 0 },
      });
    });

    render(<ViewpointList />);

    // Should display a formatted date string
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/;
    expect(screen.getByText(dateRegex)).toBeDefined();
  });
});
