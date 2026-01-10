/**
 * Logger Configuration
 *
 * Centralized Winston logger for parser package
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
  defaultMeta: { service: 'parser' },
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
    filename: 'logs/parser-error.log',
    level: 'error'
  }))
  logger.add(new winston.transports.File({
    filename: 'logs/parser-combined.log'
  }))
}

// Helper functions for common logging patterns
export const logOperation = (operation: string, data?: Record<string, any>) => {
  logger.info(`[START] ${operation}`, data)
  return {
    success: (result?: Record<string, any>) => {
      logger.info(`[SUCCESS] ${operation}`, result)
    },
    fail: (error: Error | string, context?: Record<string, any>) => {
      if (error instanceof Error) {
        logger.error(`[FAIL] ${operation}`, { error: error.message, stack: error.stack, ...context })
      } else {
        logger.error(`[FAIL] ${operation}`, { error, ...context })
      }
    },
    timing: (startTime: number, result?: Record<string, any>) => {
      const duration = Date.now() - startTime
      logger.info(`[COMPLETE] ${operation}`, { duration: `${duration}ms`, ...result })
    }
  }
}
