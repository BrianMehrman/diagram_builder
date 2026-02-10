/**
 * API Types
 *
 * Shared types for API requests and responses
 */

/**
 * RFC 7807 Problem Details for HTTP APIs
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail?: string;
  instance?: string;
  [key: string]: unknown;
}

/**
 * Authentication token payload
 */
export interface AuthToken {
  token: string;
  expiresAt: string;
}

/**
 * API error response
 */
export interface ApiError extends ProblemDetails {
  code?: string;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/**
 * Workspace API request/response types
 */
export interface ApiWorkspaceSettings {
  defaultLodLevel?: number;
  autoRefresh?: boolean;
  collaborationEnabled?: boolean;
}

export interface CreateWorkspaceRequest {
  name: string;
  description?: string;
  settings?: ApiWorkspaceSettings;
}

export interface UpdateWorkspaceRequest {
  name?: string;
  description?: string;
  settings?: ApiWorkspaceSettings;
}

/**
 * Codebase types
 */
export type CodebaseStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CodebaseType = 'local' | 'git';
export type ImportStage = 'cloning' | 'parsing' | 'graph-building' | 'storing';

/**
 * Import progress information
 */
export interface ImportProgress {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current stage of import */
  stage: ImportStage;
  /** Human-readable stage message */
  message: string;
  /** Number of files processed (optional) */
  filesProcessed?: number;
  /** Total files to process (optional) */
  totalFiles?: number;
}

export interface Codebase {
  codebaseId: string;
  workspaceId: string;
  source: string;
  type: CodebaseType;
  branch?: string;
  status: CodebaseStatus;
  error?: string;
  repositoryId?: string;
  importedAt: string;
  /** Import progress (when processing) */
  progress?: ImportProgress;
}

export interface CreateCodebaseRequest {
  source: string;
  type: CodebaseType;
  branch?: string;
  credentials?: {
    type: 'oauth' | 'ssh';
    token?: string;
    sshKeyPath?: string;
  };
}

export interface CodebasesListResponse {
  count: number;
  codebases: Codebase[];
}

/**
 * Viewpoint API types
 */
export interface ApiCameraState {
  position: { x: number; y: number; z: number };
  target: { x: number; y: number; z: number };
  zoom: number;
}

export interface ApiViewpointFilters {
  lodLevel?: number;
  nodeTypes?: string[];
  searchQuery?: string;
}

export interface CreateViewpointRequest {
  name: string;
  description?: string;
  workspaceId: string;
  camera: ApiCameraState;
  filters?: ApiViewpointFilters;
}

export interface UpdateViewpointRequest {
  name?: string;
  description?: string;
  camera?: ApiCameraState;
  filters?: ApiViewpointFilters;
}

/**
 * Graph/Parse types
 */
export interface ParseRequest {
  source: string;
  type: 'local' | 'git';
  branch?: string;
  token?: string;
}

export interface ParseResponse {
  jobId: string;
  status: string;
}

export interface GraphQueryRequest {
  repositoryId: string;
  query?: string;
  filters?: {
    nodeTypes?: string[];
    lodLevel?: number;
  };
}

export interface GraphQueryResponse {
  nodes: ApiGraphNode[];
  edges: ApiGraphEdge[];
}

export interface ApiGraphNode {
  id: string;
  type: string;
  label: string;
  position: { x: number; y: number; z: number };
  metadata?: Record<string, unknown>;

  // City-to-cell layout fields (Epic 8)
  depth?: number;
  isExternal?: boolean;
  parentId?: string;

  // Shape metadata fields (Epic 9-B)
  methodCount?: number;
  isAbstract?: boolean;
  hasNestedTypes?: boolean;

  // Sign metadata fields (Epic 9-C)
  visibility?: 'public' | 'protected' | 'private' | 'static';
  isDeprecated?: boolean;
  isExported?: boolean;
}

export interface ApiGraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  metadata?: Record<string, unknown>;
}

/**
 * Export types
 */
export interface ExportRequest {
  repositoryId: string;
  format: 'plantuml' | 'mermaid' | 'gltf' | 'json';
  options?: {
    includeMetadata?: boolean;
    lodLevel?: number;
  };
}

export interface ExportResponse {
  exportId: string;
  format: string;
  status: string;
  downloadUrl?: string;
}
