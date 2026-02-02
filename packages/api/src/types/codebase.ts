/**
 * Codebase Type Definitions
 *
 * A codebase represents a source code repository imported into a workspace.
 * It can be loaded from:
 * - Local file system paths
 * - Git repository URLs (GitHub, GitLab, Bitbucket)
 *
 * Codebases are parsed to extract code structure and relationships,
 * which are stored in Neo4j as Repository nodes.
 */

/**
 * Codebase import status
 */
export type CodebaseStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * Import progress stage
 */
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

/**
 * Codebase source type
 */
export type CodebaseType = 'local' | 'git';

/**
 * Credential type for private repository access
 */
export type CredentialType = 'oauth' | 'ssh';

/**
 * Authentication credentials for private repositories
 */
export interface CodebaseCredentials {
  /** Credential type */
  type: CredentialType;
  /** OAuth token (for oauth type) */
  token?: string;
  /** SSH key path (for ssh type) */
  sshKeyPath?: string;
}

/**
 * Complete codebase definition
 */
export interface Codebase {
  /** Unique codebase ID */
  id: string;
  /** Workspace ID this codebase belongs to */
  workspaceId: string;
  /** Source path or URL */
  source: string;
  /** Source type */
  type: CodebaseType;
  /** Git branch (for git type) */
  branch?: string;
  /** Import status */
  status: CodebaseStatus;
  /** Error message (if failed) */
  error?: string;
  /** Neo4j Repository node ID (when parsing completed) */
  repositoryId?: string;
  /** Import timestamp */
  importedAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Import progress (when processing) */
  progress?: ImportProgress;
}

/**
 * Input for creating/importing a new codebase
 */
export interface CreateCodebaseInput {
  /** Source path or Git URL */
  source: string;
  /** Source type */
  type: CodebaseType;
  /** Git branch (optional, defaults to main) */
  branch?: string;
  /** Authentication credentials for private repositories (optional) */
  credentials?: CodebaseCredentials;
}

/**
 * Options for codebase import operation
 */
export interface CodebaseImportOptions {
  /** Source path or Git URL */
  source: string;
  /** Source type */
  type: CodebaseType;
  /** Git branch (optional) */
  branch?: string;
  /** Authentication credentials (optional) */
  credentials?: CodebaseCredentials;
}

/**
 * Input for updating codebase status
 */
export interface UpdateCodebaseStatusInput {
  /** New status */
  status: CodebaseStatus;
  /** Error message (if failed) */
  error?: string;
  /** Repository ID (if completed) */
  repositoryId?: string;
}

/**
 * Input for updating codebase import progress
 */
export interface UpdateCodebaseProgressInput {
  /** Progress percentage (0-100) */
  percentage: number;
  /** Current import stage */
  stage: ImportStage;
  /** Human-readable message */
  message: string;
  /** Files processed so far */
  filesProcessed?: number;
  /** Total files to process */
  totalFiles?: number;
}
