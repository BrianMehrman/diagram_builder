import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getDriver, closeDriver } from './neo4j-config';

describe('Neo4j Configuration', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(async () => {
    await closeDriver();
    process.env = originalEnv;
  });

  describe('getDriver', () => {
    it('should create driver instance with valid configuration', () => {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      process.env.NEO4J_USERNAME = 'neo4j';
      process.env.NEO4J_PASSWORD = 'test-password';

      const driver = getDriver();

      expect(driver).toBeDefined();
      expect(driver).toHaveProperty('session');
      expect(driver).toHaveProperty('close');
    });

    it('should return same driver instance on subsequent calls (singleton)', () => {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      process.env.NEO4J_USERNAME = 'neo4j';
      process.env.NEO4J_PASSWORD = 'test-password';

      const driver1 = getDriver();
      const driver2 = getDriver();

      expect(driver1).toBe(driver2);
    });

    it('should throw error when NEO4J_URI is missing', async () => {
      await closeDriver(); // Reset singleton
      delete process.env.NEO4J_URI;
      process.env.NEO4J_USERNAME = 'neo4j';
      process.env.NEO4J_PASSWORD = 'test-password';

      expect(() => getDriver()).toThrow('Neo4j configuration is missing');
    });

    it('should throw error when NEO4J_USERNAME is missing', async () => {
      await closeDriver(); // Reset singleton
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      delete process.env.NEO4J_USERNAME;
      process.env.NEO4J_PASSWORD = 'test-password';

      expect(() => getDriver()).toThrow('Neo4j configuration is missing');
    });

    it('should throw error when NEO4J_PASSWORD is missing', async () => {
      await closeDriver(); // Reset singleton
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      process.env.NEO4J_USERNAME = 'neo4j';
      delete process.env.NEO4J_PASSWORD;

      expect(() => getDriver()).toThrow('Neo4j configuration is missing');
    });
  });

  describe('closeDriver', () => {
    it('should close driver connection', async () => {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      process.env.NEO4J_USERNAME = 'neo4j';
      process.env.NEO4J_PASSWORD = 'test-password';

      const driver = getDriver();
      expect(driver).toBeDefined();

      await closeDriver();

      // After closing, getDriver should create a new instance
      const newDriver = getDriver();
      expect(newDriver).toBeDefined();
      expect(newDriver).not.toBe(driver);
    });

    it('should handle multiple close calls gracefully', async () => {
      process.env.NEO4J_URI = 'bolt://localhost:7687';
      process.env.NEO4J_USERNAME = 'neo4j';
      process.env.NEO4J_PASSWORD = 'test-password';

      getDriver();

      await closeDriver();
      await closeDriver(); // Should not throw

      expect(true).toBe(true); // Test passes if no error thrown
    });
  });
});
