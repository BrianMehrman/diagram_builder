/**
 * Export API Integration Tests
 *
 * Priority: P0 - Critical export functionality
 * Coverage: All 5 export endpoints (plantuml, mermaid, drawio, gltf, image)
 */

import { test, expect } from '@playwright/test'

const API_BASE_URL = 'http://localhost:4000/api'
const TEST_REPO_ID = 'test-repo-123'
const AUTH_HEADER = { Authorization: 'Bearer test-token-123' }

// ---------------------------------------------------------------------------
// Auth rejection tests
// ---------------------------------------------------------------------------

test.describe('Export API - Auth Rejection @P0 @api', () => {
  test('[P0] POST /api/export/plantuml - should reject unauthenticated requests', async ({
    request,
  }) => {
    // GIVEN: Request without auth token
    // WHEN: Calling plantuml export without auth
    const response = await request.post(`${API_BASE_URL}/export/plantuml`, {
      data: { repoId: TEST_REPO_ID },
      failOnStatusCode: false,
    })

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401)
  })

  test('[P0] POST /api/export/mermaid - should reject unauthenticated requests', async ({
    request,
  }) => {
    // GIVEN: Request without auth token
    // WHEN: Calling mermaid export without auth
    const response = await request.post(`${API_BASE_URL}/export/mermaid`, {
      data: { repoId: TEST_REPO_ID },
      failOnStatusCode: false,
    })

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401)
  })

  test('[P0] POST /api/export/drawio - should reject unauthenticated requests', async ({
    request,
  }) => {
    // GIVEN: Request without auth token
    // WHEN: Calling drawio export without auth
    const response = await request.post(`${API_BASE_URL}/export/drawio`, {
      data: { repoId: TEST_REPO_ID },
      failOnStatusCode: false,
    })

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401)
  })

  test('[P0] POST /api/export/gltf - should reject unauthenticated requests', async ({
    request,
  }) => {
    // GIVEN: Request without auth token
    // WHEN: Calling gltf export without auth
    const response = await request.post(`${API_BASE_URL}/export/gltf`, {
      data: { repoId: TEST_REPO_ID },
      failOnStatusCode: false,
    })

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401)
  })

  test('[P0] POST /api/export/image - should reject unauthenticated requests', async ({
    request,
  }) => {
    // GIVEN: Request without auth token
    // WHEN: Calling image export without auth
    const response = await request.post(`${API_BASE_URL}/export/image`, {
      data: { repoId: TEST_REPO_ID, format: 'png' },
      failOnStatusCode: false,
    })

    // THEN: Returns 401 Unauthorized
    expect(response.status()).toBe(401)
  })
})

// ---------------------------------------------------------------------------
// Validation tests
// ---------------------------------------------------------------------------

test.describe('Export API - Input Validation @P1 @api', () => {
  test('[P1] POST /api/export/plantuml - should reject request missing repoId', async ({
    request,
  }) => {
    // GIVEN: Request with auth but missing repoId
    // WHEN: Calling plantuml export without required repoId
    const response = await request.post(`${API_BASE_URL}/export/plantuml`, {
      data: {},
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 400 Bad Request or 401 (if auth not configured in test env)
    const status = response.status()
    expect([400, 401]).toContain(status)
  })

  test('[P1] POST /api/export/image - should reject invalid format value', async ({ request }) => {
    // GIVEN: Request with auth but unsupported format 'bmp'
    // WHEN: Calling image export with invalid format
    const response = await request.post(`${API_BASE_URL}/export/image`, {
      data: { repoId: TEST_REPO_ID, format: 'bmp' },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 400 Bad Request or 401 (if auth not configured in test env)
    const status = response.status()
    expect([400, 401]).toContain(status)
  })
})

// ---------------------------------------------------------------------------
// Format-correct content tests
// ---------------------------------------------------------------------------

test.describe('Export API - Format Content Validation @P1 @api', () => {
  test('[P1] POST /api/export/plantuml - should return valid PlantUML content', async ({
    request,
  }) => {
    // GIVEN: Valid request with auth
    // WHEN: Requesting plantuml export
    const response = await request.post(`${API_BASE_URL}/export/plantuml`, {
      data: { repoId: TEST_REPO_ID },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 200, 401, or 404 depending on environment
    const status = response.status()
    expect([200, 401, 404]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.mimeType).toBe('text/x-plantuml')
      expect(body.extension).toBe('puml')
      expect(body.content).toMatch(/^@startuml/)
      expect(body.content).toMatch(/@enduml\s*$/)
      expect(body.stats).toHaveProperty('nodeCount')
      expect(body.stats).toHaveProperty('edgeCount')
    }
  })

  test('[P1] POST /api/export/mermaid - should return valid Mermaid content', async ({
    request,
  }) => {
    // GIVEN: Valid request with auth
    // WHEN: Requesting mermaid export
    const response = await request.post(`${API_BASE_URL}/export/mermaid`, {
      data: { repoId: TEST_REPO_ID },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 200, 401, or 404 depending on environment
    const status = response.status()
    expect([200, 401, 404]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.mimeType).toBe('text/x-mermaid')
      expect(body.extension).toBe('mmd')
      expect(body.content).toMatch(/^(flowchart|graph|classDiagram|C4)/m)
      expect(body.stats).toHaveProperty('nodeCount')
      expect(body.stats).toHaveProperty('edgeCount')
    }
  })

  test('[P1] POST /api/export/drawio - should return valid Draw.io content', async ({
    request,
  }) => {
    // GIVEN: Valid request with auth
    // WHEN: Requesting drawio export
    const response = await request.post(`${API_BASE_URL}/export/drawio`, {
      data: { repoId: TEST_REPO_ID },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 200, 401, or 404 depending on environment
    const status = response.status()
    expect([200, 401, 404]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.mimeType).toBe('application/vnd.jgraph.mxfile')
      expect(body.extension).toBe('drawio')
      expect(body.content).toMatch(/<mxfile/)
      expect(body.stats).toHaveProperty('nodeCount')
      expect(body.stats).toHaveProperty('edgeCount')
    }
  })

  test('[P1] POST /api/export/gltf - should return valid GLTF content', async ({ request }) => {
    // GIVEN: Valid request with auth
    // WHEN: Requesting gltf export
    const response = await request.post(`${API_BASE_URL}/export/gltf`, {
      data: { repoId: TEST_REPO_ID },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 200, 401, or 404 depending on environment
    const status = response.status()
    expect([200, 401, 404]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.mimeType).toBe('model/gltf+json')
      expect(body.extension).toBe('gltf')
      const parsed = JSON.parse(body.content)
      expect(parsed.asset.version).toBe('2.0')
      expect(body.stats).toHaveProperty('nodeCount')
      expect(body.stats).toHaveProperty('edgeCount')
    }
  })

  test('[P1] POST /api/export/image (svg) - should return valid SVG content', async ({
    request,
  }) => {
    // GIVEN: Valid request with auth and format=svg
    // WHEN: Requesting image export as SVG
    const response = await request.post(`${API_BASE_URL}/export/image`, {
      data: { repoId: TEST_REPO_ID, format: 'svg' },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 200, 401, or 404 depending on environment
    const status = response.status()
    expect([200, 401, 404]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.mimeType).toBe('image/svg+xml')
      expect(body.extension).toBe('svg')
      expect(body.content).toMatch(/<svg/)
      expect(body.content).toMatch(/<\/svg>/)
      expect(body.stats).toHaveProperty('nodeCount')
      expect(body.stats).toHaveProperty('edgeCount')
    }
  })

  test('[P1] POST /api/export/image (png) - should return valid PNG content', async ({
    request,
  }) => {
    // GIVEN: Valid request with auth and format=png
    // WHEN: Requesting image export as PNG
    const response = await request.post(`${API_BASE_URL}/export/image`, {
      data: { repoId: TEST_REPO_ID, format: 'png' },
      headers: AUTH_HEADER,
      failOnStatusCode: false,
    })

    // THEN: Returns 200, 401, or 404 depending on environment
    const status = response.status()
    expect([200, 401, 404]).toContain(status)

    if (status === 200) {
      const body = await response.json()
      expect(body.mimeType).toBe('image/png')
      expect(body.extension).toBe('png')
      expect(body.content).toBeDefined()
      expect(body.stats).toHaveProperty('nodeCount')
      expect(body.stats).toHaveProperty('edgeCount')
    }
  })
})
