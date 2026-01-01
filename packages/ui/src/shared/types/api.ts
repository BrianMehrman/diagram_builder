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
 * Codebase types
 */
export type CodebaseStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type CodebaseType = 'local' | 'git';

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
