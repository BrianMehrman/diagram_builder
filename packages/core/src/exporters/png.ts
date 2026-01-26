/**
 * PNG Exporter
 *
 * Exports IVM graphs to PNG (Portable Network Graphics) format.
 * Uses SVG rendering as intermediate step, then converts to PNG.
 * 
 * Note: For actual PNG rendering, this module provides hooks for puppeteer
 * or other headless browser solutions. Without a browser, it returns the
 * SVG as a data URL that can be rendered client-side.
 */

import type { IVMGraph } from '../ivm/types.js';
import type {
  Exporter,
  ExportResult,
} from './types.js';
import { SVGExporter, SVGExportOptions, DEFAULT_SVG_OPTIONS } from './svg.js';

// =============================================================================
// PNG-Specific Types
// =============================================================================

/**
 * PNG export options
 */
export interface PNGExportOptions extends SVGExportOptions {
  /** Image quality (0-100, only for JPEG fallback) */
  quality?: number;

  /** Device scale factor for retina displays */
  deviceScaleFactor?: number;

  /** Whether to use transparent background */
  transparent?: boolean;

  /** Custom renderer function (for dependency injection) */
  renderer?: PNGRenderer;
}

/**
 * PNG renderer interface for dependency injection
 * 
 * This allows users to provide their own renderer implementation
 * (e.g., puppeteer, playwright, canvas, etc.)
 */
export interface PNGRenderer {
  /**
   * Renders SVG content to PNG buffer
   * @param svg The SVG string to render
   * @param options Rendering options
   * @returns PNG buffer
   */
  render(svg: string, options: PNGRenderOptions): Promise<Buffer>;

  /**
   * Cleans up any resources used by the renderer
   */
  cleanup?(): Promise<void>;
}

/**
 * Options passed to the PNG renderer
 */
export interface PNGRenderOptions {
  width: number;
  height: number;
  deviceScaleFactor: number;
  transparent: boolean;
}

/**
 * Default PNG export options
 */
export const DEFAULT_PNG_OPTIONS: Required<Omit<PNGExportOptions, 'renderer'>> & { renderer?: PNGRenderer | undefined } = {
  ...DEFAULT_SVG_OPTIONS,
  quality: 100,
  deviceScaleFactor: 2,
  transparent: false,
};

// =============================================================================
// Built-in Renderers
// =============================================================================

/**
 * Data URL renderer - converts SVG to a base64 data URL
 * 
 * This is a fallback when no actual renderer is provided.
 * The SVG can be rendered client-side using this data URL.
 */
export class DataURLRenderer implements PNGRenderer {
  async render(svg: string, options: PNGRenderOptions): Promise<Buffer> {
    // Create an HTML document that renders the SVG
    const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { margin: 0; padding: 0; ${options.transparent ? '' : 'background: white;'} }
    svg { max-width: 100%; height: auto; }
  </style>
</head>
<body>
${svg}
</body>
</html>`;

    // Return as base64 encoded "PNG placeholder" with embedded SVG
    // The actual conversion would need to happen in a browser or canvas
    const svgBase64 = Buffer.from(svg).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${svgBase64}`;
    
    // Return a simple JSON structure that includes the data URL
    const wrapper = {
      type: 'svg-data-url',
      dataUrl,
      html,
      width: options.width,
      height: options.height,
      message: 'Use a PNGRenderer implementation (e.g., puppeteer) for actual PNG output',
    };

    return Buffer.from(JSON.stringify(wrapper));
  }
}

/**
 * Creates a Puppeteer-based PNG renderer
 * 
 * Note: This is a factory function that expects puppeteer to be passed in
 * to avoid adding it as a direct dependency.
 * 
 * @example
 * ```typescript
 * import puppeteer from 'puppeteer';
 * 
 * const renderer = createPuppeteerRenderer(puppeteer);
 * const exporter = new PNGExporter();
 * const result = await exporter.exportAsync(graph, { renderer });
 * ```
 */
export function createPuppeteerRenderer(puppeteer: PuppeteerModule): PNGRenderer {
  let browser: PuppeteerBrowser | null = null;

  return {
    async render(svg: string, options: PNGRenderOptions): Promise<Buffer> {
      if (!browser) {
        browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
      }

      const page = await browser.newPage();
      
      try {
        await page.setViewport({
          width: options.width,
          height: options.height,
          deviceScaleFactor: options.deviceScaleFactor,
        });

        // Set the SVG content
        const html = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      width: ${options.width}px; 
      height: ${options.height}px; 
      ${options.transparent ? '' : 'background: white;'}
    }
    svg { display: block; width: 100%; height: 100%; }
  </style>
</head>
<body>${svg}</body>
</html>`;

        await page.setContent(html, { waitUntil: 'networkidle0' });

        // Take screenshot
        const screenshot = await page.screenshot({
          type: 'png',
          omitBackground: options.transparent,
          clip: {
            x: 0,
            y: 0,
            width: options.width,
            height: options.height,
          },
        });

        return Buffer.from(screenshot);
      } finally {
        await page.close();
      }
    },

    async cleanup(): Promise<void> {
      if (browser) {
        await browser.close();
        browser = null;
      }
    },
  };
}

// Type definitions for puppeteer (to avoid direct dependency)
interface PuppeteerModule {
  launch(options: { headless: boolean; args: string[] }): Promise<PuppeteerBrowser>;
}

interface PuppeteerBrowser {
  newPage(): Promise<PuppeteerPage>;
  close(): Promise<void>;
}

interface PuppeteerPage {
  setViewport(options: { width: number; height: number; deviceScaleFactor: number }): Promise<void>;
  setContent(html: string, options?: { waitUntil: string }): Promise<void>;
  screenshot(options: { type: string; omitBackground: boolean; clip: { x: number; y: number; width: number; height: number } }): Promise<Uint8Array>;
  close(): Promise<void>;
}

// =============================================================================
// PNGExporter Class
// =============================================================================

/**
 * PNG image exporter
 * 
 * This exporter generates PNG images from IVM graphs.
 * It uses SVG as an intermediate format and then converts to PNG.
 * 
 * For synchronous export (the standard interface), it returns a placeholder
 * with the SVG data URL. For actual PNG rendering, use the async methods
 * with a provided renderer.
 */
export class PNGExporter implements Exporter<PNGExportOptions> {
  readonly id = 'png';
  readonly name = 'PNG Image';
  readonly extension = 'png';
  readonly mimeType = 'image/png';

  private svgExporter: SVGExporter;
  private defaultRenderer: PNGRenderer;

  constructor() {
    this.svgExporter = new SVGExporter();
    this.defaultRenderer = new DataURLRenderer();
  }

  /**
   * Exports an IVM graph to PNG format (synchronous, returns SVG data URL)
   * 
   * Note: For actual PNG output, use exportAsync with a renderer.
   */
  export(graph: IVMGraph, options?: PNGExportOptions): ExportResult {
    const startTime = Date.now();
    const opts = { ...DEFAULT_PNG_OPTIONS, ...options };

    // Generate SVG first
    const svgResult = this.svgExporter.export(graph, opts);

    // For sync export, return SVG wrapped in a data URL
    const svgBase64 = Buffer.from(svgResult.content).toString('base64');
    const content = `data:image/svg+xml;base64,${svgBase64}`;

    const duration = Date.now() - startTime;

    return {
      content,
      mimeType: 'text/plain', // Data URL is text
      extension: 'txt',
      stats: {
        nodeCount: svgResult.stats.nodeCount,
        edgeCount: svgResult.stats.edgeCount,
        duration,
        size: content.length,
      },
    };
  }

  /**
   * Exports an IVM graph to actual PNG format (asynchronous)
   * 
   * @param graph The graph to export
   * @param options Export options (must include renderer for real PNG output)
   * @returns Promise resolving to export result with PNG buffer
   */
  async exportAsync(graph: IVMGraph, options?: PNGExportOptions): Promise<ExportResult> {
    const startTime = Date.now();
    const opts = { ...DEFAULT_PNG_OPTIONS, ...options };
    const renderer = opts.renderer ?? this.defaultRenderer;

    // Generate SVG first
    const svgResult = this.svgExporter.export(graph, opts);

    // Render to PNG
    const svgContent = typeof svgResult.content === 'string'
      ? svgResult.content
      : svgResult.content.toString('utf-8');
    const pngBuffer = await renderer.render(svgContent, {
      width: opts.width,
      height: opts.height,
      deviceScaleFactor: opts.deviceScaleFactor,
      transparent: opts.transparent,
    });

    const duration = Date.now() - startTime;

    // Check if this is actual PNG or a data URL wrapper
    const isPNG = pngBuffer[0] === 0x89 && pngBuffer[1] === 0x50; // PNG magic bytes
    
    return {
      content: isPNG ? pngBuffer.toString('base64') : pngBuffer.toString('utf-8'),
      mimeType: isPNG ? this.mimeType : 'application/json',
      extension: isPNG ? this.extension : 'json',
      stats: {
        nodeCount: svgResult.stats.nodeCount,
        edgeCount: svgResult.stats.edgeCount,
        duration,
        size: pngBuffer.length,
      },
    };
  }

  /**
   * Validates export options
   */
  validateOptions(options?: PNGExportOptions): string[] {
    const errors = this.svgExporter.validateOptions(options);

    if (options) {
      if (options.quality !== undefined && (options.quality < 0 || options.quality > 100)) {
        errors.push('quality must be between 0 and 100');
      }

      if (options.deviceScaleFactor !== undefined && options.deviceScaleFactor < 0.1) {
        errors.push('deviceScaleFactor must be at least 0.1');
      }
    }

    return errors;
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

/**
 * Creates a new PNGExporter instance
 */
export function createPNGExporter(): PNGExporter {
  return new PNGExporter();
}

/**
 * Convenience function to export a graph to PNG format (sync, returns data URL)
 */
export function exportToPNG(graph: IVMGraph, options?: PNGExportOptions): ExportResult {
  const exporter = new PNGExporter();
  return exporter.export(graph, options);
}

/**
 * Convenience function to export a graph to actual PNG format (async)
 */
export async function exportToPNGAsync(
  graph: IVMGraph,
  options?: PNGExportOptions
): Promise<ExportResult> {
  const exporter = new PNGExporter();
  return exporter.exportAsync(graph, options);
}
