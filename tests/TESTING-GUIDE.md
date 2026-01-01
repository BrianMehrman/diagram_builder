# Testing Guide - Diagram Builder

This guide explains how to run the Playwright E2E tests for the Diagram Builder project.

## Architecture Overview

The application consists of two main services:

- **UI (React + Vite)**: Runs on `http://localhost:3000`
- **API (Express + Socket.IO)**: Runs on `http://localhost:4000`
- **Database**: Neo4j on `bolt://localhost:7687`
- **Cache**: Redis on `localhost:6379`

The UI proxies API requests from `/api` to `http://localhost:4000`.

## Prerequisites

### 1. Environment Configuration

Copy `.env.example` to `.env` and update the values:

```bash
cp .env.example .env
```

**Critical settings:**
```env
# API Server runs on port 4000
PORT=4000

# UI runs on port 3000, so CORS must allow it
CORS_ORIGIN=http://localhost:3000

# Database credentials
NEO4J_PASSWORD=your-password
JWT_SECRET=your-secret-key
```

### 2. Install Playwright Browsers

```bash
npx playwright install
```

### 3. Start Docker Services

The application requires Neo4j and Redis:

```bash
docker-compose up -d
```

## Running Tests

### Option 1: Manual Server Start (Recommended)

This approach gives you more control and better debugging:

```bash
# Terminal 1: Start all services (UI on 3000, API on 4000)
npm run dev

# Terminal 2: Run tests
npm run test:e2e
```

### Option 2: Run Specific Test Suites

```bash
# Run only smoke tests
npm run test:e2e -- integration-smoke.spec.ts

# Run only chromium browser
npm run test:e2e -- --project=chromium

# Run with UI mode (interactive debugging)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug a specific test
npm run test:e2e:debug -- integration-smoke.spec.ts
```

### Option 3: Auto-Start Servers (Advanced)

Enable `webServer` in `playwright.config.ts` to auto-start services before tests.

**Important:** Ensure `PORT=4000` in your `.env` file first!

## Test Structure

### Integration Smoke Tests (`integration-smoke.spec.ts`)

Simple end-to-end tests that validate the full stack:

- **[SMOKE-001]** Application loads and displays homepage
- **[SMOKE-002]** Can navigate to canvas page
- **[SMOKE-003]** 3D canvas element initializes
- **[SMOKE-004]** API health check endpoint is accessible
- **[SMOKE-005]** Can load graph data (with mocking)
- **[SMOKE-006]** No network failures on page load

**Priority:** P0 - Run these first to validate basic system health

### Feature Tests

- `canvas-visualization.spec.ts` - 3D rendering and controls
- `search-navigation.spec.ts` - Search bar, breadcrumbs, HUD
- `viewpoint-management.spec.ts` - Viewpoint creation and sharing
- `workspace-management.spec.ts` - Workspace switching
- `export-functionality.spec.ts` - Export to various formats

## Test Fixtures and Factories

Tests use custom fixtures for consistent data:

```typescript
import { test, expect } from '../support/fixtures';

test('my test', async ({ page, mockGraph }) => {
  // Mock graph data automatically
  const graph = await mockGraph({
    metadata: { totalNodes: 50 }
  });

  await page.goto('/canvas');
  // ... test assertions
});
```

### Available Fixtures

- `mockGraph` - Mock graph API responses
- `mockRepository` - Mock repository data
- `networkMock` - Generic network interception helpers

### Factories

Located in `tests/support/factories/`:

- `createGraph(nodeCount, edgeCount, overrides)` - Create mock graph data
- `createGraphNode(overrides)` - Create individual nodes
- `createRepository(overrides)` - Create repository data
- `createViewpoint(overrides)` - Create viewpoint data

## Troubleshooting

### Port Already in Use

```bash
# Kill process on port 3000 (UI)
lsof -ti tcp:3000 | xargs kill -9

# Kill process on port 4000 (API)
lsof -ti tcp:4000 | xargs kill -9
```

### Tests Timing Out

- Ensure Neo4j and Redis are running: `docker-compose ps`
- Check API is responding: `curl http://localhost:4000/health`
- Check UI is serving: `curl http://localhost:3000`

### Database Connection Errors

```bash
# Restart Docker services
docker-compose down
docker-compose up -d

# Check Neo4j logs
docker-compose logs neo4j
```

### Console Errors in Tests

Enable verbose logging in smoke tests - they log errors and warnings by default.

```typescript
// Tests automatically log console errors
page.on('console', (msg) => {
  if (msg.type() === 'error') {
    console.log('Browser error:', msg.text());
  }
});
```

## Test Reporting

After running tests, view the HTML report:

```bash
npm run test:e2e:report
```

Reports are saved to:
- HTML: `playwright-report/index.html`
- JUnit XML: `test-results/junit.xml`
- Videos/Screenshots: `test-results/` (on failure only)

## CI/CD

In CI environments:
- Tests run on all browsers (chromium, firefox, webkit)
- Retries: 2 attempts on failure
- Workers: 1 (serial execution to avoid flakiness)

```bash
CI=1 npm run test:e2e
```

## Best Practices

1. **Always start with smoke tests** - They validate basic system health
2. **Use fixtures for data** - Don't create mock data inline
3. **Mock external services** - Use `mockGraph`, `mockRepository` for API responses
4. **Clean up after tests** - Fixtures handle auto-cleanup
5. **Follow Given-When-Then** - Structure tests clearly

## Example Test

```typescript
test('[P0] should display graph statistics', async ({ page, mockGraph }) => {
  // GIVEN: Graph with specific node/edge counts
  const graph = await mockGraph({
    metadata: {
      totalNodes: 25,
      totalEdges: 15,
    },
  });

  // WHEN: User navigates to canvas
  await page.goto('/canvas');

  // THEN: Statistics display correct counts
  await expect(page.getByText('25 nodes, 15 edges')).toBeVisible();
});
```

## Next Steps

1. Review existing tests in `tests/e2e/`
2. Run smoke tests to validate your setup
3. Add new tests following the established patterns
4. Check test coverage with `npm run test` (runs unit tests)

For questions or issues, check the main [README.md](../README.md) or open an issue.
