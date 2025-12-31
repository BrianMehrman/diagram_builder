# Test Suite Documentation

**Framework**: Playwright v1.57.0
**Language**: TypeScript
**Test Types**: E2E (End-to-End), API Integration

---

## Overview

This test suite provides comprehensive E2E testing for the Diagram Builder 3D visualization UI. Tests verify critical user journeys, performance requirements (60fps rendering, <100ms interaction latency), and multi-browser compatibility.

---

## Setup Instructions

### 1. Install Dependencies

Playwright is already included in the root `package.json`. If you need to reinstall or install browsers:

```bash
# Install all dependencies (from project root)
npm install

# Install Playwright browsers (Chromium, Firefox, WebKit)
npx playwright install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in test-specific values:

```bash
cp .env.example .env
```

Required variables:
- `BASE_URL`: URL of the application under test (default: `http://localhost:3000`)
- `TEST_USER_EMAIL`: Test user email for authenticated tests
- `TEST_USER_PASSWORD`: Test user password

### 3. Start the Application

Before running tests, ensure the UI server is running:

```bash
# Start dev server (in separate terminal)
npm run dev
```

The UI should be accessible at `http://localhost:3000` (or your configured `BASE_URL`).

---

## Running Tests

### Basic Execution

```bash
# Run all E2E tests (headless mode, all browsers)
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/e2e/canvas-visualization.spec.ts

# Run tests matching a pattern
npm run test:e2e -- --grep "smoke"

# Run API integration tests
npm run test:api
```

### By Priority

```bash
# P0 tests only (critical smoke tests, ~2-5 min)
npm run test:e2e -- --grep "@P0"

# P0 + P1 tests (core functionality, ~10-15 min)
npm run test:e2e -- --grep "@P0|@P1"

# All priorities (full regression, ~20-30 min)
npm run test:e2e
```

### Interactive Mode

```bash
# Open Playwright UI mode (recommended for development)
npm run test:e2e:ui

# Run tests in headed mode (see browser window)
npm run test:e2e:headed

# Debug mode (step through tests with inspector)
npm run test:e2e:debug
```

### View Test Reports

```bash
# Open HTML test report
npm run test:e2e:report
```

### Browser-Specific Testing

```bash
# Run tests in Chromium only
npm run test:e2e -- --project=chromium

# Run tests in Firefox only
npm run test:e2e -- --project=firefox

# Run tests in WebKit (Safari) only
npm run test:e2e -- --project=webkit
```

---

## Directory Structure

```
tests/
├── e2e/                              # E2E test files
│   ├── ui-loads.spec.ts              # [P0] UI load smoke tests
│   ├── canvas-visualization.spec.ts  # [P0] 3D canvas visualization tests
│   ├── search-navigation.spec.ts     # [P1] Search and navigation tests
│   ├── viewpoint-management.spec.ts  # [P1] Viewpoint CRUD tests
│   ├── workspace-management.spec.ts  # [P1] Workspace switching tests
│   ├── export-functionality.spec.ts  # [P2] Export feature tests
│   └── example.spec.ts               # Example test patterns (delete when ready)
├── api/                              # API integration tests
│   ├── repositories.api.spec.ts      # [P0] Repository API tests
│   └── viewpoints.api.spec.ts        # [P1] Viewpoints API tests
└── support/                          # Test infrastructure
    ├── factories/                    # Data factories (faker-based)
    │   ├── graph-factory.ts          # Graph/repository data factories
    │   ├── viewpoint-factory.ts      # Viewpoint data factories
    │   └── index.ts                  # Factory exports
    ├── fixtures/                     # Test fixtures with auto-cleanup
    │   └── index.ts                  # Custom fixtures (mockGraph, mockRepository, networkMock)
    └── helpers/                      # Utility functions
```

---

## Test Architecture

### Fixture Pattern

Tests use Playwright's fixture system for setup/teardown with auto-cleanup:

```typescript
import { test, expect } from '../support/fixtures';

test('my test', async ({ page }) => {
  // Fixtures provide pre-configured resources
  // Cleanup happens automatically after test completes
});
```

**Key Benefits**:
- Auto-cleanup (no manual teardown in tests)
- Composable (fixtures can use other fixtures)
- Isolated (each test gets fresh fixtures)
- Type-safe

### Data Factories

Located in `tests/support/factories/`:

```typescript
import { createGraphNode, createGraph, createViewpoint } from '../support/factories';

// Generate unique graph nodes
const node = createGraphNode({
  label: 'UserService.ts',
  type: 'file',
});

// Generate complete graphs
const graph = createGraph(10, 5, {
  metadata: { totalNodes: 10, totalEdges: 5 },
});

// Generate viewpoints
const viewpoint = createViewpoint({
  name: 'My Architecture View',
  isPublic: false,
});
```

All factories use `@faker-js/faker` for random data generation to ensure parallel-safe, unique test data.

### Network-First Pattern

**CRITICAL**: Always intercept routes BEFORE navigation to prevent race conditions.

```typescript
// ✅ CORRECT: Intercept BEFORE navigation
await page.route('**/api/data', handler);
await page.goto('/page');

// ❌ WRONG: Navigate then intercept (too late!)
await page.goto('/page');
await page.route('**/api/data', handler);
```

---

## Best Practices

### 1. Use `data-testid` Attributes

Prefer stable selectors that don't break with UI changes:

```tsx
// In your UI component
<button data-testid="submit-button">Submit</button>

// In your test
await page.click('[data-testid="submit-button"]');
```

**Selector Priority**:
1. `data-testid` (best - stable across changes)
2. ARIA roles (`role=button`)
3. Text content (`text=Submit`)
4. CSS selectors (last resort - brittle)

### 2. Follow Given-When-Then Structure

```typescript
test('should display error for invalid input', async ({ page }) => {
  // GIVEN: User is on the form page
  await page.goto('/form');

  // WHEN: User submits invalid data
  await page.fill('[data-testid="email"]', 'invalid-email');
  await page.click('[data-testid="submit"]');

  // THEN: Error message is displayed
  await expect(page.locator('[data-testid="error"]')).toHaveText('Invalid email');
});
```

### 3. One Assertion Per Test (Atomic Tests)

```typescript
// ✅ GOOD: One assertion
test('should display user name', async ({ page }) => {
  await expect(page.locator('[data-testid="user-name"]')).toHaveText('John');
});

// ❌ AVOID: Multiple assertions (harder to debug)
test('should display user info', async ({ page }) => {
  await expect(page.locator('[data-testid="user-name"]')).toHaveText('John');
  await expect(page.locator('[data-testid="user-email"]')).toHaveText('john@example.com');
});
```

**Why?** If the second assertion fails, you don't know if the first is still valid.

### 4. No Hard Waits

```typescript
// ❌ WRONG: Hard wait (flaky, slow)
await page.waitForTimeout(3000);

// ✅ CORRECT: Explicit wait (deterministic, fast)
await page.waitForSelector('[data-testid="element"]');
await page.waitForURL('/dashboard');
await page.waitForLoadState('networkidle');
```

### 5. Deterministic Tests

- Use faker for random data (no hardcoded values)
- Clean up test data in fixture teardown
- Isolate tests (no dependencies between tests)
- Use network interception for consistent API responses

---

## CI Integration

Tests are configured to run in CI with retry logic:

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0,
workers: process.env.CI ? 1 : undefined,
```

**JUnit XML Report** for CI systems:

```bash
# Reports saved to: test-results/junit.xml
```

**HTML Report** for debugging:

```bash
# Reports saved to: test-results/html
```

---

## Debugging Failed Tests

### 1. Run in UI Mode

```bash
npm run test:e2e:ui
```

Click on a failed test to see:
- Screenshots at each step
- Network requests
- Console logs
- DOM snapshots

### 2. Run in Debug Mode

```bash
npm run test:e2e:debug
```

Playwright Inspector will open, allowing you to:
- Step through test line-by-line
- Inspect page state
- Try selectors in real-time

### 3. View Failure Artifacts

After a test failure, check:
- **Screenshots**: `test-results/{test-name}/screenshot.png`
- **Videos**: `test-results/{test-name}/video.webm`
- **Traces**: `test-results/{test-name}/trace.zip` (open with `npx playwright show-trace trace.zip`)

---

## Performance Testing

This application has strict performance requirements:
- **Rendering**: 60fps minimum with 1000+ nodes
- **Interaction**: <100ms input-to-render latency

Monitor performance in tests:

```typescript
test('should render at 60fps', async ({ page }) => {
  await page.goto('/');

  // Measure frame rate
  const fps = await page.evaluate(() => {
    let frames = 0;
    return new Promise((resolve) => {
      const measure = () => {
        frames++;
        if (frames < 60) requestAnimationFrame(measure);
        else resolve(60 / (performance.now() / 1000));
      };
      requestAnimationFrame(measure);
    });
  });

  expect(fps).toBeGreaterThanOrEqual(60);
});
```

---

## Knowledge Base References

This test framework follows TEA (Test Architect) best practices:

- **Fixture Architecture**: Pure function → fixture → mergeTests composition
- **Data Factories**: Faker-based with auto-cleanup
- **Network-First**: Intercept before navigate pattern
- **Test Quality**: Deterministic, isolated, explicit assertions
- **Selector Resilience**: data-testid > ARIA > text > CSS hierarchy

For detailed examples and advanced patterns, consult:
- `_bmad/bmm/testarch/knowledge/fixture-architecture.md`
- `_bmad/bmm/testarch/knowledge/data-factories.md`
- `_bmad/bmm/testarch/knowledge/network-first.md`
- `_bmad/bmm/testarch/knowledge/test-quality.md`

---

## Troubleshooting

### Issue: "UI didn't load"

Run the smoke tests to diagnose:

```bash
npm run test:e2e -- tests/e2e/ui-loads.spec.ts
```

These tests verify:
- HTTP 200 response
- No console errors
- Main app container visible
- No failed network requests
- Valid page title

### Issue: "Browser not found"

Install Playwright browsers:

```bash
npx playwright install
```

### Issue: "Port 3000 already in use"

Check if dev server is running or update `BASE_URL` in `.env`:

```bash
BASE_URL=http://localhost:5173
```

---

## Next Steps

1. **Delete example tests**: Remove `tests/e2e/example.spec.ts` once you have real tests
2. **Add feature tests**: Create test files for each major feature
3. **Implement data factories**: Add factories for your domain entities
4. **Create custom fixtures**: Add fixtures for common setup (auth, data seeding)
5. **Configure CI**: Add test execution to your CI/CD pipeline

---

## Contact

**Questions or Issues?**

- Consult TEA knowledge base: `_bmad/bmm/testarch/knowledge/`
- Review Playwright docs: https://playwright.dev
- Check test architecture doc: `_bmad/bmm/docs/test-architecture.md`

---

## Test Coverage Summary

### E2E Tests

- **Canvas Visualization** (P0): 6 tests
  - Canvas loads with graph data
  - 3D rendering without errors
  - Camera controls display
  - LOD controls display
  - Navigation back to home
  - Export button visible

- **Search & Navigation** (P1): 4 tests
  - Search bar display
  - Node filtering
  - Breadcrumbs display
  - HUD metrics

- **Viewpoint Management** (P1): 4 tests
  - Viewpoint panel display
  - Create new viewpoint
  - List saved viewpoints
  - Share viewpoint

- **Workspace Management** (P1): 2 tests
  - Workspace switcher display
  - Workspace persistence

- **Export Functionality** (P2): 3 tests
  - Export dialog opens
  - Export dialog closes
  - Export format options

### API Integration Tests

- **Repository API** (P0): 5 tests
  - Authentication validation
  - Parse repository (POST)
  - Get repository metadata (GET)
  - Delete repository (DELETE)
  - Refresh repository (POST)

- **Viewpoints API** (P1): 8 tests
  - Authentication validation
  - Create viewpoint (POST)
  - Field validation
  - Get viewpoint (GET)
  - Update viewpoint (PUT)
  - Delete viewpoint (DELETE)
  - Share viewpoint (POST)
  - Public access via share token (GET)

**Total Tests:** 32 (19 E2E + 13 API)

---

**Last Updated:** 2025-12-31
**Generated by BMad TEA Agent**
