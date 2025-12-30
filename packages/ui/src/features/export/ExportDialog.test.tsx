/**
 * ExportDialog Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportDialog } from './ExportDialog';
import { useExportStore } from './store';

describe('ExportDialog', () => {
  beforeEach(() => {
    useExportStore.getState().reset();
    vi.clearAllMocks();

    // Mock URL.createObjectURL and revokeObjectURL for download tests
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  it('renders with title', () => {
    render(<ExportDialog repositoryId="repo-123" />);

    expect(screen.getByText('Export Graph')).toBeDefined();
  });

  it('displays all export formats', () => {
    render(<ExportDialog repositoryId="repo-123" />);

    expect(screen.getByText('PlantUML')).toBeDefined();
    expect(screen.getByText('Mermaid')).toBeDefined();
    expect(screen.getByText('Draw.io')).toBeDefined();
    expect(screen.getByText('GLTF')).toBeDefined();
    expect(screen.getByText('PNG')).toBeDefined();
    expect(screen.getByText('SVG')).toBeDefined();
  });

  it('has LOD level selector', () => {
    render(<ExportDialog repositoryId="repo-123" />);

    const lodSelect = screen.getByLabelText(/detail level/i);
    expect(lodSelect).toBeDefined();
    expect(lodSelect.tagName).toBe('SELECT');
  });

  it('selects format on click', async () => {
    const user = userEvent.setup();
    render(<ExportDialog repositoryId="repo-123" />);

    const mermaidButton = screen.getByText('Mermaid').closest('button');
    await user.click(mermaidButton!);

    expect(useExportStore.getState().selectedFormat).toBe('mermaid');
  });

  it('changes LOD level', async () => {
    const user = userEvent.setup();
    render(<ExportDialog repositoryId="repo-123" />);

    const lodSelect = screen.getByLabelText(/detail level/i);
    await user.selectOptions(lodSelect, '4');

    expect(useExportStore.getState().selectedLodLevel).toBe(4);
  });

  it('has export button', () => {
    render(<ExportDialog repositoryId="repo-123" />);

    const exportButton = screen.getByText('Export');
    expect(exportButton).toBeDefined();
    expect(exportButton.tagName).toBe('BUTTON');
  });

  it('has cancel button', () => {
    render(<ExportDialog repositoryId="repo-123" />);

    const cancelButton = screen.getByText('Cancel');
    expect(cancelButton).toBeDefined();
  });

  it('calls onClose when cancel is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ExportDialog repositoryId="repo-123" onClose={onClose} />);

    await user.click(screen.getByText('Cancel'));

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<ExportDialog repositoryId="repo-123" onClose={onClose} />);

    const closeButton = screen.getByTitle('Close');
    await user.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('starts export on export button click', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test content',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  it('shows progress during export', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  content: 'test',
                  filename: 'test.puml',
                  mimeType: 'text/plain',
                  extension: '.puml',
                  stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
                }),
              }),
            100
          );
        })
    );

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    expect(screen.getAllByText('Exporting...').length).toBeGreaterThan(0);
  });

  it('disables controls during export', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: async () => ({
                  content: 'test',
                  filename: 'test.puml',
                  mimeType: 'text/plain',
                  extension: '.puml',
                  stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
                }),
              }),
            100
          );
        })
    );

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    const exportButtons = screen.getAllByText('Exporting...');
    const button = exportButtons.find((el) => el.tagName === 'BUTTON');
    expect(button).toHaveProperty('disabled', true);
  });

  it('shows success message on completion', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test content',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Export Complete')).toBeDefined();
    });
  });

  it('shows stats after successful export', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test content',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 25, edgeCount: 15, duration: 250, size: 1500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText(/Nodes: 25/)).toBeDefined();
      expect(screen.getByText(/Edges: 15/)).toBeDefined();
    });
  });

  it('shows download button after successful export', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test content',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Download')).toBeDefined();
    });
  });

  it('shows error message on failure', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: 'Repository not found',
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Export Failed')).toBeDefined();
      expect(screen.getByText('Repository not found')).toBeDefined();
    });
  });

  it('shows preview button for text formats', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: '@startuml\nclass Foo\n@enduml',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Show Preview')).toBeDefined();
    });
  });

  it('toggles preview content', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: '@startuml\nclass Foo\n@enduml',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Show Preview')).toBeDefined();
    });

    await user.click(screen.getByText('Show Preview'));

    expect(screen.getByText('Hide Preview')).toBeDefined();
    expect(screen.getByText(/@startuml/)).toBeDefined();
  });

  it('allows export another after success', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Export Another')).toBeDefined();
    });

    await user.click(screen.getByText('Export Another'));

    expect(screen.getByText('Export')).toBeDefined();
    expect(useExportStore.getState().status).toBe('idle');
  });

  it('clears result when format changes', async () => {
    const user = userEvent.setup();
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    render(<ExportDialog repositoryId="repo-123" />);

    await user.click(screen.getByText('Export'));

    await waitFor(() => {
      expect(screen.getByText('Download')).toBeDefined();
    });

    // Change format
    const mermaidButton = screen.getByText('Mermaid').closest('button');
    await user.click(mermaidButton!);

    // Result should be cleared
    expect(useExportStore.getState().result).toBeNull();
  });
});
