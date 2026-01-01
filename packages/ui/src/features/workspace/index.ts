/**
 * Workspace Management Feature
 *
 * Workspace configuration UI, multi-codebase support, parsing settings,
 * and workspace templates.
 */

export { WorkspaceConfig } from './WorkspaceConfig'
export { WorkspaceSwitcher } from './WorkspaceSwitcher'
export { ImportCodebaseButton } from './ImportCodebaseButton'
export { ImportCodebaseModal } from './ImportCodebaseModal'
export { useWorkspaceStore } from './store'
export type { CreateWorkspaceData } from './store'
export { useWorkspacePersistence } from './useWorkspacePersistence'
export { saveWorkspaces, loadWorkspaces, clearWorkspaceData } from './persistence'
