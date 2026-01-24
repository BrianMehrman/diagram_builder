/**
 * URL Validation
 *
 * Validates and sanitizes repository URLs to prevent SSRF attacks
 * Ensures only safe, public repositories can be accessed
 */

import { URL } from 'url';
import { logger } from '../logger.js';

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedUrl?: string;
}

/**
 * Blocked domains and IP ranges (prevent SSRF)
 */
const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '169.254.169.254', // AWS metadata endpoint
  'metadata.google.internal', // GCP metadata endpoint
];

/**
 * Allowed Git hosting platforms
 */
const ALLOWED_GIT_HOSTS = [
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'git.sr.ht', // Sourcehut
];

/**
 * Check if IP is in private range
 */
function isPrivateIp(hostname: string): boolean {
  // IPv4 private ranges
  const privateRanges = [
    /^10\./,                    // 10.0.0.0/8
    /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0/12
    /^192\.168\./,              // 192.168.0.0/16
  ];

  return privateRanges.some((range) => range.test(hostname));
}

/**
 * Validate repository URL
 * Returns validation result with sanitized URL if valid
 */
export function validateRepositoryUrl(urlString: string): UrlValidationResult {
  try {
    // Parse URL
    const url = new URL(urlString);

    // Only allow HTTP(S) and Git protocols
    if (!['http:', 'https:', 'git:'].includes(url.protocol)) {
      return {
        isValid: false,
        error: `Invalid protocol: ${url.protocol}. Only http, https, and git are allowed.`,
      };
    }

    // Check for blocked hosts
    const hostname = url.hostname.toLowerCase();
    if (BLOCKED_HOSTS.includes(hostname)) {
      logger.warn(`Blocked repository URL with forbidden host: ${hostname}`);
      return {
        isValid: false,
        error: `Blocked host: ${hostname}. Cannot access localhost or internal services.`,
      };
    }

    // Check for private IP addresses
    if (isPrivateIp(hostname)) {
      logger.warn(`Blocked repository URL with private IP: ${hostname}`);
      return {
        isValid: false,
        error: `Blocked private IP address: ${hostname}`,
      };
    }

    // Verify it's from an allowed Git hosting platform
    const isAllowedHost = ALLOWED_GIT_HOSTS.some((allowed) => hostname.endsWith(allowed));
    if (!isAllowedHost) {
      logger.warn(`Repository URL from non-whitelisted host: ${hostname}`);
      return {
        isValid: false,
        error: `Host not allowed: ${hostname}. Only ${ALLOWED_GIT_HOSTS.join(', ')} are supported.`,
      };
    }

    // Sanitize URL (remove auth credentials if present)
    const sanitizedUrl = new URL(url.toString());
    sanitizedUrl.username = '';
    sanitizedUrl.password = '';

    return {
      isValid: true,
      sanitizedUrl: sanitizedUrl.toString(),
    };
  } catch (error) {
    logger.error('Invalid repository URL format:', error);
    return {
      isValid: false,
      error: `Invalid URL format: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Sanitize file path to prevent directory traversal
 * Removes .. and ensures path stays within allowed directory
 */
export function sanitizeFilePath(filePath: string, baseDir: string): string | null {
  try {
    // Normalize path and resolve to absolute
    const path = require('path');
    const normalizedPath = path.normalize(filePath);
    const absolutePath = path.resolve(baseDir, normalizedPath);

    // Ensure resolved path is within base directory
    if (!absolutePath.startsWith(path.resolve(baseDir))) {
      logger.warn(`Path traversal attempt detected: ${filePath}`);
      return null;
    }

    return absolutePath;
  } catch (error) {
    logger.error('Error sanitizing file path:', error);
    return null;
  }
}
