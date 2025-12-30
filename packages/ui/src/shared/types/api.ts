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
