import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { runQuery, runSingleQuery, runTransaction, TransactionQuery } from './query-utils';
import { closeDriver } from './neo4j-config';

// Mock Neo4j driver
const mockClose = vi.fn();
const mockRun = vi.fn();
const mockExecuteWrite = vi.fn();

const mockSession = {
  run: mockRun,
  close: mockClose,
  executeWrite: mockExecuteWrite,
};

const mockDriver = {
  session: vi.fn(() => mockSession),
};

vi.mock('./neo4j-config', () => ({
  getDriver: vi.fn(() => mockDriver),
  closeDriver: vi.fn(),
}));

describe('Query Utilities', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.NEO4J_URI = 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME = 'neo4j';
    process.env.NEO4J_PASSWORD = 'test-password';

    // Reset mocks
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await closeDriver();
    process.env = originalEnv;
  });

  describe('runQuery', () => {
    it('should return empty array for query without results', async () => {
      mockRun.mockResolvedValue({ records: [] });

      const results = await runQuery('RETURN 1 as result WHERE false');

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
      expect(mockClose).toHaveBeenCalled();
    });

    it('should return results as array of objects', async () => {
      mockRun.mockResolvedValue({
        records: [
          {
            toObject: () => ({ num: 1, str: 'test' }),
          },
        ],
      });

      const results = await runQuery('RETURN 1 as num, "test" as str');

      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(1);
      expect(results[0]).toHaveProperty('num');
      expect(results[0]).toHaveProperty('str');
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle query parameters', async () => {
      mockRun.mockResolvedValue({
        records: [
          {
            toObject: () => ({ value: 42 }),
          },
        ],
      });

      const results = await runQuery<{ value: number }>(
        'RETURN $value as value',
        { value: 42 }
      );

      expect(results[0]?.value).toBe(42);
      expect(mockRun).toHaveBeenCalledWith('RETURN $value as value', { value: 42 });
      expect(mockClose).toHaveBeenCalled();
    });
  });

  describe('runSingleQuery', () => {
    it('should return single numeric result', async () => {
      mockRun.mockResolvedValue({
        records: [
          {
            toObject: () => ({ result: 100 }),
          },
        ],
      });

      const result = await runSingleQuery('RETURN 100 as result');

      expect(typeof result).toBe('number');
      expect(result).toBe(100);
    });

    it('should return 0 for query without results', async () => {
      mockRun.mockResolvedValue({ records: [] });

      const result = await runSingleQuery('RETURN 1 as result WHERE false');

      expect(result).toBe(0);
    });

    it('should handle query parameters', async () => {
      mockRun.mockResolvedValue({
        records: [
          {
            toObject: () => ({ result: 123 }),
          },
        ],
      });

      const result = await runSingleQuery(
        'RETURN $value as result',
        { value: 123 }
      );

      expect(result).toBe(123);
    });
  });

  describe('runTransaction', () => {
    it('should execute multiple queries in transaction', async () => {
      const mockTx = {
        run: vi.fn().mockResolvedValue({ records: [] }),
      };
      mockExecuteWrite.mockImplementation(async (fn: any) => {
        await fn(mockTx);
      });

      const queries: TransactionQuery[] = [
        { cypher: 'RETURN 1 as result' },
        { cypher: 'RETURN 2 as result' },
        { cypher: 'RETURN 3 as result' }
      ];

      await expect(runTransaction(queries)).resolves.not.toThrow();
      expect(mockTx.run).toHaveBeenCalledTimes(3);
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle queries with parameters', async () => {
      const mockTx = {
        run: vi.fn().mockResolvedValue({ records: [] }),
      };
      mockExecuteWrite.mockImplementation(async (fn: any) => {
        await fn(mockTx);
      });

      const queries: TransactionQuery[] = [
        { cypher: 'RETURN $value as result', params: { value: 1 } },
        { cypher: 'RETURN $value as result', params: { value: 2 } }
      ];

      await expect(runTransaction(queries)).resolves.not.toThrow();
      expect(mockTx.run).toHaveBeenCalledWith('RETURN $value as result', { value: 1 });
      expect(mockTx.run).toHaveBeenCalledWith('RETURN $value as result', { value: 2 });
      expect(mockClose).toHaveBeenCalled();
    });

    it('should handle empty transaction', async () => {
      const mockTx = {
        run: vi.fn().mockResolvedValue({ records: [] }),
      };
      mockExecuteWrite.mockImplementation(async (fn: any) => {
        await fn(mockTx);
      });

      const queries: TransactionQuery[] = [];

      await expect(runTransaction(queries)).resolves.not.toThrow();
      expect(mockTx.run).not.toHaveBeenCalled();
      expect(mockClose).toHaveBeenCalled();
    });
  });
});
