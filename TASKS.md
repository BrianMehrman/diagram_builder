# Implementation Tasks - Diagram Builder

**Project:** 3D Codebase Visualization Tool
**Architecture:** _bmad-output/planning-artifacts/architecture.md
**Project Context:** _bmad-output/project-context.md
**Generated:** 2025-12-29

---

## Phase 1: Project Infrastructure

### 1.1 Monorepo Setup
- [x] Initialize npm workspaces monorepo structure
- [x] Create 5 packages: `ui`, `api`, `parser`, `cli`, `core`
- [x] Configure root package.json with workspace definitions
- [x] Set up shared TypeScript configuration (strict mode)
- [x] Configure ESLint with TypeScript support
- [x] Set up Prettier for code formatting
- [x] Create .gitignore for node_modules, dist, .env files

### 1.2 Development Environment
- [x] Create Docker Compose for local development
  - Neo4j service (latest version)
  - Redis service (v7.4.x)
  - Volume mounts for data persistence
- [x] Create .env.example with placeholder values
- [x] Document Node.js version requirements (20.19+ or 22.12+)
- [x] Set up VS Code workspace settings
- [x] Configure debugging configurations

### 1.3 CI/CD Pipeline
- [x] GitHub Actions workflow for automated testing
- [x] TypeScript type checking in CI
- [x] ESLint validation in CI
- [x] Automated test execution (Vitest)
- [x] Build validation for all packages
- [x] Docker image builds (production)

---

## Phase 2: Core Package (`@diagram-builder/core`)

### 2.1 Internal Visualization Model (IVM)
- [x] Define IVM TypeScript interfaces
  - Node interface (id, type, metadata, position)
  - Edge interface (source, target, type, metadata)
  - Graph interface (nodes, edges, metadata)
- [x] Create IVM builder utilities
- [x] Implement IVM validation functions
- [x] Write unit tests for IVM types (Vitest)

### 2.2 Layout Engine
- [x] Implement force-directed layout algorithm
  - Position calculation for nodes
  - Edge tension/repulsion physics
  - Convergence detection
- [x] Create 3D coordinate system utilities
- [x] Implement LOD (Level of Detail) system
  - LOD level calculation based on graph query depth
  - Node filtering by LOD threshold
  - Edge simplification strategies
- [x] Write unit tests for layout algorithms

### 2.3 Export Pipeline - PlantUML
- [x] Create PlantUML exporter interface
- [x] Implement node-to-component mapping
- [x] Implement edge-to-relationship mapping
- [x] Support LOD-level filtering
- [x] Generate valid PlantUML syntax
- [x] Write integration tests with sample graphs

### 2.4 Export Pipeline - Mermaid
- [x] Create Mermaid exporter interface
- [x] Implement graph-to-Mermaid syntax conversion
- [x] Support class diagrams, flowcharts, C4 diagrams
- [x] Apply LOD filtering
- [x] Write integration tests

### 2.5 Export Pipeline - Draw.io
- [x] Create Draw.io XML exporter
- [x] Map IVM nodes to Draw.io shapes
- [x] Map IVM edges to connectors
- [x] Apply consistent styling from project context
- [x] Write integration tests

### 2.6 Export Pipeline - GLTF
- [x] Create GLTF exporter for 3D model export
- [x] Convert IVM 3D positions to GLTF nodes
- [x] Apply materials and styling
- [x] Write integration tests

### 2.7 Export Pipeline - Images
- [x] Set up headless rendering (puppeteer or similar)
- [x] Implement PNG export from 3D scene
- [x] Implement SVG export for 2D diagrams
- [x] Write integration tests

---

## Phase 3: Parser Package (`@diagram-builder/parser`)

### 3.1 Tree-sitter Integration ✅
- [x] Install tree-sitter and language bindings
  - tree-sitter-javascript
  - tree-sitter-typescript
- [x] Create parser initialization utilities
- [x] Implement file parsing functions
- [x] Write unit tests for parser setup

### 3.2 AST Analysis - JavaScript/TypeScript ✅
- [x] Extract class definitions (name, methods, properties)
- [x] Extract function declarations
- [x] Extract import/export statements
- [x] Calculate code metrics (LOC, complexity)
- [x] Write comprehensive unit tests

### 3.3 Dependency Graph Construction ✅
- [x] Parse import statements to build dependency edges
- [x] Extract function call relationships
- [x] Extract class inheritance relationships
- [x] Create dependency graph data structure
- [x] Write integration tests with real JS/TS files

### 3.4 Repository Integration ✅ ⚠️ VERIFICATION NEEDED
- [x] Implement local directory scanning
- [x] Implement Git repository cloning
- [x] Support GitHub, GitLab, Bitbucket URLs
- [x] Handle authentication (OAuth tokens, SSH keys)
- [x] Branch-specific parsing support
- [x] Write integration tests
- [ ] **VERIFY:** Supports on-demand loading triggered by API calls (for story 4-14)
- [ ] **VERIFY:** Can accept repository source as input parameter
- [ ] **VERIFY:** Returns loading status and handles errors appropriately

### 3.5 IVM Conversion ✅
- [x] Convert AST nodes to IVM nodes
- [x] Convert dependencies to IVM edges
- [x] Add metadata (file paths, line numbers, metrics)
- [x] Write unit tests for conversion

---

## Phase 4: API Package (`@diagram-builder/api`)

### 4.1 Express Server Setup
- [x] Initialize Express application
- [x] Configure TypeScript compilation
- [x] Set up error handling middleware (RFC 7807 format)
- [x] Configure CORS for frontend
- [x] Add request logging middleware
- [x] Write server startup tests

### 4.2 JWT Authentication
- [x] Implement JWT token generation
- [x] Create authentication middleware
- [x] Add token validation
- [x] Configure 24-hour token expiration
- [x] Write authentication tests

### 4.3 Neo4j Integration
- [x] Install Neo4j driver
- [x] Create connection pool configuration
- [x] Implement database initialization scripts
- [x] Create Neo4j query utilities
- [x] Write database connection tests

### 4.4 Redis Integration
- [x] Install ioredis client
- [x] Configure Redis connection
- [x] Implement cache utilities (get, set, invalidate)
- [x] Configure 5-minute TTL for query results
- [x] Write cache integration tests

### 4.5 REST API - Parsing Endpoints
- [x] POST /api/repositories - Parse new repository
- [x] GET /api/repositories/:id - Get repository metadata
- [x] DELETE /api/repositories/:id - Delete repository
- [x] POST /api/repositories/:id/refresh - Re-parse repository
- [x] Write API integration tests

### 4.6 REST API - Graph Query Endpoints
- [x] GET /api/graph/:repoId - Get full graph
- [x] GET /api/graph/:repoId/node/:nodeId - Get node details
- [x] GET /api/graph/:repoId/dependencies/:nodeId - Get dependencies
- [x] POST /api/graph/:repoId/query - Custom Cypher query
- [x] Implement Redis caching for all queries
- [x] Write API integration tests

### 4.7 REST API - Viewpoint Endpoints ✅
- [x] POST /api/viewpoints - Create viewpoint
- [x] GET /api/viewpoints/:id - Get viewpoint
- [x] PUT /api/viewpoints/:id - Update viewpoint
- [x] DELETE /api/viewpoints/:id - Delete viewpoint
- [x] POST /api/viewpoints/:id/share - Generate share token
- [x] GET /api/viewpoints/share/:token - Get by share token
- [x] GET /api/viewpoints/repository/:repositoryId - List viewpoints
- [x] Write API integration tests

### 4.8 REST API - Export Endpoints ✅
- [x] POST /api/export/plantuml - Export as PlantUML
- [x] POST /api/export/mermaid - Export as Mermaid
- [x] POST /api/export/drawio - Export as Draw.io
- [x] POST /api/export/gltf - Export as GLTF
- [x] POST /api/export/image - Export as PNG/SVG
- [x] Create export service with LOD filtering and graph filters
- [x] Register routes in main app
- [ ] Write export API integration tests
- [ ] Fix core package TypeScript errors to enable full exporter integration

### 4.9 REST API - Workspace Endpoints ✅
- [x] POST /api/workspaces - Create workspace
- [x] GET /api/workspaces - List user's workspaces
- [x] GET /api/workspaces/:id - Get workspace
- [x] PUT /api/workspaces/:id - Update workspace
- [x] DELETE /api/workspaces/:id - Delete workspace
- [x] POST /api/workspaces/:id/members - Add member
- [x] DELETE /api/workspaces/:id/members/:userId - Remove member
- [x] PUT /api/workspaces/:id/members/:userId - Update member role
- [x] Create workspace data model with role-based access control
- [x] Create workspace service with Neo4j storage and caching
- [x] Register routes in main app
- [ ] Write workspace API integration tests

### 4.10 WebSocket Server ✅
- [x] Verify Socket.io installation (v4.7.0)
- [x] Configure WebSocket server with CORS
- [x] Implement JWT authentication for WebSocket handshake
- [x] Create session management (multi-user rooms)
- [x] Implement event handlers:
  - [x] session.join / session.leave
  - [x] position.update / positions.sync
  - [x] viewpoint.created / updated / deleted
- [x] Create session cleanup for stale sessions
- [x] Integrate with HTTP server and graceful shutdown
- [ ] Write WebSocket connection tests

### 4.11 WebSocket Events - Position Updates ✅
- [x] Implement `position.update` event
- [x] Add 50ms batching for performance
- [x] Optimize serialization (Socket.io built-in)
- [x] Broadcast to all session participants
- [ ] Write real-time synchronization tests

### 4.12 WebSocket Events - Viewpoint Management ✅
- [x] Implement `viewpoint.created` event (server.ts:194)
- [x] Implement `viewpoint.updated` event (server.ts:206)
- [x] Implement `viewpoint.deleted` event (server.ts:217)
- [ ] Write viewpoint sync tests

### 4.13 WebSocket Events - Session Management ✅
- [x] Implement `session.join` event (server.ts:106)
- [x] Implement `session.leave` event (server.ts:151)
- [x] Implement spatial avatar positioning (via session-manager)
- [ ] Write session management tests

### 4.14 Codebase Import API ⚠️ NEW - HIGH PRIORITY
- [ ] Create POST /api/workspace/:workspaceId/codebases endpoint
- [ ] Implement input validation (local path OR Git URL)
- [ ] Add authentication support for private repositories
- [ ] Integrate with parser (story 3-4) for on-demand loading
- [ ] Create/update Neo4j schema for workspace-codebase relationships
- [ ] Implement error handling (invalid paths, clone failures, parsing errors)
- [ ] Return codebase metadata (ID, source, import timestamp, status)
- [ ] Write API integration tests
- [ ] Update API documentation

**Dependencies:** Epic 3 story 3-4 must support on-demand loading

---

## Phase 5: UI Package (`@diagram-builder/ui`)

### 5.1 Vite + React Setup ✅
- [x] Initialize Vite project with React 19
- [x] Configure TypeScript (strict mode)
- [x] Install and configure Tailwind CSS
- [x] Set up React Router v7 with code splitting
- [x] Configure Vitest for component testing
- [x] Install @testing-library/react

### 5.2 Feature Structure Setup ✅
- [x] Create src/features directory
- [x] Set up feature-based organization (NOT type-based)
- [x] Create shared types directory
- [x] Create shared utilities directory
- [x] Document folder structure in README

### 5.3 Error Boundary System ✅
- [x] Create global ErrorBoundary component
- [x] Create feature-level ErrorBoundary component
- [x] Implement GlobalErrorFallback component
- [x] Implement FeatureErrorFallback component
- [x] Write error boundary tests

### 5.4 Feature: Canvas (3D Visualization) ✅
- [x] Install react-three-fiber (v9.4.2)
- [x] Install @react-three/drei (v10.7.7)
- [x] Create Canvas3D component
- [x] Implement camera controls (pan, zoom, rotate)
- [x] Create canvasStore (Zustand) with camera state
- [x] Implement useCamera hook
- [x] Write Canvas3D component tests

### 5.5 Feature: Canvas - Rendering ✅
- [x] Implement node rendering (3D spheres/boxes)
- [x] Implement edge rendering (lines/arrows)
- [x] Add LOD filtering for performance
- [x] Implement LOD system integration
- [x] Create sample graph data for testing
- [x] Write rendering tests

### 5.6 Feature: Canvas - Selection ✅
- [x] Implement node click selection
- [x] Highlight selected nodes
- [x] Show node details on selection
- [x] Update selection in canvasStore
- [x] Write selection interaction tests

### 5.7 Feature: MiniMap ✅
- [x] Create MiniMap component
- [x] Implement 2D file tree view
- [x] Implement 3D spatial overview
- [x] Synchronize with main canvas position
- [x] Write MiniMap component tests

### 5.8 Feature: Navigation
- [x] Create search interface
- [x] Implement coordinate-based navigation (service:class:method:line)
- [x] Create breadcrumb navigation component
- [x] Create HUD (heads-up display) component
- [ ] Implement path tracing visualization
- [x] Write navigation tests

### 5.9 Feature: Viewpoints
- [x] Create viewpoint creation UI
- [x] Implement camera position saving
- [x] Add filter/annotation support
- [x] Create viewpoint list component
- [x] Implement viewpoint sharing (URL generation)
- [x] Write viewpoint feature tests

### 5.10 Feature: Workspace Management
- [x] Create workspace configuration UI
- [x] Implement multi-codebase workspace support
- [ ] Add parsing settings UI
- [x] Implement session persistence
- [ ] Create workspace templates UI
- [x] Write workspace feature tests

### 5.11 Feature: Export
- [x] Create export dialog component
- [x] Add format selection (PlantUML, Mermaid, Draw.io, GLTF, PNG, SVG)
- [x] Add LOD level selection
- [x] Implement export preview
- [x] Integrate with export API endpoints
- [x] Write export feature tests

### 5.12 Feature: Collaboration
- [ ] Implement WebSocket client connection
- [ ] Create session join/leave UI
- [ ] Render spatial avatars for other users
- [ ] Implement real-time position synchronization
- [ ] Add user presence indicators
- [ ] Write collaboration tests

### 5.13 API Client
- [ ] Create REST API client utilities
- [ ] Implement JWT token storage (memory only, NOT localStorage)
- [ ] Add request interceptors for auth headers
- [ ] Create WebSocket connection manager
- [ ] Write API client tests

### 5.14 Routing
- [ ] Configure React Router routes
- [ ] Implement code splitting per route
- [ ] Create route guards for authentication
- [ ] Write routing tests

### 5.15 Codebase Import UI ⚠️ NEW - HIGH PRIORITY
- [ ] Create UX specification document (ux-codebase-import.md)
- [ ] Add import button/interface to workspace management view
- [ ] Create import modal/dialog with form
- [ ] Implement input type selection (Local Path OR Git URL)
- [ ] Add input validation (path format, URL format)
- [ ] Implement authentication input for private repositories
- [ ] Add loading state with progress feedback
- [ ] Display success message with codebase details
- [ ] Show clear error messages with retry option
- [ ] Update workspace view to display imported codebases
- [ ] Integrate with API endpoint POST /api/workspace/:workspaceId/codebases
- [ ] Write component tests for import UI

**Dependencies:** Epic 4 story 4-14 must be complete, UX design must be created

---

## Phase 6: CLI Package (`@diagram-builder/cli`)

### 6.1 CLI Framework
- [ ] Set up CLI framework (commander.js or yargs)
- [ ] Configure TypeScript compilation
- [ ] Create executable entry point
- [ ] Add --help documentation
- [ ] Write CLI framework tests

### 6.2 CLI Commands - Parse
- [ ] Implement `parse` command
- [ ] Add --path flag for local directories
- [ ] Add --url flag for remote repositories
- [ ] Add --token flag for authentication
- [ ] Support environment variable for token
- [ ] Write parse command tests

### 6.3 CLI Commands - Export
- [ ] Implement `export` command
- [ ] Add --format flag (plantuml, mermaid, drawio, gltf, png, svg)
- [ ] Add --lod flag for LOD level selection
- [ ] Add --output flag for file destination
- [ ] Ensure <3min execution for 5000-file projects
- [ ] Write export command tests

### 6.4 CLI Commands - Query
- [ ] Implement `query` command for graph queries
- [ ] Support Cypher query input
- [ ] Format output as JSON or table
- [ ] Write query command tests

### 6.5 CLI - Headless Operation
- [ ] Ensure all commands work without UI
- [ ] Support CI/CD integration
- [ ] Create GitHub Actions template
- [ ] Create GitLab CI template
- [ ] Write headless execution tests

---

## Phase 7: Integration & Performance

### 7.1 End-to-End Testing
- [ ] Set up E2E testing framework (Playwright or Cypress)
- [ ] Test full parsing workflow (upload → parse → visualize)
- [ ] Test export workflow (select → configure → download)
- [ ] Test collaboration workflow (join session → sync positions)
- [ ] Test viewpoint workflow (create → share → load)

### 7.2 Performance Optimization
- [ ] Verify 60fps rendering with 1000+ nodes
- [ ] Verify <1s query response time with Redis caching
- [ ] Verify <100ms WebSocket synchronization
- [ ] Verify <2s per 100 files parsing
- [ ] Run load tests for 100+ concurrent users

### 7.3 Security Audit
- [ ] Verify JWT implementation (no localStorage storage)
- [ ] Verify HTTPS/TLS/WSS in production configs
- [ ] Verify encrypted credential storage
- [ ] Verify OAuth/SSH authentication flows
- [ ] Run vulnerability scanning (npm audit)

---

## Phase 8: Deployment

### 8.1 Docker Production Images
- [ ] Create Dockerfile for API service
- [ ] Create Dockerfile for UI service (static build)
- [ ] Create Dockerfile for CLI tool
- [ ] Optimize image sizes
- [ ] Write Docker build tests

### 8.2 Kubernetes Configuration
- [ ] Create Helm chart for production deployment
- [ ] Configure Neo4j StatefulSet with clustering
- [ ] Configure Redis Deployment
- [ ] Configure API Deployment with horizontal scaling
- [ ] Configure UI Deployment with CDN
- [ ] Create ingress configuration (HTTPS/TLS)

### 8.3 Documentation
- [ ] Write README for monorepo root
- [ ] Document each package (README per package)
- [ ] Create API documentation (OpenAPI/Swagger)
- [ ] Write deployment guide
- [ ] Create user guide for web UI
- [ ] Create CLI usage examples

---

## Testing Checklist

All tests must follow these rules:
- ✅ Co-located with source files (`.test.ts` suffix)
- ✅ Use Vitest for all tests
- ✅ Use @testing-library/react for component tests
- ✅ No separate `/tests/` or `/__tests__/` directories
- ✅ All tests must pass 100% before marking tasks complete

---

## Critical Architecture Rules

**MUST FOLLOW** (from project-context.md):

1. **Zustand ONLY** for state management (NO Redux, NO Context API)
2. **Feature-based organization** (NOT type-based)
3. **Neo4j naming conventions:**
   - Node labels: PascalCase (`:Repository`, `:File`)
   - Properties: camelCase (`fileName`, `lineCount`)
   - Relationships: UPPER_SNAKE_CASE (`:CONTAINS`, `:DEPENDS_ON`)
4. **RFC 7807 error format** for ALL API errors
5. **JWT authentication** for REST, WebSocket, CLI
6. **Co-located tests** (next to source files)
7. **Multi-level error boundaries** (global + feature-level)
8. **TypeScript strict mode** (NO `any` types)
9. **Read architecture.md BEFORE implementing** any feature

---

## Post-MVP: External Setup

> These tasks require external services or repository configuration after pushing to GitHub.

### GitHub Repository Setup
- [ ] Push repository to GitHub
- [ ] Configure GitHub Actions secrets:
  - `DOCKER_USERNAME` - Docker Hub username
  - `DOCKER_PASSWORD` - Docker Hub access token
- [ ] Verify CI workflow runs on push/PR
- [ ] Verify Docker build workflow runs on tags

### Production Deployment
- [ ] Set up Docker Hub repository for images
- [ ] Configure production environment variables
- [ ] Set up production Neo4j instance
- [ ] Set up production Redis instance

---

## Phase 9: Observability & Infrastructure (Epic 12)

> **Goal:** Add full OpenTelemetry observability (traces → Jaeger, metrics → Prometheus, logs → Grafana) and
> support three deployment modes: local Node.js dev, full Docker Compose stack, and Kubernetes via Helm.
>
> **Dependencies:** Epics 3–11 complete. No existing Dockerfiles or Helm charts exist.

---

### Epic 12-A: Application Containerization

#### Story 12-1: Dockerfiles for API and UI

- [x] Create `docker/api/Dockerfile` (multi-stage: deps → builder → runtime)
  - Stage 1 `deps`: `node:22.12-alpine3.21` — installs build tools (python3, make, g++ for tree-sitter), copies workspace manifests, runs `npm ci`
  - Stage 2 `builder`: compiles core → parser → api in dependency order; runs `npm prune --omit=dev`
  - Stage 3 `runtime`: `node:22.12-alpine3.21` — copies pruned node_modules + dist only; `USER node`; `EXPOSE 4000`; `CMD ["node", "dist/server.js"]`
- [x] Create `docker/ui/Dockerfile` (multi-stage: deps → builder → runtime)
  - Stage 1 `deps`: `node:22.12-alpine3.21` — copies workspace manifests, runs `npm ci`
  - Stage 2 `builder`: builds core then UI (`tsc && vite build`)
  - Stage 3 `runtime`: `nginx:1.27-alpine3.21` — copies `packages/ui/dist` to nginx html; `EXPOSE 80`
- [x] Create `docker/ui/nginx.conf`
  - SPA routing: `try_files $uri $uri/ /index.html`
  - Proxy `/api/` → `http://api:4000` with forwarding headers
  - Proxy `/socket.io/` → `http://api:4000` with WebSocket upgrade headers and 24h timeout
  - Gzip compression for text assets; immutable cache headers for hashed assets
  - Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)
- [x] Create `.dockerignore` at repo root
  - Excludes `node_modules`, `packages/*/node_modules`, `packages/*/dist`, `.env*`, test output, logs, IDE files, `_bmad-output/`, `docs/`
- [x] Add `HEALTHCHECK` to API Dockerfile (node inline HTTP check against `/health`)
- [x] Add `HEALTHCHECK` to UI Dockerfile (`wget -qO- http://localhost/`)
- [ ] Validate both images build successfully: `docker build -f docker/api/Dockerfile .`
- [ ] Validate API container starts and `/health` responds `200`

#### Story 12-2: Docker image hardening

- [x] Pin base image versions (exact tags: `node:22.12-alpine3.21`, `nginx:1.27-alpine3.21`)
- [x] API runs as non-root (`USER node` set before `EXPOSE`; `--chown=node:node` on all COPY in runtime stage)
- [x] Minimize final image size: `npm prune --omit=dev` in builder stage; runtime stage copies only `dist/` + pruned `node_modules`
- [x] Document image build and scan commands in README (`Building Docker Images` section)
- [ ] Scan images with `docker scout` or `trivy` — zero critical/high CVEs (run after first successful build)

---

### Epic 12-B: Docker Compose Full Stack with Observability

#### Story 12-3: Restructure Docker Compose with profiles

- [ ] Refactor `docker-compose.yml` to use named profiles
  - Profile `infra`: existing `neo4j` and `redis` services (no change to config)
  - Profile `app`: new `api` and `ui` services using Dockerfiles from Epic 12-A
  - Profile `observability`: new `jaeger`, `prometheus`, `grafana` services
- [ ] Add `api` service (profile: `app`)
  - Build context: `docker/api/Dockerfile`
  - `env_file: .env`
  - `environment` overrides for docker networking: `NEO4J_URI=bolt://neo4j:7687`, `REDIS_HOST=redis`, `OTEL_EXPORTER_OTLP_ENDPOINT=http://jaeger:4318`
  - `depends_on: [neo4j, redis]`
  - `ports: ["8741:8741"]`
  - `networks: [diagram-builder-network]`
- [ ] Add `ui` service (profile: `app`)
  - Build context: `docker/ui/Dockerfile`
  - `depends_on: [api]`
  - `ports: ["8742:80"]`
  - `networks: [diagram-builder-network]`
- [ ] Add named volumes for any new persistent data
- [ ] Validate `docker-compose --profile infra up -d` matches existing behavior

#### Story 12-4: Add observability services to Docker Compose

- [ ] Add `jaeger` service (profile: `observability`)
  - Image: `jaegertracing/all-in-one:2.1`
  - `environment: COLLECTOR_OTLP_ENABLED=true`
  - Ports: `16686:16686` (UI), `4317:4317` (OTLP gRPC), `4318:4318` (OTLP HTTP)
  - `networks: [diagram-builder-network]`
- [ ] Add `prometheus` service (profile: `observability`)
  - Image: `prom/prometheus:v3.1.0`
  - Volume mount: `./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro`
  - Volume: `prometheus-data:/prometheus`
  - Port: `9090:9090`
  - `networks: [diagram-builder-network]`
- [ ] Add `grafana` service (profile: `observability`)
  - Image: `grafana/grafana:11.4.0`
  - Port: `3001:3000` (avoids conflict with UI on 3000)
  - Volume: `grafana-data:/var/lib/grafana`
  - Volume mount: `./config/grafana/provisioning:/etc/grafana/provisioning:ro`
  - `depends_on: [prometheus, jaeger]`
  - `networks: [diagram-builder-network]`
- [ ] Create `config/prometheus/prometheus.yml`
  - Global: `scrape_interval: 15s`, `evaluation_interval: 15s`
  - Scrape job `diagram-builder-api`: target `api:4000`, path `/metrics`
  - Scrape job `prometheus` (self-scrape)
- [ ] Create `config/grafana/provisioning/datasources/datasources.yaml`
  - Prometheus datasource: `http://prometheus:9090`, default datasource
  - Jaeger datasource: `http://jaeger:16686`, with `tracesToLogs` correlation
- [ ] Create `config/grafana/provisioning/dashboards/dashboards.yaml`
  - File-based dashboard provider pointing to `/etc/grafana/provisioning/dashboards`
- [ ] Create `config/grafana/provisioning/dashboards/api-overview.json`
  - Panel: HTTP request rate by route (Counter, `http_requests_total`)
  - Panel: HTTP latency p50/p95/p99 (Histogram, `http_request_duration_seconds`)
  - Panel: HTTP error rate 4xx/5xx
  - Panel: Active WebSocket sessions (`ws_active_sessions`)
  - Panel: Cache hit/miss ratio (`cache_operations_total`)
  - Panel: DB query duration (`db_query_duration_seconds`)
  - Panel: Trace search link to Jaeger
- [ ] Add `prometheus-data` and `grafana-data` to `volumes:` block in docker-compose
- [ ] Update `PORT-CONFIGURATION.md` — add Grafana (3001), Jaeger UI (16686), Prometheus (9090), OTLP HTTP (4318), OTLP gRPC (4317)

---

### Epic 12-C: OTEL Instrumentation — API Package

#### Story 12-5: OTEL SDK setup and distributed tracing

- [ ] Install packages in `packages/api/package.json`:
  - `@opentelemetry/api`
  - `@opentelemetry/sdk-node`
  - `@opentelemetry/auto-instrumentations-node`
  - `@opentelemetry/exporter-trace-otlp-http`
- [ ] Add OTEL env vars to Zod schema in `packages/api/src/config.ts`
  - `OTEL_ENABLED`: `z.coerce.boolean().default(false)`
  - `OTEL_SERVICE_NAME`: `z.string().default('diagram-builder-api')`
  - `OTEL_SERVICE_VERSION`: `z.string().default('1.0.0')`
  - `OTEL_EXPORTER_OTLP_ENDPOINT`: `z.string().url().default('http://localhost:4318')`
- [ ] Create `packages/api/src/observability/tracing.ts`
  - `NodeTracerProvider` with `Resource` attributes: `service.name`, `service.version`, `deployment.environment`
  - `OTLPTraceExporter` using `OTEL_EXPORTER_OTLP_ENDPOINT` from config
  - `BatchSpanProcessor` wrapping the exporter (production-safe batching)
  - Auto-instrumentation via `getNodeAutoInstrumentations()` — covers Express, HTTP, Neo4j driver, ioredis
  - Export `tracer` instance: `trace.getTracer(serviceName, serviceVersion)`
  - Guard entire setup behind `OTEL_ENABLED` flag — no-op when disabled
- [ ] Create `packages/api/src/observability/index.ts`
  - Initialize tracing (call tracing setup)
  - Initialize metrics (call metrics setup — see story 12-6)
  - Export `tracer` and `meter` for use across the codebase
- [ ] Update `packages/api/src/server.ts`
  - Add `import './observability'` as the **very first import** (before Express, http, config)
  - Add comment explaining why it must be first
- [ ] Add OTEL vars to `.env.example`
- [ ] Write unit tests for tracing initialization (`observability/tracing.test.ts`)
- [ ] Verify `npm run type-check` passes with zero errors

#### Story 12-6: OTEL metrics and Prometheus exporter

- [ ] Install additional packages in `packages/api/package.json`:
  - `@opentelemetry/sdk-metrics`
  - `@opentelemetry/exporter-prometheus`
- [ ] Create `packages/api/src/observability/metrics.ts`
  - `PrometheusExporter` on the default metrics path (`/metrics`) using the API's existing HTTP server
  - `MeterProvider` with the Prometheus exporter as reader
  - Define and export metric instruments:
    - `httpRequestDuration`: `Histogram` — buckets `[0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5]` — attributes: `method`, `route`, `status_code`
    - `httpRequestsTotal`: `Counter` — attributes: `method`, `route`, `status_code`
    - `wsActiveSessions`: `UpDownCounter` — attributes: `repository_id`
    - `dbQueryDuration`: `Histogram` — attributes: `operation`
    - `cacheOperationsTotal`: `Counter` — attributes: `operation` (get/set/del), `result` (hit/miss)
    - `parserDuration`: `Histogram` — attributes: `language`
  - Guard entire setup behind `OTEL_ENABLED` flag — no-op instruments when disabled
- [ ] Create `packages/api/src/observability/instrumentation.ts`
  - `withSpan<T>(name: string, attributes: Attributes, fn: (span: Span) => Promise<T>): Promise<T>` — wraps async ops in a named span, sets error status on throw
  - `recordHttpMetrics(method, route, statusCode, durationMs)` — increments counter + records histogram
  - Re-export all metric instruments for direct import by services
- [ ] Update `packages/api/src/observability/index.ts` to call metrics initialization
- [ ] Write unit tests for metrics initialization and instrument creation
- [ ] Verify Prometheus `/metrics` endpoint returns valid text format when OTEL_ENABLED=true

#### Story 12-7: OTEL log bridge and service-level instrumentation

- [ ] Install `@opentelemetry/winston-transport` in `packages/api/package.json`
- [ ] Update `packages/api/src/logger.ts`
  - Conditionally add `OpenTelemetryTransportV3` to Winston transports when `OTEL_ENABLED=true`
  - Ensure `trace_id` and `span_id` fields are injected into log records (enables log-to-trace correlation in Grafana)
- [ ] Update `packages/api/src/middleware/logger.ts`
  - Add `trace_id` token to Morgan format string: extract from active span via `trace.getActiveSpan()`
  - Call `recordHttpMetrics()` on `res.on('finish', ...)` — record method, route (from `req.route?.path`), status code, duration
- [ ] Update `packages/api/src/services/graph-service.ts`
  - Wrap Neo4j query execution in `withSpan('neo4j.query', { 'db.operation': operationName }, fn)`
  - Record `dbQueryDuration` histogram on completion
- [ ] Update `packages/api/src/cache/cache-utils.ts`
  - Increment `cacheOperationsTotal` on cache hit (`result: 'hit'`) and miss (`result: 'miss'`)
- [ ] Update `packages/api/src/services/codebase-service.ts`
  - Record `parserDuration` histogram wrapping the `parser.loadRepository()` call
- [ ] Update `packages/api/src/websocket/session-manager.ts`
  - Increment `wsActiveSessions` on session join, decrement on leave
- [ ] Write integration tests verifying:
  - HTTP request increments `httpRequestsTotal`
  - Cache operations update `cacheOperationsTotal`
  - DB calls appear in `dbQueryDuration` histogram
- [ ] Run `npm test` — zero new failures
- [ ] Run `npm run type-check` — zero TypeScript errors

---

### Epic 12-D: Helm Charts for Kubernetes

#### Story 12-8: Helm chart scaffold and application templates

- [ ] Document Helm 3.x as a prerequisite in README (with install link)
- [ ] Create `helm/diagram-builder/Chart.yaml`
  - `apiVersion: v2`, `name: diagram-builder`, `version: 0.1.0`, `appVersion: 1.0.0`
  - Dependencies:
    - `neo4j` from `https://helm.neo4j.com/neo4j` (pinned version ~5.x)
    - `redis` from `https://charts.bitnami.com/bitnami` (pinned version ~20.x)
    - `kube-prometheus-stack` from `https://prometheus-community.github.io/helm-charts` (pinned ~67.x)
    - `jaeger` from `https://jaegertracing.github.io/helm-charts` (pinned ~3.x)
    - `opentelemetry-collector` from `https://open-telemetry.github.io/opentelemetry-helm-charts` (pinned ~0.x)
- [ ] Create `helm/diagram-builder/values.yaml` (production defaults)
  - `api.replicaCount: 2`, image ref, resource limits (CPU 500m/1, mem 512Mi/1Gi), service ClusterIP
  - `ui.replicaCount: 2`, image ref, service LoadBalancer
  - Ingress disabled by default, TLS config placeholder
  - Dependency chart value overrides (neo4j, redis, prometheus-stack, jaeger)
- [ ] Create `helm/diagram-builder/values.docker-desktop.yaml`
  - `api.replicaCount: 1`, `ui.replicaCount: 1`
  - All services as `NodePort` (no LoadBalancer on Docker Desktop)
  - Reduced resource limits (api: 256Mi mem, neo4j: 1Gi heap)
  - `kube-prometheus-stack.alertmanager.enabled: false`
  - `neo4j.volumes.data.persistentVolumeClaim.storageClassName: hostpath`
  - `jaeger.storage.type: memory` (no persistence needed locally)
- [ ] Create `helm/diagram-builder/values.production.yaml`
  - Multiple replicas, LoadBalancer, PVC cloud storage classes, alertmanager enabled
- [ ] Create `helm/diagram-builder/templates/_helpers.tpl`
  - `diagram-builder.name`, `diagram-builder.fullname`, `diagram-builder.labels`, `diagram-builder.selectorLabels`
- [ ] Create `helm/diagram-builder/templates/namespace.yaml`
- [ ] Create `helm/diagram-builder/templates/api/deployment.yaml`
  - Liveness probe: `GET /health` (initialDelaySeconds: 30, periodSeconds: 10)
  - Readiness probe: `GET /health` (initialDelaySeconds: 10, periodSeconds: 5)
  - `envFrom`: configmap ref + secret ref
  - `OTEL_EXPORTER_OTLP_ENDPOINT` → `http://{{ .Release.Name }}-otel-collector:4317`
- [ ] Create `helm/diagram-builder/templates/api/service.yaml` (ClusterIP, port 8741)
- [ ] Create `helm/diagram-builder/templates/api/configmap.yaml` (NODE_ENV, LOG_LEVEL, OTEL_SERVICE_NAME, etc.)
- [ ] Create `helm/diagram-builder/templates/api/secret.yaml` (JWT_SECRET, NEO4J_PASSWORD, REDIS_PASSWORD — base64 encoded via `{{ .Values.api.secrets.jwtSecret | b64enc }}`)
- [ ] Create `helm/diagram-builder/templates/api/hpa.yaml`
  - `minReplicas: 1`, `maxReplicas: 10`, CPU target 70%
  - Enabled/disabled via `values.yaml` flag
- [ ] Create `helm/diagram-builder/templates/ui/deployment.yaml`
- [ ] Create `helm/diagram-builder/templates/ui/service.yaml`
- [ ] Create `helm/diagram-builder/templates/ingress.yaml` (optional, nginx ingress class)
- [ ] Run `helm lint ./helm/diagram-builder` — zero errors or warnings

#### Story 12-9: OTEL Collector templates and observability wiring

- [ ] Create `config/otel-collector/config.yaml`
  - Receivers: `otlp` (protocols: grpc 4317, http 4318)
  - Processors: `batch`, `memory_limiter` (512MiB limit, 0.8 spike ratio), `resource_detection`
  - Exporters:
    - `otlp/jaeger`: endpoint `jaeger-collector:4317`
    - `prometheus`: endpoint `0.0.0.0:8889` (scraped by prometheus)
    - `debug`: verbosity `detailed` (disabled in production via values)
  - Pipelines: traces (otlp → batch → otlp/jaeger), metrics (otlp → batch → prometheus), logs (otlp → batch → debug)
- [ ] Create `helm/diagram-builder/templates/otel-collector/configmap.yaml`
  - Mounts `config/otel-collector/config.yaml` as ConfigMap data
- [ ] Create `helm/diagram-builder/templates/otel-collector/deployment.yaml`
  - `image: otel/opentelemetry-collector-contrib:0.115.0`
  - Mounts configmap as `/etc/otelcol-contrib/config.yaml`
  - Resource limits (CPU 200m, mem 256Mi)
- [ ] Create `helm/diagram-builder/templates/otel-collector/service.yaml`
  - Port 4317 (OTLP gRPC, used by API pods)
  - Port 4318 (OTLP HTTP)
  - Port 8889 (Prometheus metrics scrape port)
- [ ] Configure `kube-prometheus-stack` subchart in `values.yaml`
  - Add scrape config for otel-collector port 8889
  - Grafana additional datasources: Jaeger at `http://{{ .Release.Name }}-jaeger-query:16686`
  - Import API overview dashboard via Grafana sidecar configmap
- [ ] Configure `jaeger` subchart in `values.yaml` — point to `otel-collector` as collector endpoint
- [ ] Run `helm template ./helm/diagram-builder -f values.docker-desktop.yaml` — inspect rendered manifests
- [ ] Run `helm install diagram-builder ./helm/diagram-builder -f values.docker-desktop.yaml --dry-run --debug` against Docker Desktop cluster — zero errors

#### Story 12-10: Kubernetes production readiness

- [ ] Create `helm/diagram-builder/templates/api/pdb.yaml` (`PodDisruptionBudget`, `minAvailable: 1`)
- [ ] Create `helm/diagram-builder/templates/networkpolicy.yaml`
  - Allow api → neo4j (7687), api → redis (6379), api → otel-collector (4317)
  - Allow prometheus → api (4000/metrics), prometheus → otel-collector (8889)
  - Allow ui → api (4000)
  - Deny all other ingress by default
- [ ] Add `topologySpreadConstraints` to API deployment (spread across zones/nodes)
- [ ] Verify all containers have `resources.requests` AND `resources.limits` set
- [ ] Add `securityContext` to API pod spec: `runAsNonRoot: true`, `readOnlyRootFilesystem: true`, `allowPrivilegeEscalation: false`
- [ ] Validate manifests with `kubeconform` against Kubernetes 1.29 schema — zero errors
- [ ] Test `helm upgrade` with changed values — pods roll over cleanly
- [ ] Test `helm rollback` to previous release — verifies rollback works

---

### Epic 12-E: Developer Experience & Scripts

#### Story 12-11: Update scripts for multi-mode support

- [ ] Update `scripts/init.sh` to support `--mode` flag (default: `local`)
  - `--mode=local`: existing behavior (docker-compose infra profile + Node.js API/UI processes)
  - `--mode=docker`: `docker-compose --profile infra --profile app --profile observability up -d`, wait for health checks, seed DB, print URLs
  - `--mode=k8s`: check `kubectl` and `helm` are available, call `scripts/deploy-helm.sh`, call `scripts/port-forward.sh`, print URLs
  - All modes: display colored service URL summary at end (including Grafana, Jaeger if observability is active)
- [ ] Update `scripts/stop.sh` to support `--mode` flag
  - `--mode=local`: existing behavior
  - `--mode=docker`: `docker-compose --profile infra --profile app --profile observability down`
  - `--mode=k8s`: `helm uninstall diagram-builder --namespace diagram-builder`
  - Add `--observability` flag for local mode to stop/start only the observability Docker Compose profile
- [ ] Create `scripts/deploy-helm.sh`
  - Parse flags: `--context` (default: `docker-desktop`), `--values` (default: `values.docker-desktop.yaml`), `--namespace` (default: `diagram-builder`)
  - Check `helm` and `kubectl` are installed (print install links if not)
  - Run `helm dependency update ./helm/diagram-builder` (only if `Chart.lock` is stale)
  - Run `helm upgrade --install diagram-builder ./helm/diagram-builder --namespace $NAMESPACE --create-namespace --kube-context $CONTEXT -f ./helm/diagram-builder/$VALUES --wait --timeout 5m`
  - On success: print pod status and service URLs
  - On failure: print `helm status` and last 50 lines of failing pod logs
- [ ] Create `scripts/port-forward.sh`
  - Port-forward these services to localhost in background:
    - `svc/diagram-builder-api 4000:4000`
    - `svc/diagram-builder-ui 3000:80`
    - `svc/diagram-builder-kube-prometheus-stack-grafana 3001:80`
    - `svc/diagram-builder-jaeger-query 16686:16686`
    - `svc/diagram-builder-kube-prometheus-stack-prometheus 9090:9090`
  - Store PIDs in `/tmp/diagram-builder-port-forwards.pid`
  - Trap `SIGINT`/`SIGTERM` to kill all forwards cleanly on exit
  - Print "Port forwarding active — press Ctrl+C to stop" with URL list
  - Add `--stop` flag: reads PID file, kills all forwards, removes PID file

#### Story 12-12: Documentation updates

- [ ] Update `PORT-CONFIGURATION.md`
  - Add new services table rows: Grafana (3001), Jaeger UI (16686), Prometheus (9090), OTLP HTTP (4318), OTLP gRPC (4317)
  - Add "Kubernetes Port Forwarding" section (via `scripts/port-forward.sh`)
  - Add note that port 3001 is Grafana — do NOT use for any app service
  - Update "Files That Reference Ports" section with new config files
- [ ] Update `README.md`
  - Add "Prerequisites" section listing Docker Desktop (with Kubernetes enabled), Helm 3.x, Node.js 22
  - Add "Deployment Modes" section explaining local / docker / k8s
  - Add "Observability" section: how to access Grafana (default creds), Jaeger trace search, Prometheus query
  - Add Kubernetes quick start: `./scripts/init.sh --mode=k8s`
  - Add Docker full-stack quick start: `./scripts/init.sh --mode=docker`
- [ ] Update `CLAUDE.md`
  - Add new paths to "Document Locations" section (Helm chart, config/, docker/)
  - Update "Development Commands" section with `--mode` flag examples
  - Add OTEL env vars to relevant sections
- [ ] Update `.env.example`
  - Add `OTEL_ENABLED=false`
  - Add `OTEL_SERVICE_NAME=diagram-builder-api`
  - Add `OTEL_SERVICE_VERSION=1.0.0`
  - Add `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` (local Jaeger)
  - Add `# DEPLOY_MODE: local | docker | k8s` comment block

---

**Status:** Ready for implementation
**Next Step:** Begin Phase 1 - Project Infrastructure
