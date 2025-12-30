/**
 * Workspace Type Definitions
 *
 * A workspace is a collaborative container that groups:
 * - Repositories (code graphs to visualize)
 * - Viewpoints (saved views)
 * - Users (collaborators)
 * - Settings (preferences and permissions)
 */

/**
 * Workspace member with role-based access
 */
export interface WorkspaceMember {
  /** User ID */
  userId: string;
  /** Role in workspace */
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  /** When the user joined */
  joinedAt: string;
}

/**
 * Workspace settings and preferences
 */
export interface WorkspaceSettings {
  /** Default visualization settings */
  defaultCamera?: {
    position: { x: number; y: number; z: number };
    target: { x: number; y: number; z: number };
  };
  /** Default LOD level */
  defaultLodLevel?: number;
  /** Theme preference */
  theme?: 'light' | 'dark' | 'auto';
  /** Auto-save viewpoints */
  autoSave?: boolean;
}

/**
 * Complete workspace definition
 */
export interface Workspace {
  /** Unique workspace ID */
  id: string;
  /** Workspace name */
  name: string;
  /** Optional description */
  description?: string;
  /** Workspace owner user ID */
  ownerId: string;
  /** Repository IDs in this workspace */
  repositories: string[];
  /** Workspace members */
  members: WorkspaceMember[];
  /** Workspace settings */
  settings: WorkspaceSettings;
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Last accessed timestamp */
  lastAccessedAt?: string;
}

/**
 * Input for creating a new workspace
 */
export interface CreateWorkspaceInput {
  /** Workspace name */
  name: string;
  /** Optional description */
  description?: string;
  /** Initial repository IDs (optional) */
  repositories?: string[];
  /** Initial settings (optional) */
  settings?: WorkspaceSettings;
}

/**
 * Input for updating an existing workspace
 */
export interface UpdateWorkspaceInput {
  /** Workspace name */
  name?: string;
  /** Description */
  description?: string;
  /** Repository IDs */
  repositories?: string[];
  /** Settings */
  settings?: WorkspaceSettings;
}

/**
 * Input for adding a member to workspace
 */
export interface AddMemberInput {
  /** User ID to add */
  userId: string;
  /** Role to assign */
  role: 'admin' | 'editor' | 'viewer';
}

/**
 * Input for updating member role
 */
export interface UpdateMemberInput {
  /** New role */
  role: 'admin' | 'editor' | 'viewer';
}
