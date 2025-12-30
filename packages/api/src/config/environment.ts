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
}

/**
 * Validate and load environment configuration
 * Fails fast if required variables are missing
 */
export function validateEnvironment(): EnvironmentConfig {
  const config: EnvironmentConfig = {
    PORT: parseInt(process.env.PORT || '3000', 10),
    NODE_ENV: (process.env.NODE_ENV as EnvironmentConfig['NODE_ENV']) || 'development',
    CORS_ORIGIN: process.env.CORS_ORIGIN
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

  return config;
}
