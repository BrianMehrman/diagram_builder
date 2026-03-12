/**
 * Export Demo Script
 *
 * Parses the small-ts-repo fixture codebase using the real parser,
 * then exports the resulting IVMGraph through all 6 exporters.
 */

import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const FIXTURE_PATH = join(root, 'tests/fixtures/repositories/small-ts-repo')
const OUTPUT_DIR = join(root, 'scripts/demo-output')

function hr(char = '─', width = 70) {
  return char.repeat(width)
}
function banner(title: string) {
  console.log('\n' + hr('═'))
  console.log(`  ${title}`)
  console.log(hr('═'))
}
function section(title: string) {
  console.log('\n' + hr())
  console.log(`  ${title}`)
  console.log(hr())
}

async function main() {
  banner('📦  Export Demo — small-ts-repo')
  console.log(`\nSource: ${FIXTURE_PATH}`)
  console.log('\nSource files:')
  console.log('  src/index.ts        — entry point, imports User + formatUser')
  console.log('  src/models/User.ts  — User class with getDisplayName()')
  console.log('  src/utils/helpers.ts — formatUser(), validateEmail()')

  // ── 1. Parse the real fixture codebase ─────────────────────────────────
  const { loadRepository, buildDependencyGraph, convertToIVM } =
    await import('@diagram-builder/parser')
  const { readFile } = await import('fs/promises')

  console.log('\n⏳  Parsing...')
  const repoContext = await loadRepository(FIXTURE_PATH, {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  })

  const fileInputs = await Promise.all(
    repoContext.files.map(async (filePath: string) => ({
      filePath,
      content: await readFile(filePath, 'utf-8'),
    }))
  )

  const depGraph = buildDependencyGraph(fileInputs)
  const graph = convertToIVM(depGraph, repoContext, { name: 'small-ts-repo' })

  section('📊  Parse Results')
  console.log(`  Nodes : ${graph.nodes.length}`)
  console.log(`  Edges : ${graph.edges.length}`)
  console.log('\n  Node breakdown:')
  const byType: Record<string, number> = {}
  for (const n of graph.nodes) {
    byType[n.type] = (byType[n.type] ?? 0) + 1
  }
  for (const [type, count] of Object.entries(byType).sort()) {
    console.log(`    ${type.padEnd(16)} ${count}`)
  }
  console.log('\n  Nodes (LOD | type | label):')
  for (const n of graph.nodes) {
    console.log(`    [${n.lod}] ${n.type.padEnd(12)} ${n.metadata?.label ?? n.id}`)
  }
  console.log('\n  Edges:')
  for (const e of graph.edges) {
    const src = graph.nodes.find((n) => n.id === e.source)?.metadata?.label ?? e.source
    const tgt = graph.nodes.find((n) => n.id === e.target)?.metadata?.label ?? e.target
    console.log(`    ${String(src).padEnd(20)} --[${e.type}]--> ${tgt}`)
  }

  // ── 2. Run all exporters ──────────────────────────────────────────────────
  const { exportToPlantUML, exportToMermaid, exportToDrawio, exportToGLTF, exportToSVG } =
    await import('@diagram-builder/core')

  mkdirSync(OUTPUT_DIR, { recursive: true })

  const formatExports = [
    { name: 'PlantUML', ext: 'puml', fn: () => exportToPlantUML(graph) },
    { name: 'Mermaid', ext: 'mmd', fn: () => exportToMermaid(graph) },
    { name: 'Draw.io', ext: 'drawio', fn: () => exportToDrawio(graph) },
    { name: 'GLTF', ext: 'gltf', fn: () => exportToGLTF(graph) },
    { name: 'SVG', ext: 'svg', fn: () => exportToSVG(graph) },
  ]

  for (const { name, ext, fn } of formatExports) {
    section(`📄  ${name} (.${ext})`)
    try {
      const result = fn()
      const outPath = join(OUTPUT_DIR, `export.${ext}`)
      writeFileSync(outPath, result.content, 'utf-8')
      console.log(`  MIME    : ${result.mimeType}`)
      console.log(`  Size    : ${result.stats.size} bytes`)
      console.log(`  Nodes   : ${result.stats.nodeCount}`)
      console.log(`  Edges   : ${result.stats.edgeCount}`)
      console.log(`  File    : scripts/demo-output/export.${ext}`)
      console.log('\n  Content:')
      const lines = result.content.split('\n')
      const preview = lines.slice(0, 35)
      console.log(preview.map((l) => '    ' + l).join('\n'))
      if (lines.length > 35) console.log(`    ... (${lines.length - 35} more lines)`)
    } catch (err: any) {
      console.log(`  ❌  Export failed: ${err.message}`)
    }
  }

  banner('✅  Demo complete')
  console.log(`\nAll files saved to: ${OUTPUT_DIR}\n`)
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
