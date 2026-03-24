import morgan from 'morgan'
import { type Request, type Response, type NextFunction } from 'express'
import { logger, loggerStream } from '../logger'

/**
 * Request logging middleware configuration
 *
 * - Development: Human-readable format with colors
 * - Production: Structured JSON format with timestamps
 */

// Define custom tokens for production logging
morgan.token('timestamp', () => new Date().toISOString())

// Development format: colorful, human-readable
const developmentFormat = 'dev'

// Production format: JSON structured logging
const productionFormat = ':timestamp :method :url :status :res[content-length] - :response-time ms'

/**
 * Logger middleware instance
 * Automatically switches between development and production formats based on NODE_ENV
 */

const format = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat

export const loggerMiddleware = morgan(format, { stream: loggerStream })

/**
 * Structured Winston request logger middleware.
 * Emits a structured log on response finish with method, route, status, and duration.
 * Skips health check requests to reduce noise.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  if (req.path === '/health') {
    next()
    return
  }
  const start = Date.now()
  res.on('finish', () => {
    logger.info('request', {
      method: req.method,
      route: req.route?.path ?? req.path,
      status: res.statusCode,
      durationMs: Date.now() - start,
    })
  })
  next()
}
