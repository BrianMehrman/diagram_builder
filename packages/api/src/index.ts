import express from 'express';
import { loggerMiddleware } from './middleware/logger';
import { corsMiddleware } from './middleware/cors-config';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { repositoriesRouter } from './routes/repositories';
import { graphRouter } from './routes/graph';
import { viewpointsRouter } from './routes/viewpoints';
import { exportRouter } from './routes/export';
import { workspacesRouter } from './routes/workspaces';

const app = express();

// Middleware stack (order matters!)
app.use(loggerMiddleware);  // 1. Logging first
app.use(corsMiddleware);     // 2. CORS second
app.use(express.json());     // 3. Body parsing

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy' });
});

// Authentication routes
app.use('/api/auth', authRouter);

// Repository parsing routes
app.use('/api/repositories', repositoriesRouter);

// Graph query routes
app.use('/api/graph', graphRouter);

// Viewpoint management routes
app.use('/api/viewpoints', viewpointsRouter);

// Export routes
app.use('/api/export', exportRouter);

// Workspace routes
app.use('/api/workspaces', workspacesRouter);

// Error handling middleware (MUST be last)
app.use(errorHandler);

export default app;
