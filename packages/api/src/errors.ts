/**
 * HTTP Error Classes
 *
 * Custom error classes for HTTP status codes following RFC 7807
 */

/**
 * Base HTTP Error class
 */
export class HttpError extends Error {
  constructor(
    message: string,
    public status: number,
    public type?: string,
    public detail?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Bad Request
 * Request validation failed
 */
export class ValidationError extends HttpError {
  constructor(message: string, detail?: string) {
    super(
      message,
      400,
      'https://diagram-builder.io/errors/validation-error',
      detail
    );
  }
}

/**
 * 401 Unauthorized
 * Authentication required or failed
 */
export class UnauthorizedError extends HttpError {
  constructor(message: string, detail?: string) {
    super(
      message,
      401,
      'https://diagram-builder.io/errors/unauthorized',
      detail
    );
  }
}

/**
 * 403 Forbidden
 * Authentication successful but access denied
 */
export class ForbiddenError extends HttpError {
  constructor(message: string, detail?: string) {
    super(
      message,
      403,
      'https://diagram-builder.io/errors/forbidden',
      detail
    );
  }
}

/**
 * 404 Not Found
 * Resource not found
 */
export class NotFoundError extends HttpError {
  constructor(message: string, detail?: string) {
    super(
      message,
      404,
      'https://diagram-builder.io/errors/not-found',
      detail
    );
  }
}

/**
 * 409 Conflict
 * Resource conflict (e.g., duplicate key)
 */
export class ConflictError extends HttpError {
  constructor(message: string, detail?: string) {
    super(
      message,
      409,
      'https://diagram-builder.io/errors/conflict',
      detail
    );
  }
}

/**
 * 500 Internal Server Error
 * Unexpected server error
 */
export class InternalServerError extends HttpError {
  constructor(message: string, detail?: string) {
    super(
      message,
      500,
      'https://diagram-builder.io/errors/internal-server-error',
      detail
    );
  }
}
