import { buildGraph } from '../../../core/src/ivm/builder.js'
import type { GraphInput, IVMGraph } from '../../../core/src/ivm/types.js'
import type { DependencyGraph } from '../graph/dependency-graph'
import type { RepositoryContext } from '../repository/repository-loader'
import { convertNodes } from './node-converter'
import { convertEdges } from './edge-converter'
import { enrichGraphMetadata } from './metadata-enricher'
import { validateIVM } from './validator'

/**
 * Options for IVM conversion
 */
export interface IVMConversionOptions {
  /** Name of the project/repository */
  name: string
  /** Whether to assign initial positions (default: true) */
  assignPositions?: boolean
  /** Position assignment strategy (default: 'grid') */
  positionStrategy?: 'grid' | 'hierarchical'
  /** Spacing between nodes (default: 100) */
  spacing?: number
}

/**
 * Converts a DependencyGraph to IVM (Internal Visualization Model) format
 *
 * This is the main conversion function that orchestrates:
 * 1. Node conversion (DependencyNode → NodeInput)
 * 2. Edge conversion (DependencyEdge → EdgeInput)
 * 3. Metadata enrichment (add repository context)
 * 4. Graph building (create IVMGraph with positions, LOD, bounds)
 * 5. Validation (ensure graph integrity)
 *
 * @param depGraph - Dependency graph to convert
 * @param repoContext - Repository context for metadata enrichment
 * @param options - Conversion options
 * @returns Complete IVM graph ready for layout engine and exporters
 * @throws Error if validation fails
 */
export function convertToIVM(
  depGraph: DependencyGraph,
  repoContext: RepositoryContext,
  options: IVMConversionOptions
): IVMGraph {
  // Step 1: Convert nodes
  const nodeInputs = convertNodes(depGraph.getNodes())

  // Step 2: Convert edges
  const edgeInputs = convertEdges(depGraph.getEdges())

  // Step 3: Create initial GraphInput
  const graphInput: GraphInput = {
    nodes: nodeInputs,
    edges: edgeInputs,
    metadata: {
      name: options.name,
      rootPath: repoContext.path,
      languages: [],
    },
  }

  // Step 4: Enrich metadata with repository context
  const enrichedGraphInput = enrichGraphMetadata(graphInput, repoContext)

  // Step 5: Build IVM graph (adds positions, LOD, bounds, stats)
  const ivm = buildGraph(enrichedGraphInput, {
    assignPositions: options.assignPositions ?? true,
    positionStrategy: options.positionStrategy ?? 'grid',
    spacing: options.spacing ?? 100,
  })

  // Step 6: Validate IVM graph
  const validation = validateIVM(ivm)
  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => `  - ${e.message}`).join('\n')
    throw new Error(
      `IVM validation failed with ${validation.errors.length} error(s):\n${errorMessages}`
    )
  }

  return ivm
}
