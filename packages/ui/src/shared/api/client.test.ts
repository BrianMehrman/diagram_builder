/**
 * API Client Tests
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createApiClient, ApiClientError } from '../utils/api-client'

// Mock fetch globally
global.fetch = vi.fn()

describe('createApiClient', () => {
  const mockGetToken = vi.fn()
  const baseUrl = 'http://localhost:4000'

  let apiClient: ReturnType<typeof createApiClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetToken.mockReturnValue(null)
    apiClient = createApiClient({ baseUrl, getToken: mockGetToken })
  })

  it('should make GET request', async () => {
    const mockData = { id: 1, name: 'Test' }
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockData,
    } as Response)

    const result = await apiClient.get('/api/test')

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/test`,
      expect.objectContaining({
        method: 'GET',
      })
    )
    expect(result).toEqual(mockData)
  })

  it('should include auth token when available', async () => {
    mockGetToken.mockReturnValue('test-token')
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    await apiClient.get('/api/test')

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const headers = callArgs[1]?.headers as Headers
    expect(headers.get('Authorization')).toBe('Bearer test-token')
  })

  it('should make POST request with body', async () => {
    const requestBody = { name: 'Test' }
    const mockResponse = { id: 1, ...requestBody }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const result = await apiClient.post('/api/test', requestBody)

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/test`,
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(requestBody),
      })
    )
    expect(result).toEqual(mockResponse)
  })

  it('should handle query parameters', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response)

    await apiClient.get('/api/test', {
      params: { page: 1, limit: 10, active: true },
    })

    expect(fetch).toHaveBeenCalledWith(
      `${baseUrl}/api/test?page=1&limit=10&active=true`,
      expect.anything()
    )
  })

  it('should handle 204 No Content', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      status: 204,
    } as Response)

    const result = await apiClient.delete('/api/test/1')

    expect(result).toBeUndefined()
  })

  it('should throw ApiClientError on error response', async () => {
    const errorResponse = {
      title: 'Not Found',
      detail: 'Resource not found',
      status: 404,
    }

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => errorResponse,
    } as Response)

    await expect(apiClient.get('/api/test')).rejects.toThrow(ApiClientError)
  })

  it('should set Content-Type header', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    } as Response)

    await apiClient.post('/api/test', {})

    const callArgs = vi.mocked(fetch).mock.calls[0]
    const headers = callArgs[1]?.headers as Headers
    expect(headers.get('Content-Type')).toBe('application/json')
  })
})
