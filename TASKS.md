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
- [ ] Define IVM TypeScript interfaces
  - Node interface (id, type, metadata, position)
  - Edge interface (source, target, type, metadata)
  - Graph interface (nodes, edges, metadata)
- [ ] Create IVM builder utilities
- [ ] Implement IVM validation functions
- [ ] Write unit tests for IVM types (Vitest)

### 2.2 Layout Engine
- [ ] Implement force-directed layout algorithm
  - Position calculation for nodes
  - Edge tension/repulsion physics
  - Convergence detection
- [ ] Create 3D coordinate system utilities
- [ ] Implement LOD (Level of Detail) system
  - LOD level calculation based on graph query depth
  - Node filtering by LOD threshold
  - Edge simplification strategies
- [ ] Write unit tests for layout algorithms

### 2.3 Export Pipeline - PlantUML
- [ ] Create PlantUML exporter interface
- [ ] Implement node-to-component mapping
- [ ] Implement edge-to-relationship mapping
- [ ] Support LOD-level filtering
- [ ] Generate valid PlantUML syntax
- [ ] Write integration tests with sample graphs

### 2.4 Export Pipeline - Mermaid
- [ ] Create Mermaid exporter interface
- [ ] Implement graph-to-Mermaid syntax conversion
- [ ] Support class diagrams, flowcharts, C4 diagrams
- [ ] Apply LOD filtering
- [ ] Write integration tests

### 2.5 Export Pipeline - Draw.io
- [ ] Create Draw.io XML exporter
- [ ] Map IVM nodes to Draw.io shapes
- [ ] Map IVM edges to connectors
- [ ] Apply consistent styling from project context
- [ ] Write integration tests

### 2.6 Export Pipeline - GLTF
- [ ] Create GLTF exporter for 3D model export
- [ ] Convert IVM 3D positions to GLTF nodes
- [ ] Apply materials and styling
- [ ] Write integration tests

### 2.7 Export Pipeline - Images
- [ ] Set up headless rendering (puppeteer or similar)
- [ ] Implement PNG export from 3D scene
- [ ] Implement SVG export for 2D diagrams
- [ ] Write integration tests

---

## Phase 3: Parser Package (`@diagram-builder/parser`)

### 3.1 Tree-sitter Integration
- [ ] Install tree-sitter and language bindings
  - tree-sitter-javascript
  - tree-sitter-typescript
- [ ] Create parser initialization utilities
- [ ] Implement file parsing functions
- [ ] Write unit tests for parser setup

### 3.2 AST Analysis - JavaScript/TypeScript
- [ ] Extract class definitions (name, methods, properties)
- [ ] Extract function declarations
- [ ] Extract import/export statements
- [ ] Calculate code metrics (LOC, complexity)
- [ ] Write comprehensive unit tests

### 3.3 Dependency Graph Construction
- [ ] Parse import statements to build dependency edges
- [ ] Extract function call relationships
- [ ] Extract class inheritance relationships
- [ ] Create dependency graph data structure
- [ ] Write integration tests with real JS/TS files

### 3.4 Repository Integration
- [ ] Implement local directory scanning
- [ ] Implement Git repository cloning
- [ ] Support GitHub, GitLab, Bitbucket URLs
- [ ] Handle authentication (OAuth tokens, SSH keys)
- [ ] Branch-specific parsing support
- [ ] Write integration tests

### 3.5 IVM Conversion
- [ ] Convert AST nodes to IVM nodes
- [ ] Convert dependencies to IVM edges
- [ ] Add metadata (file paths, line numbers, metrics)
- [ ] Write unit tests for conversion

---

## Phase 4: API Package (`@diagram-builder/api`)

### 4.1 Express Server Setup
- [ ] Initialize Express application
- [ ] Configure TypeScript compilation
- [ ] Set up error handling middleware (RFC 7807 format)
- [ ] Configure CORS for frontend
- [ ] Add request logging middleware
- [ ] Write server startup tests

### 4.2 JWT Authentication
- [ ] Implement JWT token generation
- [ ] Create authentication middleware
- [ ] Add token validation
- [ ] Configure 24-hour token expiration
- [ ] Write authentication tests

### 4.3 Neo4j Integration
- [ ] Install Neo4j driver
- [ ] Create connection pool configuration
- [ ] Implement database initialization scripts
- [ ] Create Neo4j query utilities
- [ ] Write database connection tests

### 4.4 Redis Integration
- [ ] Install ioredis client
- [ ] Configure Redis connection
- [ ] Implement cache utilities (get, set, invalidate)
- [ ] Configure 5-minute TTL for query results
- [ ] Write cache integration tests

### 4.5 REST API - Parsing Endpoints
- [ ] POST /api/repositories - Parse new repository
- [ ] GET /api/repositories/:id - Get repository metadata
- [ ] DELETE /api/repositories/:id - Delete repository
- [ ] POST /api/repositories/:id/refresh - Re-parse repository
- [ ] Write API integration tests

### 4.6 REST API - Graph Query Endpoints
- [ ] GET /api/graph/:repoId - Get full graph
- [ ] GET /api/graph/:repoId/node/:nodeId - Get node details
- [ ] GET /api/graph/:repoId/dependencies/:nodeId - Get dependencies
- [ ] POST /api/graph/:repoId/query - Custom Cypher query
- [ ] Implement Redis caching for all queries
- [ ] Write API integration tests

### 4.7 REST API - Viewpoint Endpoints
- [ ] POST /api/viewpoints - Create viewpoint
- [ ] GET /api/viewpoints/:id - Get viewpoint
- [ ] PUT /api/viewpoints/:id - Update viewpoint
- [ ] DELETE /api/viewpoints/:id - Delete viewpoint
- [ ] GET /api/viewpoints/share/:id - Generate share URL
- [ ] Write API integration tests

### 4.8 REST API - Export Endpoints
- [ ] POST /api/export/plantuml - Export as PlantUML
- [ ] POST /api/export/mermaid - Export as Mermaid
- [ ] POST /api/export/drawio - Export as Draw.io
- [ ] POST /api/export/gltf - Export as GLTF
- [ ] POST /api/export/image - Export as PNG/SVG
- [ ] Write export API tests

### 4.9 REST API - Workspace Endpoints
- [ ] POST /api/workspaces - Create workspace
- [ ] GET /api/workspaces/:id - Get workspace
- [ ] PUT /api/workspaces/:id - Update workspace
- [ ] DELETE /api/workspaces/:id - Delete workspace
- [ ] Write workspace API tests

### 4.10 WebSocket Server
- [ ] Install Socket.io
- [ ] Configure WebSocket server
- [ ] Implement JWT authentication for WebSocket handshake
- [ ] Create session management (multi-user rooms)
- [ ] Write WebSocket connection tests

### 4.11 WebSocket Events - Position Updates
- [ ] Implement `position.update` event
- [ ] Add 50ms batching for performance
- [ ] Use MessagePack for binary serialization
- [ ] Broadcast to all session participants
- [ ] Write real-time synchronization tests

### 4.12 WebSocket Events - Viewpoint Management
- [ ] Implement `viewpoint.created` event
- [ ] Implement `viewpoint.updated` event
- [ ] Implement `viewpoint.deleted` event
- [ ] Write viewpoint sync tests

### 4.13 WebSocket Events - Session Management
- [ ] Implement `session.join` event
- [ ] Implement `session.leave` event
- [ ] Implement spatial avatar positioning
- [ ] Write session management tests

---

## Phase 5: UI Package (`@diagram-builder/ui`)

### 5.1 Vite + React Setup
- [ ] Initialize Vite project with React 19
- [ ] Configure TypeScript (strict mode)
- [ ] Install and configure Tailwind CSS
- [ ] Set up React Router v7 with code splitting
- [ ] Configure Vitest for component testing
- [ ] Install @testing-library/react

### 5.2 Feature Structure Setup
- [ ] Create src/features directory
- [ ] Set up feature-based organization (NOT type-based)
- [ ] Create shared types directory
- [ ] Create shared utilities directory
- [ ] Document folder structure in README

### 5.3 Error Boundary System
- [ ] Create global ErrorBoundary component
- [ ] Create feature-level ErrorBoundary component
- [ ] Implement GlobalErrorFallback component
- [ ] Implement FeatureErrorFallback component
- [ ] Write error boundary tests

### 5.4 Feature: Canvas (3D Visualization)
- [ ] Install react-three-fiber (v9.4.2)
- [ ] Install @react-three/drei (v10.7.7)
- [ ] Create Canvas3D component
- [ ] Implement camera controls (pan, zoom, rotate)
- [ ] Create canvasStore (Zustand) with camera state
- [ ] Implement useCamera hook
- [ ] Write Canvas3D component tests

### 5.5 Feature: Canvas - Rendering
- [ ] Implement node rendering (3D spheres/boxes)
- [ ] Implement edge rendering (lines/arrows)
- [ ] Add instanced rendering for performance
- [ ] Implement LOD system integration
- [ ] Ensure 60fps minimum performance
- [ ] Write rendering performance tests

### 5.6 Feature: Canvas - Selection
- [ ] Implement node click selection
- [ ] Highlight selected nodes
- [ ] Show node details on selection
- [ ] Update selection in canvasStore
- [ ] Write selection interaction tests

### 5.7 Feature: MiniMap
- [ ] Create MiniMap component
- [ ] Implement 2D file tree view
- [ ] Implement 3D spatial overview
- [ ] Synchronize with main canvas position
- [ ] Write MiniMap component tests

### 5.8 Feature: Navigation
- [ ] Create search interface
- [ ] Implement coordinate-based navigation (service:class:method:line)
- [ ] Create breadcrumb navigation component
- [ ] Create HUD (heads-up display) component
- [ ] Implement path tracing visualization
- [ ] Write navigation tests

### 5.9 Feature: Viewpoints
- [ ] Create viewpoint creation UI
- [ ] Implement camera position saving
- [ ] Add filter/annotation support
- [ ] Create viewpoint list component
- [ ] Implement viewpoint sharing (URL generation)
- [ ] Write viewpoint feature tests

### 5.10 Feature: Workspace Management
- [ ] Create workspace configuration UI
- [ ] Implement multi-codebase workspace support
- [ ] Add parsing settings UI
- [ ] Implement session persistence
- [ ] Create workspace templates UI
- [ ] Write workspace feature tests

### 5.11 Feature: Export
- [ ] Create export dialog component
- [ ] Add format selection (PlantUML, Mermaid, Draw.io, GLTF, PNG, SVG)
- [ ] Add LOD level selection
- [ ] Implement export preview
- [ ] Integrate with export API endpoints
- [ ] Write export feature tests

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

**Status:** Ready for implementation
**Next Step:** Begin Phase 1 - Project Infrastructure
