/**
 * Export Store
 *
 * State management for graph export functionality
 */

import { create } from 'zustand';
import type {
  ExportFormat,
  ExportFormatInfo,
  ExportOptions,
  ExportResult,
  ExportState,
} from './types';

/**
 * Available export formats with metadata
 */
export const EXPORT_FORMATS: ExportFormatInfo[] = [
  {
    id: 'plantuml',
    name: 'PlantUML',
    description: 'Class diagrams in PlantUML format',
    extension: '.puml',
    mimeType: 'text/plain',
    category: 'text',
    supportsPreview: true,
  },
  {
    id: 'mermaid',
    name: 'Mermaid',
    description: 'Flowcharts in Mermaid format',
    extension: '.md',
    mimeType: 'text/markdown',
    category: 'text',
    supportsPreview: true,
  },
  {
    id: 'drawio',
    name: 'Draw.io',
    description: 'Diagrams in Draw.io XML format',
    extension: '.drawio',
    mimeType: 'application/xml',
    category: 'text',
    supportsPreview: true,
  },
  {
    id: 'gltf',
    name: 'GLTF',
    description: '3D graph visualization',
    extension: '.gltf',
    mimeType: 'model/gltf+json',
    category: '3d',
    supportsPreview: false,
  },
  {
    id: 'png',
    name: 'PNG',
    description: 'Raster image export',
    extension: '.png',
    mimeType: 'image/png',
    category: 'image',
    supportsPreview: true,
  },
  {
    id: 'svg',
    name: 'SVG',
    description: 'Vector graphics export',
    extension: '.svg',
    mimeType: 'image/svg+xml',
    category: 'image',
    supportsPreview: true,
  },
];

interface ExportStoreState extends ExportState {
  selectedFormat: ExportFormat;
  selectedLodLevel: number;
  selectedRepositoryId: string | null;

  // Actions
  setFormat: (format: ExportFormat) => void;
  setLodLevel: (level: number) => void;
  setRepositoryId: (id: string | null) => void;
  startExport: (options: ExportOptions) => Promise<void>;
  clearResult: () => void;
  reset: () => void;
}

const INITIAL_STATE: ExportState = {
  status: 'idle',
  result: null,
  error: null,
  progress: 0,
};

/**
 * Export store
 */
export const useExportStore = create<ExportStoreState>((set) => ({
  ...INITIAL_STATE,
  selectedFormat: 'plantuml',
  selectedLodLevel: 2,
  selectedRepositoryId: null,

  setFormat: (format: ExportFormat) => {
    set({ selectedFormat: format });
  },

  setLodLevel: (level: number) => {
    set({ selectedLodLevel: level });
  },

  setRepositoryId: (id: string | null) => {
    set({ selectedRepositoryId: id });
  },

  startExport: async (options: ExportOptions) => {
    set({
      status: 'exporting',
      error: null,
      progress: 0,
    });

    try {
      const { format, lodLevel, repositoryId, filters, formatOptions } = options;

      // Determine API endpoint based on format
      const endpoint =
        format === 'png' || format === 'svg'
          ? '/api/export/image'
          : `/api/export/${format}`;

      // Build request body
      const body: Record<string, unknown> = {
        repoId: repositoryId,
        lodLevel,
        ...(filters && { filters }),
        ...(formatOptions && { options: formatOptions }),
      };

      // Add format for image endpoint
      if (format === 'png' || format === 'svg') {
        body.format = format;
      }

      set({ progress: 50 });

      // Make API request
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Export failed');
      }

      const result: ExportResult = await response.json();

      set({
        status: 'success',
        result,
        progress: 100,
      });
    } catch (error) {
      set({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: 0,
      });
    }
  },

  clearResult: () => {
    set({
      status: 'idle',
      result: null,
      error: null,
      progress: 0,
    });
  },

  reset: () => {
    set({
      ...INITIAL_STATE,
      selectedFormat: 'plantuml',
      selectedLodLevel: 2,
      selectedRepositoryId: null,
    });
  },
}));

/**
 * Get format info by ID
 */
export function getFormatInfo(format: ExportFormat): ExportFormatInfo {
  const info = EXPORT_FORMATS.find((f) => f.id === format);
  if (!info) {
    throw new Error(`Unknown format: ${format}`);
  }
  return info;
}
