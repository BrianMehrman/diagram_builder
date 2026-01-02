# Diagram Builder

3D codebase visualization tool with interactive graph-based exploration.

## Overview

Diagram Builder is a developer tool that parses codebases, builds dependency graphs, and renders them as interactive 3D visualizations. It supports multi-format exports, real-time collaboration, and headless CLI operations for CI/CD integration.

## Architecture

This is a TypeScript monorepo with 5 packages:

- **`@diagram-builder/core`**: Shared library (IVM, layout engine, exporters)
- **`@diagram-builder/parser`**: Tree-sitter based parser (JS/TS support)
- **`@diagram-builder/api`**: REST API + WebSocket server (Express, Neo4j, Redis)
- **`@diagram-builder/cli`**: CLI tool for headless parsing and export
- **`@diagram-builder/ui`**: Web UI (Vite + React 19 + react-three-fiber)

## Requirements

- **Node.js**: 20.19+ or 22.12+ (LTS versions)
- **npm**: 10.0.0+
- **Docker**: Latest (for local development)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd diagram_builder
npm install
```

### 2. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services

**Option A: Quick Start (Recommended)**

```bash
# Idempotently start all services (Docker, API, UI)
./scripts/init.sh
```

This script will:
- Start Neo4j and Redis (if not running)
- Seed the database with test data
- Start the API server on port 3001
- Start the UI server on port 5173

**Option B: Manual Start**

```bash
# Start Neo4j and Redis
docker compose up -d

# Seed database
cd packages/api && npx tsx src/database/seed-db.ts && cd ../..

# Start development servers
npm run dev
```

### 4. Access the Application

Once the services are running:

- **UI**: http://localhost:5173 (or http://localhost:3000)
- **API**: http://localhost:3001
- **Neo4j Browser**: http://localhost:7474

**Development Mode:**
- Authentication is **optional** in development (both UI and API)
- Click "Skip Login" button to bypass authentication
- A default workspace will be auto-created on first visit
- Or use test credentials: `test@example.com` / `testpassword123`

> **Note**: In production, authentication will be required for all endpoints.

## Project Structure

```
diagram-builder/
├── packages/
│   ├── core/           # Shared library
│   ├── parser/         # Parser engine
│   ├── api/            # REST API + WebSocket
│   ├── cli/            # CLI tool
│   └── ui/             # Web UI
├── .github/            # CI/CD workflows
├── .vscode/            # VS Code settings
├── docker-compose.yml  # Local development services
├── tsconfig.json       # Shared TypeScript config
├── eslint.config.js    # ESLint configuration
└── package.json        # Root workspace config
```

## Development Workflow

### Running Tests

```bash
# Run all unit tests
npm test

# Run tests for specific package
npm test --workspace=@diagram-builder/core

# Run E2E tests (Playwright)
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in headed mode
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug
```

**E2E Test Setup:**
- Playwright automatically starts all required services via `./scripts/init.sh`
- Tests run against the full stack (UI, API, Neo4j, Redis)
- Database is seeded with test data before tests run
- Services are reused if already running for faster test execution

### Type Checking

```bash
# Check all packages
npm run type-check
```

### Linting

```bash
# Lint all packages
npm run lint

# Auto-fix issues
npm run lint -- --fix
```

### Formatting

```bash
# Format all files
npm run format

# Check formatting
npm run format:check
```

### Building

```bash
# Build all packages
npm run build

# Build specific package
npm run build --workspace=@diagram-builder/api
```

## Docker Services

### Neo4j

- **URL**: http://localhost:7474
- **Bolt**: bolt://localhost:7687
- **Credentials**: neo4j/password123

### Redis

- **Host**: localhost
- **Port**: 6379

### Commands

```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# View logs
docker compose logs -f

# Reset data
docker compose down -v
```

## Architecture Guidelines

**Critical Rules** (from `_bmad-output/project-context.md`):

1. **State Management**: Zustand ONLY (NO Redux, NO Context API)
2. **Organization**: Feature-based (NOT type-based)
3. **Neo4j Naming**:
   - Node labels: PascalCase (`:Repository`, `:File`)
   - Properties: camelCase (`fileName`, `lineCount`)
   - Relationships: UPPER_SNAKE_CASE (`:CONTAINS`, `:DEPENDS_ON`)
4. **Error Format**: RFC 7807 for ALL API errors
5. **Authentication**: JWT everywhere (REST, WebSocket, CLI)
6. **Tests**: Co-located with source files (`.test.ts` suffix)
7. **TypeScript**: Strict mode (NO `any` types)

## Documentation

- **Architecture**: `_bmad-output/planning-artifacts/architecture.md`
- **Project Context**: `_bmad-output/project-context.md`
- **Implementation Tasks**: `TASKS.md`

## CI/CD

GitHub Actions workflows:

- **`.github/workflows/ci.yml`**: TypeScript checks, linting, testing, building
- **`.github/workflows/docker.yml`**: Docker image builds and pushes

## VS Code

Recommended extensions (`.vscode/extensions.json`):

- ESLint
- Prettier
- TypeScript
- Tailwind CSS

Debug configurations available in `.vscode/launch.json`.

## License

TBD
