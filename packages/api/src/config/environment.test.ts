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

    const config = validateEnvironment();

    expect(config.PORT).toBe(3000);
    expect(config.NODE_ENV).toBe('development');
    expect(config.CORS_ORIGIN).toBeUndefined();
  });

  it('should parse PORT from environment', () => {
    process.env.PORT = '8080';

    const config = validateEnvironment();

    expect(config.PORT).toBe(8080);
  });

  it('should accept production NODE_ENV', () => {
    process.env.NODE_ENV = 'production';

    const config = validateEnvironment();

    expect(config.NODE_ENV).toBe('production');
  });

  it('should accept test NODE_ENV', () => {
    process.env.NODE_ENV = 'test';

    const config = validateEnvironment();

    expect(config.NODE_ENV).toBe('test');
  });

  it('should parse CORS_ORIGIN from environment', () => {
    process.env.CORS_ORIGIN = 'http://localhost:5173,http://example.com';

    const config = validateEnvironment();

    expect(config.CORS_ORIGIN).toBe('http://localhost:5173,http://example.com');
  });

  it('should throw error for invalid PORT (non-numeric)', () => {
    process.env.PORT = 'invalid';

    expect(() => validateEnvironment()).toThrow('Invalid PORT');
  });

  it('should throw error for PORT out of range (too low)', () => {
    process.env.PORT = '0';

    expect(() => validateEnvironment()).toThrow('Invalid PORT');
  });

  it('should throw error for PORT out of range (too high)', () => {
    process.env.PORT = '99999';

    expect(() => validateEnvironment()).toThrow('Invalid PORT');
  });

  it('should warn and default to development for non-standard NODE_ENV', () => {
    process.env.NODE_ENV = 'staging';

    const config = validateEnvironment();

    // Should fallback to development
    expect(config.NODE_ENV).toBe('development');
  });
});
