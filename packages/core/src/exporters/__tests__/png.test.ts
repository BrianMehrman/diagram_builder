/**
 * PNG Exporter Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { IVMGraph, IVMNode, IVMEdge, NodeType, EdgeType } from '../../ivm/types.js';
import {
  PNGExporter,
  createPNGExporter,
  exportToPNG,
  exportToPNGAsync,
  PNGExportOptions,
  DEFAULT_PNG_OPTIONS,
  PNGRenderer,
  PNGRenderOptions,
  DataURLRenderer,
  createPuppeteerRenderer,
} from '../png.js';

// =============================================================================
// Test Fixtures
// =============================================================================

function createTestNode(
  id: string,
  type: NodeType,
  label: string,
  lod: number = 3,
  options: Partial<IVMNode> = {}
): IVMNode {
  return {
    id,
    type,
    lod,
    position: options.position ?? { x: 0, y: 0, z: 0 },
    style: options.style ?? { color: '#FFFFFF', size: 1 },
    metadata: {
      label,
      description: options.metadata?.description ?? '',
      source: options.metadata?.source ?? { file: 'test.ts', line: 1 },
    },
  };
}

function createTestEdge(
  source: string,
  target: string,
  type: EdgeType,
  options: Partial<IVMEdge> = {}
): IVMEdge {
  return {
    source,
    target,
    type,
    weight: options.weight ?? 1,
    metadata: options.metadata ?? { label: '', bidirectional: false },
    style: options.style,
  };
}

function createTestGraph(
  nodes: IVMNode[] = [],
  edges: IVMEdge[] = []
): IVMGraph {
  return {
    nodes,
    edges,
    metadata: {
      name: 'test-graph',
      version: '1.0.0',
      generatedAt: new Date().toISOString(),
      sourceInfo: {
        type: 'repository',
        path: '/test/repo',
        languages: ['typescript'],
      },
    },
    bounds: {
      min: { x: -100, y: -100, z: -100 },
      max: { x: 100, y: 100, z: 100 },
    },
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType: {},
      edgesByType: {},
      maxDepth: 1,
    },
  };
}

// =============================================================================
// Mock Renderer
// =============================================================================

function createMockRenderer(): PNGRenderer {
  // PNG magic bytes + minimal valid PNG header
  const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  return {
    render: vi.fn().mockResolvedValue(pngMagic),
    cleanup: vi.fn().mockResolvedValue(undefined),
  };
}

// =============================================================================
// Exporter Instance Tests
// =============================================================================

describe('PNGExporter', () => {
  let exporter: PNGExporter;

  beforeEach(() => {
    exporter = new PNGExporter();
  });

  describe('properties', () => {
    it('should have correct id', () => {
      expect(exporter.id).toBe('png');
    });

    it('should have correct name', () => {
      expect(exporter.name).toBe('PNG Image');
    });

    it('should have correct extension', () => {
      expect(exporter.extension).toBe('png');
    });

    it('should have correct mimeType', () => {
      expect(exporter.mimeType).toBe('image/png');
    });
  });

  describe('validateOptions', () => {
    it('should return no errors for valid options', () => {
      const options: PNGExportOptions = {
        lodLevel: 3,
        width: 800,
        height: 600,
        quality: 90,
        deviceScaleFactor: 2,
      };
      const errors = exporter.validateOptions(options);
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for undefined options', () => {
      const errors = exporter.validateOptions(undefined);
      expect(errors).toHaveLength(0);
    });

    it('should validate quality range', () => {
      expect(exporter.validateOptions({ quality: -1 })).toContain(
        'quality must be between 0 and 100'
      );
      expect(exporter.validateOptions({ quality: 101 })).toContain(
        'quality must be between 0 and 100'
      );
    });

    it('should validate deviceScaleFactor minimum', () => {
      expect(exporter.validateOptions({ deviceScaleFactor: 0.05 })).toContain(
        'deviceScaleFactor must be at least 0.1'
      );
    });

    it('should inherit SVG option validation', () => {
      expect(exporter.validateOptions({ lodLevel: 10 })).toContain(
        'lodLevel must be between 0 and 5'
      );
      expect(exporter.validateOptions({ width: 50 })).toContain(
        'width must be at least 100'
      );
    });

    it('should accumulate multiple errors', () => {
      const errors = exporter.validateOptions({
        quality: -1,
        deviceScaleFactor: 0,
        lodLevel: 10,
      });
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });
  });
});

// =============================================================================
// Synchronous Export Tests
// =============================================================================

describe('PNG synchronous export', () => {
  let exporter: PNGExporter;

  beforeEach(() => {
    exporter = new PNGExporter();
  });

  describe('empty graph', () => {
    it('should export empty graph as data URL', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.content).toContain('data:image/svg+xml;base64,');
      expect(result.mimeType).toBe('text/plain');
      expect(result.extension).toBe('txt');
    });

    it('should have correct stats for empty graph', () => {
      const graph = createTestGraph();
      const result = exporter.export(graph);

      expect(result.stats.nodeCount).toBe(0);
      expect(result.stats.edgeCount).toBe(0);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.size).toBeGreaterThan(0);
    });
  });

  describe('graph with nodes', () => {
    it('should export graph as data URL', () => {
      const nodes = [
        createTestNode('node-1', 'class', 'MyClass'),
        createTestNode('node-2', 'interface', 'MyInterface'),
      ];
      const graph = createTestGraph(nodes);
      const result = exporter.export(graph);

      expect(result.content).toContain('data:image/svg+xml;base64,');
      expect(result.stats.nodeCount).toBe(2);
    });

    it('should decode to valid SVG', () => {
      const node = createTestNode('node-1', 'class', 'TestClass');
      const graph = createTestGraph([node]);
      const result = exporter.export(graph);

      // Extract base64 content and decode
      const base64 = result.content.replace('data:image/svg+xml;base64,', '');
      const svg = Buffer.from(base64, 'base64').toString('utf-8');

      expect(svg).toContain('<?xml');
      expect(svg).toContain('<svg');
      expect(svg).toContain('TestClass');
    });
  });
});

// =============================================================================
// Asynchronous Export Tests
// =============================================================================

describe('PNG asynchronous export', () => {
  let exporter: PNGExporter;

  beforeEach(() => {
    exporter = new PNGExporter();
  });

  describe('with mock renderer', () => {
    it('should call renderer with correct options', async () => {
      const mockRenderer = createMockRenderer();
      const graph = createTestGraph();
      const options: PNGExportOptions = {
        width: 1024,
        height: 768,
        deviceScaleFactor: 3,
        transparent: true,
        renderer: mockRenderer,
      };

      await exporter.exportAsync(graph, options);

      expect(mockRenderer.render).toHaveBeenCalledTimes(1);
      expect(mockRenderer.render).toHaveBeenCalledWith(
        expect.stringContaining('<svg'),
        expect.objectContaining({
          width: 1024,
          height: 768,
          deviceScaleFactor: 3,
          transparent: true,
        })
      );
    });

    it('should return PNG result when renderer returns PNG bytes', async () => {
      const mockRenderer = createMockRenderer();
      const graph = createTestGraph();
      const result = await exporter.exportAsync(graph, { renderer: mockRenderer });

      expect(result.mimeType).toBe('image/png');
      expect(result.extension).toBe('png');
    });

    it('should have correct stats', async () => {
      const mockRenderer = createMockRenderer();
      const nodes = [
        createTestNode('node-1', 'class', 'ClassA'),
        createTestNode('node-2', 'class', 'ClassB'),
      ];
      const edges = [createTestEdge('node-1', 'node-2', 'extends')];
      const graph = createTestGraph(nodes, edges);
      const result = await exporter.exportAsync(graph, { renderer: mockRenderer });

      expect(result.stats.nodeCount).toBe(2);
      expect(result.stats.edgeCount).toBe(1);
      expect(result.stats.duration).toBeGreaterThanOrEqual(0);
      expect(result.stats.size).toBeGreaterThan(0);
    });
  });

  describe('without renderer (default DataURLRenderer)', () => {
    it('should use default DataURLRenderer', async () => {
      const graph = createTestGraph();
      const result = await exporter.exportAsync(graph);

      expect(result.mimeType).toBe('application/json');
      expect(result.extension).toBe('json');
    });

    it('should return JSON with data URL info', async () => {
      const graph = createTestGraph();
      const result = await exporter.exportAsync(graph);

      const parsed = JSON.parse(result.content);
      expect(parsed.type).toBe('svg-data-url');
      expect(parsed.dataUrl).toContain('data:image/svg+xml;base64,');
      expect(parsed.html).toContain('<body>');
    });
  });
});

// =============================================================================
// DataURLRenderer Tests
// =============================================================================

describe('DataURLRenderer', () => {
  let renderer: DataURLRenderer;

  beforeEach(() => {
    renderer = new DataURLRenderer();
  });

  it('should render SVG to data URL JSON', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><rect/></svg>';
    const options: PNGRenderOptions = {
      width: 800,
      height: 600,
      deviceScaleFactor: 2,
      transparent: false,
    };

    const result = await renderer.render(svg, options);
    const parsed = JSON.parse(result.toString());

    expect(parsed.type).toBe('svg-data-url');
    expect(parsed.dataUrl).toContain('base64');
    expect(parsed.width).toBe(800);
    expect(parsed.height).toBe(600);
  });

  it('should include HTML wrapper', async () => {
    const svg = '<svg><circle/></svg>';
    const result = await renderer.render(svg, {
      width: 100,
      height: 100,
      deviceScaleFactor: 1,
      transparent: false,
    });

    const parsed = JSON.parse(result.toString());
    expect(parsed.html).toContain('<!DOCTYPE html>');
    expect(parsed.html).toContain(svg);
  });

  it('should handle transparent background option', async () => {
    const svg = '<svg></svg>';
    const result = await renderer.render(svg, {
      width: 100,
      height: 100,
      deviceScaleFactor: 1,
      transparent: true,
    });

    const parsed = JSON.parse(result.toString());
    expect(parsed.html).not.toContain('background: white');
  });
});

// =============================================================================
// createPuppeteerRenderer Tests
// =============================================================================

describe('createPuppeteerRenderer', () => {
  it('should create a renderer with render method', () => {
    const mockPuppeteer = {
      launch: vi.fn(),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);

    expect(renderer).toHaveProperty('render');
    expect(typeof renderer.render).toBe('function');
  });

  it('should create a renderer with cleanup method', () => {
    const mockPuppeteer = {
      launch: vi.fn(),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);

    expect(renderer).toHaveProperty('cleanup');
    expect(typeof renderer.cleanup).toBe('function');
  });

  it('should launch browser on first render', async () => {
    const mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50, 0x4E, 0x47])),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockPuppeteer = {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);
    await renderer.render('<svg></svg>', {
      width: 100,
      height: 100,
      deviceScaleFactor: 1,
      transparent: false,
    });

    expect(mockPuppeteer.launch).toHaveBeenCalledTimes(1);
    expect(mockPuppeteer.launch).toHaveBeenCalledWith(
      expect.objectContaining({
        headless: true,
      })
    );
  });

  it('should reuse browser for subsequent renders', async () => {
    const mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50])),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockPuppeteer = {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);
    await renderer.render('<svg></svg>', { width: 100, height: 100, deviceScaleFactor: 1, transparent: false });
    await renderer.render('<svg></svg>', { width: 100, height: 100, deviceScaleFactor: 1, transparent: false });

    expect(mockPuppeteer.launch).toHaveBeenCalledTimes(1);
    expect(mockBrowser.newPage).toHaveBeenCalledTimes(2);
  });

  it('should close browser on cleanup', async () => {
    const mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50])),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockPuppeteer = {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);
    await renderer.render('<svg></svg>', { width: 100, height: 100, deviceScaleFactor: 1, transparent: false });
    await renderer.cleanup!();

    expect(mockBrowser.close).toHaveBeenCalledTimes(1);
  });

  it('should set viewport with correct options', async () => {
    const mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50])),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockPuppeteer = {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);
    await renderer.render('<svg></svg>', {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 3,
      transparent: false,
    });

    expect(mockPage.setViewport).toHaveBeenCalledWith({
      width: 1920,
      height: 1080,
      deviceScaleFactor: 3,
    });
  });

  it('should take screenshot with transparency option', async () => {
    const mockPage = {
      setViewport: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
      screenshot: vi.fn().mockResolvedValue(new Uint8Array([0x89, 0x50])),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockBrowser = {
      newPage: vi.fn().mockResolvedValue(mockPage),
      close: vi.fn().mockResolvedValue(undefined),
    };

    const mockPuppeteer = {
      launch: vi.fn().mockResolvedValue(mockBrowser),
    };

    const renderer = createPuppeteerRenderer(mockPuppeteer as any);
    await renderer.render('<svg></svg>', {
      width: 100,
      height: 100,
      deviceScaleFactor: 1,
      transparent: true,
    });

    expect(mockPage.screenshot).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'png',
        omitBackground: true,
      })
    );
  });
});

// =============================================================================
// Factory Function Tests
// =============================================================================

describe('createPNGExporter', () => {
  it('should create a PNGExporter instance', () => {
    const exporter = createPNGExporter();
    expect(exporter).toBeInstanceOf(PNGExporter);
  });
});

describe('exportToPNG', () => {
  it('should export graph using convenience function', () => {
    const graph = createTestGraph();
    const result = exportToPNG(graph);

    expect(result.content).toContain('data:image/svg+xml;base64,');
    expect(result.mimeType).toBe('text/plain');
  });

  it('should accept options', () => {
    const graph = createTestGraph();
    const result = exportToPNG(graph, { width: 1920 });

    // The SVG embedded should have the width
    const base64 = result.content.replace('data:image/svg+xml;base64,', '');
    const svg = Buffer.from(base64, 'base64').toString('utf-8');
    expect(svg).toContain('width="1920"');
  });
});

describe('exportToPNGAsync', () => {
  it('should export graph using async convenience function', async () => {
    const graph = createTestGraph();
    const result = await exportToPNGAsync(graph);

    // Without renderer, returns JSON
    expect(result.mimeType).toBe('application/json');
  });

  it('should use provided renderer', async () => {
    const mockRenderer = createMockRenderer();
    const graph = createTestGraph();
    const result = await exportToPNGAsync(graph, { renderer: mockRenderer });

    expect(mockRenderer.render).toHaveBeenCalled();
    expect(result.mimeType).toBe('image/png');
  });
});

// =============================================================================
// Default Options Tests
// =============================================================================

describe('DEFAULT_PNG_OPTIONS', () => {
  it('should have quality of 100', () => {
    expect(DEFAULT_PNG_OPTIONS.quality).toBe(100);
  });

  it('should have deviceScaleFactor of 2', () => {
    expect(DEFAULT_PNG_OPTIONS.deviceScaleFactor).toBe(2);
  });

  it('should have transparent as false', () => {
    expect(DEFAULT_PNG_OPTIONS.transparent).toBe(false);
  });

  it('should not have a default renderer', () => {
    expect(DEFAULT_PNG_OPTIONS.renderer).toBeUndefined();
  });

  it('should inherit SVG defaults', () => {
    expect(DEFAULT_PNG_OPTIONS.width).toBeGreaterThan(0);
    expect(DEFAULT_PNG_OPTIONS.height).toBeGreaterThan(0);
    expect(DEFAULT_PNG_OPTIONS.showLabels).toBe(true);
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('PNG export integration', () => {
  it('should maintain graph data through export pipeline', async () => {
    const nodes = [
      createTestNode('class-1', 'class', 'UserService'),
      createTestNode('class-2', 'class', 'UserRepository'),
      createTestNode('iface-1', 'interface', 'IUserRepository'),
    ];
    const edges = [
      createTestEdge('class-1', 'class-2', 'uses'),
      createTestEdge('class-2', 'iface-1', 'implements'),
    ];
    const graph = createTestGraph(nodes, edges);

    const exporter = new PNGExporter();
    const result = await exporter.exportAsync(graph);

    expect(result.stats.nodeCount).toBe(3);
    expect(result.stats.edgeCount).toBe(2);
  });

  it('should apply LOD filtering', async () => {
    const nodes = [
      createTestNode('pkg-1', 'package', 'my-package', 1),
      createTestNode('class-1', 'class', 'MyClass', 3),
      createTestNode('method-1', 'method', 'myMethod', 5),
    ];
    const graph = createTestGraph(nodes);

    const exporter = new PNGExporter();
    const result = await exporter.exportAsync(graph, { lodLevel: 2 });

    // Only package should be visible at LOD 2
    expect(result.stats.nodeCount).toBe(1);
  });
});
