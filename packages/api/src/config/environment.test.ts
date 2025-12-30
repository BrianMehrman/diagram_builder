import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { validateEnvironment } from './environment';

describe('validateEnvironment', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return default values when no env vars set', () => {
    delete process.env.PORT;
    delete process.env.NODE_ENV;
    delete process.env.CORS_ORIGIN;
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    const config = validateEnvironment();

    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.CORS_ORIGIN).toBeUndefined();
    expect(config.JWT_SECRET).toBe('test-secret-key-at-least-32-characters-long');
  });

  it('should parse PORT from environment', () => {
    process.env.PORT = '8080';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    const config = validateEnvironment();

    expect(config.PORT).toBe(8080);
  });

  it('should accept production NODE_ENV', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    const config = validateEnvironment();

    expect(config.NODE_ENV).toBe('production');
  });

  it('should accept test NODE_ENV', () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    const config = validateEnvironment();

    expect(config.NODE_ENV).toBe('test');
  });

  it('should parse CORS_ORIGIN from environment', () => {
    process.env.CORS_ORIGIN = 'http://localhost:5173,http://example.com';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    const config = validateEnvironment();

    expect(config.CORS_ORIGIN).toBe('http://localhost:5173,http://example.com');
  });

  it('should throw error for invalid PORT (non-numeric)', () => {
    process.env.PORT = 'invalid';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    expect(() => validateEnvironment()).toThrow('Invalid PORT');
  });

  it('should throw error for PORT out of range (too low)', () => {
    process.env.PORT = '0';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    expect(() => validateEnvironment()).toThrow('Invalid PORT');
  });

  it('should throw error for PORT out of range (too high)', () => {
    process.env.PORT = '99999';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    expect(() => validateEnvironment()).toThrow('Invalid PORT');
  });

  it('should warn and default to development for non-standard NODE_ENV', () => {
    process.env.NODE_ENV = 'staging';
    process.env.JWT_SECRET = 'test-secret-key-at-least-32-characters-long';

    const config = validateEnvironment();

    // Should fallback to development
    expect(config.NODE_ENV).toBe('development');
  });

  it('should throw error when JWT_SECRET is missing', () => {
    delete process.env.JWT_SECRET;

    expect(() => validateEnvironment()).toThrow('JWT_SECRET environment variable is required');
  });

  it('should accept JWT_SECRET from environment', () => {
    process.env.JWT_SECRET = 'my-super-secret-jwt-key-with-at-least-32-chars';

    const config = validateEnvironment();

    expect(config.JWT_SECRET).toBe('my-super-secret-jwt-key-with-at-least-32-chars');
  });

  it('should warn when JWT_SECRET is less than 32 characters', () => {
    process.env.JWT_SECRET = 'short-key';

    // The validation should still pass, just emit a warning
    const config = validateEnvironment();

    expect(config.JWT_SECRET).toBe('short-key');
  });
});
