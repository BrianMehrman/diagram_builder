/**
 * URL Validator Tests
 *
 * Tests for repository URL validation and path sanitization
 */

import { describe, it, expect } from 'vitest';
import { validateRepositoryUrl, sanitizeFilePath } from './url-validator.js';
import path from 'path';
import os from 'os';

describe('URL Validator', () => {
  describe('validateRepositoryUrl', () => {
    it('should accept valid GitHub HTTPS URLs', () => {
      const result = validateRepositoryUrl('https://github.com/user/repo.git');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://github.com/user/repo.git');
      expect(result.error).toBeUndefined();
    });

    it('should accept valid GitLab URLs', () => {
      const result = validateRepositoryUrl('https://gitlab.com/user/repo.git');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://gitlab.com/user/repo.git');
    });

    it('should accept valid Bitbucket URLs', () => {
      const result = validateRepositoryUrl('https://bitbucket.org/user/repo.git');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).toBe('https://bitbucket.org/user/repo.git');
    });

    it('should accept git protocol URLs', () => {
      const result = validateRepositoryUrl('git://github.com/user/repo.git');

      expect(result.isValid).toBe(true);
    });

    it('should remove auth credentials from URL', () => {
      const result = validateRepositoryUrl('https://username:password@github.com/user/repo.git');

      expect(result.isValid).toBe(true);
      expect(result.sanitizedUrl).not.toContain('username');
      expect(result.sanitizedUrl).not.toContain('password');
      expect(result.sanitizedUrl).toBe('https://github.com/user/repo.git');
    });

    it('should reject localhost URLs', () => {
      const result = validateRepositoryUrl('https://localhost/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Blocked host');
    });

    it('should reject 127.0.0.1 URLs', () => {
      const result = validateRepositoryUrl('https://127.0.0.1/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Blocked host');
    });

    it('should reject AWS metadata endpoint', () => {
      const result = validateRepositoryUrl('http://169.254.169.254/latest/meta-data/');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Blocked host');
    });

    it('should reject private IP addresses (10.x.x.x)', () => {
      const result = validateRepositoryUrl('https://10.0.0.1/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('private IP');
    });

    it('should reject private IP addresses (192.168.x.x)', () => {
      const result = validateRepositoryUrl('https://192.168.1.1/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('private IP');
    });

    it('should reject private IP addresses (172.16-31.x.x)', () => {
      const result = validateRepositoryUrl('https://172.16.0.1/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('private IP');
    });

    it('should reject non-whitelisted hosts', () => {
      const result = validateRepositoryUrl('https://malicious-site.com/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject invalid protocols', () => {
      const result = validateRepositoryUrl('ftp://github.com/user/repo.git');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid protocol');
    });

    it('should reject file:// URLs', () => {
      const result = validateRepositoryUrl('file:///tmp/repo');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid protocol');
    });

    it('should reject malformed URLs', () => {
      const result = validateRepositoryUrl('not-a-valid-url');

      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Invalid URL format');
    });

    it('should handle URLs with ports', () => {
      const result = validateRepositoryUrl('https://github.com:443/user/repo.git');

      expect(result.isValid).toBe(true);
    });

    it('should handle URLs with paths', () => {
      const result = validateRepositoryUrl('https://github.com/org/team/repo.git');

      expect(result.isValid).toBe(true);
    });
  });

  describe('sanitizeFilePath', () => {
    const baseDir = path.join(os.tmpdir(), 'test-base');

    it('should allow valid relative paths', () => {
      const result = sanitizeFilePath('subdir/file.txt', baseDir);

      expect(result).not.toBeNull();
      expect(result).toContain('subdir');
      expect(result).toContain('file.txt');
    });

    it('should allow valid absolute paths within base dir', () => {
      const safePath = path.join(baseDir, 'safe', 'file.txt');
      const result = sanitizeFilePath(safePath, baseDir);

      expect(result).not.toBeNull();
      expect(result).toBe(path.normalize(safePath));
    });

    it('should block path traversal with ..', () => {
      const result = sanitizeFilePath('../../../etc/passwd', baseDir);

      expect(result).toBeNull();
    });

    it('should block path traversal in middle of path', () => {
      const result = sanitizeFilePath('subdir/../../etc/passwd', baseDir);

      expect(result).toBeNull();
    });

    it('should block absolute paths outside base dir', () => {
      const result = sanitizeFilePath('/etc/passwd', baseDir);

      expect(result).toBeNull();
    });

    it('should normalize paths with redundant separators', () => {
      const result = sanitizeFilePath('subdir//file.txt', baseDir);

      expect(result).not.toBeNull();
      expect(result).toContain('subdir');
      expect(result).toContain('file.txt');
    });

    it('should handle empty strings safely', () => {
      const result = sanitizeFilePath('', baseDir);

      // Empty string resolves to base dir, which is valid
      expect(result).not.toBeNull();
    });

    it('should handle current directory references', () => {
      const result = sanitizeFilePath('./file.txt', baseDir);

      expect(result).not.toBeNull();
      expect(result).toContain('file.txt');
    });

    it('should block symlink-like paths', () => {
      const result = sanitizeFilePath('subdir/../../../etc/passwd', baseDir);

      expect(result).toBeNull();
    });

    it('should allow deeply nested valid paths', () => {
      const result = sanitizeFilePath('a/b/c/d/e/file.txt', baseDir);

      expect(result).not.toBeNull();
      expect(result).toContain('a');
      expect(result).toContain('file.txt');
    });
  });
});
