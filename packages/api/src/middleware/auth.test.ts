import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from './auth';
import { generateToken } from '../auth/jwt';
import { UnauthorizedError } from '../errors';

// Mock Express request, response, and next function
function mockRequest(authHeader?: string): Partial<Request> {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
    path: '/api/protected'
  };
}

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = () => res as Response;
  res.json = () => res as Response;
  return res;
}

function mockNext(): NextFunction {
  return () => { };
}

describe('Authentication Middleware', () => {
  const TEST_SECRET = 'test-secret-key-at-least-32-characters-long-for-testing';
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalEnv = { ...process.env };
    process.env.JWT_SECRET = TEST_SECRET;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('authenticate', () => {
    it('should throw UnauthorizedError when Authorization header is missing', () => {
      const req = mockRequest() as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
      expect(() => authenticate(req, res, next)).toThrow('Missing authorization header');
    });

    it('should throw UnauthorizedError when Authorization header does not use Bearer scheme', () => {
      const req = mockRequest('Basic sometoken') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
      expect(() => authenticate(req, res, next)).toThrow('Invalid authorization header');
    });

    it('should throw UnauthorizedError when token is empty', () => {
      const req = mockRequest('Bearer ') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
      expect(() => authenticate(req, res, next)).toThrow('Missing token');
    });

    it('should attach user payload to req.user for valid token', () => {
      const userId = 'user-123';
      const token = generateToken(userId);
      const req = mockRequest(`Bearer ${token}`) as Request;
      const res = mockResponse() as Response;
      let nextCalled = false;
      const next: NextFunction = () => { nextCalled = true; };

      authenticate(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user?.userId).toBe(userId);
      expect(nextCalled).toBe(true);
    });

    it('should throw UnauthorizedError for expired token', () => {
      const userId = 'user-expired';
      const expiredToken = jwt.sign({ userId }, TEST_SECRET, { expiresIn: '-1s' });
      const req = mockRequest(`Bearer ${expiredToken}`) as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
      expect(() => authenticate(req, res, next)).toThrow('Token expired');
    });

    it('should throw UnauthorizedError for malformed token', () => {
      const req = mockRequest('Bearer invalid.token.here') as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for token with invalid signature', () => {
      const userId = 'user-tampered';
      const token = generateToken(userId);
      const tamperedToken = token.slice(0, -10) + 'tampered00';
      const req = mockRequest(`Bearer ${tamperedToken}`) as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      expect(() => authenticate(req, res, next)).toThrow(UnauthorizedError);
      expect(() => authenticate(req, res, next)).toThrow('Invalid token');
    });

    it('should populate req.user with iat and exp timestamps', () => {
      const userId = 'user-timestamps';
      const token = generateToken(userId);
      const req = mockRequest(`Bearer ${token}`) as Request;
      const res = mockResponse() as Response;
      const next = mockNext();

      authenticate(req, res, next);

      expect(req.user?.iat).toBeDefined();
      expect(req.user?.exp).toBeDefined();
      expect(typeof req.user?.iat).toBe('number');
      expect(typeof req.user?.exp).toBe('number');
    });
  });
});
