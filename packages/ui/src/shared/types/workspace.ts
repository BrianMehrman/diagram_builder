/**
 * Workspace Types
 *
 * Types for workspace management and configuration
 */

/**
 * Workspace member role
 */
export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer'

/**
 * Workspace member
 */
export interface WorkspaceMember {
  userId: string
  role: WorkspaceRole
  joinedAt: string
}

/**
 * Workspace settings
 */
export interface WorkspaceSettings {
  defaultLodLevel: number
  autoRefresh: boolean
  collaborationEnabled: boolean
}

/**
 * Workspace
 */
export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  repositories: string[]
  members: WorkspaceMember[]
  settings: WorkspaceSettings
  createdAt: string
  updatedAt: string
  lastAccessedAt?: string
}

/**
 * Viewpoint — saved camera position and filter state
 */
export interface Viewpoint {
  id: string
  name: string
  description?: string
  cameraPosition: { x: number; y: number; z: number }
  cameraTarget: { x: number; y: number; z: number }
  filters?: {
    lodLevel?: number
    nodeTypes?: string[]
    edgeTypes?: string[]
  }
  annotations?: Array<{
    nodeId: string
    text: string
  }>
  createdAt: string
  updatedAt: string
  shareToken?: string
}

/**
 * Repository metadata
 */
export interface Repository {
  id: string
  name: string
  url?: string
  path?: string
  branch: string
  lastParsedAt?: string
  nodeCount: number
  edgeCount: number
  status: 'pending' | 'parsing' | 'ready' | 'error'
  error?: string
}
