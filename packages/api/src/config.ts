/**
 * API Configuration
 *
 * Centralized configuration for API package using Zod for validation
 * Replaces environment.ts with type-safe schema validation
 */

import { z } from 'zod';

/**
 * Configuration schema with validation
 */
const ApiConfigSchema = z.object({
  // Server Configuration
  PORT: z.coerce.number().min(1).max(65535).default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CORS_ORIGIN: z.string().optional(),

  // Authentication
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters for security'),

  // Neo4j Database
  NEO4J_URI: z.string().default('bolt://localhost:7687'),
  NEO4J_USERNAME: z.string().default('neo4j'),
  NEO4J_PASSWORD: z.string().min(1, 'NEO4J_PASSWORD is required'),

  // Redis Cache
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  REDIS_DB: z.coerce.number().default(0),

  // Parser Integration (from Story 6-5)
  PARSER_TEMP_DIR: z.string().optional(),
  MAX_REPO_SIZE_MB: z.coerce.number().default(500),
  MAX_FILE_COUNT: z.coerce.number().default(10000),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  PARSE_TIMEOUT_MS: z.coerce.number().default(300000), // 5 minutes

  // Security
  ENABLE_SECRET_SCANNING: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true')
    .pipe(z.boolean()),
  SECRET_ACTION: z.enum(['warn', 'redact', 'fail']).default('warn'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(60000), // 1 minute
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(100),
  RATE_LIMIT_ENABLED: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true')
    .pipe(z.boolean()),
});

export type ApiConfig = z.infer<typeof ApiConfigSchema>;

/**
 * Load and validate API configuration from environment variables
 * Fails fast with clear error messages if validation fails
 */
export function loadApiConfig(): ApiConfig {
  const parsed = ApiConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ API configuration validation failed:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

/**
 * Singleton configuration instance
 */
let configInstance: ApiConfig | null = null;

/**
 * Get API configuration (singleton pattern)
 */
export function getApiConfig(): ApiConfig {
  if (!configInstance) {
    configInstance = loadApiConfig();
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetApiConfig(): void {
  configInstance = null;
}
