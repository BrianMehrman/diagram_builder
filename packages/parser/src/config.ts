/**
 * Parser Configuration
 *
 * Centralized configuration for parser package using Zod for validation
 */

import { z } from 'zod';
import os from 'os';
import path from 'path';

/**
 * Configuration schema with validation
 */
const ParserConfigSchema = z.object({
  // File Storage
  PARSER_TEMP_DIR: z.string().default(path.join(os.tmpdir(), 'diagram-builder')),

  // Repository Size Limits
  MAX_REPO_SIZE_MB: z.coerce.number().default(500),
  MAX_FILE_COUNT: z.coerce.number().default(10000),
  MAX_FILE_SIZE_MB: z.coerce.number().default(10),
  PARSE_TIMEOUT_MS: z.coerce.number().default(300000), // 5 minutes

  // Secret Scanning
  ENABLE_SECRET_SCANNING: z
    .string()
    .optional()
    .default('true')
    .transform((val) => val.toLowerCase() === 'true')
    .pipe(z.boolean()),
  SECRET_ACTION: z.enum(['warn', 'redact', 'fail']).default('warn'),

  // Logging
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type ParserConfig = z.infer<typeof ParserConfigSchema>;

/**
 * Load and validate parser configuration from environment variables
 * Fails fast with clear error messages if validation fails
 */
export function loadParserConfig(): ParserConfig {
  const parsed = ParserConfigSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Parser configuration validation failed:');
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

/**
 * Singleton configuration instance
 */
let configInstance: ParserConfig | null = null;

/**
 * Get parser configuration (singleton pattern)
 */
export function getParserConfig(): ParserConfig {
  if (!configInstance) {
    configInstance = loadParserConfig();
  }
  return configInstance;
}

/**
 * Reset configuration (useful for testing)
 */
export function resetParserConfig(): void {
  configInstance = null;
}
