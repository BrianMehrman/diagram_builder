/**
 * Export Store Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExportStore, EXPORT_FORMATS, getFormatInfo } from './store';

describe('useExportStore', () => {
  beforeEach(() => {
    useExportStore.getState().reset();
    vi.clearAllMocks();
  });

  it('initializes with default state', () => {
    const state = useExportStore.getState();

    expect(state.status).toBe('idle');
    expect(state.result).toBeNull();
    expect(state.error).toBeNull();
    expect(state.progress).toBe(0);
    expect(state.selectedFormat).toBe('plantuml');
    expect(state.selectedLodLevel).toBe(2);
    expect(state.selectedRepositoryId).toBeNull();
  });

  it('sets format', () => {
    useExportStore.getState().setFormat('mermaid');

    const state = useExportStore.getState();
    expect(state.selectedFormat).toBe('mermaid');
  });

  it('sets LOD level', () => {
    useExportStore.getState().setLodLevel(4);

    const state = useExportStore.getState();
    expect(state.selectedLodLevel).toBe(4);
  });

  it('sets repository ID', () => {
    useExportStore.getState().setRepositoryId('repo-123');

    const state = useExportStore.getState();
    expect(state.selectedRepositoryId).toBe('repo-123');
  });

  it('clears result', () => {
    // Manually set some state
    useExportStore.setState({
      status: 'success',
      result: {
        content: 'test',
        filename: 'test.puml',
        mimeType: 'text/plain',
        extension: '.puml',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      },
      progress: 100,
    });

    useExportStore.getState().clearResult();

    const state = useExportStore.getState();
    expect(state.status).toBe('idle');
    expect(state.result).toBeNull();
    expect(state.progress).toBe(0);
  });

  it('resets store', () => {
    // Set some state
    useExportStore.setState({
      selectedFormat: 'gltf',
      selectedLodLevel: 5,
      selectedRepositoryId: 'repo-123',
      status: 'success',
    });

    useExportStore.getState().reset();

    const state = useExportStore.getState();
    expect(state.selectedFormat).toBe('plantuml');
    expect(state.selectedLodLevel).toBe(2);
    expect(state.selectedRepositoryId).toBeNull();
    expect(state.status).toBe('idle');
  });

  it('startExport sets exporting status', async () => {
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

    const exportPromise = useExportStore.getState().startExport({
      format: 'plantuml',
      lodLevel: 2,
      repositoryId: 'repo-123',
    });

    // Check exporting status
    expect(useExportStore.getState().status).toBe('exporting');

    await exportPromise;
  });

  it('startExport succeeds with result', async () => {
    const mockResult = {
      content: 'test content',
      filename: 'test.puml',
      mimeType: 'text/plain',
      extension: '.puml',
      stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
    };

    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockResult,
    });

    global.fetch = mockFetch;

    await useExportStore.getState().startExport({
      format: 'plantuml',
      lodLevel: 2,
      repositoryId: 'repo-123',
    });

    const state = useExportStore.getState();
    expect(state.status).toBe('success');
    expect(state.result).toEqual(mockResult);
    expect(state.progress).toBe(100);
    expect(state.error).toBeNull();
  });

  it('startExport calls correct endpoint for text formats', async () => {
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

    await useExportStore.getState().startExport({
      format: 'plantuml',
      lodLevel: 2,
      repositoryId: 'repo-123',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/export/plantuml',
      expect.objectContaining({
        method: 'POST',
      })
    );
  });

  it('startExport calls image endpoint for PNG/SVG', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        content: 'test',
        filename: 'test.png',
        mimeType: 'image/png',
        extension: '.png',
        stats: { nodeCount: 10, edgeCount: 5, duration: 100, size: 500 },
      }),
    });

    global.fetch = mockFetch;

    await useExportStore.getState().startExport({
      format: 'png',
      lodLevel: 2,
      repositoryId: 'repo-123',
    });

    expect(mockFetch).toHaveBeenCalledWith(
      '/api/export/image',
      expect.objectContaining({
        method: 'POST',
      })
    );

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body as string);
    expect(body.format).toBe('png');
  });

  it('startExport handles errors', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        detail: 'Export failed',
      }),
    });

    global.fetch = mockFetch;

    await useExportStore.getState().startExport({
      format: 'plantuml',
      lodLevel: 2,
      repositoryId: 'repo-123',
    });

    const state = useExportStore.getState();
    expect(state.status).toBe('error');
    expect(state.error).toBe('Export failed');
    expect(state.result).toBeNull();
  });

  it('startExport includes filters in request', async () => {
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

    const filters = {
      nodeTypes: ['class', 'interface'],
      maxLod: 3,
    };

    await useExportStore.getState().startExport({
      format: 'plantuml',
      lodLevel: 2,
      repositoryId: 'repo-123',
      filters,
    });

    const call = mockFetch.mock.calls[0];
    const body = JSON.parse(call[1].body as string);
    expect(body.filters).toEqual(filters);
  });
});

describe('EXPORT_FORMATS', () => {
  it('includes all required formats', () => {
    const formatIds = EXPORT_FORMATS.map((f) => f.id);

    expect(formatIds).toContain('plantuml');
    expect(formatIds).toContain('mermaid');
    expect(formatIds).toContain('drawio');
    expect(formatIds).toContain('gltf');
    expect(formatIds).toContain('png');
    expect(formatIds).toContain('svg');
  });

  it('has valid metadata for each format', () => {
    EXPORT_FORMATS.forEach((format) => {
      expect(format.id).toBeDefined();
      expect(format.name).toBeDefined();
      expect(format.description).toBeDefined();
      expect(format.extension).toBeDefined();
      expect(format.mimeType).toBeDefined();
      expect(format.category).toBeDefined();
      expect(typeof format.supportsPreview).toBe('boolean');
    });
  });
});

describe('getFormatInfo', () => {
  it('returns format info for valid format', () => {
    const info = getFormatInfo('plantuml');

    expect(info.id).toBe('plantuml');
    expect(info.name).toBe('PlantUML');
    expect(info.extension).toBe('.puml');
  });

  it('throws error for invalid format', () => {
    expect(() => getFormatInfo('invalid' as any)).toThrow('Unknown format: invalid');
  });
});
