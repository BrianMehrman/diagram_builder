/**
 * Logger Configuration
 *
 * Centralized Winston logger for parser package
 */

import winston from 'winston'
import LokiTransport from 'winston-loki'

// Determine log level from environment
const LOG_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const LOKI_ENABLED = process.env.LOKI_ENABLED === 'true'
const LOKI_HOST = process.env.LOKI_HOST ?? 'http://localhost:3100'

const transports: winston.transport[] = [
  // Console transport for development
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, service, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
        return `${String(timestamp)} [${String(service)}] ${String(level)}: ${String(message)}${metaStr}`
      })
    ),
  }),
]

if (LOKI_ENABLED) {
  transports.push(
    new LokiTransport({
      host: LOKI_HOST,
      labels: { app: 'diagram-builder-parser' },
      batching: true,
      interval: 5,
      // uncolorize here so ANSI codes don't appear in Loki log lines
      format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
    })
  )
}

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'parser' },
  transports,
})

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/parser-error.log',
      level: 'error',
    })
  )
  logger.add(
    new winston.transports.File({
      filename: 'logs/parser-combined.log',
    })
  )
}

// Helper functions for common logging patterns
export const logOperation = (operation: string, data?: Record<string, unknown>) => {
  logger.info(`[START] ${operation}`, data)
  return {
    success: (result?: Record<string, unknown>) => {
      logger.info(`[SUCCESS] ${operation}`, result)
    },
    fail: (error: Error | string, context?: Record<string, unknown>) => {
      if (error instanceof Error) {
        logger.error(`[FAIL] ${operation}`, {
          error: error.message,
          stack: error.stack,
          ...context,
        })
      } else {
        logger.error(`[FAIL] ${operation}`, { error, ...context })
      }
    },
    timing: (startTime: number, result?: Record<string, unknown>) => {
      const duration = Date.now() - startTime
      logger.info(`[COMPLETE] ${operation}`, { duration: `${duration}ms`, ...result })
    },
  }
}
