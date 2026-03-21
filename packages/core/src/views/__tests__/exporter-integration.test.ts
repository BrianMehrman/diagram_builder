/**
 * Integration test: exportWithView + real exporters
 *
 * Verifies that each sync exporter produces valid ExportResult objects
 * when fed tier-produced IVMGraphs via exportWithView.
 */

import { describe, it, expect } from 'vitest'
import type { IVMGraph, IVMNode, IVMEdge, GraphMetadata } from '../../ivm/types.js'
import { IVM_SCHEMA_VERSION } from '../../ivm/types.js'
import type { ParseResult, GroupHierarchy, GroupNode } from '../../ivm/semantic-tier.js'
import { SemanticTier } from '../../ivm/semantic-tier.js'
import type { ExportResult, Exporter, BaseExportOptions } from '../../exporters/types.js'
import { MermaidExporter } from '../../exporters/mermaid.js'
import { PlantUMLExporter } from '../../exporters/plantuml.js'
import { DrawioExporter } from '../../exporters/drawio.js'
import { SVGExporter } from '../../exporters/svg.js'
import { GLTFExporter } from '../../exporters/gltf.js'
import { exportWithView } from '../export-with-view.js'

// =============================================================================
// Test Fixtures
// =============================================================================

function makeNode(overrides: Partial<IVMNode> & { id: string; type: IVMNode['type'] }): IVMNode {
  return {
    id: overrides.id,
    type: overrides.type,
    position: overrides.position ?? { x: 0, y: 0, z: 0 },
    lod: overrides.lod ?? SemanticTier.Detail,
    parentId: overrides.parentId,
    metadata: {
      label: overrides.metadata?.label ?? overrides.id,
      path: overrides.metadata?.path ?? overrides.id,
      ...overrides.metadata,
    },
  }
}

function makeEdge(
  overrides: Partial<IVMEdge> & { source: string; target: string; type: IVMEdge['type'] }
): IVMEdge {
  return {
    id: overrides.id ?? `${overrides.source}->${overrides.target}`,
    source: overrides.source,
    target: overrides.target,
    type: overrides.type,
    lod: overrides.lod ?? SemanticTier.Detail,
    metadata: {
      label: overrides.metadata?.label,
      ...overrides.metadata,
    },
  }
}

/**
 * Builds a realistic IVMGraph with files, classes, functions, and edges.
 */
function buildTestGraph(): IVMGraph {
  const nodes: IVMNode[] = [
    makeNode({ id: 'repo', type: 'repository', lod: SemanticTier.Repository }),
    makeNode({ id: 'pkg-core', type: 'package', lod: SemanticTier.Package, parentId: 'repo' }),
    makeNode({ id: 'dir-src', type: 'directory', lod: SemanticTier.Module, parentId: 'pkg-core' }),
    makeNode({
      id: 'file-user',
      type: 'file',
      lod: SemanticTier.File,
      parentId: 'dir-src',
      metadata: { label: 'user.ts', path: 'src/user.ts', language: 'typescript' },
    }),
    makeNode({
      id: 'file-auth',
      type: 'file',
      lod: SemanticTier.File,
      parentId: 'dir-src',
      metadata: { label: 'auth.ts', path: 'src/auth.ts', language: 'typescript' },
    }),
    makeNode({
      id: 'class-user',
      type: 'class',
      lod: SemanticTier.Symbol,
      parentId: 'file-user',
      metadata: { label: 'User', path: 'src/user.ts::User' },
    }),
    makeNode({
      id: 'fn-login',
      type: 'function',
      lod: SemanticTier.Symbol,
      parentId: 'file-auth',
      metadata: { label: 'login', path: 'src/auth.ts::login' },
    }),
    makeNode({
      id: 'method-getName',
      type: 'method',
      lod: SemanticTier.Detail,
      parentId: 'class-user',
      metadata: { label: 'getName', path: 'src/user.ts::User.getName' },
    }),
  ]

  const edges: IVMEdge[] = [
    makeEdge({ source: 'repo', target: 'pkg-core', type: 'contains' }),
    makeEdge({ source: 'pkg-core', target: 'dir-src', type: 'contains' }),
    makeEdge({ source: 'dir-src', target: 'file-user', type: 'contains' }),
    makeEdge({ source: 'dir-src', target: 'file-auth', type: 'contains' }),
    makeEdge({ source: 'file-user', target: 'class-user', type: 'contains' }),
    makeEdge({ source: 'file-auth', target: 'fn-login', type: 'contains' }),
    makeEdge({ source: 'class-user', target: 'method-getName', type: 'contains' }),
    makeEdge({ source: 'file-auth', target: 'file-user', type: 'imports' }),
    makeEdge({ source: 'fn-login', target: 'class-user', type: 'uses' }),
  ]

  const metadata: GraphMetadata = {
    name: 'test-project',
    schemaVersion: IVM_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    rootPath: '/test',
    languages: ['typescript'],
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodesByType: {} as Record<string, number>,
      edgesByType: {} as Record<string, number>,
    },
  }

  return {
    nodes,
    edges,
    metadata,
    bounds: {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    },
  }
}

/**
 * Build a minimal ParseResult where every tier points to the same full graph.
 * This tests exporter compatibility, not tier materialization.
 */
function buildParseResult(): ParseResult {
  const graph = buildTestGraph()

  const rootGroup: GroupNode = {
    id: 'root',
    label: 'root',
    tier: SemanticTier.Repository,
    nodeIds: ['repo'],
    children: [],
  }

  const hierarchy: GroupHierarchy = {
    root: rootGroup,
    tierCount: {
      [SemanticTier.Repository]: 1,
      [SemanticTier.Package]: 1,
      [SemanticTier.Module]: 1,
      [SemanticTier.File]: 2,
      [SemanticTier.Symbol]: 2,
      [SemanticTier.Detail]: 1,
    },
    edgesByTier: {
      [SemanticTier.Repository]: [],
      [SemanticTier.Package]: [],
      [SemanticTier.Module]: [],
      [SemanticTier.File]: [],
      [SemanticTier.Symbol]: [],
      [SemanticTier.Detail]: [],
    },
  }

  const tiers: Record<SemanticTier, IVMGraph> = {
    [SemanticTier.Repository]: graph,
    [SemanticTier.Package]: graph,
    [SemanticTier.Module]: graph,
    [SemanticTier.File]: graph,
    [SemanticTier.Symbol]: graph,
    [SemanticTier.Detail]: graph,
  }

  return { graph, hierarchy, tiers }
}

// =============================================================================
// Exporter definitions with expected mimeType and extension
// =============================================================================

interface ExporterSpec {
  name: string
  exporter: Exporter<BaseExportOptions>
  mimeType: string
  extension: string
}

// PNG is excluded: its sync export() falls back to text/plain (requires a browser renderer for actual PNG)
const EXPORTERS: ExporterSpec[] = [
  {
    name: 'Mermaid',
    exporter: new MermaidExporter(),
    mimeType: 'text/x-mermaid',
    extension: 'mmd',
  },
  {
    name: 'PlantUML',
    exporter: new PlantUMLExporter(),
    mimeType: 'text/x-plantuml',
    extension: 'puml',
  },
  {
    name: 'Draw.io',
    exporter: new DrawioExporter(),
    mimeType: 'application/vnd.jgraph.mxfile',
    extension: 'drawio',
  },
  { name: 'SVG', exporter: new SVGExporter(), mimeType: 'image/svg+xml', extension: 'svg' },
  { name: 'GLTF', exporter: new GLTFExporter(), mimeType: 'model/gltf+json', extension: 'gltf' },
]

// =============================================================================
// Tests
// =============================================================================

describe('exportWithView - exporter integration', () => {
  const parseResult = buildParseResult()

  for (const spec of EXPORTERS) {
    describe(spec.name, () => {
      it('produces valid ExportResult at SemanticTier.File', () => {
        const result: ExportResult = exportWithView(parseResult, spec.exporter, {
          tier: SemanticTier.File,
        })

        expect(result).toBeDefined()
        expect(result.content).toBeTruthy()
        expect(result.mimeType).toBe(spec.mimeType)
        expect(result.extension).toBe(spec.extension)
        expect(result.stats.nodeCount).toBeGreaterThan(0)
        expect(result.stats.duration).toBeGreaterThanOrEqual(0)
        expect(result.stats.size).toBeGreaterThan(0)
      })

      it('produces valid ExportResult at SemanticTier.Detail', () => {
        const result: ExportResult = exportWithView(parseResult, spec.exporter, {
          tier: SemanticTier.Detail,
        })

        expect(result).toBeDefined()
        expect(result.content).toBeTruthy()
        expect(result.mimeType).toBe(spec.mimeType)
        expect(result.extension).toBe(spec.extension)
        expect(result.stats.nodeCount).toBeGreaterThan(0)
        expect(result.stats.size).toBeGreaterThan(0)
      })

      it('produces valid ExportResult with no tier (uses full graph)', () => {
        const result: ExportResult = exportWithView(parseResult, spec.exporter)

        expect(result).toBeDefined()
        expect(result.content).toBeTruthy()
        expect(result.mimeType).toBe(spec.mimeType)
        expect(result.extension).toBe(spec.extension)
        expect(result.stats.nodeCount).toBeGreaterThan(0)
      })
    })
  }

  it('content differs between different exporters for the same graph', () => {
    const results = EXPORTERS.map((spec) =>
      exportWithView(parseResult, spec.exporter, { tier: SemanticTier.File })
    )

    // Each exporter should produce unique content
    const contents = results.map((r) => String(r.content))
    const uniqueContents = new Set(contents)
    expect(uniqueContents.size).toBe(EXPORTERS.length)
  })
})
