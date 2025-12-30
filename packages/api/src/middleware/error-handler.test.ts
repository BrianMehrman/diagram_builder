import { describe, it, expect, vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { errorHandler } from './error-handler';
import { ValidationError, NotFoundError } from '../errors';

// Mock Express request, response, and next function
function mockRequest(path = '/test'): Partial<Request> {
  return { path };
}

function mockResponse(): Partial<Response> {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function mockNext(): NextFunction {
  return vi.fn();
}

describe('errorHandler', () => {
  it('should return RFC 7807 format for ValidationError', () => {
    const err = new ValidationError('Invalid input', 'Email format is invalid');
    const req = mockRequest('/api/test') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://diagram-builder.io/errors/validation-error',
        title: 'Invalid input',
        status: 400,
        detail: 'Email format is invalid',
        instance: '/api/test'
      })
    );
  });

  it('should return RFC 7807 format for NotFoundError', () => {
    const err = new NotFoundError('Resource not found', 'User with ID 123 not found');
    const req = mockRequest('/api/users/123') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://diagram-builder.io/errors/not-found',
        title: 'Resource not found',
        status: 404,
        detail: 'User with ID 123 not found',
        instance: '/api/users/123'
      })
    );
  });

  it('should handle generic Error as 500 Internal Server Error', () => {
    const err = new Error('Unexpected error');
    const req = mockRequest('/api/test') as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://diagram-builder.io/errors/Error',
        title: 'Unexpected error',
        status: 500,
        detail: 'Unexpected error',
        instance: '/api/test'
      })
    );
  });

  it('should NOT include stack trace in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const err = new ValidationError('Test error');
    err.stack = 'Error stack trace here';
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.stack).toBeUndefined();

    process.env.NODE_ENV = originalEnv;
  });

  it('should include stack trace in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const err = new ValidationError('Test error');
    err.stack = 'Error stack trace here';
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);

    const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(jsonCall.stack).toBe('Error stack trace here');

    process.env.NODE_ENV = originalEnv;
  });

  it('should use error name as type fallback for non-HttpError', () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const err = new CustomError('Custom error message');
    const req = mockRequest() as Request;
    const res = mockResponse() as Response;
    const next = mockNext();

    errorHandler(err, req, res, next);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'https://diagram-builder.io/errors/CustomError'
      })
    );
  });
});
