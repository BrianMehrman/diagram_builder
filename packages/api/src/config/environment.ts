/**
 * Environment configuration and validation
 *
 * Validates required environment variables on server startup
 * Provides default values where appropriate
 */

export interface EnvironmentConfig {
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  CORS_ORIGIN: string | undefined;
  JWT_SECRET: string;
  NEO4J_URI: string;
  NEO4J_USERNAME: string;
  NEO4J_PASSWORD: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string | undefined;
  REDIS_DB: number;
}

/**
 * Validate and load environment configuration
 * Fails fast if required variables are missing
 */
export function validateEnvironment(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    CORS_ORIGIN: process.env.CORS_ORIGIN,
    JWT_SECRET: process.env.JWT_SECRET || '',
    NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
    NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'neo4j',
    NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || '',
    REDIS_HOST: process.env.REDIS_HOST || 'localhost',
    REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
    REDIS_PASSWORD: process.env.REDIS_PASSWORD || undefined,
    REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10)
  };

  // Validate PORT
  if (isNaN(config.PORT) || config.PORT < 1 || config.PORT > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535.`);
  }

  // Validate NODE_ENV
  if (!['development', 'production', 'test'].includes(config.NODE_ENV)) {
    console.warn(`Warning: NODE_ENV="${config.NODE_ENV}" is not standard. Using "development".`);
    config.NODE_ENV = 'development';
  }

  // Validate JWT_SECRET
  if (!config.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required');
  }

  if (config.JWT_SECRET.length < 32) {
    console.warn('Warning: JWT_SECRET should be at least 32 characters for security');
  }

  // Validate Neo4j configuration
  if (!config.NEO4J_PASSWORD) {
    throw new Error('NEO4J_PASSWORD environment variable is required');
  }

  if (!config.NEO4J_URI) {
    throw new Error('NEO4J_URI environment variable is required');
  }

  if (!config.NEO4J_USERNAME) {
    throw new Error('NEO4J_USERNAME environment variable is required');
  }

  return config;
}
