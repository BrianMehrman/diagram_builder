/**
 * Server startup and lifecycle management
 * Separate from app.ts to allow testing without starting the server
 */

// Load environment variables from .env file in project root
import dotenv from 'dotenv';
import { resolve } from 'path';

// When running via npm workspaces, cwd is the package dir, so go up 2 levels to project root
const envPath = resolve(process.cwd(), '../../.env');
dotenv.config({ path: envPath });

import { createServer } from 'http';
import app from './index';
import { validateEnvironment } from './config/environment';
import { connectDatabase, disconnectDatabase } from './database/neo4j-client';
import { initializeDatabase } from './database/init-db';
import { seedDatabase } from './database/seed-db';
import { connectRedis, disconnectRedis } from './cache/redis-client';
import { createWebSocketServer, shutdownWebSocketServer } from './websocket/server';

// Validate environment configuration
const config = validateEnvironment();

// Create HTTP server
const httpServer = createServer(app);

// Create WebSocket server
const io = createWebSocketServer(httpServer);

// Start server and connect to database
const server = httpServer.listen(config.PORT, () => {
  console.warn(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  console.warn(`   Health check: http://localhost:${config.PORT}/health`);
  console.warn(`   WebSocket server: ws://localhost:${config.PORT}`);
  if (config.CORS_ORIGIN) {
    console.warn(`   CORS origins: ${config.CORS_ORIGIN}`);
  }

  // Connect to Neo4j database and Redis cache
  void (async () => {
    try {
      await connectDatabase();
      await initializeDatabase();
      await seedDatabase();
      await connectRedis();
    } catch (error) {
      console.error('Failed to connect to services on startup:', error);
      process.exit(1);
    }
  })();
});

// Graceful shutdown handlers
function shutdown(signal: string) {
  console.warn(`\n${signal} received. Shutting down gracefully...`);

  // Flush WebSocket batches and cleanup
  shutdownWebSocketServer();

  // Close WebSocket server
  io.close(() => {
    console.warn('WebSocket server closed.');

    // Then close HTTP server
    server.close(() => {
      console.warn('HTTP server closed.');

      // Disconnect from database and cache
      void (async () => {
        try {
          await disconnectDatabase();
          await disconnectRedis();
        } catch (error) {
          console.error('Error disconnecting from services:', error);
        }

        console.warn('Exiting process.');
        process.exit(0);
      })();
    });
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
