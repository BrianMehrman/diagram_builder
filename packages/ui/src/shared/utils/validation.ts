/**
 * Validation Utilities
 *
 * Common validation functions
 */

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate URL format
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validate Git repository URL
 */
export function isValidGitUrl(url: string): boolean {
  // Support HTTP(S), Git, and SSH URLs
  const patterns = [
    /^https?:\/\/.+\.git$/,
    /^git@.+:.+\.git$/,
    /^git:\/\/.+\.git$/,
  ];
  return patterns.some((pattern) => pattern.test(url));
}

/**
 * Check if value is not empty
 */
export function isNotEmpty(value: string | null | undefined): boolean {
  return value !== null && value !== undefined && value.trim().length > 0;
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value.length >= minLength;
}

/**
 * Validate maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return value.length <= maxLength;
}
