import { SpanStatusCode, trace } from '@opentelemetry/api'
import { readFile } from 'fs/promises'
import path from 'path'
import { loadRepository, type RepositoryConfig } from '../repository/repository-loader'
import { buildDependencyGraph } from '../graph/graph-builder'
import { convertToIVM, type IVMConversionOptions } from '../ivm/ivm-converter'
import type { IVMGraph } from '../../../core/src/ivm/types.js'
import { parserFilesTotal, parserRunDuration, parserErrorsTotal } from './metrics'
import { logger } from '../logger'

function detectLanguage(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const map: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
  }
  return map[ext] ?? 'unknown'
}

/**
 * Runs the full parser pipeline with OTEL tracing and metrics:
 *   parser.run (root)
 *     ├── parser.scan   — loadRepository
 *     ├── parser.parse  — read file contents + buildDependencyGraph
 *     └── parser.graph  — convertToIVM
 */
export async function runParserPipeline(
  repoConfig: RepositoryConfig,
  ivmOptions: IVMConversionOptions
): Promise<IVMGraph> {
  const tracer = trace.getTracer('diagram-builder-parser')

  return tracer.startActiveSpan('parser.run', async (rootSpan) => {
    try {
      // ── Phase 1: Scan ──────────────────────────────────────────────────────
      const scanStart = Date.now()
      const repoContext = await tracer.startActiveSpan('parser.scan', async (scanSpan) => {
        try {
          const ctx = await loadRepository(repoConfig)
          scanSpan.setAttributes({
            repository_path: ctx.path,
            file_count: ctx.files.length,
          })
          scanSpan.setStatus({ code: SpanStatusCode.OK })
          return ctx
        } catch (err) {
          scanSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : String(err),
          })
          scanSpan.recordException(err instanceof Error ? err : new Error(String(err)))
          throw err
        } finally {
          scanSpan.end()
        }
      })

      const language = detectLanguage(repoContext.files[0] ?? '')
      parserRunDuration.record((Date.now() - scanStart) / 1000, { language, phase: 'scan' })

      rootSpan.setAttributes({
        repository_path: repoContext.path,
        file_count: repoContext.files.length,
        language,
      })

      // ── Phase 2: Parse ─────────────────────────────────────────────────────
      const parseStart = Date.now()
      const fileInputs = await tracer.startActiveSpan('parser.parse', async (parseSpan) => {
        const inputs: Array<{ filePath: string; content: string }> = []

        for (const filePath of repoContext.files) {
          const lang = detectLanguage(filePath)
          try {
            const content = await readFile(filePath, 'utf-8')
            if (content.includes('\0')) {
              parserFilesTotal.add(1, { language: lang, status: 'skipped' })
              continue
            }
            inputs.push({ filePath, content })
            parserFilesTotal.add(1, { language: lang, status: 'parsed' })
          } catch (err) {
            logger.warn('Failed to read file', {
              filePath,
              error: (err as Error).message,
            })
            parserFilesTotal.add(1, { language: lang, status: 'error' })
            parserErrorsTotal.add(1, { language: lang, error_type: 'read_error' })
          }
        }

        parseSpan.setAttributes({ files_parsed: inputs.length })
        parseSpan.setStatus({ code: SpanStatusCode.OK })
        parseSpan.end()
        return inputs
      })

      parserRunDuration.record((Date.now() - parseStart) / 1000, { language, phase: 'parse' })

      // Build dependency graph (synchronous — no active span wrapper needed)
      const depGraph = buildDependencyGraph(fileInputs)

      // ── Phase 3: Graph ─────────────────────────────────────────────────────
      const graphStart = Date.now()
      const ivm = tracer.startActiveSpan('parser.graph', (graphSpan) => {
        try {
          const result = convertToIVM(depGraph, repoContext, ivmOptions)
          graphSpan.setAttributes({
            node_count: result.nodes.length,
            edge_count: result.edges.length,
          })
          graphSpan.setStatus({ code: SpanStatusCode.OK })
          return result
        } catch (err) {
          graphSpan.setStatus({
            code: SpanStatusCode.ERROR,
            message: err instanceof Error ? err.message : String(err),
          })
          graphSpan.recordException(err instanceof Error ? err : new Error(String(err)))
          parserErrorsTotal.add(1, { language, error_type: 'graph_error' })
          throw err
        } finally {
          graphSpan.end()
        }
      })

      parserRunDuration.record((Date.now() - graphStart) / 1000, { language, phase: 'graph' })

      rootSpan.setStatus({ code: SpanStatusCode.OK })

      if (repoContext.cleanup) {
        await repoContext.cleanup()
      }

      return ivm
    } catch (err) {
      rootSpan.setStatus({
        code: SpanStatusCode.ERROR,
        message: err instanceof Error ? err.message : String(err),
      })
      rootSpan.recordException(err instanceof Error ? err : new Error(String(err)))
      throw err
    } finally {
      rootSpan.end()
    }
  })
}
