/**
 * Server startup and lifecycle management
 * Separate from app.ts to allow testing without starting the server
 */

import app from './index';
import { validateEnvironment } from './config/environment';
import { connectDatabase, disconnectDatabase } from './database/neo4j-client';
import { initializeDatabase } from './database/init-db';

// Validate environment configuration
const config = validateEnvironment();

// Start server and connect to database
const server = app.listen(config.PORT, () => {
  console.warn(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  console.warn(`   Health check: http://localhost:${config.PORT}/health`);
  if (config.CORS_ORIGIN) {
    console.warn(`   CORS origins: ${config.CORS_ORIGIN}`);
  }

  // Connect to Neo4j database
  void (async () => {
    try {
      await connectDatabase();
      await initializeDatabase();
    } catch (error) {
      console.error('Failed to connect to database on startup:', error);
      process.exit(1);
    }
  })();
});

// Graceful shutdown handlers
function shutdown(signal: string) {
  console.warn(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.warn('Server closed.');

    // Disconnect from database
    void (async () => {
      try {
        await disconnectDatabase();
      } catch (error) {
        console.error('Error disconnecting from database:', error);
      }

      console.warn('Exiting process.');
      process.exit(0);
    })();
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
