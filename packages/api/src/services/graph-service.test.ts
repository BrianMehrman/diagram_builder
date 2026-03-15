import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Neo4j driver
const mockRun = vi.fn()
const mockClose = vi.fn()
const mockSession = { run: mockRun, close: mockClose }
const mockDriver = { session: vi.fn(() => mockSession) }

vi.mock('../database/neo4j-config', () => ({
  getDriver: vi.fn(() => mockDriver),
  closeDriver: vi.fn(),
}))

// Mock Redis cache — default: cache miss
const mockCacheGet = vi.fn().mockResolvedValue(null)
const mockCacheSet = vi.fn().mockResolvedValue(undefined)

vi.mock('../cache/cache-utils', () => ({
  get: (...args: unknown[]) => mockCacheGet(...args),
  set: (...args: unknown[]) => mockCacheSet(...args),
}))

import { getParseResult } from './graph-service'

describe('getParseResult', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCacheGet.mockResolvedValue(null)
    mockCacheSet.mockResolvedValue(undefined)
  })

  it('returns null when no repository is found in Neo4j', async () => {
    // Repository query returns empty
    mockRun.mockResolvedValueOnce({ records: [] })
    const result = await getParseResult('unknown-repo')
    expect(result).toBeNull()
  })

  it('returns a ParseResult with graph, hierarchy, and tiers when graph exists', async () => {
    const makeRecord = (fields: Record<string, unknown>) => ({
      keys: Object.keys(fields),
      get: (key: string) => fields[key],
      toObject: () => fields,
    })

    // First call: repository metadata query
    mockRun.mockResolvedValueOnce({
      records: [
        makeRecord({
          id: 'repo-1',
          name: 'test-repo',
          rootPath: '/repos/test',
          repositoryUrl: null,
          branch: null,
          commit: null,
          parsedAt: new Date().toISOString(),
        }),
      ],
    })

    // Second call: nodes query (empty)
    mockRun.mockResolvedValueOnce({ records: [] })

    // Third call: edges query (empty)
    mockRun.mockResolvedValueOnce({ records: [] })

    const result = await getParseResult('repo-1')
    expect(result).not.toBeNull()
    expect(result).toHaveProperty('graph')
    expect(result).toHaveProperty('hierarchy')
    expect(result).toHaveProperty('tiers')
  })

  it('returns cached ParseResult without hitting Neo4j', async () => {
    const cachedResult = { graph: {}, hierarchy: {}, tiers: {} }
    mockCacheGet.mockResolvedValueOnce(cachedResult)

    const result = await getParseResult('repo-1')
    expect(result).toEqual(cachedResult)
    expect(mockRun).not.toHaveBeenCalled()
  })
})
