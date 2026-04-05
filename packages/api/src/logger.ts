/**
 * Logger Configuration
 *
 * Centralized Winston logger for API package
 */

import winston from 'winston'
import { OpenTelemetryTransportV3 } from '@opentelemetry/winston-transport'
import LokiTransport from 'winston-loki'

// Determine log level from environment
const LOG_LEVEL =
  process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug')

const OTEL_ENABLED = process.env.OTEL_ENABLED === 'true'
const LOKI_ENABLED = process.env.LOKI_ENABLED === 'true'
const LOKI_HOST = process.env.LOKI_HOST ?? 'http://localhost:3100'

const transports: winston.transport[] = [
  // dev logs — uncolorize so ANSI codes don't appear in the file
  new winston.transports.File({
    filename: 'logs/development.log',
    format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
  }),
  // Console transport for development — colorize runs here, not stripped by root format
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

// Add Loki transport when enabled — ships logs directly to Loki for aggregation.
if (LOKI_ENABLED) {
  transports.push(
    new LokiTransport({
      host: LOKI_HOST,
      labels: { app: 'diagram-builder-api' },
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
  defaultMeta: { service: 'api' },
  transports,
})

// Add file transport in production
if (process.env.NODE_ENV === 'production') {
  const fileFormat = winston.format.combine(winston.format.uncolorize(), winston.format.json())
  logger.add(
    new winston.transports.File({
      filename: 'logs/api-error.log',
      level: 'error',
      format: fileFormat,
    })
  )
  logger.add(
    new winston.transports.File({
      filename: 'logs/api-combined.log',
      format: fileFormat,
    })
  )
}

// ─── Module logger factory ────────────────────────────────────────────────────

/**
 * Returns a child logger with a `module` field on every entry.
 * Use this instead of importing `logger` directly so Loki logs are
 * filterable by module name: {app="diagram-builder-api", module="workspace-service"}
 */
export const createModuleLogger = (module: string): winston.Logger => logger.child({ module })

// ─── App logger factory ───────────────────────────────────────────────────────

/**
 * Creates a standalone logger with its own Loki transport labelled with the
 * given app name. Use this when logs should appear in Loki under a different
 * {app} stream than "diagram-builder-api" — for example, UI error logs
 * forwarded through the API should land under {app="diagram-builder-ui"}.
 *
 * The returned logger ships to Loki only (no console/file). The caller is
 * responsible for any additional transports they need.
 */
export const createAppLogger = (appName: string): winston.Logger => {
  const appTransports: winston.transport[] = []

  if (LOKI_ENABLED) {
    appTransports.push(
      new LokiTransport({
        host: LOKI_HOST,
        labels: { app: appName },
        batching: true,
        interval: 5,
        format: winston.format.combine(winston.format.uncolorize(), winston.format.json()),
      })
    )
  }

  return winston.createLogger({
    level: LOG_LEVEL,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json()
    ),
    defaultMeta: { service: appName },
    transports: appTransports,
  })
}

// ─── Operation wrapper ────────────────────────────────────────────────────────

/**
 * Wraps an async function with structured start / complete / failed logging.
 *
 *   DEBUG  <name>.start    { ...meta }
 *   INFO   <name>.complete { ...meta, durationMs }
 *   ERROR  <name>.failed   { ...meta, durationMs, error }  ← re-throws
 */
export const withOperation = async <T>(
  log: winston.Logger,
  name: string,
  meta: Record<string, unknown>,
  fn: () => Promise<T>
): Promise<T> => {
  log.debug(`${name}.start`, meta)
  const start = Date.now()
  try {
    const result = await fn()
    log.info(`${name}.complete`, { ...meta, durationMs: Date.now() - start })
    return result
  } catch (err) {
    log.error(`${name}.failed`, {
      ...meta,
      durationMs: Date.now() - start,
      error: (err as Error).message,
    })
    throw err
  }
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
