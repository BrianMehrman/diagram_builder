/**
 * Secret Scanner Tests
 *
 * Tests for secret pattern detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { scanFileContent, processSecretScanResult, scanAndProcessFile } from './secret-scanner.js';
import { resetParserConfig } from '../config.js';

describe('Secret Scanner', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Clone environment
    process.env = { ...originalEnv };
    // Enable secret scanning for tests
    process.env.ENABLE_SECRET_SCANNING = 'true';
    process.env.SECRET_ACTION = 'warn';
    // Reset config singleton
    resetParserConfig();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    // Reset config singleton
    resetParserConfig();
  });

  describe('scanFileContent', () => {
    it('should return null when secret scanning is disabled', () => {
      process.env.ENABLE_SECRET_SCANNING = 'false';
      resetParserConfig(); // Reload config with new env var

      const content = 'const apiKey = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanFileContent('test.ts', content);

      expect(result).toBeNull();
    });

    it('should return null when no secrets found', () => {
      const content = 'const message = "Hello, World!";';
      const result = scanFileContent('test.ts', content);

      expect(result).toBeNull();
    });

    it('should detect AWS Access Key ID', () => {
      const content = 'const awsKey = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThanOrEqual(1);

      // Should detect at least the AWS Access Key ID pattern
      const awsSecret = result?.secrets.find(s => s.pattern === 'AWS Access Key ID');
      expect(awsSecret).toBeDefined();
      expect(awsSecret?.match).toBe('AKIAIOSFODNN7EXAMPLE');
      expect(awsSecret?.line).toBe(1);
    });

    it('should detect GitHub Personal Access Token', () => {
      // GitHub PAT format: ghp_ + 36 characters
      const content = 'const token = "ghp_' + 'a'.repeat(36) + '";';
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThanOrEqual(1);

      const githubSecret = result?.secrets.find(s => s.pattern === 'GitHub Personal Access Token');
      expect(githubSecret).toBeDefined();
    });

    it('should detect GitHub Fine-grained PAT', () => {
      // Format: github_pat_ + 22 chars + _ + 59 chars
      const content = 'const token = "github_pat_' + 'a'.repeat(22) + '_' + 'b'.repeat(59) + '";';
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThanOrEqual(1);

      const githubSecret = result?.secrets.find(s => s.pattern === 'GitHub Fine-grained PAT');
      expect(githubSecret).toBeDefined();
    });

    it('should detect Private Key', () => {
      const content = '-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEA...';
      const result = scanFileContent('test.pem', content);

      expect(result).not.toBeNull();
      expect(result?.secrets).toHaveLength(1);
      expect(result?.secrets[0].pattern).toBe('Private Key');
    });

    it('should detect password in config', () => {
      const content = 'password: "mySecretPassword123"';
      const result = scanFileContent('config.yml', content);

      expect(result).not.toBeNull();
      expect(result?.secrets).toHaveLength(1);
      expect(result?.secrets[0].pattern).toBe('Password in Config');
    });

    it('should detect API key patterns', () => {
      const content = 'api_key: "sk-1234567890abcdefghijklmnopqrstuv"';
      const result = scanFileContent('config.yml', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThan(0);
      const apiKeySecret = result?.secrets.find(s => s.pattern === 'API Key');
      expect(apiKeySecret).toBeDefined();
    });

    it('should detect Slack tokens', () => {
      // Format: xoxb- + 10-13 digits + - + 10-13 digits + - + 24-32 chars
      const content = 'const token = "xoxb-1234567890-1234567890-' + 'a'.repeat(24) + '";';
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThanOrEqual(1);

      const slackSecret = result?.secrets.find(s => s.pattern === 'Slack Token');
      expect(slackSecret).toBeDefined();
    });

    it('should detect Stripe API keys', () => {
      // Format: sk_live_ + 24+ chars
      const content = 'const stripeKey = "sk_live_' + 'a'.repeat(24) + '";';
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThanOrEqual(1);

      const stripeSecret = result?.secrets.find(s => s.pattern === 'Stripe API Key');
      expect(stripeSecret).toBeDefined();
    });

    it('should detect multiple secrets in one file', () => {
      const content = `
        const awsKey = "AKIAIOSFODNN7EXAMPLE";
        const githubToken = "ghp_${'a'.repeat(36)}";
        password: "mySecretPassword123"
      `;
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets.length).toBeGreaterThanOrEqual(3);
    });

    it('should report correct line numbers', () => {
      const content = `line 1
line 2
const secret = "AKIAIOSFODNN7EXAMPLE";
line 4`;
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets[0].line).toBe(3);
    });

    it('should report correct column numbers', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanFileContent('test.ts', content);

      expect(result).not.toBeNull();
      expect(result?.secrets[0].column).toBeGreaterThan(0);
    });

    it('should use configured SECRET_ACTION', () => {
      process.env.SECRET_ACTION = 'redact';

      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanFileContent('test.ts', content);

      expect(result?.action).toBe('redact');
    });
  });

  describe('processSecretScanResult', () => {
    it('should return original content with warn action', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = {
        filePath: 'test.ts',
        secrets: [
          {
            pattern: 'AWS Access Key ID',
            match: 'AKIAIOSFODNN7EXAMPLE',
            line: 1,
            column: 14,
          },
        ],
        action: 'warn' as const,
      };

      const processedContent = processSecretScanResult(content, result);

      expect(processedContent).toBe(content);
    });

    it('should redact secrets with redact action', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = {
        filePath: 'test.ts',
        secrets: [
          {
            pattern: 'AWS Access Key ID',
            match: 'AKIAIOSFODNN7EXAMPLE',
            line: 1,
            column: 14,
          },
        ],
        action: 'redact' as const,
      };

      const processedContent = processSecretScanResult(content, result);

      expect(processedContent).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(processedContent).toContain('[REDACTED]');
    });

    it('should redact multiple secrets', () => {
      const content = `
        const awsKey = "AKIAIOSFODNN7EXAMPLE";
        const githubToken = "ghp_1234567890abcdefghijklmnopqrstuv";
      `;
      const result = {
        filePath: 'test.ts',
        secrets: [
          {
            pattern: 'AWS Access Key ID',
            match: 'AKIAIOSFODNN7EXAMPLE',
            line: 2,
            column: 24,
          },
          {
            pattern: 'GitHub Personal Access Token',
            match: 'ghp_1234567890abcdefghijklmnopqrstuv',
            line: 3,
            column: 29,
          },
        ],
        action: 'redact' as const,
      };

      const processedContent = processSecretScanResult(content, result);

      expect(processedContent).not.toContain('AKIAIOSFODNN7EXAMPLE');
      expect(processedContent).not.toContain('ghp_1234567890abcdefghijklmnopqrstuv');
      expect(processedContent).toContain('[REDACTED]');
    });

    it('should throw error with fail action', () => {
      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = {
        filePath: 'test.ts',
        secrets: [
          {
            pattern: 'AWS Access Key ID',
            match: 'AKIAIOSFODNN7EXAMPLE',
            line: 1,
            column: 14,
          },
        ],
        action: 'fail' as const,
      };

      expect(() => processSecretScanResult(content, result)).toThrow();
      expect(() => processSecretScanResult(content, result)).toThrow('Security violation');
      expect(() => processSecretScanResult(content, result)).toThrow('test.ts');
    });

    it('should include all secrets in fail error message', () => {
      const githubToken = 'ghp_' + 'a'.repeat(36);
      const content = `const key = "AKIAIOSFODNN7EXAMPLE"; const token = "${githubToken}";`;
      const result = {
        filePath: 'test.ts',
        secrets: [
          {
            pattern: 'AWS Access Key ID',
            match: 'AKIAIOSFODNN7EXAMPLE',
            line: 1,
            column: 14,
          },
          {
            pattern: 'GitHub Personal Access Token',
            match: githubToken,
            line: 1,
            column: 52,
          },
        ],
        action: 'fail' as const,
      };

      expect(() => processSecretScanResult(content, result)).toThrow('AWS Access Key ID');
      expect(() => processSecretScanResult(content, result)).toThrow('GitHub Personal Access Token');
    });
  });

  describe('scanAndProcessFile', () => {
    it('should return original content when no secrets found', () => {
      const content = 'const message = "Hello, World!";';
      const result = scanAndProcessFile('test.ts', content);

      expect(result).toBe(content);
    });

    it('should process secrets when found with warn action', () => {
      process.env.SECRET_ACTION = 'warn';

      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanAndProcessFile('test.ts', content);

      expect(result).toBe(content); // Warn keeps original content
    });

    it('should process secrets when found with redact action', () => {
      process.env.SECRET_ACTION = 'redact';

      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanAndProcessFile('test.ts', content);

      expect(result).not.toBe(content);
      expect(result).toContain('[REDACTED]');
    });

    it('should throw when secrets found with fail action', () => {
      process.env.SECRET_ACTION = 'fail';

      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';

      expect(() => scanAndProcessFile('test.ts', content)).toThrow();
    });

    it('should return original content when scanning is disabled', () => {
      process.env.ENABLE_SECRET_SCANNING = 'false';

      const content = 'const key = "AKIAIOSFODNN7EXAMPLE";';
      const result = scanAndProcessFile('test.ts', content);

      expect(result).toBe(content);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = scanFileContent('test.ts', '');

      expect(result).toBeNull();
    });

    it('should handle content with only whitespace', () => {
      const result = scanFileContent('test.ts', '   \n  \n  ');

      expect(result).toBeNull();
    });

    it('should handle very long lines', () => {
      const longLine = 'const data = "' + 'x'.repeat(10000) + '";';
      const result = scanFileContent('test.ts', longLine);

      // Should not crash
      expect(result).toBeDefined();
    });

    it('should handle special characters in content', () => {
      const content = 'const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";';
      const result = scanFileContent('test.ts', content);

      expect(result).toBeNull();
    });

    it('should not detect false positives', () => {
      // These should NOT be detected as secrets
      const content = `
        const shortPassword = "pass"; // Too short
        const comment = "AKIA is a prefix"; // Not a real key
        const example = "example_api_key"; // Too short
      `;
      const result = scanFileContent('test.ts', content);

      // Should either be null or have very few matches
      if (result) {
        expect(result.secrets.length).toBeLessThanOrEqual(1);
      }
    });
  });
});
