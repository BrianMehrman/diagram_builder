/**
 * API Client
 *
 * Centralized API client with authentication and error handling
 */

import { createApiClient } from '../utils/api-client'
import { getToken } from './auth'

/**
 * API base URL from environment
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

/**
 * Main API client instance
 */
export const apiClient = createApiClient({
  baseUrl: API_BASE_URL,
  getToken,
})

/**
 * Re-export API client error
 */
export { ApiClientError } from '../utils/api-client'
