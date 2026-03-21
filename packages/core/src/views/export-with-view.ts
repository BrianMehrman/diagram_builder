/**
 * Convenience function for exporting a view-resolved graph.
 *
 * Combines ViewResolver tier/view lookup with an Exporter in a single call.
 */

import type { Exporter, ExportResult, BaseExportOptions } from '../exporters/types.js'
import type { ParseResult } from '../ivm/semantic-tier.js'
import type { SemanticTier } from '../ivm/semantic-tier.js'
import type { ViewConfig } from './types.js'
import { createViewResolver } from './view-resolver.js'

export function exportWithView(
  parseResult: ParseResult,
  exporter: Exporter<BaseExportOptions>,
  options?: {
    tier?: SemanticTier
    viewConfig?: ViewConfig
    exportOptions?: BaseExportOptions
  }
): ExportResult {
  const resolver = createViewResolver(parseResult)

  let graph
  if (options?.viewConfig) {
    const viewResult = resolver.getView(options.viewConfig)
    graph = viewResult.graph
  } else if (options?.tier !== undefined) {
    graph = resolver.getTier(options.tier)
  } else {
    graph = parseResult.graph
  }

  return exporter.export(graph, options?.exportOptions)
}
