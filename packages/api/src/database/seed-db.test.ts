/**
 * Database Seeding Tests
 *
 * Tests for comprehensive database seeding functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { seedDatabase } from './seed-db'
import * as queryUtils from './query-utils'

vi.mock('./query-utils')

describe('seedDatabase', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should seed workspaces, repositories, viewpoints, and exports', async () => {
    // Mock: no existing data (all MATCH queries return empty)
    // Then successful CREATE queries
    // Then validation counts
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return [] // No existing data
      }
      if (query.includes('count(w)')) {
        return [{ count: 3 }] // 3 workspaces created
      }
      if (query.includes('count(r)')) {
        return [{ count: 3 }] // 3 repositories created
      }
      if (query.includes('count(v)')) {
        return [{ count: 3 }] // 3 viewpoints created
      }
      if (query.includes('count(e)')) {
        return [{ count: 3 }] // 3 exports created
      }
      return []
    })

    await seedDatabase()

    const calls = vi.mocked(queryUtils.runQuery).mock.calls

    // Verify workspaces were created
    const workspaceCreates = calls.filter(([query]) => query.includes('CREATE (w:Workspace'))
    expect(workspaceCreates.length).toBeGreaterThan(0)

    // Verify repositories were created
    const repoCreates = calls.filter(([query]) => query.includes('CREATE (r:Repository'))
    expect(repoCreates.length).toBeGreaterThan(0)

    // Verify viewpoints were created
    const viewpointCreates = calls.filter(([query]) => query.includes('CREATE (v:Viewpoint'))
    expect(viewpointCreates.length).toBeGreaterThan(0)

    // Verify exports were created
    const exportCreates = calls.filter(([query]) => query.includes('CREATE (e:Export'))
    expect(exportCreates.length).toBeGreaterThan(0)

    // Verify validation queries were run
    const validationCalls = calls.filter(([query]) => query.includes('count'))
    expect(validationCalls.length).toBeGreaterThanOrEqual(4) // At least 4 count queries
  })

  it('should be idempotent - skip existing data', async () => {
    // Mock: all data already exists
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return [{ id: 'existing-id' }] // Existing data
      }
      if (query.includes('count')) {
        return [{ count: 5 }] // Sufficient data exists
      }
      return []
    })

    await seedDatabase()

    const calls = vi.mocked(queryUtils.runQuery).mock.calls

    // Should not call any CREATE queries since data exists
    const createCalls = calls.filter(([query]) => query.includes('CREATE'))
    expect(createCalls.length).toBe(0)
  })

  it('should create multiple workspaces with different configs', async () => {
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return []
      }
      if (query.includes('count')) {
        return [{ count: 3 }]
      }
      return []
    })

    await seedDatabase()

    const workspaceCalls = vi
      .mocked(queryUtils.runQuery)
      .mock.calls.filter(([query]) => query.includes('CREATE (w:Workspace'))

    // Should create at least 3 workspaces
    expect(workspaceCalls.length).toBeGreaterThanOrEqual(3)

    // Verify workspace IDs are unique
    const workspaceIds = workspaceCalls.map(([, params]) => (params as Record<string, unknown>).id)
    expect(new Set(workspaceIds).size).toBe(workspaceCalls.length)

    // Verify at least one workspace has multiple repositories
    const multiRepoWorkspace = workspaceCalls.find(([, params]) => {
      const repos = JSON.parse((params as Record<string, unknown>).repositories as string)
      return repos.length > 0
    })
    expect(multiRepoWorkspace).toBeDefined()
  })

  it('should fail validation if insufficient data created', async () => {
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return []
      }
      if (query.includes('count')) {
        return [{ count: 0 }] // No data - validation should fail
      }
      return []
    })

    await expect(seedDatabase()).rejects.toThrow(/Expected at least/)
  })

  it('should throw error if seeding fails', async () => {
    vi.mocked(queryUtils.runQuery).mockRejectedValueOnce(new Error('DB connection error'))

    await expect(seedDatabase()).rejects.toThrow('DB connection error')
  })

  it('should create workspaces with correct structure', async () => {
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return []
      }
      if (query.includes('count')) {
        return [{ count: 3 }]
      }
      return []
    })

    await seedDatabase()

    const workspaceCalls = vi
      .mocked(queryUtils.runQuery)
      .mock.calls.filter(([query]) => query.includes('CREATE (w:Workspace'))

    const firstWorkspace = workspaceCalls[0]![1] as Record<string, unknown>

    // Verify required fields exist
    expect(firstWorkspace.id).toBeDefined()
    expect(firstWorkspace.name).toBeDefined()
    expect(firstWorkspace.ownerId).toBe('dev-user')
    expect(firstWorkspace.repositories).toBeDefined()
    expect(firstWorkspace.members).toBeDefined()
    expect(firstWorkspace.settings).toBeDefined()
    expect(firstWorkspace.createdAt).toBeDefined()
    expect(firstWorkspace.updatedAt).toBeDefined()

    // Verify JSON fields are valid
    expect(() => JSON.parse(firstWorkspace.repositories as string)).not.toThrow()
    expect(() => JSON.parse(firstWorkspace.members as string)).not.toThrow()
    expect(() => JSON.parse(firstWorkspace.settings as string)).not.toThrow()
  })

  it('should create repositories with language metadata', async () => {
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return []
      }
      if (query.includes('count')) {
        return [{ count: 3 }]
      }
      return []
    })

    await seedDatabase()

    const repoCalls = vi
      .mocked(queryUtils.runQuery)
      .mock.calls.filter(([query]) => query.includes('CREATE (r:Repository'))

    expect(repoCalls.length).toBeGreaterThanOrEqual(3)

    // Verify languages are set
    const languages = repoCalls.map(([, params]) => (params as Record<string, unknown>).language)
    expect(languages).toContain('javascript')
    expect(languages).toContain('typescript')
  })

  it('should create viewpoints with camera and filters', async () => {
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return []
      }
      if (query.includes('count')) {
        return [{ count: 3 }]
      }
      return []
    })

    await seedDatabase()

    const viewpointCalls = vi
      .mocked(queryUtils.runQuery)
      .mock.calls.filter(([query]) => query.includes('CREATE (v:Viewpoint'))

    expect(viewpointCalls.length).toBeGreaterThanOrEqual(3)

    const firstViewpoint = viewpointCalls[0]![1] as Record<string, unknown>

    // Verify camera state exists and is valid JSON
    expect(firstViewpoint.camera).toBeDefined()
    const camera = JSON.parse(firstViewpoint.camera as string)
    expect(camera.position).toBeDefined()
    expect(camera.target).toBeDefined()

    // Verify filters exist and are valid JSON
    expect(firstViewpoint.filters).toBeDefined()
    expect(() => JSON.parse(firstViewpoint.filters as string)).not.toThrow()
  })

  it('should create exports with different formats', async () => {
    vi.mocked(queryUtils.runQuery).mockImplementation(async (query: string) => {
      if (query.includes('MATCH') && !query.includes('count')) {
        return []
      }
      if (query.includes('count')) {
        return [{ count: 3 }]
      }
      return []
    })

    await seedDatabase()

    const exportCalls = vi
      .mocked(queryUtils.runQuery)
      .mock.calls.filter(([query]) => query.includes('CREATE (e:Export'))

    expect(exportCalls.length).toBeGreaterThanOrEqual(3)

    const formats = exportCalls.map(([, params]) => (params as Record<string, unknown>).format)

    // Verify multiple export formats
    const uniqueFormats = new Set(formats)
    expect(uniqueFormats.size).toBeGreaterThan(1)
    expect(formats).toContain('plantuml')
  })
})
