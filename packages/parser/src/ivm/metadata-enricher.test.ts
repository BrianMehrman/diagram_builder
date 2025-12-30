import { describe, it, expect } from 'vitest'
import type { GraphInput } from '../../../core/src/ivm/types.js'
import type { RepositoryContext } from '../repository/repository-loader'
import { enrichGraphMetadata } from './metadata-enricher'

describe('metadata-enricher', () => {
  describe('enrichGraphMetadata', () => {
    it('should enrich GraphInput with repository context from local directory', () => {
      const graphInput: GraphInput = {
        nodes: [],
        edges: [],
        metadata: {
          name: 'test-project',
          rootPath: '/path/to/project',
          languages: [],
        },
      }

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: ['src/a.ts', 'src/b.ts'],
        metadata: {
          type: 'local',
          fileCount: 2,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const enriched = enrichGraphMetadata(graphInput, repoContext)

      expect(enriched.metadata.name).toBe('test-project')
      expect(enriched.metadata.rootPath).toBe('/path/to/project')
      expect(enriched.metadata.properties?.repositoryType).toBe('local')
      expect(enriched.metadata.properties?.fileCount).toBe(2)
      expect(enriched.metadata.properties?.scannedAt).toBe('2025-01-01T00:00:00.000Z')
    })

    it('should enrich GraphInput with repository context from Git repository', () => {
      const graphInput: GraphInput = {
        nodes: [],
        edges: [],
        metadata: {
          name: 'example-repo',
          rootPath: '/tmp/cloned-repo',
          languages: [],
        },
      }

      const repoContext: RepositoryContext = {
        path: '/tmp/cloned-repo',
        files: ['index.ts'],
        metadata: {
          type: 'git',
          url: 'https://github.com/example/repo.git',
          branch: 'main',
          fileCount: 1,
          scannedAt: new Date('2025-01-01T12:00:00Z'),
        },
      }

      const enriched = enrichGraphMetadata(graphInput, repoContext)

      expect(enriched.metadata.name).toBe('example-repo')
      expect(enriched.metadata.rootPath).toBe('/tmp/cloned-repo')
      expect(enriched.metadata.repositoryUrl).toBe('https://github.com/example/repo.git')
      expect(enriched.metadata.branch).toBe('main')
      expect(enriched.metadata.properties?.repositoryType).toBe('git')
      expect(enriched.metadata.properties?.fileCount).toBe(1)
    })

    it('should preserve existing metadata properties', () => {
      const graphInput: GraphInput = {
        nodes: [],
        edges: [],
        metadata: {
          name: 'test-project',
          rootPath: '/path/to/project',
          languages: ['typescript'],
          properties: {
            existingProp: 'value',
          },
        },
      }

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: [],
        metadata: {
          type: 'local',
          fileCount: 0,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const enriched = enrichGraphMetadata(graphInput, repoContext)

      expect(enriched.metadata.properties?.existingProp).toBe('value')
      expect(enriched.metadata.properties?.repositoryType).toBe('local')
    })

    it('should add parser version information', () => {
      const graphInput: GraphInput = {
        nodes: [],
        edges: [],
        metadata: {
          name: 'test-project',
          rootPath: '/path/to/project',
          languages: [],
        },
      }

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: [],
        metadata: {
          type: 'local',
          fileCount: 0,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const enriched = enrichGraphMetadata(graphInput, repoContext)

      expect(enriched.metadata.properties?.parserPackage).toBe('@diagram-builder/parser')
      expect(typeof enriched.metadata.properties?.parserVersion).toBe('string')
    })

    it('should not add repositoryUrl or branch for local repositories', () => {
      const graphInput: GraphInput = {
        nodes: [],
        edges: [],
        metadata: {
          name: 'test-project',
          rootPath: '/path/to/project',
          languages: [],
        },
      }

      const repoContext: RepositoryContext = {
        path: '/path/to/project',
        files: [],
        metadata: {
          type: 'local',
          fileCount: 0,
          scannedAt: new Date('2025-01-01T00:00:00Z'),
        },
      }

      const enriched = enrichGraphMetadata(graphInput, repoContext)

      expect(enriched.metadata.repositoryUrl).toBeUndefined()
      expect(enriched.metadata.branch).toBeUndefined()
    })
  })
})
