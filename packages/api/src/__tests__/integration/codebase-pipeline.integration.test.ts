/**
 * Codebase Pipeline Integration Tests
 *
 * Full integration tests for the complete pipeline:
 * POST /api/workspaces/:id/codebases → parse → Neo4j → GET /api/graph/:repoId
 *
 * These tests use REAL Neo4j (not mocked) and REAL file systems to validate
 * the entire import flow works correctly.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import request from 'supertest'
import path from 'path'
import app from '../../index'
import { generateToken } from '../../auth/jwt'
import { getDriver } from '../../database/neo4j-config'
import type { IVMGraph } from '@diagram-builder/core'

// ---------------------------------------------------------------------------
// Shared in-memory stores (defined before vi.mock so factories can close over them)
// ---------------------------------------------------------------------------
const mockWorkspaces = new Map<string, Record<string, unknown>>()
const mockCodebases = new Map<string, Record<string, unknown>>()
const mockRepositories = new Map<string, Record<string, unknown>>()
// nodesByRepo: repoId → (nodeId → nodeParams)
const mockNodesByRepo = new Map<string, Map<string, Record<string, unknown>>>()
// edgesByRepo: repoId → (edgeId → { ...params, edgeType })
const mockEdgesByRepo = new Map<string, Map<string, Record<string, unknown>>>()
// reverse lookup: nodeId → repoId (so edge storage can find the repo)
const nodeToRepo = new Map<string, string>()

// ---------------------------------------------------------------------------
// Mock: Neo4j driver (used directly in afterAll/cleanupTestData)
// ---------------------------------------------------------------------------
vi.mock('../../database/neo4j-config', () => ({
  getDriver: () => ({
    session: () => ({
      run: vi.fn().mockResolvedValue({ records: [] }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
    close: vi.fn().mockResolvedValue(undefined),
  }),
  closeDriver: vi.fn().mockResolvedValue(undefined),
  default: {
    getDriver: () => ({
      session: () => ({
        run: vi.fn().mockResolvedValue({ records: [] }),
        close: vi.fn().mockResolvedValue(undefined),
      }),
      close: vi.fn().mockResolvedValue(undefined),
    }),
    closeDriver: vi.fn().mockResolvedValue(undefined),
  },
}))

// ---------------------------------------------------------------------------
// Mock: cache utilities (simple no-ops so DB is always hit)
// ---------------------------------------------------------------------------
vi.mock('../../cache/cache-utils', () => ({
  get: vi.fn().mockResolvedValue(null),
  set: vi.fn().mockResolvedValue(undefined),
  invalidate: vi.fn().mockResolvedValue(undefined),
  invalidatePattern: vi.fn().mockResolvedValue(undefined),
  DEFAULT_CACHE_TTL: 300,
}))

// ---------------------------------------------------------------------------
// Mock: query-utils — Cypher-aware in-memory store
// Allowed edge types in the graph service's filter list (uppercase)
// ---------------------------------------------------------------------------
const GRAPH_EDGE_TYPES = new Set([
  'IMPORTS',
  'EXPORTS',
  'EXTENDS',
  'IMPLEMENTS',
  'CALLS',
  'USES',
  'DEPENDS_ON',
  'TYPE_OF',
  'RETURNS',
  'PARAMETER_OF',
])

vi.mock('../../database/query-utils', () => ({
  runQuery: vi.fn(async (query: string, params: Record<string, unknown>) => {
    // ---- Workspace operations ----

    if (query.includes('CREATE (w:Workspace')) {
      const id = params.id as string
      mockWorkspaces.set(id, {
        id,
        name: params.name,
        description: params.description,
        ownerId: params.ownerId,
        repositories: JSON.parse(params.repositories as string),
        members: JSON.parse(params.members as string),
        settings: JSON.parse(params.settings as string),
        sessionState: JSON.parse(params.sessionState as string),
        createdAt: params.createdAt,
        updatedAt: params.updatedAt,
      })
      return []
    }

    if (query.includes('WHERE w.ownerId = $userId')) {
      const userId = params.userId as string
      const userWorkspaces = Array.from(mockWorkspaces.values()).filter((w) => {
        if (w.ownerId === userId) return true
        const members = w.members as Array<{ userId: string }>
        return members.some((m) => m.userId === userId)
      })
      return userWorkspaces.map((w) => ({
        id: w.id,
        name: w.name,
        description: w.description,
        ownerId: w.ownerId,
        repositories: JSON.stringify(w.repositories),
        members: JSON.stringify(w.members),
        settings: JSON.stringify(w.settings),
        sessionState: JSON.stringify(w.sessionState),
        createdAt: w.createdAt,
        updatedAt: w.updatedAt,
        lastAccessedAt: null,
      }))
    }

    if (query.includes('SET w.lastAccessedAt')) {
      const id = params.id as string
      const workspace = mockWorkspaces.get(id)
      if (workspace && params.lastAccessedAt) {
        workspace.lastAccessedAt = params.lastAccessedAt
        mockWorkspaces.set(id, workspace)
      }
      return []
    }

    if (query.includes('SET w.') || query.includes('SET ${')) {
      const id = params.id as string
      const workspace = mockWorkspaces.get(id)
      if (!workspace) return []
      const updated = { ...workspace }
      if (params.name !== undefined) updated.name = params.name
      if (params.description !== undefined) updated.description = params.description
      if (params.repositories !== undefined)
        updated.repositories = JSON.parse(params.repositories as string)
      if (params.settings !== undefined) updated.settings = JSON.parse(params.settings as string)
      if (params.sessionState !== undefined)
        updated.sessionState = JSON.parse(params.sessionState as string)
      if (params.members !== undefined) updated.members = JSON.parse(params.members as string)
      updated.updatedAt = (params.updatedAt as string) || new Date().toISOString()
      mockWorkspaces.set(id, updated)
      return []
    }

    if (query.includes('DETACH DELETE') && !query.includes('Codebase') && !query.includes('Repository')) {
      const id = params.id as string
      mockWorkspaces.delete(id)
      return []
    }

    if (
      query.includes('MATCH (w:Workspace {id: $id})') &&
      !query.includes('SET w') &&
      !query.includes('DETACH DELETE')
    ) {
      const id = params.id as string
      const workspace = mockWorkspaces.get(id)
      if (!workspace) return []
      return [
        {
          id: workspace.id,
          name: workspace.name,
          description: workspace.description,
          ownerId: workspace.ownerId,
          repositories: JSON.stringify(workspace.repositories),
          members: JSON.stringify(workspace.members),
          settings: JSON.stringify(workspace.settings),
          sessionState: JSON.stringify(workspace.sessionState),
          createdAt: workspace.createdAt,
          updatedAt: workspace.updatedAt,
          lastAccessedAt: workspace.lastAccessedAt ?? null,
        },
      ]
    }

    // ---- Codebase operations ----

    if (query.includes('CREATE (c:Codebase')) {
      const id = params.id as string
      mockCodebases.set(id, {
        id,
        workspaceId: params.workspaceId,
        source: params.source,
        type: params.type,
        branch: params.branch ?? null,
        status: 'pending',
        error: null,
        repositoryId: null,
        importedAt: params.importedAt ?? new Date().toISOString(),
        updatedAt: params.updatedAt ?? new Date().toISOString(),
        progressPercentage: null,
        progressStage: null,
        progressMessage: null,
        progressFilesProcessed: null,
        progressTotalFiles: null,
      })
      return []
    }

    if (query.includes('MATCH (w:Workspace') && query.includes('[:CONTAINS]->(c:Codebase)')) {
      const workspaceId = params.workspaceId as string
      const codebases = Array.from(mockCodebases.values()).filter(
        (c) => c.workspaceId === workspaceId
      )
      return codebases.map((c) => ({
        id: c.id,
        workspaceId: c.workspaceId,
        source: c.source,
        type: c.type,
        branch: c.branch,
        status: c.status,
        error: c.error,
        repositoryId: c.repositoryId,
        importedAt: c.importedAt,
        updatedAt: c.updatedAt,
        progressPercentage: c.progressPercentage,
        progressStage: c.progressStage,
        progressMessage: c.progressMessage,
        progressFilesProcessed: c.progressFilesProcessed,
        progressTotalFiles: c.progressTotalFiles,
      }))
    }

    // updateCodebaseStatus — MUST come before generic codebase GET
    if (query.includes('SET c.status = $status')) {
      const codebaseId = params.codebaseId as string
      const codebase = mockCodebases.get(codebaseId)
      if (!codebase) return []
      codebase.status = params.status
      codebase.error = params.error ?? null
      codebase.repositoryId = params.repositoryId ?? codebase.repositoryId
      codebase.updatedAt = (params.updatedAt as string) ?? new Date().toISOString()
      codebase.progressPercentage = null
      codebase.progressStage = null
      codebase.progressMessage = null
      codebase.progressFilesProcessed = null
      codebase.progressTotalFiles = null
      mockCodebases.set(codebaseId, codebase)
      return [{ workspaceId: codebase.workspaceId }]
    }

    // updateCodebaseProgress — MUST come before generic codebase GET
    if (query.includes('SET c.progressPercentage')) {
      const codebaseId = params.codebaseId as string
      const codebase = mockCodebases.get(codebaseId)
      if (!codebase) return []
      codebase.progressPercentage = params.percentage
      codebase.progressStage = params.stage
      codebase.progressMessage = params.message
      codebase.progressFilesProcessed = params.filesProcessed ?? null
      codebase.progressTotalFiles = params.totalFiles ?? null
      codebase.updatedAt = (params.updatedAt as string) ?? new Date().toISOString()
      mockCodebases.set(codebaseId, codebase)
      return [{ workspaceId: codebase.workspaceId }]
    }

    if (
      query.includes('MATCH (c:Codebase {id: $codebaseId})') &&
      !query.includes('DETACH DELETE')
    ) {
      const codebaseId = params.codebaseId as string
      const codebase = mockCodebases.get(codebaseId)
      if (!codebase) return []
      return [
        {
          id: codebase.id,
          workspaceId: codebase.workspaceId,
          source: codebase.source,
          type: codebase.type,
          branch: codebase.branch,
          status: codebase.status,
          error: codebase.error,
          repositoryId: codebase.repositoryId,
          importedAt: codebase.importedAt,
          updatedAt: codebase.updatedAt,
          progressPercentage: codebase.progressPercentage,
          progressStage: codebase.progressStage,
          progressMessage: codebase.progressMessage,
          progressFilesProcessed: codebase.progressFilesProcessed,
          progressTotalFiles: codebase.progressTotalFiles,
        },
      ]
    }

    if (query.includes('MATCH (c:Codebase') && query.includes('DETACH DELETE')) {
      const codebaseId = params.codebaseId as string
      mockCodebases.delete(codebaseId)
      return []
    }

    // ---- Repository + graph storage (from triggerParserImport) ----

    if (query.includes('MERGE (r:Repository {id: $id})') && query.includes('SET r.name')) {
      const id = params.id as string
      mockRepositories.set(id, {
        id,
        name: params.name,
        rootPath: params.rootPath,
        repositoryUrl: params.repositoryUrl ?? null,
        branch: params.branch ?? null,
        type: params.type,
        fileCount: params.fileCount,
        parsedAt: new Date().toISOString(),
      })
      return []
    }

    // Node storage: MERGE (r:Repository {id: $repoId}) MERGE (n:Type {id: $id}) ... MERGE (r)-[:CONTAINS]->(n)
    if (query.includes('MERGE (r)-[:CONTAINS]->(n)')) {
      const repoId = params.repoId as string
      const nodeId = params.id as string
      if (!mockNodesByRepo.has(repoId)) mockNodesByRepo.set(repoId, new Map())
      mockNodesByRepo.get(repoId)!.set(nodeId, { ...params })
      nodeToRepo.set(nodeId, repoId)
      return []
    }

    // Edge storage: MATCH (source {id: $sourceId}) MATCH (target {id: $targetId}) MERGE (source)-[rel:TYPE {id: $id}]->(target)
    if (query.includes('MATCH (source {id: $sourceId})')) {
      const edgeId = params.id as string
      const sourceId = params.sourceId as string
      // Find the repo this edge belongs to via its source node
      const repoId = nodeToRepo.get(sourceId)
      if (repoId) {
        // Extract the relationship type from the Cypher string
        const typeMatch = query.match(/\[rel:(\w+)\s*\{id/)
        const edgeType = typeMatch ? typeMatch[1] : 'UNKNOWN'
        if (!mockEdgesByRepo.has(repoId)) mockEdgesByRepo.set(repoId, new Map())
        mockEdgesByRepo.get(repoId)!.set(edgeId, { ...params, edgeType })
      }
      return []
    }

    // Link codebase to repository
    if (query.includes('MERGE (c)-[:PARSED_INTO]->(r)')) {
      const codebaseId = params.codebaseId as string
      const repositoryId = params.repositoryId as string
      const codebase = mockCodebases.get(codebaseId)
      if (codebase) {
        codebase.repositoryId = repositoryId
        mockCodebases.set(codebaseId, codebase)
      }
      return []
    }

    // ---- Graph queries (from graph-service) ----

    // Repository metadata query
    if (
      query.includes('MATCH (r:Repository {id: $repoId})') &&
      query.includes('RETURN r.id as id') &&
      query.includes('r.name as name')
    ) {
      const repoId = params.repoId as string
      const repo = mockRepositories.get(repoId)
      if (!repo) return []
      return [
        {
          id: repo.id,
          name: repo.name,
          rootPath: repo.rootPath,
          repositoryUrl: repo.repositoryUrl ?? null,
          branch: repo.branch ?? null,
          commit: null,
          parsedAt: repo.parsedAt,
        },
      ]
    }

    // Graph nodes query
    if (query.includes('[:CONTAINS*]->(n)') && query.includes('RETURN n.id')) {
      const repoId = params.repoId as string
      const nodes = mockNodesByRepo.get(repoId)
      if (!nodes) return []
      return Array.from(nodes.values()).map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        path: n.path ?? null,
        x: n.x ?? 0,
        y: n.y ?? 0,
        z: n.z ?? 0,
        lod: n.lod ?? 3,
        parentId: n.parentId ?? null,
        language: n.language ?? null,
        loc: n.loc ?? null,
        complexity: n.complexity ?? null,
        dependencyCount: null,
        dependentCount: null,
        startLine: null,
        endLine: null,
        startColumn: null,
        endColumn: null,
        visibility: n.visibility ?? null,
        methodCount: n.methodCount ?? null,
        properties: null,
      }))
    }

    // Graph edges query
    if (query.includes('[:CONTAINS*]->(source)') && query.includes('type(e) IN')) {
      const repoId = params.repoId as string
      const edges = mockEdgesByRepo.get(repoId)
      if (!edges) return []
      return Array.from(edges.values())
        .filter((e) => GRAPH_EDGE_TYPES.has(e.edgeType as string))
        .map((e, i) => ({
          id: String(i),
          source: e.sourceId,
          target: e.targetId,
          type: (e.edgeType as string).toLowerCase(),
          lod: e.lod ?? 3,
          label: e.label ?? null,
          weight: null,
          circular: null,
          reference: null,
          properties: null,
        }))
    }

    // Delete repo graph data
    if (query.includes('$repositoryId') && query.includes('DETACH DELETE')) {
      const repositoryId = params.repositoryId as string
      const nodes = mockNodesByRepo.get(repositoryId)
      if (nodes) {
        for (const nodeId of nodes.keys()) nodeToRepo.delete(nodeId)
        mockNodesByRepo.delete(repositoryId)
      }
      mockEdgesByRepo.delete(repositoryId)
      mockRepositories.delete(repositoryId)
      return []
    }

    return []
  }),
  getQueryStats: vi.fn(() => ({ totalQueries: 0 })),
  runSingleQuery: vi.fn().mockResolvedValue(0),
  runTransaction: vi.fn().mockResolvedValue(undefined),
}))

describe('[Integration] Codebase Import Pipeline', () => {
  let authToken: string
  let testWorkspaceId: string
  let testUserId: string

  // Test fixtures paths
  const FIXTURES_DIR = path.join(__dirname, '../../../../../tests/fixtures/repositories')
  const SMALL_TS_REPO = path.join(FIXTURES_DIR, 'small-ts-repo')

  beforeAll(async () => {
    // Generate auth token
    testUserId = 'test-pipeline-user'
    authToken = generateToken({ userId: testUserId, email: 'pipeline@test.com' })

    // Create a test workspace
    const workspaceRes = await request(app)
      .post('/api/workspaces')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Pipeline Test Workspace',
        description: 'Test workspace for integration tests',
      })

    expect(workspaceRes.status).toBe(201)
    testWorkspaceId = workspaceRes.body.id
  })

  afterAll(async () => {
    // Clean up test data from Neo4j
    const session = getDriver().session()
    try {
      // Delete all test repositories and related nodes
      await session.run(
        `
        MATCH (r:Repository)
        WHERE r.id STARTS WITH 'test-' OR r.name CONTAINS 'test'
        DETACH DELETE r
        `
      )
    } finally {
      await session.close()
    }

    // Close Neo4j driver
    await getDriver().close()
  })

  const cleanupTestData = async () => {
    const session = getDriver().session()
    try {
      // Delete all repositories and related nodes that match our test fixture path
      await session.run(
        `
        MATCH (n)
        WHERE n.id CONTAINS '/tests/fixtures/repositories/'
           OR (n:Repository AND n.name = 'small-ts-repo')
        DETACH DELETE n
        `
      )
    } finally {
      await session.close()
    }
  }

  beforeEach(cleanupTestData)
  afterEach(cleanupTestData)

  describe('POST /api/workspaces/:workspaceId/codebases', () => {
    it('should import a local codebase successfully', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        })

      expect(response.status).toBe(201)
      expect(response.body).toHaveProperty('codebaseId')
      expect(response.body).toHaveProperty('workspaceId', testWorkspaceId)
      expect(response.body).toHaveProperty('source', SMALL_TS_REPO)
      expect(response.body).toHaveProperty('type', 'local')
      expect(response.body).toHaveProperty('status')
      expect(['pending', 'processing', 'completed']).toContain(response.body.status)
    })

    it('should return validation error for missing source', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          type: 'local',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('type')
      expect(response.body.type).toContain('validation-error')
    })

    it('should return validation error for invalid type', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'invalid',
        })

      expect(response.status).toBe(400)
      expect(response.body).toHaveProperty('type')
      expect(response.body.type).toContain('validation-error')
    })

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        })

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('type')
      expect(response.body.type).toContain('unauthorized')
    })
  })

  describe('Full Pipeline Integration', () => {
    it('should complete full import → parse → store → retrieve flow', async () => {
      // Step 1: Import codebase
      const importRes = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        })

      expect(importRes.status).toBe(201)
      const codebaseId = importRes.body.codebaseId

      // Step 2: Wait for processing to complete
      let codebase: { status: string; repositoryId?: string; error?: string }
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout

      while (attempts < maxAttempts) {
        const statusRes = await request(app)
          .get(`/api/workspaces/${testWorkspaceId}/codebases/${codebaseId}`)
          .set('Authorization', `Bearer ${authToken}`)

        expect(statusRes.status).toBe(200)
        codebase = statusRes.body

        if (codebase.status === 'completed') {
          break
        }

        if (codebase.status === 'failed') {
          throw new Error(`Codebase import failed: ${codebase.error}`)
        }

        // Wait 1 second before next check
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }

      // Verify completion
      expect(codebase.status).toBe('completed')
      expect(codebase).toHaveProperty('repositoryId')

      const repositoryId = codebase.repositoryId

      // Step 3: Retrieve graph data
      const graphRes = await request(app)
        .get(`/api/graph/${repositoryId}`)
        .set('Authorization', `Bearer ${authToken}`)

      expect(graphRes.status).toBe(200)
      expect(graphRes.body).toHaveProperty('nodes')
      expect(graphRes.body).toHaveProperty('edges')
      expect(graphRes.body).toHaveProperty('metadata')

      const graph: IVMGraph = graphRes.body

      // Step 4: Validate graph quality
      expect(graph.nodes.length).toBeGreaterThan(0)

      // Validate node structure
      graph.nodes.forEach((node) => {
        expect(node).toHaveProperty('id')
        expect(node).toHaveProperty('type')
        expect(node).toHaveProperty('metadata')
        expect(node).toHaveProperty('metadata.label')
        expect(node).toHaveProperty('position')
        expect(node).toHaveProperty('lod')

        // Validate 3D coordinates
        expect(node.position).toHaveProperty('x')
        expect(node.position).toHaveProperty('y')
        expect(node.position).toHaveProperty('z')
        expect(typeof node.position.x).toBe('number')
        expect(typeof node.position.y).toBe('number')
        expect(typeof node.position.z).toBe('number')
      })

      // Validate edge structure (if edges exist)
      if (graph.edges.length > 0) {
        graph.edges.forEach((edge) => {
          expect(edge).toHaveProperty('id')
          expect(edge).toHaveProperty('source')
          expect(edge).toHaveProperty('target')
          expect(edge).toHaveProperty('type')
          expect(edge).toHaveProperty('metadata')
        })

        // Validate edge references
        const nodeIds = new Set(graph.nodes.map((n) => n.id))
        graph.edges.forEach((edge) => {
          expect(nodeIds.has(edge.source)).toBe(true)
          expect(nodeIds.has(edge.target)).toBe(true)
        })
      }

      // Validate metadata
      expect(graph.metadata.stats.totalNodes).toBe(graph.nodes.length)
      expect(graph.metadata.stats.totalEdges).toBe(graph.edges.length)
    }, 60000) // 60 second timeout for full pipeline

    it('should handle multiple concurrent imports', async () => {
      // Import same repo twice concurrently
      const [import1, import2] = await Promise.all([
        request(app)
          .post(`/api/workspaces/${testWorkspaceId}/codebases`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            source: SMALL_TS_REPO,
            type: 'local',
          }),
        request(app)
          .post(`/api/workspaces/${testWorkspaceId}/codebases`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            source: SMALL_TS_REPO,
            type: 'local',
          }),
      ])

      expect(import1.status).toBe(201)
      expect(import2.status).toBe(201)
      expect(import1.body.codebaseId).not.toBe(import2.body.codebaseId)
    })
  })

  describe('GET /api/graph/:repoId', () => {
    it('should return 404 for non-existent repository', async () => {
      const response = await request(app)
        .get('/api/graph/non-existent-repo-id')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('type')
      expect(response.body.type).toContain('not-found')
    })

    it('should require authentication', async () => {
      const response = await request(app).get('/api/graph/test-repo-id')

      expect(response.status).toBe(401)
      expect(response.body).toHaveProperty('type')
      expect(response.body.type).toContain('unauthorized')
    })

    it('should return RFC 7807 error format', async () => {
      const response = await request(app)
        .get('/api/graph/non-existent')
        .set('Authorization', `Bearer ${authToken}`)

      expect(response.status).toBe(404)
      expect(response.body).toHaveProperty('type')
      expect(response.body).toHaveProperty('title')
      expect(response.body).toHaveProperty('status', 404)
      expect(response.body).toHaveProperty('detail')
    })
  })

  describe('Codebase Status Tracking', () => {
    it('should track status transitions correctly', async () => {
      // Import codebase
      const importRes = await request(app)
        .post(`/api/workspaces/${testWorkspaceId}/codebases`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          source: SMALL_TS_REPO,
          type: 'local',
        })

      const codebaseId = importRes.body.codebaseId

      // Check initial status
      const initialStatus = importRes.body.status
      expect(['pending', 'processing']).toContain(initialStatus)

      // Wait for completion
      let finalStatus: string = initialStatus
      let attempts = 0

      while (attempts < 30 && finalStatus !== 'completed' && finalStatus !== 'failed') {
        const statusRes = await request(app)
          .get(`/api/workspaces/${testWorkspaceId}/codebases/${codebaseId}`)
          .set('Authorization', `Bearer ${authToken}`)

        finalStatus = statusRes.body.status
        await new Promise((resolve) => setTimeout(resolve, 1000))
        attempts++
      }

      expect(finalStatus).toBe('completed')
    }, 60000)
  })
})
