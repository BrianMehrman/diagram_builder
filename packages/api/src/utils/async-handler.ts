/**
 * Async Handler Wrapper
 *
 * Wraps async Express route handlers to properly catch errors
 * and pass them to the error handling middleware
 */

import { Request, Response, NextFunction } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

/**
 * Wraps an async route handler to catch promise rejections
 * and pass them to Express error handling middleware
 *
 * @param fn - Async route handler function
 * @returns Express request handler
 */
export function asyncHandler(fn: AsyncRequestHandler) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
