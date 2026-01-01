/**
 * API Error Handling
 *
 * Utilities for handling API errors and providing user-friendly messages
 */

import { ApiClientError } from './client'
import type { ProblemDetails } from '../types/api'

/**
 * Get user-friendly error message from API error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiClientError) {
    return error.problemDetails.detail || error.problemDetails.title
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'An unexpected error occurred'
}

/**
 * Check if error is authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401
}

/**
 * Check if error is forbidden error (403)
 */
export function isForbiddenError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 403
}

/**
 * Check if error is not found error (404)
 */
export function isNotFoundError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 404
}

/**
 * Check if error is validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 400
}

/**
 * Check if error is server error (5xx)
 */
export function isServerError(error: unknown): boolean {
  return error instanceof ApiClientError && error.status >= 500
}

/**
 * Format validation errors
 */
export function formatValidationErrors(error: ApiClientError): Record<string, string> {
  const errors: Record<string, string> = {}

  if (error.problemDetails.errors) {
    Object.entries(error.problemDetails.errors).forEach(([field, messages]) => {
      errors[field] = Array.isArray(messages) ? messages[0] : String(messages)
    })
  }

  return errors
}

/**
 * Retry configuration
 */
interface RetryConfig {
  maxRetries: number
  delay: number
  backoff: number
}

/**
 * Retry a request with exponential backoff
 */
export async function retryRequest<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxRetries = 3, delay = 1000, backoff = 2 } = config
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Don't retry on client errors (4xx)
      if (error instanceof ApiClientError && error.status >= 400 && error.status < 500) {
        throw error
      }

      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break
      }

      // Wait before retrying with exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(backoff, attempt)))
    }
  }

  throw lastError
}
