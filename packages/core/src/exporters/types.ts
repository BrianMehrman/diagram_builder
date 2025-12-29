/**
 * Exporter Type Definitions
 *
 * Common types and interfaces for all export pipelines.
 */

import type { IVMGraph, LODLevel, NodeType, EdgeType } from '../ivm/types.js';

// =============================================================================
// Export Configuration Types
// =============================================================================

/**
 * Base export options shared by all exporters
 */
export interface BaseExportOptions {
  /** Title for the diagram */
  title?: string;

  /** LOD level to export (filters nodes/edges) */
  lodLevel?: LODLevel;

  /** Whether to include a legend */
  includeLegend?: boolean;

  /** Whether to include metadata comments */
  includeMetadata?: boolean;

  /** Custom styling overrides */
  styling?: ExportStyling;
}

/**
 * Color scheme for exports
 */
export interface ColorScheme {
  /** Colors by node type */
  nodeColors: Partial<Record<NodeType, string>>;

  /** Colors by edge type */
  edgeColors: Partial<Record<EdgeType, string>>;

  /** Background color */
  background?: string;

  /** Text color */
  text?: string;

  /** Border color */
  border?: string;
}

/**
 * Export styling configuration
 */
export interface ExportStyling {
  /** Color scheme */
  colors?: ColorScheme;

  /** Font family */
  fontFamily?: string;

  /** Font size in points */
  fontSize?: number;

  /** Whether to use shadows */
  shadows?: boolean;

  /** Whether to use rounded corners */
  rounded?: boolean;

  /** Line thickness */
  lineWidth?: number;
}

/**
 * Result of an export operation
 */
export interface ExportResult {
  /** The exported content (string for text formats, Buffer for binary) */
  content: string | Buffer;

  /** MIME type of the exported content */
  mimeType: string;

  /** Suggested file extension */
  extension: string;

  /** Export statistics */
  stats: ExportStats;
}

/**
 * Export statistics
 */
export interface ExportStats {
  /** Number of nodes exported */
  nodeCount: number;

  /** Number of edges exported */
  edgeCount: number;

  /** Time taken to export in milliseconds */
  duration: number;

  /** Size of output in bytes */
  size: number;
}

// =============================================================================
// Exporter Interface
// =============================================================================

/**
 * Interface for all exporters
 */
export interface Exporter<TOptions extends BaseExportOptions = BaseExportOptions> {
  /** Unique identifier for the exporter */
  readonly id: string;

  /** Human-readable name */
  readonly name: string;

  /** Supported file extension */
  readonly extension: string;

  /** MIME type */
  readonly mimeType: string;

  /**
   * Exports an IVM graph to the target format
   */
  export(graph: IVMGraph, options?: TOptions): ExportResult;

  /**
   * Validates export options
   */
  validateOptions(options?: TOptions): string[];
}

// =============================================================================
// Default Color Schemes
// =============================================================================

/**
 * Default color scheme for exports
 */
export const DEFAULT_COLOR_SCHEME: ColorScheme = {
  nodeColors: {
    repository: '#2E86AB',
    package: '#A23B72',
    namespace: '#A23B72',
    directory: '#F18F01',
    module: '#F18F01',
    file: '#C73E1D',
    class: '#3B1F2B',
    interface: '#6B4C9A',
    function: '#44AF69',
    method: '#44AF69',
    variable: '#FCCA46',
    type: '#6B4C9A',
    enum: '#6B4C9A',
  },
  edgeColors: {
    imports: '#666666',
    exports: '#666666',
    extends: '#2E86AB',
    implements: '#6B4C9A',
    calls: '#44AF69',
    uses: '#999999',
    contains: '#CCCCCC',
    depends_on: '#666666',
    type_of: '#6B4C9A',
    returns: '#44AF69',
    parameter_of: '#FCCA46',
  },
  background: '#FFFFFF',
  text: '#333333',
  border: '#CCCCCC',
};

/**
 * Dark color scheme
 */
export const DARK_COLOR_SCHEME: ColorScheme = {
  nodeColors: {
    repository: '#5DADE2',
    package: '#F1948A',
    namespace: '#F1948A',
    directory: '#F9E79F',
    module: '#F9E79F',
    file: '#F5B7B1',
    class: '#D7BDE2',
    interface: '#BB8FCE',
    function: '#82E0AA',
    method: '#82E0AA',
    variable: '#F7DC6F',
    type: '#BB8FCE',
    enum: '#BB8FCE',
  },
  edgeColors: {
    imports: '#AAAAAA',
    exports: '#AAAAAA',
    extends: '#5DADE2',
    implements: '#BB8FCE',
    calls: '#82E0AA',
    uses: '#CCCCCC',
    contains: '#666666',
    depends_on: '#AAAAAA',
    type_of: '#BB8FCE',
    returns: '#82E0AA',
    parameter_of: '#F7DC6F',
  },
  background: '#1E1E1E',
  text: '#EEEEEE',
  border: '#444444',
};

/**
 * Default export styling
 */
export const DEFAULT_EXPORT_STYLING: ExportStyling = {
  colors: DEFAULT_COLOR_SCHEME,
  fontFamily: 'Arial',
  fontSize: 12,
  shadows: true,
  rounded: true,
  lineWidth: 1,
};
