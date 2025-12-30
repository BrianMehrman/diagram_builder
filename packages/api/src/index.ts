import express from 'express';
import { loggerMiddleware } from './middleware/logger';
import { corsMiddleware } from './middleware/cors-config';
import { errorHandler } from './middleware/error-handler';
import { validateEnvironment } from './config/environment';

const app = express();

// Validate environment configuration on startup
const config = validateEnvironment();

// Middleware stack (order matters!)
app.use(loggerMiddleware);  // 1. Logging first
app.use(corsMiddleware);     // 2. CORS second
app.use(express.json());     // 3. Body parsing

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Error handling middleware (MUST be last)
app.use(errorHandler);

// Start server
const server = app.listen(config.PORT, () => {
  // Using console.warn to comply with ESLint no-console rule
  console.warn(`🚀 Server running on port ${config.PORT} in ${config.NODE_ENV} mode`);
  console.warn(`   Health check: http://localhost:${config.PORT}/health`);
  if (config.CORS_ORIGIN) {
    console.warn(`   CORS origins: ${config.CORS_ORIGIN}`);
  }
});

// Graceful shutdown handlers
function shutdown(signal: string) {
  console.warn(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.warn('Server closed. Exiting process.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export default app;
