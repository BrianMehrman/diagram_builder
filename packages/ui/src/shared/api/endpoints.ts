/**
 * API Endpoints
 *
 * Type-safe wrappers for all backend API endpoints
 */

import { apiClient } from './client'
import type {
  ParseRequest,
  ParseResponse,
  GraphQueryRequest,
  GraphQueryResponse,
  Viewpoint,
  CreateViewpointRequest,
  UpdateViewpointRequest,
  ExportRequest,
  ExportResponse,
  Workspace,
  CreateWorkspaceRequest,
  UpdateWorkspaceRequest,
} from '../types/api'

/**
 * Authentication endpoints
 */
export const auth = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<{ token: string }>('/api/auth/login', credentials),

  register: (userData: { username: string; password: string; email: string }) =>
    apiClient.post<{ token: string }>('/api/auth/register', userData),

  logout: () => apiClient.post('/api/auth/logout'),
}

/**
 * Parsing endpoints
 */
export const parsing = {
  parse: (request: ParseRequest) => apiClient.post<ParseResponse>('/api/parse', request),

  getParseStatus: (jobId: string) =>
    apiClient.get<{ status: string; progress: number }>(`/api/parse/${jobId}/status`),
}

/**
 * Graph query endpoints
 */
export const graph = {
  query: (request: GraphQueryRequest) =>
    apiClient.post<GraphQueryResponse>('/api/graph/query', request),

  getNode: (nodeId: string) => apiClient.get<any>(`/api/graph/nodes/${nodeId}`),

  getNodeDependencies: (nodeId: string) =>
    apiClient.get<any[]>(`/api/graph/nodes/${nodeId}/dependencies`),

  getNodeDependents: (nodeId: string) =>
    apiClient.get<any[]>(`/api/graph/nodes/${nodeId}/dependents`),
}

/**
 * Viewpoint endpoints
 */
export const viewpoints = {
  list: () => apiClient.get<Viewpoint[]>('/api/viewpoints'),

  get: (id: string) => apiClient.get<Viewpoint>(`/api/viewpoints/${id}`),

  create: (request: CreateViewpointRequest) =>
    apiClient.post<Viewpoint>('/api/viewpoints', request),

  update: (id: string, request: UpdateViewpointRequest) =>
    apiClient.put<Viewpoint>(`/api/viewpoints/${id}`, request),

  delete: (id: string) => apiClient.delete(`/api/viewpoints/${id}`),
}

/**
 * Export endpoints
 */
export const exports = {
  export: (request: ExportRequest) => apiClient.post<ExportResponse>('/api/export', request),

  download: (exportId: string) => apiClient.get<Blob>(`/api/export/${exportId}/download`),
}

/**
 * Workspace endpoints
 */
export const workspaces = {
  list: () => apiClient.get<Workspace[]>('/api/workspaces'),

  get: (id: string) => apiClient.get<Workspace>(`/api/workspaces/${id}`),

  create: (request: CreateWorkspaceRequest) =>
    apiClient.post<Workspace>('/api/workspaces', request),

  update: (id: string, request: UpdateWorkspaceRequest) =>
    apiClient.put<Workspace>(`/api/workspaces/${id}`, request),

  delete: (id: string) => apiClient.delete(`/api/workspaces/${id}`),
}

/**
 * Collaboration endpoints
 */
export const collaboration = {
  getSessions: () => apiClient.get<any[]>('/api/collaboration/sessions'),

  getSessionUsers: (sessionId: string) =>
    apiClient.get<any[]>(`/api/collaboration/sessions/${sessionId}/users`),
}
