/**
 * Server startup and lifecycle management
 * Separate from app.ts to allow testing without starting the server
 */

// Load env vars FIRST — must precede observability, which calls getApiConfig() at load time.
import './env'

// OTEL must be initialized before Express/ioredis so auto-instrumentation patches them.
import './observability'

import { createServer } from 'http'
import app from './index'
import { validateEnvironment } from './config/environment'
import { connectDatabase, disconnectDatabase } from './database/neo4j-client'
import { initializeDatabase } from './database/init-db'
import { seedDatabase } from './database/seed-db'
import { connectRedis, disconnectRedis } from './cache/redis-client'
import { createWebSocketServer, shutdownWebSocketServer } from './websocket/server'
import { createModuleLogger } from './logger'

const log = createModuleLogger('startup')

// Validate environment configuration
const config = validateEnvironment()

// Create HTTP server
const httpServer = createServer(app)

// Create WebSocket server
const io = createWebSocketServer(httpServer)

// Start server and connect to database
const server = httpServer.listen(config.PORT, () => {
  log.info('server started', {
    port: config.PORT,
    env: config.NODE_ENV,
    healthUrl: `http://localhost:${config.PORT}/health`,
    wsUrl: `ws://localhost:${config.PORT}`,
    ...(config.CORS_ORIGIN && { corsOrigin: config.CORS_ORIGIN }),
  })

  // Connect to Neo4j database and Redis cache
  void (async () => {
    try {
      await connectDatabase()
      await initializeDatabase()
      await seedDatabase()
      await connectRedis()
    } catch (error) {
      log.error('failed to connect to services on startup', {
        error: error instanceof Error ? error.message : String(error),
      })
      process.exit(1)
    }
  })()
})

// Graceful shutdown handlers
function shutdown(signal: string) {
  log.info('shutdown signal received', { signal })

  // Flush WebSocket batches and cleanup
  shutdownWebSocketServer()

  // Close WebSocket server
  void io.close(() => {
    log.info('websocket server closed')

    // Then close HTTP server
    server.close(() => {
      log.info('http server closed')

      // Disconnect from database and cache
      void (async () => {
        try {
          await disconnectDatabase()
          await disconnectRedis()
        } catch (error) {
          log.error('error disconnecting from services', {
            error: error instanceof Error ? error.message : String(error),
          })
        }

        log.info('exiting process')
        process.exit(0)
      })()
    })
  })

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    log.error('forced shutdown after timeout')
    process.exit(1)
  }, 10000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))
