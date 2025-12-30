/**
 * Base error class for HTTP errors with RFC 7807 Problem Details support
 */
export abstract class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly type?: string,
    public readonly detail?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request - Client sent invalid data
 */
export class ValidationError extends HttpError {
  constructor(message: string, detail?: string) {
    super(400, message, 'https://diagram-builder.io/errors/validation-error', detail);
  }
}

/**
 * 401 Unauthorized - Missing or invalid authentication
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string, detail?: string) {
    super(401, message, 'https://diagram-builder.io/errors/unauthorized', detail);
  }
}

/**
 * 403 Forbidden - Authenticated but not authorized
 */
export class ForbiddenError extends HttpError {
  constructor(message: string, detail?: string) {
    super(403, message, 'https://diagram-builder.io/errors/forbidden', detail);
  }
}

/**
 * 404 Not Found - Resource doesn't exist
 */
export class NotFoundError extends HttpError {
  constructor(message: string, detail?: string) {
    super(404, message, 'https://diagram-builder.io/errors/not-found', detail);
  }
}

/**
 * 409 Conflict - Resource conflict (e.g., duplicate)
 */
export class ConflictError extends HttpError {
  constructor(message: string, detail?: string) {
    super(409, message, 'https://diagram-builder.io/errors/conflict', detail);
  }
}

/**
 * 500 Internal Server Error - Unexpected server error
 */
export class InternalServerError extends HttpError {
  constructor(message: string, detail?: string) {
    super(500, message, 'https://diagram-builder.io/errors/internal-server-error', detail);
  }
}
