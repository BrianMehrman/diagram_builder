/**
 * Logger Configuration
 *
 * Centralized Winston logger for API package
 */

import winston from 'winston'

// Determine log level from environment
const LOG_LEVEL = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
          return `${timestamp} [${service}] ${level}: ${message}${metaStr}`
        })
      )
    })
  ]
})

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/api-error.log',
    level: 'error'
  }))
  logger.add(new winston.transports.File({
    filename: 'logs/api-combined.log'
  }))
}

// Helper function for HTTP request logging
export const logRequest = (method: string, path: string, meta?: Record<string, any>) => {
  logger.info(`HTTP ${method} ${path}`, meta)
}

// Helper function for database operations
export const logDbOperation = (operation: string, data?: Record<string, any>) => {
  logger.debug(`[DB] ${operation}`, data)
  return {
    success: (result?: Record<string, any>) => {
      logger.debug(`[DB SUCCESS] ${operation}`, result)
    },
    fail: (error: Error | string) => {
      if (error instanceof Error) {
        logger.error(`[DB FAIL] ${operation}`, { error: error.message, stack: error.stack })
      } else {
        logger.error(`[DB FAIL] ${operation}`, { error })
      }
    }
  }
}
