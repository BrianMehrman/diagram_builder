import cors from 'cors'

/**
 * CORS middleware configuration for frontend integration
 *
 * - Allows origins from environment variable (CORS_ORIGIN)
 * - Enables credentials for JWT authentication
 * - Configures allowed methods and headers
 */
export const corsMiddleware = cors({
  // Allow origins from environment or default to localhost:3000 and 5173
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],

  // Enable credentials for JWT cookie/auth handling
  credentials: true,

  // Allowed HTTP methods
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
})
