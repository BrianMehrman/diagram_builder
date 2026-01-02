/**
 * Database Seeding
 *
 * Creates comprehensive test data for development and testing
 * Includes: workspaces, repositories, viewpoints, collaboration sessions
 * Idempotent - safe to run multiple times
 */

import { runQuery } from './query-utils'

// User IDs for test data
const TEST_USERS = {
  DEV_USER: 'dev-user',
  TEST_ADMIN: 'test-admin',
  TEST_EDITOR: 'test-editor',
  TEST_VIEWER: 'test-viewer',
}

// Workspace IDs for consistent reference
const WORKSPACE_IDS = {
  DEFAULT: 'default-workspace',
  MULTI_REPO: 'multi-repo-workspace',
  COLLAB: 'collab-workspace',
}

// Repository IDs for test data
const REPOSITORY_IDS = {
  SAMPLE_JS: 'repo-sample-javascript',
  SAMPLE_TS: 'repo-sample-typescript',
  SAMPLE_MULTI: 'repo-sample-multilang',
}

/**
 * Seed database with comprehensive test data
 * Safe to run multiple times (idempotent)
 */
export async function seedDatabase(): Promise<void> {
  console.warn('Seeding database with comprehensive test data...')

  try {
    await seedWorkspaces()
    await seedRepositories()
    await seedViewpoints()
    await seedExportHistory()
    await validateSeedData()
    console.warn('✓ Database seeded successfully')
  } catch (error) {
    console.error('Failed to seed database:', error)
    throw error
  }
}

/**
 * Validate seeded data integrity
 */
async function validateSeedData(): Promise<void> {
  console.warn('  Validating seed data...')

  // Count workspaces
  const workspaceCount = await runQuery<{ count: number }>(
    'MATCH (w:Workspace) RETURN count(w) as count'
  )
  const workspaces = workspaceCount?.[0]?.count ?? 0

  // Count repositories
  const repoCount = await runQuery<{ count: number }>(
    'MATCH (r:Repository) RETURN count(r) as count'
  )
  const repositories = repoCount?.[0]?.count ?? 0

  // Count viewpoints
  const viewpointCount = await runQuery<{ count: number }>(
    'MATCH (v:Viewpoint) RETURN count(v) as count'
  )
  const viewpoints = viewpointCount?.[0]?.count ?? 0

  // Count exports
  const exportCount = await runQuery<{ count: number }>('MATCH (e:Export) RETURN count(e) as count')
  const exports = exportCount?.[0]?.count ?? 0

  console.warn(`    Workspaces: ${workspaces}`)
  console.warn(`    Repositories: ${repositories}`)
  console.warn(`    Viewpoints: ${viewpoints}`)
  console.warn(`    Exports: ${exports}`)

  // Verify minimum expected data exists
  if (workspaces < 3) {
    throw new Error(`Expected at least 3 workspaces, found ${workspaces}`)
  }
  if (repositories < 3) {
    throw new Error(`Expected at least 3 repositories, found ${repositories}`)
  }
  if (viewpoints < 3) {
    throw new Error(`Expected at least 3 viewpoints, found ${viewpoints}`)
  }

  console.warn('  ✓ Validation passed')
}

/**
 * Seed multiple test workspaces with different configurations
 */
async function seedWorkspaces(): Promise<void> {
  const now = new Date().toISOString()

  const workspaces = [
    {
      id: WORKSPACE_IDS.DEFAULT,
      name: 'Default Workspace',
      description: 'Basic workspace for development and testing',
      ownerId: TEST_USERS.DEV_USER,
      repositories: JSON.stringify([]),
      members: JSON.stringify([
        {
          userId: TEST_USERS.DEV_USER,
          role: 'owner',
          joinedAt: now,
        },
      ]),
      settings: JSON.stringify({
        defaultLodLevel: 2,
        autoSave: true,
        theme: 'dark',
        defaultCamera: {
          position: { x: 0, y: 50, z: 100 },
          target: { x: 0, y: 0, z: 0 },
        },
      }),
      sessionState: JSON.stringify({}),
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    },
    {
      id: WORKSPACE_IDS.MULTI_REPO,
      name: 'Multi-Repository Workspace',
      description: 'Example workspace with multiple repositories for testing complex scenarios',
      ownerId: TEST_USERS.DEV_USER,
      repositories: JSON.stringify([
        REPOSITORY_IDS.SAMPLE_JS,
        REPOSITORY_IDS.SAMPLE_TS,
        REPOSITORY_IDS.SAMPLE_MULTI,
      ]),
      members: JSON.stringify([
        {
          userId: TEST_USERS.DEV_USER,
          role: 'owner',
          joinedAt: now,
        },
        {
          userId: TEST_USERS.TEST_ADMIN,
          role: 'admin',
          joinedAt: now,
        },
      ]),
      settings: JSON.stringify({
        defaultLodLevel: 3,
        autoSave: false,
        theme: 'light',
        defaultCamera: {
          position: { x: 100, y: 100, z: 100 },
          target: { x: 0, y: 0, z: 0 },
        },
      }),
      sessionState: JSON.stringify({
        currentLodLevel: 3,
        selectedNodes: [],
        filters: { nodeTypes: ['Class', 'Function'] },
      }),
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    },
    {
      id: WORKSPACE_IDS.COLLAB,
      name: 'Collaboration Workspace',
      description: 'Shared workspace for testing collaboration features with multiple users',
      ownerId: TEST_USERS.DEV_USER,
      repositories: JSON.stringify([REPOSITORY_IDS.SAMPLE_TS]),
      members: JSON.stringify([
        {
          userId: TEST_USERS.DEV_USER,
          role: 'owner',
          joinedAt: now,
        },
        {
          userId: TEST_USERS.TEST_ADMIN,
          role: 'admin',
          joinedAt: now,
        },
        {
          userId: TEST_USERS.TEST_EDITOR,
          role: 'editor',
          joinedAt: now,
        },
        {
          userId: TEST_USERS.TEST_VIEWER,
          role: 'viewer',
          joinedAt: now,
        },
      ]),
      settings: JSON.stringify({
        defaultLodLevel: 2,
        autoSave: true,
        theme: 'auto',
        collaborationEnabled: true,
        defaultCamera: {
          position: { x: 50, y: 75, z: 50 },
          target: { x: 0, y: 0, z: 0 },
        },
      }),
      sessionState: JSON.stringify({
        currentLodLevel: 2,
        currentCamera: {
          position: { x: 50, y: 75, z: 50 },
          target: { x: 0, y: 0, z: 0 },
        },
      }),
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
    },
  ]

  for (const workspace of workspaces) {
    await createOrUpdateWorkspace(workspace)
  }

  console.warn('  ✓ Workspaces seeded')
}

/**
 * Seed test repositories
 */
async function seedRepositories(): Promise<void> {
  const now = new Date().toISOString()

  const repositories = [
    {
      id: REPOSITORY_IDS.SAMPLE_JS,
      name: 'sample-javascript',
      url: 'https://github.com/example/sample-javascript',
      branch: 'main',
      language: 'javascript',
      fileCount: 42,
      classCount: 15,
      functionCount: 87,
      lastParsed: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: REPOSITORY_IDS.SAMPLE_TS,
      name: 'sample-typescript',
      url: 'https://github.com/example/sample-typescript',
      branch: 'main',
      language: 'typescript',
      fileCount: 68,
      classCount: 34,
      functionCount: 156,
      lastParsed: now,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: REPOSITORY_IDS.SAMPLE_MULTI,
      name: 'sample-multilang',
      url: 'https://github.com/example/sample-multilang',
      branch: 'develop',
      language: 'mixed',
      fileCount: 125,
      classCount: 48,
      functionCount: 223,
      lastParsed: now,
      createdAt: now,
      updatedAt: now,
    },
  ]

  for (const repo of repositories) {
    await createOrUpdateRepository(repo)
  }

  console.warn('  ✓ Repositories seeded')
}

/**
 * Seed test viewpoints
 */
async function seedViewpoints(): Promise<void> {
  const now = new Date().toISOString()

  const viewpoints = [
    {
      id: 'viewpoint-overview-js',
      repositoryId: REPOSITORY_IDS.SAMPLE_JS,
      name: 'Overview - JavaScript',
      description: 'High-level view of the JavaScript repository structure',
      camera: JSON.stringify({
        position: { x: 0, y: 100, z: 150 },
        target: { x: 0, y: 0, z: 0 },
        fov: 75,
        zoom: 1,
      }),
      filters: JSON.stringify({
        nodeTypes: ['File', 'Class'],
        maxLod: 2,
      }),
      annotations: JSON.stringify([]),
      createdBy: TEST_USERS.DEV_USER,
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      shareToken: null,
    },
    {
      id: 'viewpoint-detailed-ts',
      repositoryId: REPOSITORY_IDS.SAMPLE_TS,
      name: 'Detailed View - TypeScript',
      description: 'Detailed function-level view with annotations',
      camera: JSON.stringify({
        position: { x: 25, y: 50, z: 75 },
        target: { x: 25, y: 0, z: 25 },
        fov: 60,
        zoom: 1.5,
      }),
      filters: JSON.stringify({
        nodeTypes: ['Class', 'Function'],
        maxLod: 4,
        pathPattern: 'src/**/*.ts',
      }),
      annotations: JSON.stringify([
        {
          id: 'anno-1',
          type: 'note',
          target: { nodeId: 'sample-node-1' },
          content: 'Core authentication logic',
          color: '#ff6b6b',
          createdAt: now,
          createdBy: TEST_USERS.DEV_USER,
        },
        {
          id: 'anno-2',
          type: 'highlight',
          target: { nodeId: 'sample-node-2' },
          content: 'Needs refactoring',
          color: '#feca57',
          createdAt: now,
          createdBy: TEST_USERS.TEST_EDITOR,
        },
      ]),
      createdBy: TEST_USERS.DEV_USER,
      createdAt: now,
      updatedAt: now,
      isPublic: true,
      shareToken: 'share-token-xyz123',
    },
    {
      id: 'viewpoint-collab',
      repositoryId: REPOSITORY_IDS.SAMPLE_TS,
      name: 'Collaboration View',
      description: 'Shared view for team collaboration',
      camera: JSON.stringify({
        position: { x: 50, y: 75, z: 50 },
        target: { x: 0, y: 0, z: 0 },
        fov: 70,
        zoom: 1,
      }),
      filters: JSON.stringify({
        nodeTypes: ['Class', 'Function', 'File'],
        maxLod: 3,
      }),
      annotations: JSON.stringify([]),
      createdBy: TEST_USERS.TEST_ADMIN,
      createdAt: now,
      updatedAt: now,
      isPublic: false,
      shareToken: null,
    },
  ]

  for (const viewpoint of viewpoints) {
    await createOrUpdateViewpoint(viewpoint)
  }

  console.warn('  ✓ Viewpoints seeded')
}

/**
 * Seed export history records
 */
async function seedExportHistory(): Promise<void> {
  const now = new Date().toISOString()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const exports = [
    {
      id: 'export-plantuml-1',
      workspaceId: WORKSPACE_IDS.DEFAULT,
      repositoryId: REPOSITORY_IDS.SAMPLE_JS,
      format: 'plantuml',
      status: 'completed',
      createdBy: TEST_USERS.DEV_USER,
      createdAt: yesterday,
      completedAt: yesterday,
    },
    {
      id: 'export-mermaid-1',
      workspaceId: WORKSPACE_IDS.MULTI_REPO,
      repositoryId: REPOSITORY_IDS.SAMPLE_TS,
      format: 'mermaid',
      status: 'completed',
      createdBy: TEST_USERS.DEV_USER,
      createdAt: yesterday,
      completedAt: yesterday,
    },
    {
      id: 'export-png-1',
      workspaceId: WORKSPACE_IDS.COLLAB,
      repositoryId: REPOSITORY_IDS.SAMPLE_TS,
      format: 'png',
      status: 'completed',
      createdBy: TEST_USERS.TEST_EDITOR,
      createdAt: now,
      completedAt: now,
    },
  ]

  for (const exportRecord of exports) {
    await createOrUpdateExport(exportRecord)
  }

  console.warn('  ✓ Export history seeded')
}

/**
 * Create or update a workspace (idempotent)
 */
async function createOrUpdateWorkspace(workspace: Record<string, unknown>): Promise<void> {
  const checkQuery = 'MATCH (w:Workspace {id: $id}) RETURN w'
  const existing = await runQuery(checkQuery, { id: workspace.id })

  if (existing && existing.length > 0) {
    console.warn(`  ↻ Workspace ${workspace.id} already exists, skipping`)
    return
  }

  const createQuery = `
    CREATE (w:Workspace {
      id: $id,
      name: $name,
      description: $description,
      ownerId: $ownerId,
      repositories: $repositories,
      members: $members,
      settings: $settings,
      sessionState: $sessionState,
      createdAt: $createdAt,
      updatedAt: $updatedAt,
      lastAccessedAt: $lastAccessedAt
    })
    RETURN w
  `

  await runQuery(createQuery, workspace)
  console.warn(`  ✓ Created workspace: ${workspace.name}`)
}

/**
 * Create or update a repository (idempotent)
 */
async function createOrUpdateRepository(repo: Record<string, unknown>): Promise<void> {
  const checkQuery = 'MATCH (r:Repository {id: $id}) RETURN r'
  const existing = await runQuery(checkQuery, { id: repo.id })

  if (existing && existing.length > 0) {
    console.warn(`  ↻ Repository ${repo.id} already exists, skipping`)
    return
  }

  const createQuery = `
    CREATE (r:Repository {
      id: $id,
      name: $name,
      url: $url,
      branch: $branch,
      language: $language,
      fileCount: $fileCount,
      classCount: $classCount,
      functionCount: $functionCount,
      lastParsed: $lastParsed,
      createdAt: $createdAt,
      updatedAt: $updatedAt
    })
    RETURN r
  `

  await runQuery(createQuery, repo)
  console.warn(`  ✓ Created repository: ${repo.name}`)
}

/**
 * Create or update a viewpoint (idempotent)
 */
async function createOrUpdateViewpoint(viewpoint: Record<string, unknown>): Promise<void> {
  const checkQuery = 'MATCH (v:Viewpoint {id: $id}) RETURN v'
  const existing = await runQuery(checkQuery, { id: viewpoint.id })

  if (existing && existing.length > 0) {
    console.warn(`  ↻ Viewpoint ${viewpoint.id} already exists, skipping`)
    return
  }

  const createQuery = `
    CREATE (v:Viewpoint {
      id: $id,
      repositoryId: $repositoryId,
      name: $name,
      description: $description,
      camera: $camera,
      filters: $filters,
      annotations: $annotations,
      createdBy: $createdBy,
      createdAt: $createdAt,
      updatedAt: $updatedAt,
      isPublic: $isPublic,
      shareToken: $shareToken
    })
    RETURN v
  `

  await runQuery(createQuery, viewpoint)
  console.warn(`  ✓ Created viewpoint: ${viewpoint.name}`)
}

/**
 * Create or update an export record (idempotent)
 */
async function createOrUpdateExport(exportRecord: Record<string, unknown>): Promise<void> {
  const checkQuery = 'MATCH (e:Export {id: $id}) RETURN e'
  const existing = await runQuery(checkQuery, { id: exportRecord.id })

  if (existing && existing.length > 0) {
    console.warn(`  ↻ Export ${exportRecord.id} already exists, skipping`)
    return
  }

  const createQuery = `
    CREATE (e:Export {
      id: $id,
      workspaceId: $workspaceId,
      repositoryId: $repositoryId,
      format: $format,
      status: $status,
      createdBy: $createdBy,
      createdAt: $createdAt,
      completedAt: $completedAt
    })
    RETURN e
  `

  await runQuery(createQuery, exportRecord)
  console.warn(`  ✓ Created export: ${exportRecord.id}`)
}
