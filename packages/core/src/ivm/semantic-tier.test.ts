import { describe, it, expect } from 'vitest'
import {
  SemanticTier,
  SEMANTIC_TIER_DESCRIPTIONS,
  NODE_TYPE_TO_TIER,
  AGGREGATABLE_EDGE_TYPES,
} from './semantic-tier.js'

describe('SemanticTier', () => {
  it('has correct numeric values (0-5)', () => {
    expect(SemanticTier.Repository).toBe(0)
    expect(SemanticTier.Package).toBe(1)
    expect(SemanticTier.Module).toBe(2)
    expect(SemanticTier.File).toBe(3)
    expect(SemanticTier.Symbol).toBe(4)
    expect(SemanticTier.Detail).toBe(5)
  })
})

describe('SEMANTIC_TIER_DESCRIPTIONS', () => {
  it('has entries for all 6 tiers', () => {
    const tiers = [
      SemanticTier.Repository,
      SemanticTier.Package,
      SemanticTier.Module,
      SemanticTier.File,
      SemanticTier.Symbol,
      SemanticTier.Detail,
    ]

    for (const tier of tiers) {
      expect(SEMANTIC_TIER_DESCRIPTIONS[tier]).toBeDefined()
      expect(typeof SEMANTIC_TIER_DESCRIPTIONS[tier]).toBe('string')
      expect(SEMANTIC_TIER_DESCRIPTIONS[tier].length).toBeGreaterThan(0)
    }

    expect(Object.keys(SEMANTIC_TIER_DESCRIPTIONS)).toHaveLength(6)
  })
})

describe('AGGREGATABLE_EDGE_TYPES', () => {
  it('includes the 7 aggregatable edge types', () => {
    expect(AGGREGATABLE_EDGE_TYPES).toContain('imports')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('calls')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('extends')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('implements')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('uses')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('depends_on')
    expect(AGGREGATABLE_EDGE_TYPES).toContain('exports')
    expect(AGGREGATABLE_EDGE_TYPES).toHaveLength(7)
  })

  it('excludes structural and type-detail edge types', () => {
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('contains')
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('type_of')
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('returns')
    expect(AGGREGATABLE_EDGE_TYPES).not.toContain('parameter_of')
  })
})

describe('NODE_TYPE_TO_TIER', () => {
  it('maps all 13 node types to the correct tier', () => {
    expect(NODE_TYPE_TO_TIER.repository).toBe(SemanticTier.Repository)
    expect(NODE_TYPE_TO_TIER.package).toBe(SemanticTier.Package)
    expect(NODE_TYPE_TO_TIER.namespace).toBe(SemanticTier.Package)
    expect(NODE_TYPE_TO_TIER.directory).toBe(SemanticTier.Module)
    expect(NODE_TYPE_TO_TIER.module).toBe(SemanticTier.Module)
    expect(NODE_TYPE_TO_TIER.file).toBe(SemanticTier.File)
    expect(NODE_TYPE_TO_TIER.class).toBe(SemanticTier.Symbol)
    expect(NODE_TYPE_TO_TIER.interface).toBe(SemanticTier.Symbol)
    expect(NODE_TYPE_TO_TIER.enum).toBe(SemanticTier.Symbol)
    expect(NODE_TYPE_TO_TIER.function).toBe(SemanticTier.Symbol)
    expect(NODE_TYPE_TO_TIER.type).toBe(SemanticTier.Detail)
    expect(NODE_TYPE_TO_TIER.method).toBe(SemanticTier.Detail)
    expect(NODE_TYPE_TO_TIER.variable).toBe(SemanticTier.Detail)
  })

  it('covers all 13 node types', () => {
    expect(Object.keys(NODE_TYPE_TO_TIER)).toHaveLength(13)
  })
})
