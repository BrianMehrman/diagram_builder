import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, TOKEN_EXPIRATION } from './jwt';

describe('JWT Token Generation and Validation', () => {
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT format: header.payload.signature
    });

    it('should include userId in token payload', () => {
      const userId = 'user-456';
      const token = generateToken(userId);
      const decoded = jwt.decode(token) as { userId: string };

      expect(decoded.userId).toBe(userId);
    });

    it('should set 24-hour expiration', () => {
      const userId = 'user-789';
      const token = generateToken(userId);
      const decoded = jwt.decode(token) as { iat: number; exp: number };

      const expirationDuration = decoded.exp - decoded.iat;
      const expectedDuration = 24 * 60 * 60; // 24 hours in seconds

      expect(expirationDuration).toBe(expectedDuration);
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      delete process.env.JWT_SECRET;

      expect(() => generateToken('user-123')).toThrow('JWT_SECRET is not configured');
    });

    it('should use custom secret when provided', () => {
      const customSecret = 'custom-secret-key-for-testing-purposes-only';
      const userId = 'user-custom';
      const token = generateToken(userId, customSecret);

      // Verify with the custom secret
      const decoded = jwt.verify(token, customSecret) as { userId: string };
      expect(decoded.userId).toBe(userId);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const userId = 'user-valid';
      const token = generateToken(userId);
      const payload = verifyToken(token);

      expect(payload.userId).toBe(userId);
      expect(payload.iat).toBeDefined();
      expect(payload.exp).toBeDefined();
    });

    it('should reject expired token', () => {
      const userId = 'user-expired';
      const expiredToken = jwt.sign({ userId }, TEST_SECRET, { expiresIn: '-1s' });

      expect(() => verifyToken(expiredToken)).toThrow();
    });

    it('should reject malformed token', () => {
      const malformedToken = 'this.is.not.a.valid.token';

      expect(() => verifyToken(malformedToken)).toThrow();
    });

    it('should reject token with invalid signature', () => {
      const userId = 'user-invalid-sig';
      const token = generateToken(userId);
      const tamperedToken = token.slice(0, -10) + 'tamperedXX';

      expect(() => verifyToken(tamperedToken)).toThrow();
    });

    it('should throw error when JWT_SECRET is not configured', () => {
      const token = generateToken('user-123');
      delete process.env.JWT_SECRET;

      expect(() => verifyToken(token)).toThrow('JWT_SECRET is not configured');
    });

    it('should use custom secret when provided', () => {
      const customSecret = 'custom-secret-for-verification-testing';
      const userId = 'user-custom-verify';
      const token = jwt.sign({ userId }, customSecret, { expiresIn: '1h' });

      const payload = verifyToken(token, customSecret);
      expect(payload.userId).toBe(userId);
    });
  });

  describe('TOKEN_EXPIRATION constant', () => {
    it('should be set to 24 hours', () => {
      expect(TOKEN_EXPIRATION).toBe('24h');
    });
  });
});
