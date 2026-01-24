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

#### Environment Variables

The application uses environment variables for configuration. Three example files are provided:

- **`.env.example`** - Base template with all available variables
- **`.env.development`** - Development-specific settings (verbose logging, relaxed limits)
- **`.env.production`** - Production-specific settings (strict security, minimal logging)

**Required Variables:**
- `JWT_SECRET` - Must be at least 32 characters (use a strong random string in production)
- `NEO4J_PASSWORD` - Password for Neo4j database

**Optional Variables:**

| Category | Variable | Default | Description |
|----------|----------|---------|-------------|
| **Server** | `PORT` | `4000` | API server port |
| | `NODE_ENV` | `development` | Environment: development\|production\|test |
| | `CORS_ORIGIN` | - | Allowed CORS origin (e.g., http://localhost:3000) |
| **Database** | `NEO4J_URI` | `bolt://localhost:7687` | Neo4j connection URI |
| | `NEO4J_USER` | `neo4j` | Neo4j username |
| **Cache** | `REDIS_HOST` | `localhost` | Redis host |
| | `REDIS_PORT` | `6379` | Redis port |
| | `REDIS_PASSWORD` | - | Redis password (if required) |
| **Parser** | `PARSER_TEMP_DIR` | `/tmp/diagram-builder` | Temp directory for cloned repos |
| | `MAX_REPO_SIZE_MB` | `500` | Max repository size (DoS prevention) |
| | `MAX_FILE_COUNT` | `10000` | Max files per repository |
| | `MAX_FILE_SIZE_MB` | `10` | Max individual file size |
| | `PARSE_TIMEOUT_MS` | `300000` | Parser timeout (5 minutes) |
| **Security** | `ENABLE_SECRET_SCANNING` | `true` | Scan files for secrets (API keys, passwords) |
| | `SECRET_ACTION` | `warn` | Action on secrets: warn\|redact\|fail |
| | `RATE_LIMIT_ENABLED` | `true` | Enable API rate limiting |
| | `RATE_LIMIT_MAX_REQUESTS` | `100` | Max requests per window |
| | `RATE_LIMIT_WINDOW_MS` | `60000` | Rate limit window (1 minute) |
| **Logging** | `LOG_LEVEL` | `info` | Log level: debug\|info\|warn\|error |

**Port Configuration:**
- See [PORT-CONFIGURATION.md](./PORT-CONFIGURATION.md) for standard port assignments

### 3. Start Services

**Option A: Quick Start (Recommended)**

```bash
# Idempotently start all services (Docker, API, UI)
./scripts/init.sh
```

This script will:
- Start Neo4j and Redis (if not running)
- Seed the database with test data
- Start the API server on port 4000
- Start the UI server on port 3000

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

- **UI**: http://localhost:3000
- **API**: http://localhost:4000
- **Neo4j Browser**: http://localhost:7474

**Development Mode:**
- Authentication is **optional** in development (both UI and API)
- Click "Skip Login" button to bypass authentication
- A default workspace will be auto-created on first visit
- Or use test credentials: `test@example.com` / `testpassword123`

> **Note**: In production, authentication will be required for all endpoints.

## 3D Canvas Navigation

The 3D visualization canvas supports two navigation modes that you can toggle between:

### Control Modes

Press **'C'** to toggle between control modes. The current mode is displayed in the HUD (heads-up display) in the top-left corner.

#### Orbit Mode (Default) 🔄

Best for examining specific areas of the graph from different angles.

- **Left Click + Drag**: Rotate camera around the center point
- **Right Click + Drag**: Pan (move sideways/up/down)
- **Scroll Wheel**: Zoom in/out
- **Zoom Range**: 0.1 to 5000 units

#### Fly Mode ✈️

Best for navigating through the graph like a flight simulator.

- **W**: Move forward
- **S**: Move backward
- **A**: Strafe left
- **D**: Strafe right
- **R**: Move up
- **F**: Move down
- **Mouse**: Look around
- **Movement Speed**: 10 units/second

### HUD (Heads-Up Display)

The HUD shows real-time information:
- **FPS**: Frame rate
- **Camera**: Current camera position (x, y, z)
- **Target**: Camera target point (orbit mode)
- **LOD**: Level of detail (affects visible node count)
- **Controls**: Current control mode (Orbit 🔄 or Fly ✈️)
- **Nodes**: Visible nodes / Total nodes
- **Selected Node**: Details of selected node (if any)

### Tips

- **Auto-Fit**: When a graph loads, the camera automatically positions itself to show all nodes
- **Toggle Controls**: Press 'C' anytime to switch between orbit and fly modes
- **Large Graphs**: Use fly mode to navigate through dense node clusters
- **Detailed Inspection**: Switch to orbit mode to rotate around specific nodes

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

### Quick Navigation

- 📖 **[Architecture](/_bmad-output/planning-artifacts/architecture.md)** - System design, technology stack, and architectural decisions
- 📋 **[Product Requirements](/_bmad-output/planning-artifacts/prd.md)** - Features, user stories, and acceptance criteria
- 📊 **[Sprint Status](/_bmad-output/implementation-artifacts/sprint-status.yaml)** - Current epic and story progress
- 📝 **[Planning Guide](/PLANNING.md)** - How documentation is organized and where to find things
- 🤖 **[LLM Instructions](/CLAUDE.md)** - Context loading guide for AI assistants

### Implementation Artifacts

All epics and stories are documented in `_bmad-output/implementation-artifacts/`:
- **Epic 3**: Parser Package (`3-*.md`)
- **Epic 4**: API Package (`4-*.md`)
- **Epic 5**: UI Package (`5-*.md`)
- **Epic 5.5**: Foundation Cleanup (`5.5-*.md`)

### Key Project Context

For a deep dive into project history, conventions, and lessons learned:
- 🔍 **[Project Context](/_bmad-output/project-context.md)** - Comprehensive project guide
- 📚 **[Implementation Tasks](/TASKS.md)** - Phase-by-phase task breakdown

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
