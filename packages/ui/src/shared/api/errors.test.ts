/**
 * API Error Handling Tests
 */

import { describe, it, expect } from 'vitest'
import { ApiClientError } from './client'
import {
  getErrorMessage,
  isAuthError,
  isForbiddenError,
  isNotFoundError,
  isValidationError,
  isServerError,
  formatValidationErrors,
  retryRequest,
} from './errors'

describe('errors', () => {
  describe('getErrorMessage', () => {
    it('should extract message from ApiClientError', () => {
      const error = new ApiClientError(
        { title: 'Not Found', detail: 'Resource not found', status: 404 },
        404
      )
      expect(getErrorMessage(error)).toBe('Resource not found')
    })

    it('should extract message from Error', () => {
      const error = new Error('Test error')
      expect(getErrorMessage(error)).toBe('Test error')
    })

    it('should return default message for unknown errors', () => {
      expect(getErrorMessage('unknown')).toBe('An unexpected error occurred')
    })
  })

  describe('error type checkers', () => {
    it('should detect auth errors (401)', () => {
      const error = new ApiClientError({ title: 'Unauthorized', status: 401 }, 401)
      expect(isAuthError(error)).toBe(true)
    })

    it('should detect forbidden errors (403)', () => {
      const error = new ApiClientError({ title: 'Forbidden', status: 403 }, 403)
      expect(isForbiddenError(error)).toBe(true)
    })

    it('should detect not found errors (404)', () => {
      const error = new ApiClientError({ title: 'Not Found', status: 404 }, 404)
      expect(isNotFoundError(error)).toBe(true)
    })

    it('should detect validation errors (400)', () => {
      const error = new ApiClientError({ title: 'Bad Request', status: 400 }, 400)
      expect(isValidationError(error)).toBe(true)
    })

    it('should detect server errors (5xx)', () => {
      const error = new ApiClientError({ title: 'Internal Server Error', status: 500 }, 500)
      expect(isServerError(error)).toBe(true)
    })
  })

  describe('formatValidationErrors', () => {
    it('should format validation errors', () => {
      const error = new ApiClientError(
        {
          title: 'Validation Failed',
          status: 400,
          errors: {
            username: ['Username is required'],
            email: ['Email is invalid', 'Email already exists'],
          },
        },
        400
      )

      const formatted = formatValidationErrors(error)
      expect(formatted).toEqual({
        username: 'Username is required',
        email: 'Email is invalid',
      })
    })
  })

  describe('retryRequest', () => {
    it('should succeed on first try', async () => {
      const fn = vi.fn().mockResolvedValue('success')
      const result = await retryRequest(fn)

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should retry on failure and eventually succeed', async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success')

      const result = await retryRequest(fn, { maxRetries: 2, delay: 10 })

      expect(result).toBe('success')
      expect(fn).toHaveBeenCalledTimes(2)
    })

    it('should not retry on client errors', async () => {
      const error = new ApiClientError({ title: 'Bad Request', status: 400 }, 400)
      const fn = vi.fn().mockRejectedValue(error)

      await expect(retryRequest(fn)).rejects.toThrow(ApiClientError)
      expect(fn).toHaveBeenCalledTimes(1)
    })

    it('should throw after max retries', async () => {
      const error = new Error('Network error')
      const fn = vi.fn().mockRejectedValue(error)

      await expect(retryRequest(fn, { maxRetries: 2, delay: 10 })).rejects.toThrow('Network error')

      expect(fn).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })
  })
})
