/**
 * Express type extensions
 * Extends Express Request interface to include authenticated user
 */

import { JWTPayload } from '../auth/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
