/**
 * Config Tests
 *
 * Tests for parser configuration loading and validation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadParserConfig, getParserConfig, resetParserConfig, type ParserConfig } from './config.js';
import os from 'os';
import path from 'path';

describe('Parser Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset config singleton before each test
    resetParserConfig();
    // Clone environment and remove parser-specific vars
    process.env = { ...originalEnv };
    delete process.env.PARSER_TEMP_DIR;
    delete process.env.MAX_REPO_SIZE_MB;
    delete process.env.MAX_FILE_COUNT;
    delete process.env.MAX_FILE_SIZE_MB;
    delete process.env.PARSE_TIMEOUT_MS;
    delete process.env.ENABLE_SECRET_SCANNING;
    delete process.env.SECRET_ACTION;
    delete process.env.LOG_LEVEL;
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
    resetParserConfig();
  });

  describe('loadParserConfig', () => {
    it('should load config with default values when no env vars set', () => {
      const config = loadParserConfig();

      expect(config.PARSER_TEMP_DIR).toBe(path.join(os.tmpdir(), 'diagram-builder'));
      expect(config.MAX_REPO_SIZE_MB).toBe(500);
      expect(config.MAX_FILE_COUNT).toBe(10000);
      expect(config.MAX_FILE_SIZE_MB).toBe(10);
      expect(config.PARSE_TIMEOUT_MS).toBe(300000);
      expect(config.ENABLE_SECRET_SCANNING).toBe(true);
      expect(config.SECRET_ACTION).toBe('warn');
      expect(config.LOG_LEVEL).toBe('info');
    });

    it('should load config from environment variables', () => {
      process.env.PARSER_TEMP_DIR = '/custom/temp/dir';
      process.env.MAX_REPO_SIZE_MB = '1000';
      process.env.MAX_FILE_COUNT = '20000';
      process.env.MAX_FILE_SIZE_MB = '20';
      process.env.PARSE_TIMEOUT_MS = '600000';
      process.env.ENABLE_SECRET_SCANNING = 'false';
      process.env.SECRET_ACTION = 'redact';
      process.env.LOG_LEVEL = 'debug';

      const config = loadParserConfig();

      expect(config.PARSER_TEMP_DIR).toBe('/custom/temp/dir');
      expect(config.MAX_REPO_SIZE_MB).toBe(1000);
      expect(config.MAX_FILE_COUNT).toBe(20000);
      expect(config.MAX_FILE_SIZE_MB).toBe(20);
      expect(config.PARSE_TIMEOUT_MS).toBe(600000);
      expect(config.ENABLE_SECRET_SCANNING).toBe(false);
      expect(config.SECRET_ACTION).toBe('redact');
      expect(config.LOG_LEVEL).toBe('debug');
    });

    it('should coerce string numbers to numbers', () => {
      process.env.MAX_REPO_SIZE_MB = '750';
      process.env.MAX_FILE_COUNT = '15000';

      const config = loadParserConfig();

      expect(typeof config.MAX_REPO_SIZE_MB).toBe('number');
      expect(config.MAX_REPO_SIZE_MB).toBe(750);
      expect(typeof config.MAX_FILE_COUNT).toBe('number');
      expect(config.MAX_FILE_COUNT).toBe(15000);
    });

    it('should coerce string booleans to booleans', () => {
      process.env.ENABLE_SECRET_SCANNING = 'true';

      const config = loadParserConfig();

      expect(typeof config.ENABLE_SECRET_SCANNING).toBe('boolean');
      expect(config.ENABLE_SECRET_SCANNING).toBe(true);
    });

    it('should validate SECRET_ACTION enum values', () => {
      process.env.SECRET_ACTION = 'fail';
      let config = loadParserConfig();
      expect(config.SECRET_ACTION).toBe('fail');

      resetParserConfig();
      process.env.SECRET_ACTION = 'warn';
      config = loadParserConfig();
      expect(config.SECRET_ACTION).toBe('warn');

      resetParserConfig();
      process.env.SECRET_ACTION = 'redact';
      config = loadParserConfig();
      expect(config.SECRET_ACTION).toBe('redact');
    });

    it('should validate LOG_LEVEL enum values', () => {
      const levels: Array<ParserConfig['LOG_LEVEL']> = ['debug', 'info', 'warn', 'error'];

      levels.forEach((level) => {
        resetParserConfig();
        process.env.LOG_LEVEL = level;
        const config = loadParserConfig();
        expect(config.LOG_LEVEL).toBe(level);
      });
    });
  });

  describe('getParserConfig', () => {
    it('should return singleton instance', () => {
      const config1 = getParserConfig();
      const config2 = getParserConfig();

      expect(config1).toBe(config2);
    });

    it('should return same instance after environment changes', () => {
      const config1 = getParserConfig();

      // Change environment (should not affect already-loaded config)
      process.env.MAX_REPO_SIZE_MB = '9999';

      const config2 = getParserConfig();

      expect(config1).toBe(config2);
      expect(config2.MAX_REPO_SIZE_MB).toBe(500); // Original default
    });

    it('should load fresh config after reset', () => {
      const config1 = getParserConfig();
      expect(config1.MAX_REPO_SIZE_MB).toBe(500);

      resetParserConfig();
      process.env.MAX_REPO_SIZE_MB = '1000';

      const config2 = getParserConfig();
      expect(config2.MAX_REPO_SIZE_MB).toBe(1000);
    });
  });

  describe('resetParserConfig', () => {
    it('should clear singleton instance', () => {
      const config1 = getParserConfig();
      resetParserConfig();

      process.env.MAX_REPO_SIZE_MB = '2000';
      const config2 = getParserConfig();

      expect(config1).not.toBe(config2);
      expect(config2.MAX_REPO_SIZE_MB).toBe(2000);
    });
  });
});
