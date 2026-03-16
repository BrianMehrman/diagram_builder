import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('WorkspacePage migration guard', () => {
  it('WorkspacePage.tsx must not reference graphData state', () => {
    const src = readFileSync(join(__dirname, 'WorkspacePage.tsx'), 'utf8')
    expect(src).not.toContain('graphData')
    expect(src).not.toContain('setGraphData')
  })
})
