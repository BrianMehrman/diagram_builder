/**
 * Export Feature Types
 */

/**
 * Supported export formats
 */
export type ExportFormat =
  | 'plantuml'
  | 'mermaid'
  | 'drawio'
  | 'gltf'
  | 'png'
  | 'svg';

/**
 * Export format metadata
 */
export interface ExportFormatInfo {
  id: ExportFormat;
  name: string;
  description: string;
  extension: string;
  mimeType: string;
  category: 'text' | 'image' | '3d';
  supportsPreview: boolean;
}

/**
 * Export options for a specific format
 */
export interface ExportOptions {
  format: ExportFormat;
  lodLevel: number;
  repositoryId: string;
  filename?: string;
  filters?: GraphFilters;
  formatOptions?: Record<string, unknown>;
}

/**
 * Graph filters for export
 */
export interface GraphFilters {
  nodeTypes?: string[];
  edgeTypes?: string[];
  maxLod?: number;
  pathPattern?: string;
  languages?: string[];
  visibleNodes?: string[];
  hiddenNodes?: string[];
}

/**
 * Export result from API
 */
export interface ExportResult {
  content: string | Buffer;
  mimeType: string;
  extension: string;
  filename: string;
  stats: {
    nodeCount: number;
    edgeCount: number;
    duration: number;
    size: number;
  };
}

/**
 * Export status
 */
export type ExportStatus = 'idle' | 'exporting' | 'success' | 'error';

/**
 * Export state
 */
export interface ExportState {
  status: ExportStatus;
  result: ExportResult | null;
  error: string | null;
  progress: number;
}
