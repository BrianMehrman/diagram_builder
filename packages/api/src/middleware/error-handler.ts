import { Request, Response, NextFunction } from 'express';
import { HttpError } from '../errors';

/**
 * RFC 7807 Problem Details interface
 * @see https://datatracker.ietf.org/doc/html/rfc7807
 */
export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance: string;
  stack?: string;
}

/**
 * Global error handling middleware
 * Catches all errors and formats them as RFC 7807 Problem Details
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Determine status code
  const status = err instanceof HttpError ? err.status : 500;

  // Determine error type URL
  const type = err instanceof HttpError && err.type
    ? err.type
    : `https://diagram-builder.io/errors/${err.name}`;

  // Determine detail message
  const detail = err instanceof HttpError && err.detail
    ? err.detail
    : err.message;

  // Build RFC 7807 Problem Details response
  const problemDetails: ProblemDetails = {
    type,
    title: err.message,
    status,
    detail,
    instance: req.path
  };

  // Include stack trace ONLY in development mode
  if (process.env.NODE_ENV === 'development' && err.stack) {
    problemDetails.stack = err.stack;
  }

  // Log error for monitoring
  console.error(`[ERROR] ${status} ${type}:`, err.message);
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Send RFC 7807 response
  res.status(status).json(problemDetails);
}
