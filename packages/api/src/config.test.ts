/**
 * API Config Tests
 *
 * Tests for API configuration loading and validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadApiConfig, getApiConfig, resetApiConfig, type ApiConfig } from './config.js';

describe('API Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset config singleton before each test
    resetApiConfig();
    // Clone environment and remove API-specific vars
    process.env = { ...originalEnv };
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.CORS_ORIGIN;
    delete process.env.JWT_SECRET;
    delete process.env.NEO4J_URI;
    delete process.env.NEO4J_USERNAME;
    delete process.env.NEO4J_PASSWORD;
    delete process.env.REDIS_HOST;
    delete process.env.REDIS_PORT;
    delete process.env.REDIS_PASSWORD;
    delete process.env.REDIS_DB;
    delete process.env.PARSER_TEMP_DIR;
    delete process.env.MAX_REPO_SIZE_MB;
    delete process.env.MAX_FILE_COUNT;
    delete process.env.MAX_FILE_SIZE_MB;
    delete process.env.PARSE_TIMEOUT_MS;
    delete process.env.ENABLE_SECRET_SCANNING;
    delete process.env.SECRET_ACTION;
    delete process.env.LOG_LEVEL;
    delete process.env.RATE_LIMIT_WINDOW_MS;
    delete process.env.RATE_LIMIT_MAX_REQUESTS;
    delete process.env.RATE_LIMIT_ENABLED;

    // Set required variables for successful config load
    process.env.JWT_SECRET = 'test-secret-key-that-is-at-least-32-characters-long';
    process.env.NEO4J_PASSWORD = 'test-password';
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetApiConfig();
  });

  describe('loadApiConfig', () => {
    it('should load config with default values when minimal env vars set', () => {
      const config = loadApiConfig();

      expect(config.PORT).toBe(4000);
      expect(config.NODE_ENV).toBe('development');
      expect(config.JWT_SECRET).toBe('test-secret-key-that-is-at-least-32-characters-long');
      expect(config.NEO4J_URI).toBe('bolt://localhost:7687');
      expect(config.NEO4J_USERNAME).toBe('neo4j');
      expect(config.NEO4J_PASSWORD).toBe('test-password');
      expect(config.REDIS_HOST).toBe('localhost');
      expect(config.REDIS_PORT).toBe(6379);
      expect(config.REDIS_DB).toBe(0);
      expect(config.MAX_REPO_SIZE_MB).toBe(500);
      expect(config.MAX_FILE_COUNT).toBe(10000);
      expect(config.MAX_FILE_SIZE_MB).toBe(10);
      expect(config.PARSE_TIMEOUT_MS).toBe(300000);
      expect(config.ENABLE_SECRET_SCANNING).toBe(true);
      expect(config.SECRET_ACTION).toBe('warn');
      expect(config.LOG_LEVEL).toBe('info');
      expect(config.RATE_LIMIT_WINDOW_MS).toBe(60000);
      expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(100);
      expect(config.RATE_LIMIT_ENABLED).toBe(true);
    });

    it('should load config from environment variables', () => {
      process.env.PORT = '5000';
      process.env.NODE_ENV = 'production';
      process.env.CORS_ORIGIN = 'https://example.com';
      process.env.NEO4J_URI = 'bolt://neo4j.example.com:7687';
      process.env.NEO4J_USERNAME = 'admin';
      process.env.NEO4J_PASSWORD = 'secure-password';
      process.env.REDIS_HOST = 'redis.example.com';
      process.env.REDIS_PORT = '6380';
      process.env.REDIS_PASSWORD = 'redis-password';
      process.env.REDIS_DB = '1';
      process.env.MAX_REPO_SIZE_MB = '1000';
      process.env.MAX_FILE_COUNT = '20000';
      process.env.MAX_FILE_SIZE_MB = '20';
      process.env.PARSE_TIMEOUT_MS = '600000';
      process.env.ENABLE_SECRET_SCANNING = 'false';
      process.env.SECRET_ACTION = 'redact';
      process.env.LOG_LEVEL = 'debug';
      process.env.RATE_LIMIT_WINDOW_MS = '120000';
      process.env.RATE_LIMIT_MAX_REQUESTS = '200';
      process.env.RATE_LIMIT_ENABLED = 'false';

      const config = loadApiConfig();

      expect(config.PORT).toBe(5000);
      expect(config.NODE_ENV).toBe('production');
      expect(config.CORS_ORIGIN).toBe('https://example.com');
      expect(config.NEO4J_URI).toBe('bolt://neo4j.example.com:7687');
      expect(config.NEO4J_USERNAME).toBe('admin');
      expect(config.NEO4J_PASSWORD).toBe('secure-password');
      expect(config.REDIS_HOST).toBe('redis.example.com');
      expect(config.REDIS_PORT).toBe(6380);
      expect(config.REDIS_PASSWORD).toBe('redis-password');
      expect(config.REDIS_DB).toBe(1);
      expect(config.MAX_REPO_SIZE_MB).toBe(1000);
      expect(config.MAX_FILE_COUNT).toBe(20000);
      expect(config.MAX_FILE_SIZE_MB).toBe(20);
      expect(config.PARSE_TIMEOUT_MS).toBe(600000);
      expect(config.ENABLE_SECRET_SCANNING).toBe(false);
      expect(config.SECRET_ACTION).toBe('redact');
      expect(config.LOG_LEVEL).toBe('debug');
      expect(config.RATE_LIMIT_WINDOW_MS).toBe(120000);
      expect(config.RATE_LIMIT_MAX_REQUESTS).toBe(200);
      expect(config.RATE_LIMIT_ENABLED).toBe(false);
    });

    it('should coerce string numbers to numbers', () => {
      process.env.PORT = '8080';
      process.env.MAX_REPO_SIZE_MB = '750';

      const config = loadApiConfig();

      expect(typeof config.PORT).toBe('number');
      expect(config.PORT).toBe(8080);
      expect(typeof config.MAX_REPO_SIZE_MB).toBe('number');
      expect(config.MAX_REPO_SIZE_MB).toBe(750);
    });

    it('should validate PORT range', () => {
      process.env.PORT = '70000';

      expect(() => loadApiConfig()).toThrow();
    });

    it('should validate JWT_SECRET minimum length', () => {
      process.env.JWT_SECRET = 'short';

      expect(() => loadApiConfig()).toThrow();
    });

    it('should require NEO4J_PASSWORD', () => {
      delete process.env.NEO4J_PASSWORD;

      expect(() => loadApiConfig()).toThrow();
    });

    it('should validate NODE_ENV enum values', () => {
      const envValues: Array<ApiConfig['NODE_ENV']> = ['development', 'production', 'test'];

      envValues.forEach((env) => {
        resetApiConfig();
        process.env.NODE_ENV = env;
        const config = loadApiConfig();
        expect(config.NODE_ENV).toBe(env);
      });
    });

    it('should validate SECRET_ACTION enum values', () => {
      const actions: Array<ApiConfig['SECRET_ACTION']> = ['warn', 'redact', 'fail'];

      actions.forEach((action) => {
        resetApiConfig();
        process.env.SECRET_ACTION = action;
        const config = loadApiConfig();
        expect(config.SECRET_ACTION).toBe(action);
      });
    });

    it('should validate LOG_LEVEL enum values', () => {
      const levels: Array<ApiConfig['LOG_LEVEL']> = ['debug', 'info', 'warn', 'error'];

      levels.forEach((level) => {
        resetApiConfig();
        process.env.LOG_LEVEL = level;
        const config = loadApiConfig();
        expect(config.LOG_LEVEL).toBe(level);
      });
    });

    it('should handle boolean environment variables correctly', () => {
      process.env.ENABLE_SECRET_SCANNING = 'false';
      process.env.RATE_LIMIT_ENABLED = 'false';
      resetApiConfig();

      const config = loadApiConfig();

      expect(config.ENABLE_SECRET_SCANNING).toBe(false);
      expect(config.RATE_LIMIT_ENABLED).toBe(false);
    });
  });

  describe('getApiConfig', () => {
    it('should return singleton instance', () => {
      const config1 = getApiConfig();
      const config2 = getApiConfig();

      expect(config1).toBe(config2);
    });

    it('should return same instance after environment changes', () => {
      const config1 = getApiConfig();

      // Change environment (should not affect already-loaded config)
      process.env.PORT = '9999';

      const config2 = getApiConfig();

      expect(config1).toBe(config2);
      expect(config2.PORT).toBe(4000); // Original default
    });

    it('should load fresh config after reset', () => {
      const config1 = getApiConfig();
      expect(config1.PORT).toBe(4000);

      resetApiConfig();
      process.env.PORT = '5000';

      const config2 = getApiConfig();
      expect(config2.PORT).toBe(5000);
    });
  });

  describe('resetApiConfig', () => {
    it('should clear singleton instance', () => {
      const config1 = getApiConfig();
      resetApiConfig();

      process.env.PORT = '6000';
      const config2 = getApiConfig();

      expect(config1).not.toBe(config2);
      expect(config2.PORT).toBe(6000);
    });
  });
});
