/**
 * API Client Utilities
 *
 * HTTP client for making API requests with authentication
 */

import type { ApiError, ProblemDetails } from '../types';

/**
 * API client configuration
 */
interface ApiClientConfig {
  baseUrl: string;
  getToken: () => string | null | undefined;
}

/**
 * API request options
 */
interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean>;
}

/**
 * API client error
 */
export class ApiClientError extends Error {
  constructor(
    public problemDetails: ProblemDetails,
    public status: number
  ) {
    super(problemDetails.title);
    this.name = 'ApiClientError';
  }
}

/**
 * Create API client
 */
export function createApiClient(config: ApiClientConfig) {
  const { baseUrl, getToken } = config;

  /**
   * Make an API request
   */
  async function request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, ...fetchOptions } = options;

    // Build URL with query parameters
    let url = `${baseUrl}${endpoint}`;
    if (params) {
      const queryString = new URLSearchParams(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      ).toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Add authentication header if token exists
    const token = getToken();
    const headers = new Headers(fetchOptions.headers);
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');

    // Make request
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle error responses
    if (!response.ok) {
      const problemDetails = (await response.json()) as ApiError;
      throw new ApiClientError(problemDetails, response.status);
    }

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    // Parse JSON response
    return response.json() as Promise<T>;
  }

  return {
    get: <T>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'GET' }),

    post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'POST',
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),

    put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
      request<T>(endpoint, {
        ...options,
        method: 'PUT',
        ...(body !== undefined && { body: JSON.stringify(body) }),
      }),

    delete: <T>(endpoint: string, options?: RequestOptions) =>
      request<T>(endpoint, { ...options, method: 'DELETE' }),
  };
}
