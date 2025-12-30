/**
 * Unit tests for graph validation schemas
 */

import { describe, it, expect } from 'vitest';
import { customQuerySchema } from './graph-schemas';

describe('customQuerySchema', () => {
  it('should validate a valid query with params', () => {
    const result = customQuerySchema.safeParse({
      query: 'MATCH (n) WHERE n.id = $repoId RETURN n',
      params: { limit: 10 },
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe('MATCH (n) WHERE n.id = $repoId RETURN n');
      expect(result.data.params).toEqual({ limit: 10 });
    }
  });

  it('should validate a valid query without params', () => {
    const result = customQuerySchema.safeParse({
      query: 'MATCH (n) WHERE n.id = $repoId RETURN n',
    });

    expect(result.success).toBe(true);
  });

  it('should reject query without $repoId', () => {
    const result = customQuerySchema.safeParse({
      query: 'MATCH (n) RETURN n',
    });

    expect(result.success).toBe(false);
  });

  it('should reject empty query', () => {
    const result = customQuerySchema.safeParse({
      query: '',
    });

    expect(result.success).toBe(false);
  });
});
