import type { GraphInput } from '../../../core/src/ivm/types.js'
import type { RepositoryContext } from '../repository/repository-loader'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

// Read package version at module load time
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const packageJsonPath = join(__dirname, '../../package.json')
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8')) as { version: string }
const PARSER_VERSION = packageJson.version

/**
 * Enriches GraphInput metadata with repository context information
 *
 * @param graphInput - GraphInput to enrich
 * @param repoContext - Repository context with metadata
 * @returns Enriched GraphInput
 */
export function enrichGraphMetadata(
  graphInput: GraphInput,
  repoContext: RepositoryContext
): GraphInput {
  const enrichedMetadata = { ...graphInput.metadata }

  // Add repository URL and branch for Git repositories
  if (repoContext.metadata.type === 'git') {
    if (repoContext.metadata.url) {
      enrichedMetadata.repositoryUrl = repoContext.metadata.url
    }
    if (repoContext.metadata.branch) {
      enrichedMetadata.branch = repoContext.metadata.branch
    }
  }

  // Enrich custom properties
  const properties: Record<string, unknown> = {
    ...enrichedMetadata.properties,
  }

  // Add repository type
  properties.repositoryType = repoContext.metadata.type

  // Add file count
  properties.fileCount = repoContext.metadata.fileCount

  // Add scan timestamp
  properties.scannedAt = repoContext.metadata.scannedAt.toISOString()

  // Add parser version information
  properties.parserPackage = '@diagram-builder/parser'
  properties.parserVersion = PARSER_VERSION

  enrichedMetadata.properties = properties

  return {
    ...graphInput,
    metadata: enrichedMetadata,
  }
}
