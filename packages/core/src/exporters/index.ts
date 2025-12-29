/**
 * Exporters module
 *
 * Re-exports all exporter functionality.
 */

// Base types
export type {
  BaseExportOptions,
  ColorScheme,
  ExportStyling,
  ExportResult,
  ExportStats,
  Exporter,
} from './types.js';

export {
  DEFAULT_COLOR_SCHEME,
  DARK_COLOR_SCHEME,
  DEFAULT_EXPORT_STYLING,
} from './types.js';

// PlantUML exporter
export type { PlantUMLExportOptions, PlantUMLDiagramType } from './plantuml.js';

export {
  PlantUMLExporter,
  createPlantUMLExporter,
  exportToPlantUML,
  DEFAULT_PLANTUML_OPTIONS,
} from './plantuml.js';

// Mermaid exporter
export type { MermaidExportOptions, MermaidDiagramType, FlowchartDirection } from './mermaid.js';

export {
  MermaidExporter,
  createMermaidExporter,
  exportToMermaid,
  DEFAULT_MERMAID_OPTIONS,
} from './mermaid.js';

// Draw.io exporter
export type { DrawioExportOptions, DrawioShape } from './drawio.js';

export {
  DrawioExporter,
  createDrawioExporter,
  exportToDrawio,
  DEFAULT_DRAWIO_OPTIONS,
} from './drawio.js';

// GLTF exporter
export type { GLTFExportOptions, GLTFNodeShape } from './gltf.js';

export {
  GLTFExporter,
  createGLTFExporter,
  exportToGLTF,
  DEFAULT_GLTF_OPTIONS,
} from './gltf.js';

// SVG exporter
export type { SVGExportOptions, SVGNodeShape } from './svg.js';

export {
  SVGExporter,
  createSVGExporter,
  exportToSVG,
  DEFAULT_SVG_OPTIONS,
} from './svg.js';

// PNG exporter
export type {
  PNGExportOptions,
  PNGRenderer,
  PNGRenderOptions,
} from './png.js';

export {
  PNGExporter,
  createPNGExporter,
  exportToPNG,
  exportToPNGAsync,
  DEFAULT_PNG_OPTIONS,
  DataURLRenderer,
  createPuppeteerRenderer,
} from './png.js';
