/**
 * Logger Configuration
 *
 * Centralized Winston logger for API package
 */

import winston from 'winston'
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'

// Determine log level from environment
const LOG_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true'

const transports: winston.transport[] = [
  // dev logs
  new winston.transports.File({
    filename: 'logs/development.log',
  }),
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

// Add OTEL transport when enabled — bridges Winston logs into active traces,
// injecting trace_id and span_id for log-to-trace correlation in Grafana.
if (OTEL_ENABLED) {
  transports.push(new OpenTelemetryTransportV3())
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
  defaultMeta: { service: 'api' },
  transports,
})

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({
      filename: 'logs/api-error.log',
      level: 'error',
    })
  )
  logger.add(
    new winston.transports.File({
      filename: 'logs/api-combined.log',
    })
  )
  // } else {
  //   logger.add(
  //     new winston.transports.File({
  //       filename: 'logs/development.log',
  //     })
  //   )
}

// Stream interface for morgan integration
export const loggerStream = {
  write: (message: string) => {
    logger.info(message.trim())
  },
}

// Helper function for HTTP request logging
export const logRequest = (method: string, path: string, meta?: Record<string, unknown>) => {
  logger.info(`HTTP ${method} ${path}`, meta)
}

// Helper function for database operations
export const logDbOperation = (operation: string, data?: Record<string, unknown>) => {
  logger.debug(`[DB] ${operation}`, data)
  return {
    success: (result?: Record<string, unknown>) => {
      logger.debug(`[DB SUCCESS] ${operation}`, result)
    },
    fail: (error: Error | string) => {
      if (error instanceof Error) {
        logger.error(`[DB FAIL] ${operation}`, { error: error.message, stack: error.stack })
      } else {
        logger.error(`[DB FAIL] ${operation}`, { error })
      }
    },
  }
}
