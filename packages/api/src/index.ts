import express from 'express';
import { loggerMiddleware } from './middleware/logger';
import { corsMiddleware } from './middleware/cors-config';
import { errorHandler } from './middleware/error-handler';
import { authRouter } from './routes/auth';
import { repositoriesRouter } from './routes/repositories';

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

// Error handling middleware (MUST be last)
app.use(errorHandler);

export default app;
