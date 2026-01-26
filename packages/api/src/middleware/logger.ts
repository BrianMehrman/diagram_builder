import morgan from 'morgan'
import { loggerStream } from '../logger'

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
