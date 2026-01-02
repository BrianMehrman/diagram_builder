---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
inputDocuments: ['/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/prd.md']
workflowType: 'architecture'
project_name: 'diagram_builder'
user_name: 'Brian'
date: '2025-12-29'
lastStep: 8
status: 'complete'
completedAt: '2025-12-29'
---

# Architecture Decision Document

## 🎯 Project Overview (Quick Start)

**Diagram Builder** is a 3D codebase visualization tool that transforms JavaScript/TypeScript codebases into interactive 3D graphs for exploration, collaboration, and documentation generation.

### Core Capabilities

- 📦 **Parse Codebases**: Tree-sitter-based parsing (supports local directories and Git repositories)
- 🗄️ **Store Graphs**: Neo4j graph database for relationship queries
- 🎨 **Render 3D**: Three.js/WebGL browser visualization with LOD system
- 📤 **Export Diagrams**: Multiple formats (PlantUML, Mermaid, Draw.io, GLTF, images)
- 👥 **Collaborate**: Real-time multi-user sessions via WebSockets
- 🤖 **Automate**: CLI tool for CI/CD integration

### Technology Stack

```
Frontend:  React 19, Vite, @react-three/fiber, Tailwind CSS
Backend:   Node.js, TypeScript, Express, WebSockets
Database:  Neo4j (graph), Redis (cache)
Parser:    Tree-sitter (multi-language support)
Testing:   Vitest (unit), Playwright (e2e)
Deploy:    Docker Compose (dev), Kubernetes + Helm (prod)
```

### Project Structure

```
packages/
  ├── core/           # Shared types, IVM, layout engine, exporters
  ├── parser/         # Tree-sitter parsing, AST analysis, dependency graphs
  ├── api/            # Express REST API + WebSocket server
  ├── ui/             # React 3D visualization frontend
  └── cli/            # Command-line tool (planned)
```

### Development Workflow

1. **Epics** define major features (e.g., Epic 3: Parser Package)
2. **Stories** break epics into implementable units (e.g., 3-4: Repository Integration)
3. **Sprint Status** tracks progress (`sprint-status.yaml`)
4. **Implementation** follows feature-based organization with co-located tests

### Key Architecture Decisions

- **State Management**: Zustand (NO Redux, NO Context API)
- **Organization**: Feature-based (NOT type-based)
- **Neo4j Naming**: PascalCase labels, camelCase properties, UPPER_SNAKE_CASE relationships
- **Error Format**: RFC 7807 Problem Details for ALL API errors
- **Authentication**: JWT tokens (REST + WebSocket + CLI)
- **Testing**: Co-located unit tests (`.test.ts`), E2E via Playwright

---

_Full architectural details continue below..._

---

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

The system encompasses **72 functional requirements** across 9 major capability areas:

1. **Code Parsing & Analysis (FR1-FR9)**: Multi-language parsing (JavaScript/TypeScript MVP, expandable), dependency extraction, metric calculation, graph database storage, and repository integration (local/remote, GitHub/GitLab/Bitbucket)

2. **3D Visualization & Rendering (FR10-FR18)**: Interactive browser-based 3D visualization, force-directed layout algorithms, automatic LOD system, pre-configured visualization profiles, dependency relationship rendering, and architectural pattern highlighting

3. **Navigation & Discovery (FR19-FR28)**: 3D camera controls, codebase search, coordinate-based navigation (service:class:method:line format), breadcrumb/HUD systems, dual mini-map (2D file tree + 3D spatial), path tracing, and impact analysis visualization

4. **Workspace & Configuration Management (FR29-FR34)**: Multi-codebase workspace configurations, parsing settings, session persistence, custom LOD profiles, and team-wide templates

5. **Collaboration & Sharing (FR35-FR43)**: Viewpoint system (camera + filters + annotations), URL-based sharing, multi-user sessions, spatial avatars, real-time WebSocket synchronization, and coordinate-based communication

6. **Export & Documentation Generation (FR44-FR53)**: Multi-format exports (PlantUML, Mermaid, Draw.io, GLTF, PNG/SVG), LOD-level selection, C4-style diagrams, consistent styling, multi-view sheets, and metadata inclusion

7. **CLI & Automation (FR54-FR60)**: Headless parsing and export, format/LOD configuration, CI/CD pipeline integration, <3min execution for 5000-file projects

8. **Repository Integration (FR61-FR66)**: Private repository authentication, branch-specific parsing, auto-update on changes, monorepo support, cross-repository dependency mapping

9. **REST API & Programmatic Access (FR67-FR72)**: Full API coverage for parsing, graph retrieval, exports, viewpoints, and workspace management

**Architectural Implications**: This is a **multi-system integration platform** requiring coordination between parsing engine, graph database, 3D rendering, collaboration server, and export pipeline. The dual deployment model (web UI + CLI) means architecture must support both interactive and headless operation modes.

**Non-Functional Requirements:**

**76 non-functional requirements** drive critical architectural decisions:

- **Performance (NFR-P1 to NFR-P20)**:
  - Parsing: <2 seconds per 100 files, <2 minutes for 5000 files, <1s query response
  - Visualization: 60fps minimum with 1000+ nodes, <16ms input-to-render latency
  - Collaboration: <100ms WebSocket synchronization, 10+ concurrent users per session
  - Export: <5 seconds for large diagrams, <3 minutes total CI/CD execution

- **Security (NFR-S1 to NFR-S15)**: OAuth/SSH authentication, encrypted credentials, HTTPS/TLS/WSS protocols, vulnerability scanning, least-privilege deployments

- **Integration (NFR-I1 to NFR-I24)**: GitHub/GitLab/Bitbucket compatibility, CI/CD templates, export format validity, RESTful API standards, browser compatibility (Chrome/Firefox/Safari/Edge latest 2 versions)

- **Scalability (NFR-SC1 to NFR-SC17)**:
  - Codebase: Up to 10k files, 1M LOC, 100k+ nodes, 500k+ relationships
  - Users: 100+ concurrent single-user sessions, 50+ users per collaborative session
  - Infrastructure: Horizontal scaling, Neo4j clustering, CDN distribution
  - Multi-repo: 50+ repositories, 100k+ total nodes across repos

**Architectural Implications**: Performance requirements are **extremely demanding** and will drive technology choices, caching strategies, and optimization techniques. Real-time collaboration with sub-100ms latency requires WebSocket state management architecture. Scalability requirements indicate need for horizontal scaling, database clustering, and progressive loading strategies.

### Scale & Complexity

- **Primary domain**: Full-stack developer tool (browser-based visualization + CLI utility + REST/WebSocket APIs + graph database + parsing engine)
- **Complexity level**: **HIGH** - Explicitly stated in PRD as technically ambitious with multi-language parsing, graph optimization, real-time 3D rendering, WebSocket synchronization, and multi-format export generation
- **Estimated architectural components**: 8-10 major subsystems
  1. Parser Engine (Tree-sitter integration, language-agnostic IR)
  2. Graph Database Layer (Neo4j operations, query optimization)
  3. 3D Rendering Engine (Three.js/WebGL, LOD system)
  4. Navigation System (search, coordinates, mini-map, HUD)
  5. Collaboration Server (WebSocket management, multi-user state)
  6. Export Pipeline (PlantUML/Mermaid/GLTF/Draw.io/image generation)
  7. CLI Interface (headless parsing and export)
  8. REST API (programmatic access)
  9. WebSocket Server (real-time synchronization)
  10. Web UI (React/Vue frontend)

### Technical Constraints & Dependencies

**Explicitly Stated Technology Choices (from PRD):**

- **Parsing**: Tree-sitter (universal multi-language parser)
- **Database**: Neo4j (graph database for relationship queries)
- **3D Rendering**: Three.js/WebGL (browser-based 3D visualization)
- **Backend**: TypeScript/Node.js (enables JS/TS parsing without additional tooling)
- **Deployment**: Docker Compose (development), Kubernetes/Helm (production)
- **Infrastructure**: Browser-based client, optional self-hosted or cloud deployment

**Platform Support:**
- Server: Linux (Docker containers, Kubernetes nodes)
- Client: Modern browsers with WebGL support (Chrome, Firefox, Safari, Edge)
- Development: macOS, Linux, Windows (via Docker)

**Language Support (MVP):**
- JavaScript and TypeScript only (multi-language deferred to Growth phase)

**Integration Requirements:**
- GitHub Actions and GitLab CI templates required
- REST API must follow RESTful conventions
- Export formats must be standards-compliant and render correctly in target tools

**Performance Constraints:**
- 60fps rendering is **non-negotiable** for usability
- CI/CD execution must complete in <3 minutes (otherwise becomes PR bottleneck)
- Query response <1 second (otherwise navigation feels sluggish)

### Cross-Cutting Concerns Identified

**1. Performance Optimization** (affects all layers):
- Parsing engine performance
- Neo4j query optimization and indexing
- Three.js rendering optimization (instanced rendering, frustum culling, spatial partitioning)
- LOD system as primary performance mechanism
- WebSocket message batching and compression
- Export generation optimization

**2. Security** (affects authentication, data access, deployment):
- Repository credential management (OAuth tokens, SSH keys)
- API authentication and authorization
- Multi-user session access control
- Data encryption in transit and at rest
- Secure WebSocket connections
- Container security and least-privilege principles

**3. Real-Time Synchronization** (affects collaboration, UI updates):
- WebSocket state management across multiple users
- Conflict resolution for simultaneous actions
- Position update batching for performance
- Connection resilience and reconnection handling

**4. Level-of-Detail Management** (affects visualization, performance, export, UX):
- Automatic LOD transitions based on zoom level
- Pre-configured LOD profiles for different use cases
- LOD-based export generation
- Hidden-by-default philosophy implementation
- Smooth transitions without user disorientation

**5. Scalability** (affects architecture, database, rendering):
- Horizontal scaling for parsing and API services
- Neo4j clustering for high availability
- Progressive loading for large codebases (100k+ files)
- Multi-repository workspace optimization
- CDN distribution for web UI

**6. Integration & Interoperability** (affects CI/CD, exports, APIs):
- Git platform authentication and cloning
- CI/CD pipeline execution environment
- Export format compatibility and validation
- REST API versioning and backward compatibility
- Browser compatibility and WebGL fallbacks

**7. Developer Experience** (affects CLI, documentation, setup):
- One-command development environment setup
- Clear error messages and debugging
- Comprehensive API documentation (auto-generated)
- CI/CD integration templates
- Migration and upgrade paths

### Architectural Implications from First Principles

**Performance Architecture:**
- **Separate layout calculation (async, CPU) from rendering (sync, GPU)**: Layout runs in background worker threads until stable, then freezes positions. Rendering operates on cached static positions with zero layout cost per frame.
- **Implement spatial partitioning for viewport-only rendering**: Use octree or grid-based frustum culling to only render nodes within camera view + small margin. Reduces 100k potential nodes to ~1k visible nodes.
- **Use instanced rendering to reduce draw calls from O(n) to O(1)**: Single geometry definition reused across all nodes of same type. GPU renders 1000 instances with single draw call instead of 1000 separate calls.
- **Cache stable layouts, only recalculate on graph changes**: Store final positions in Neo4j with timestamp. Invalidate cache only when code structure changes (new parse, repository update).

**LOD Architecture:**
- **LOD is graph query depth strategy, not rendering feature**: LOD level directly maps to Neo4j query depth (1=system, 2=service, 3=file, 4=class, 5=method). All subsystems consume same depth value.
- **Single LOD state drives visualization, export, navigation, and performance**: Rendering shows nodes at current depth. Export generates diagrams at current depth. Navigation breadcrumbs reflect depth hierarchy. Query performance scales with depth limitation.
- **Profiles are query templates with depth + filter configurations**: "Architecture Review" = depth 2 + filter(APIs, boundaries, data models). "Security Audit" = depth 3 + filter(authentication, encryption, data flow).
- **All subsystems consume unified LOD state**: No separate LOD logic per subsystem. Single source of truth prevents inconsistencies.

**Collaboration Architecture:**
- **Classify state by sync requirements: ephemeral vs. persistent vs. static**: Camera positions are ephemeral (high frequency, low importance). Viewpoints/annotations are persistent (low frequency, high importance). Code graph is static (never synced, queried from Neo4j).
- **Throttle high-frequency ephemeral updates (camera positions)**: Batch position updates every 50ms. Send delta transformations, not full matrices. Client-side interpolation for smooth avatar movement.
- **Use differential updates and client-side prediction**: Predict other users' movements based on velocity. Correct when actual update arrives. Optimistic local updates with server validation for persistent state.
- **Static code graph shared via Neo4j queries, not WebSocket sync**: All clients query same Neo4j database. No sync needed for immutable data. WebSocket only for user actions, not code structure.

**Integration Architecture:**
- **Pipeline design with Language-Agnostic IR at boundaries**: Tree-sitter → JSON IR → Neo4j. Neo4j → Visualization IR → Three.js/Exporters. Clean data contracts between systems.
- **Each system transforms IR independently**: Parser produces standard IR regardless of language. Renderer consumes standard IR regardless of source. Export generators read standard IR.
- **Systems communicate through data formats, not direct coupling**: No direct API calls between Tree-sitter and Neo4j. IR files/messages are interchange format. Enables independent versioning and replacement.
- **Independent deployability enables CLI/web dual modes**: Parser can run standalone (CLI). Neo4j is queryable data store. Renderer can run headless (export mode) or interactive (web mode).

**Scalability Architecture:**
- **Graph partitioning by repository + federation layer for cross-repo edges**: Each repository stored as separate graph partition. Cross-repository dependencies in lightweight federation layer. Queries start local, expand to federation only when crossing boundaries.
- **Lazy loading with viewport-driven queries (load N hops from camera)**: Only load nodes within 3 hops of current camera position. Background pre-fetch adjacent regions. Unload distant regions when memory pressure increases.
- **Hierarchical indexing: metadata → files → full graph (on-demand)**: Level 1 index has repository metadata (50 repos × minimal data). Level 2 has file-level nodes. Level 3 full graph loaded on-demand per viewport.
- **Horizontal scaling at stateless layers (parser workers, read replicas)**: Parser workers scale linearly with queue depth (stateless). Neo4j read replicas for query load. WebSocket servers use sticky sessions + Redis pub/sub for cross-server sync.

**Deployment Architecture:**
- **Shared core engine library used by both web UI and CLI**: Core TypeScript library exports parsing, graph operations, layout algorithms, export generators. Web UI imports core + adds Three.js. CLI imports core + adds file I/O.
- **Web adds rendering layer (Three.js), CLI adds export layer (diagram generators)**: Web mode: Core → Three.js scene → GPU. CLI mode: Core → Diagram generators → Files.
- **Maximize code reuse through rendering abstraction pattern**: Layout algorithm shared between web and CLI. Graph queries shared. Export generation shared. Only presentation layer differs.
- **Single codebase, multiple presentation layers**: Environment detection determines runtime mode. Conditional imports for browser-specific (Three.js) vs Node-specific (fs) modules.

### Critical Architectural Decisions (Tree of Thoughts Evaluation)

**1. Layout Calculation Strategy:**
- **Approach**: Hybrid stabilization with background worker threads
- **Implementation**: Force-directed physics runs until energy stabilizes → freeze positions → cache in Neo4j → render from cache
- **Fallback**: Hierarchical algorithm for tree-like LOD levels
- **Performance Impact**: Reduces layout cost from O(n²) per frame to O(1)

**2. Graph Database Schema:**
- **Approach**: Hybrid structural nodes with semantic properties
- **Core Nodes**: `Repository → File → Class → Function`
- **Core Relationships**: `CONTAINS`, `DEPENDS_ON`, `CALLS`
- **Language Flexibility**: Semantic properties (`language`, `visibility`, `abstract`) enable multi-language support without schema duplication

**3. Real-Time Collaboration Pattern:**
- **Approach**: State classification with different sync strategies
- **Ephemeral State** (camera positions): Throttled broadcast (50ms), no persistence, droppable under load
- **Persistent State** (viewpoints, annotations): Optimistic updates + server reconciliation
- **Static State** (code graph): No sync, clients query Neo4j directly
- **Latency Achievement**: Optimistic updates feel instant, actual sync <100ms

**4. Export Architecture:**
- **Approach**: Intermediate Visualization Model consumed by multiple renderers
- **Model**: Abstract representation (nodes, edges, positions, styles) independent of renderer
- **Renderers**: Three.js (interactive 3D), PlantUML generator, Mermaid generator, GLTF exporter
- **Benefit**: CLI and Web UI share same model-building logic, different presentation layers

**5. LOD Transition Mechanism:**
- **Approach**: Semantic zoom with context preservation
- **Behavior**: LOD changes modify graph query depth, camera maintains semantic position
- **UX Enhancement**: Brief highlight (500ms) of newly visible nodes
- **Mental Model**: Users stay oriented because camera follows semantic location across LOD changes

### Architecture Decision Records

**Technology Stack Decisions:**

- **Primary Language**: TypeScript/Node.js (backend, CLI, frontend)
  - *Rationale*: Single language across stack enables code sharing between CLI and web API. Strong async/await for I/O-bound operations (parsing files, database queries). Tree-sitter has excellent Node.js bindings.
  - *Trade-off*: Accept worker threads for CPU-intensive tasks instead of native performance. Reject Go/Rust to maintain code sharing with Three.js frontend.

- **Graph Database**: Neo4j with Cypher
  - *Rationale*: Native graph traversal optimized for relationship queries (perfect for code dependencies). Cypher query language expressive for complex patterns. Proven at 100k+ node scale with clustering support.
  - *Trade-off*: Accept higher memory footprint (500MB+ baseline) for query performance gains. Open-source community edition sufficient for MVP, defer enterprise features.

- **3D Rendering**: Three.js + WebGL
  - *Rationale*: De facto standard for browser 3D graphics. Mature, well-documented, large community. Built-in support for instanced rendering (critical for 1000+ nodes). Works across all modern browsers.
  - *Trade-off*: Accept WebGL limitations and bundle size (~600KB). Reject WebGPU (too new, poor browser support) and Babylon.js (heavier weight).

- **Deployment**: Docker (local) + Kubernetes/Helm (production)
  - *Rationale*: Industry standard with maximum portability. Horizontal scaling built-in. Declarative configuration via Helm charts. Works across cloud providers and on-premises.
  - *Trade-off*: Accept complexity cost for production-grade scalability. Provide docker-compose for local development simplicity. Reject serverless due to WebSocket and Neo4j requirements.

**Parsing Architecture Decisions:**

- **Parser**: Tree-sitter with language-agnostic grammars
  - *Rationale*: Language-agnostic architecture (same API for all languages). Incremental parsing supports live updates. Error recovery means partial parses still useful. Grammar repository covers 40+ languages.
  - *Trade-off*: Accept grammar maintenance burden, contribute fixes upstream. Reject language-specific parsers (doesn't scale to multi-language vision) and regex-based parsing (too fragile).

- **Strategy**: Two-pass parsing (declarations → symbol resolution)
  - *Rationale*: Clean separation of concerns. Symbol table enables accurate reference resolution. Handles forward references correctly. Enables parallel first-pass parsing.
  - *Trade-off*: Accept two database writes and memory cost of symbol table for accuracy over speed. Reject single-pass parsing (misses forward references).

**Collaboration Architecture Decisions:**

- **State Management**: Hybrid authority model
  - Server Authority: Viewpoints, annotations, workspace configs
  - Client Authority: Camera positions, selections, UI state
  - Database Authority: Code graph structure (immutable during session)
  - *Rationale*: Clear ownership prevents conflicts. Optimistic updates feel instant. Server validation prevents corruption. Throttling keeps network load manageable.
  - *Trade-off*: Accept rare rollbacks for instant perceived performance and complexity for clear conflict resolution. Reject fully authoritative server (adds latency) and full CRDT (over-engineered).

- **Sync Protocol**: Binary MessagePack with 50ms batching
  - *Rationale*: 30-50% smaller payload than JSON. Batching reduces message count by 10x. Channel separation enables priority handling. Standard format with broad library support.
  - *Trade-off*: Accept debugging difficulty for performance gains. Reject JSON (too verbose) and custom binary protocol (maintenance burden).

**Export Architecture Decisions:**

- **Pattern**: Intermediate Visualization Model (IVM)
  - Architecture: Neo4j Graph → IVM Builder → Visualization Model (JSON) → Renderers (Three.js / PlantUML / Mermaid / GLTF)
  - *Rationale*: Single source of truth for all renderers. CLI and web UI use same IVM builder. Testable without rendering. Renderer-agnostic (swap Three.js for alternatives easily).
  - *Trade-off*: Accept abstraction cost for consistency and testability. Include versioning in schema. Reject direct rendering from Neo4j (couples database to presentation) and separate code paths for CLI vs web (massive duplication).

- **Generators**: Template-based PlantUML/Mermaid/GLTF generation from IVM
  - *Rationale*: Templates ensure consistent output. Customization via config (colors, styles, layouts). Easy to add new diagram types.
  - *Trade-off*: Accept format limitations (PlantUML layout is automatic) and template maintenance for consistency.

**Performance Architecture Decisions:**

Multi-layer optimization strategy:

- **Layer 1 - Rendering Optimization**: Instanced rendering (single draw call per node type), frustum culling (viewport-only), spatial partitioning (octree/grid), LOD-based geometry
  - *Expected Impact*: 1000 nodes @ 60fps → 10,000 nodes @ 60fps

- **Layer 2 - Query Optimization**: Neo4j indexes (id, type, repository, language), depth-limited queries, connection pooling, Redis caching (5min TTL)
  - *Expected Impact*: 5s queries → <1s queries

- **Layer 3 - Layout Optimization**: Background workers (Web Workers / Node threads), incremental layout (affected subgraph only), position caching in Neo4j, stabilization detection (stop when energy < threshold)
  - *Expected Impact*: Continuous CPU load → Zero load after stabilization

- **Layer 4 - Network Optimization**: Progressive loading (viewport first), compression (Gzip/Brotli/MessagePack), CDN distribution, request batching
  - *Expected Impact*: 5s initial load → <2s initial load

- *Trade-off*: Accept significant implementation complexity for achieving performance requirements. Prioritize Layer 1 (rendering) and Layer 3 (layout) as critical path. Defer Layer 4 to post-MVP if acceptable.

**Development Workflow Decisions:**

- **Local Development**: Docker Compose with hot reload volumes
  - Services: neo4j (ports 7474, 7687), parser, api (depends on neo4j), ui (port 3000)
  - One-command setup: `npm run setup`
  - *Rationale*: Production parity (same Docker images). Eliminates "works on my machine" issues.

- **Production Deployment**: Helm charts with autoscaling and clustering
  - Neo4j: 3 replicas clustered, 100Gi persistence
  - Parser: 2-20 replicas with autoscaling
  - API: 3 replicas with TLS ingress
  - *Rationale*: Horizontal scaling built-in. Environment-specific configuration via Helm values.

- *Trade-off*: Accept Docker overhead on macOS (mitigate with volume mount caching) and Kubernetes complexity for production-grade capabilities. Provide alternative native setup docs for contributors without Docker.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack developer tool** with clear separation:
- **Frontend**: Browser-based 3D visualization UI
- **Backend**: Node.js/TypeScript API + Parser + WebSocket server
- **Shared**: Core engine library (TypeScript)

### Starter Options Considered

**Option 1: Official Vite React TypeScript Template + Manual Setup** ✅ **SELECTED**
- Start with official Vite React TypeScript template
- Add Tailwind CSS for UI styling
- Add @react-three/fiber (v9.4.2) for declarative Three.js
- Add @react-three/drei (v10.7.7) for 3D helpers
- Add testing with Vitest (Vite-native testing)

**Option 2: Pre-built R3F Boilerplates**
- Various react-three-fiber Vite starters
- **Rejected**: Less maintained, opinionated for art/demo projects, not production-focused

**Option 3: Vite + React + Tailwind + Shadcn/UI**
- Modern UI component starters
- **Rejected**: Focused on form/UI components, not 3D visualization needs

### Selected Starter: Official Vite React TypeScript

**Rationale for Selection:**

1. **Official and Maintained**: Vite's official template stays current with React/TypeScript best practices
2. **Clean Foundation**: Minimal setup gives you control - important for multi-system architecture
3. **Production-Ready**: Vite is used in production by major companies (Shopify, Airbnb, etc.)
4. **Automation-Friendly**: Clean project structure makes CI/CD pipeline setup straightforward
5. **Manual Additions are Simple**: Adding Tailwind + R3F takes <10 minutes and gives you full understanding

**Initialization Commands:**

```bash
# 1. Create Vite project with React + TypeScript
npm create vite@latest diagram-builder-ui -- --template react-ts

cd diagram-builder-ui

# 2. Install dependencies
npm install

# 3. Add Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# 4. Add Three.js and React Three Fiber ecosystem
npm install three @react-three/fiber @react-three/drei

# 5. Add Three.js TypeScript types
npm install -D @types/three

# 6. Add testing framework (Vitest - Vite-native)
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

**Configuration Files to Create:**

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```typescript
// vite.config.ts (update for testing)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
})
```

### Architectural Decisions Provided by Starter

**Language & Runtime:**
- **TypeScript**: Strict type checking enabled by default
- **React 19**: Latest React with concurrent features
- **ES Modules**: Modern JavaScript module system
- **Node.js 20.19+ / 22.12+**: Required for Vite

**Styling Solution:**
- **Tailwind CSS**: Utility-first CSS framework
  - JIT compilation for fast builds
  - Minimal bundle size (only used utilities included)
  - PostCSS processing pipeline
- **CSS Modules**: Available for component-scoped styles if needed

**Build Tooling:**
- **Vite 7.3**: Lightning-fast dev server with HMR
  - esbuild for dependency pre-bundling
  - Rollup for production builds
  - Code splitting and tree shaking automatic
  - Native ES modules in development
- **TypeScript Compiler**: Type checking (tsc)
- **PostCSS**: CSS transformation pipeline

**Testing Framework:**
- **Vitest**: Vite-native testing framework
  - Same config as Vite (no separate Jest setup)
  - Fast test execution
  - Compatible with Jest API
- **Testing Library**: React component testing utilities
- **JSDOM**: Browser environment simulation

**Code Organization:**
```
diagram-builder-ui/
├── src/
│   ├── components/       # React components
│   ├── lib/              # Shared utilities
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── test/             # Test setup and utilities
│   ├── App.tsx           # Root component
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles (Tailwind)
├── public/               # Static assets
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tailwind.config.js    # Tailwind configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

**Development Experience:**
- **Hot Module Replacement (HMR)**: Instant updates without full reload
- **TypeScript Errors**: Shown in terminal and browser
- **Fast Refresh**: React state preserved during edits
- **Dev Server**: `npm run dev` (default port 5173)
- **Build**: `npm run build` (optimized production bundle)
- **Preview**: `npm run preview` (test production build locally)

**Three.js Integration:**
- **@react-three/fiber**: Declarative React renderer for Three.js
  - Component-based 3D scene graph
  - React hooks for animation and interaction
  - Automatic disposal and cleanup
- **@react-three/drei**: Helper components and utilities
  - OrbitControls, PerspectiveCamera, etc.
  - Geometry helpers
  - Material helpers
  - Post-processing effects

**Additional Setup for diagram_builder:**

After basic starter initialization, you'll need to add:

1. **WebSocket Client**: For real-time collaboration
   ```bash
   npm install socket.io-client
   ```

2. **State Management**: For LOD, viewport, filters
   ```bash
   npm install zustand  # Lightweight, recommended
   # or
   npm install @reduxjs/toolkit react-redux  # If you prefer Redux
   ```

3. **API Client**: For REST API communication
   ```bash
   npm install axios
   # or use fetch (built-in)
   ```

4. **MessagePack**: For binary WebSocket protocol
   ```bash
   npm install @msgpack/msgpack
   ```

**Note:** Project initialization using these commands should be **Story 1.1: Initialize Web UI Project** in your first epic.

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
1. Frontend State Management - Zustand v5.0.2
2. API Authentication - JWT (JSON Web Tokens)
3. Neo4j Schema Migrations - Custom Cypher scripts
4. Frontend Routing - React Router v7.1.1

**Important Decisions (Shape Architecture):**
5. Caching Strategy - Redis v7.4.x
6. API Error Handling - RFC 7807 Problem Details
7. Component Architecture - Feature-based structure
8. CI/CD Platform - GitHub Actions

**Deferred Decisions (Post-MVP):**
- Rate limiting: Simple express-rate-limit or defer to post-MVP
- Monitoring/logging: Console-based initially, structured logging tools added later
- Advanced authorization (RBAC): Simple role checking, complex permissions post-MVP

### Frontend Architecture

**State Management: Zustand v5.0.2**
- **Rationale**: Lightweight, TypeScript-first state management. Minimal boilerplate ideal for solo developer managing complex 3D state (LOD levels, camera position, viewport, filters, WebSocket connection state, user session)
- **Library**: `zustand` npm package
- **Integration**: Works seamlessly with react-three-fiber for 3D state
- **Store Organization**: Feature-based slices (canvas store, viewpoint store, filter store, session store)
- **Affects**: All React components requiring shared state, 3D scene state management

**Routing: React Router v7.1.1**
- **Rationale**: User has prior experience. Industry standard with nested routes, code splitting support, mature ecosystem
- **Key Routes**:
  - `/` - Landing/workspace selection
  - `/workspace/:id` - 3D visualization canvas (main view)
  - `/workspace/:id/viewpoint/:vpId` - Specific viewpoint view
  - `/workspace/:id/config` - Workspace configuration
  - `/export` - Export/download center
  - `/settings` - User preferences
- **Code Splitting**: Lazy load 3D canvas component (Three.js bundle only loads when needed)
- **Affects**: Frontend navigation, URL structure for workspace/viewpoint sharing, bundle optimization

**Component Architecture: Feature-Based Structure**
- **Organization Pattern**:
  ```
  src/
  ├── features/
  │   ├── canvas/           # 3D visualization
  │   │   ├── Canvas3D.tsx
  │   │   ├── Scene.tsx
  │   │   ├── useCamera.ts
  │   │   └── canvas.store.ts
  │   ├── minimap/          # Dual mini-map
  │   │   ├── MiniMap.tsx
  │   │   ├── TreeView.tsx
  │   │   └── SpatialView.tsx
  │   ├── search/           # Codebase search
  │   ├── viewpoints/       # Viewpoint management
  │   ├── filters/          # LOD and filtering controls
  │   └── export/           # Export functionality
  ├── shared/
  │   ├── components/       # Reusable UI components
  │   ├── hooks/            # Custom React hooks
  │   ├── lib/              # Utilities
  │   └── types/            # Shared TypeScript types
  ```
- **Rationale**: Clear feature boundaries, co-located code reduces context switching for solo developer, scales well with Zustand store slices per feature
- **Affects**: Frontend folder structure, import patterns, component organization, team onboarding

### Authentication & Security

**API Authentication: JWT (JSON Web Tokens)**
- **Rationale**: Stateless authentication works across web UI, CLI, and CI/CD. Enables Kubernetes horizontal scaling without shared session store
- **Library**: `jsonwebtoken` (Node.js backend), `jwt-decode` (frontend for token inspection)
- **Token Flow**:
  - User authenticates → Backend issues JWT with expiration
  - Web UI: Store in memory (not localStorage for security)
  - CLI: Pass as `--token` flag or environment variable
  - WebSocket: Include in handshake query params or initial message
- **Implementation**:
  - HTTP: `Authorization: Bearer <token>` header
  - WebSocket: Token in connection handshake
  - Expiration: 24 hours (configurable)
  - Refresh: Implement refresh token flow for long-lived sessions
- **Security Considerations**:
  - Sign tokens with strong secret (environment variable)
  - Validate on every protected endpoint
  - Short expiry reduces risk of token theft
- **Affects**: REST API middleware, WebSocket authentication, CLI authentication flow, all authenticated requests

**API Error Handling: RFC 7807 Problem Details**
- **Rationale**: Community standard for HTTP API error responses. Machine-readable format enables better tool compatibility and programmatic error handling in CLI/CI-CD
- **Format**:
  ```json
  {
    "type": "https://diagram-builder.io/errors/parsing-failed",
    "title": "Repository Parsing Failed",
    "status": 422,
    "detail": "Tree-sitter syntax error at src/index.ts:42",
    "instance": "/api/parse/repo-abc123"
  }
  ```
- **Library**: `http-problem-details` or custom middleware following RFC 7807
- **Error Categories**:
  - Authentication: 401 (invalid JWT)
  - Authorization: 403 (insufficient permissions)
  - Validation: 400 (invalid request data)
  - Parsing: 422 (Tree-sitter errors)
  - Database: 503 (Neo4j unavailable)
  - Rate Limiting: 429 (too many requests)
- **Affects**: REST API error responses, CLI error parsing and display, API documentation, client error handling

### Data Architecture

**Neo4j Schema Migrations: Custom Cypher Scripts**
- **Rationale**: Aligns with user's automation/pipeline expertise. Keeps stack in TypeScript/Node.js. Full control over migration logic. Integrates easily with Docker initialization and Helm deployment jobs
- **Implementation Pattern**:
  ```
  migrations/
  ├── 001-init-schema.cypher        # Create base nodes and relationships
  ├── 002-add-indexes.cypher        # Performance indexes
  ├── 003-add-language-properties.cypher
  └── migration-runner.ts           # Node.js script to track and run
  ```
- **Migration Tracking**:
  ```cypher
  CREATE (:Migration {
    version: 1,
    name: "001-init-schema",
    appliedAt: datetime(),
    checksum: "sha256-hash"
  })
  ```
- **Runner Logic**:
  1. Read all .cypher files in migrations/ folder (sorted numerically)
  2. Check Neo4j for applied migrations (query `:Migration` nodes)
  3. Run unapplied migrations in order
  4. Record successful migration in Neo4j
  5. Fail fast and rollback on error
- **Integration Points**:
  - Docker: Run migrations on container startup (init script)
  - Kubernetes: Helm pre-install/pre-upgrade job
  - Local Dev: `npm run migrate` script
- **Affects**: Database initialization, Docker setup, Helm charts, schema evolution workflow, deployment process

**Caching Strategy: Redis v7.4.x**
- **Rationale**: Meets <1s query requirement. Shared cache across API replicas (critical for Kubernetes horizontal scaling). Future-ready for WebSocket pub/sub cross-server communication
- **Library**: `ioredis` (supports clustering, TypeScript-friendly)
- **Cache Use Cases**:
  - Neo4j query results: 5-minute TTL (common graph traversals)
  - Layout positions: Cache until graph structure changes (invalidate on new parse)
  - Workspace configurations: Cache user preferences
  - Viewpoint metadata: Frequently accessed viewpoints
- **Cache Keys Strategy**:
  ```
  query:{hash}                    # Query result cache
  layout:{repoId}:{commitHash}    # Layout positions
  workspace:{userId}:{workspaceId} # Workspace config
  viewpoint:{viewpointId}         # Viewpoint data
  ```
- **Deployment**:
  - **Local Dev**: Docker Compose `redis:7-alpine` service
  - **Production**: Kubernetes Redis Helm chart or managed service (AWS ElastiCache, GCP Memorystore)
- **Future Enhancements** (Post-MVP):
  - Redis pub/sub for WebSocket cross-server communication
  - Redis streams for event sourcing
  - Cache warming on application startup
- **Affects**: API server performance, query optimization layer, Docker Compose configuration, Kubernetes deployment

### Infrastructure & Deployment

**CI/CD Platform: GitHub Actions**
- **Rationale**: Aligns with PRD requirement (FR-I6: GitHub Actions integration). Free for public repositories. Extensive marketplace. Integrates natively with GitHub. User's automation expertise applies directly
- **Pipeline Structure**:
  ```
  .github/workflows/
  ├── ui-build.yml          # Web UI: lint, test, build, deploy
  ├── backend-build.yml     # API + Parser: lint, test, Docker build/push
  ├── integration.yml       # E2E tests, multi-codebase parsing validation
  ├── deploy-staging.yml    # Auto-deploy to staging on main branch
  └── deploy-production.yml # Manual approval deploy to production
  ```
- **Key Workflows**:
  
  **ui-build.yml**:
  - Trigger: PR to main, push to main
  - Steps: Checkout → Setup Node.js → Install deps → Lint → Test → Build → Upload artifacts
  - Matrix: Test on Node 20, 22
  
  **backend-build.yml**:
  - Trigger: PR to main, push to main
  - Steps: Checkout → Setup Node.js → Install deps → Lint → Test → Docker build → Push to registry (on main)
  - Services: Neo4j container for integration tests
  
  **integration.yml**:
  - Trigger: Daily schedule + manual dispatch
  - Steps: Parse sample codebases → Validate exports (PlantUML, Mermaid) → Performance benchmarks
  - Performance Gates: Parsing <2s/100 files, exports <5s
  
  **deploy-staging.yml**:
  - Trigger: Push to main
  - Steps: Build Docker images → Update Helm values → Deploy to staging cluster → Smoke tests
  
  **deploy-production.yml**:
  - Trigger: Manual workflow dispatch with approval
  - Steps: Tag release → Build production images → Deploy via Helm → Health checks
  
- **Secrets Management**:
  - GitHub Secrets: Docker registry credentials, Kubernetes config, deployment tokens
  - Environment-specific secrets: Staging vs Production
  
- **Affects**: Repository `.github/workflows/` folder, Docker image publishing workflow, deployment automation, release process

### Decision Impact Analysis

**Implementation Sequence:**

1. **Phase 1 - Foundation Setup** (Week 1-2):
   - Initialize Vite project with React + TypeScript + Tailwind
   - Set up Docker Compose (Neo4j, Redis, API services)
   - Create Neo4j migration runner and initial schema (001-init-schema.cypher)
   - Configure GitHub Actions for basic CI (lint, test)

2. **Phase 2 - Backend Core** (Week 3-4):
   - Implement JWT authentication middleware
   - Set up RFC 7807 error handling
   - Connect to Neo4j with migration support
   - Configure Redis caching layer with ioredis
   - Basic REST API endpoints (health check, parse trigger)

3. **Phase 3 - Frontend Foundation** (Week 5-6):
   - Set up Zustand stores (canvas, viewpoint, session)
   - Configure React Router with lazy loading
   - Implement feature-based folder structure
   - Basic 3D canvas with react-three-fiber
   - Authentication flow (login, token storage)

4. **Phase 4 - Integration** (Week 7-8):
   - WebSocket server with JWT handshake
   - API client integration (axios with JWT interceptor)
   - CI/CD deployment pipelines (staging, production)
   - End-to-end testing setup

**Cross-Component Dependencies:**

- **Zustand ↔ React Router**: Router params drive store state (workspace ID, viewpoint ID)
- **JWT ↔ Redis**: Cache user sessions and permissions in Redis after JWT validation
- **Neo4j Migrations ↔ Docker/Helm**: Migrations run automatically on deployment
- **RFC 7807 Errors ↔ Zustand**: Error store in Zustand consumes RFC 7807 responses
- **Feature-Based Components ↔ Zustand**: Each feature has corresponding store slice
- **GitHub Actions ↔ Docker**: CI builds and pushes Docker images to registry
- **Custom Migrations ↔ Helm**: Pre-install job runs migrations before deployment

**Technology Version Matrix:**

| Technology | Version | Purpose |
|------------|---------|---------|
| Zustand | v5.0.2 | Frontend state management |
| React Router | v7.1.1 | Frontend routing |
| JWT (jsonwebtoken) | Latest stable | API authentication |
| Redis | v7.4.x | Caching layer |
| ioredis | Latest stable | Redis client for Node.js |
| http-problem-details | Latest stable | RFC 7807 error responses |

**Development Priority:**
1. **Critical Path**: JWT auth → Neo4j migrations → Redis caching → Zustand stores → React Router
2. **Parallel Work**: CI/CD pipelines can be set up alongside feature development
3. **Deferred**: Advanced error recovery, rate limiting, complex authorization

## Implementation Patterns & Consistency Rules

### Pattern Categories Defined

**Critical Conflict Points Identified:** 20+ areas where AI agents could make different choices, now standardized to ensure compatibility.

### Naming Patterns

**Database Naming Conventions (Neo4j):**

- **Node Labels**: PascalCase
  ```cypher
  (:Repository), (:File), (:Class), (:Function), (:Method)
  ```

- **Properties**: camelCase
  ```cypher
  {fileName: "index.ts", createdAt: "2025-12-29T10:30:00Z", lineCount: 142}
  ```

- **Relationships**: UPPER_SNAKE_CASE
  ```cypher
  -[:CONTAINS]-, -[:DEPENDS_ON]-, -[:CALLS]-, -[:IMPORTS]-, -[:EXTENDS]-
  ```

**API Naming Conventions:**

- **Resource Names**: Plural nouns
  ```
  /api/repositories
  /api/viewpoints
  /api/workspaces
  /api/annotations
  ```

- **Route Parameters**: Colon prefix
  ```
  /api/repositories/:id
  /api/repositories/:id/viewpoints/:viewpointId
  /api/workspaces/:workspaceId/config
  ```

- **Query Parameters**: camelCase
  ```
  ?userId=123
  ?lodLevel=3
  ?includeMetadata=true
  ?filterType=security
  ```

- **Nested Resources**: Parent-child only
  ```
  /api/repositories/:id/viewpoints (valid - repository owns viewpoints)
  /api/viewpoints?repositoryId=:id (alternative - filtering)
  ```

**Code Naming Conventions:**

- **Component Files**: PascalCase matching component name
  ```
  Canvas3D.tsx
  MiniMap.tsx
  SearchBar.tsx
  ViewpointList.tsx
  ```

- **Hook Files**: camelCase matching hook name
  ```
  useCamera.ts
  useLOD.ts
  useViewport.ts
  useWebSocket.ts
  ```

- **Store Files**: camelCase with "Store" suffix
  ```
  canvasStore.ts
  viewpointStore.ts
  sessionStore.ts
  filterStore.ts
  ```

- **Utility Files**: camelCase with "Utils" suffix (optional)
  ```
  cameraUtils.ts
  formatUtils.ts
  apiClient.ts
  validators.ts
  ```

- **Type Files**: `types.ts` within features, `/shared/types/` for global
  ```
  features/canvas/types.ts
  shared/types/index.ts
  shared/types/api.ts
  ```

- **Test Files**: Co-located with `.test.ts` suffix
  ```
  Canvas3D.test.tsx
  useCamera.test.ts
  canvasStore.test.ts
  apiClient.test.ts
  ```

### Structure Patterns

**Project Organization:**

```
src/
├── features/                    # Feature-based organization
│   ├── canvas/
│   │   ├── Canvas3D.tsx        # Components
│   │   ├── Scene.tsx
│   │   ├── useCamera.ts        # Hooks
│   │   ├── canvasStore.ts      # State
│   │   ├── types.ts            # Feature types
│   │   ├── Canvas3D.test.tsx   # Tests co-located
│   │   └── index.ts            # Public exports
│   ├── minimap/
│   ├── search/
│   ├── viewpoints/
│   ├── filters/
│   └── export/
├── shared/
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Shared custom hooks
│   ├── lib/                    # Utilities
│   │   ├── apiClient.ts
│   │   ├── formatUtils.ts
│   │   └── validators.ts
│   └── types/                  # Global types
│       ├── index.ts
│       └── api.ts
├── App.tsx
├── main.tsx
└── index.css
```

**Test Organization:**
- Co-located with source files using `.test.ts` or `.test.tsx` suffix
- Test utilities in `shared/lib/testUtils.ts`
- Mock data in feature folders: `features/canvas/__mocks__/`

### Format Patterns

**API Response Formats:**

**Single Resource** (Direct JSON):
```json
{
  "id": "repo-123",
  "name": "diagram_builder",
  "parsed": true,
  "nodeCount": 1523,
  "createdAt": "2025-12-29T10:30:00Z"
}
```

**Collections** (Envelope with pagination):
```json
{
  "data": [
    { "id": "repo-1", "name": "project-a" },
    { "id": "repo-2", "name": "project-b" }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 147,
    "hasMore": true
  }
}
```

**Error Responses** (RFC 7807):
```json
{
  "type": "https://diagram-builder.io/errors/parsing-failed",
  "title": "Repository Parsing Failed",
  "status": 422,
  "detail": "Tree-sitter syntax error at src/index.ts:42",
  "instance": "/api/parse/repo-abc123"
}
```

**Date/Time Format:**
- Always use ISO 8601 strings: `"2025-12-29T10:30:00Z"`
- Never use Unix timestamps in JSON
- Backend handles timezone conversions

**Data Exchange Formats:**

- **JSON Field Naming**: camelCase (matches TypeScript)
  ```json
  { "userId": "123", "createdAt": "2025-12-29T10:30:00Z", "lodLevel": 3 }
  ```

- **Boolean Values**: `true` / `false` (never `1` / `0` or strings)

- **Null Handling**: Use `null` for missing optional values, omit field for undefined

- **Arrays**: Always return arrays for collections, even if empty `[]`

### Communication Patterns

**WebSocket Event Patterns:**

**Event Naming**: Dot notation with category prefix
```typescript
"position.update"
"viewpoint.created"
"viewpoint.updated"
"viewpoint.deleted"
"session.join"
"session.leave"
"annotation.added"
"annotation.removed"
"filter.changed"
"lod.changed"
```

**Event Payload Structure**: Standard format
```typescript
{
  type: "position.update",
  userId: "user-123",
  timestamp: "2025-12-29T10:30:00Z",
  data: {
    x: 10.5,
    y: 20.3,
    z: 5.1
  }
}
```

**Event Categories:**
- `position.*` - Camera and user position updates
- `viewpoint.*` - Viewpoint CRUD operations
- `annotation.*` - Annotation operations
- `session.*` - Session lifecycle events
- `filter.*` - Filter changes
- `lod.*` - Level-of-detail changes

**State Management Patterns (Zustand):**

**Store Organization**: Feature-based slices
```typescript
// features/canvas/canvasStore.ts
export const useCanvasStore = create<CanvasStore>((set) => ({
  camera: { position: [0, 0, 0], target: [0, 0, 0] },
  selection: { nodes: [], edges: [] },
  
  // Actions: verb-first naming
  setCamera: (camera) => set({ camera }),
  updateSelection: (selection) => set({ selection }),
  resetCamera: () => set({ camera: initialCamera }),
}))
```

**Action Naming Conventions**: Verb-first
- `set{Property}` - Replace entire value
- `update{Property}` - Modify existing value
- `add{Item}` - Add to collection
- `remove{Item}` - Remove from collection
- `reset{Property}` - Reset to initial state
- `toggle{Property}` - Boolean toggle

**State Updates**: Functional for nested objects
```typescript
// Good - functional update
set((state) => ({ 
  camera: { ...state.camera, position: newPosition } 
}))

// Acceptable - direct for top-level
set({ selection: newSelection })
```

**Caching Patterns (Redis):**

**Cache Key Format**: Colon-separated hierarchy
```
query:{hash}                            # Query result cache
layout:{repoId}:{commitHash}            # Layout positions
workspace:{userId}:{workspaceId}        # Workspace config
viewpoint:{viewpointId}                 # Viewpoint data
session:{sessionId}                     # Session data
ivm:{repoId}:{lodLevel}:{filterHash}    # Visualization model
```

**Cache Key Rules:**
- Lowercase only
- Prefix indicates resource type
- Specific-to-general hierarchy
- No spaces (use hyphens if needed)
- Consistent ID formats

### Process Patterns

**Error Handling Patterns:**

**React Error Boundaries**: Multi-level isolation
```typescript
// App.tsx - Global boundary
<ErrorBoundary fallback={<GlobalErrorFallback />}>
  <Router>
    {/* Feature boundaries */}
    <ErrorBoundary fallback={<FeatureErrorFallback />}>
      <Canvas3D />
    </ErrorBoundary>
    
    <ErrorBoundary fallback={<FeatureErrorFallback />}>
      <MiniMap />
    </ErrorBoundary>
  </Router>
</ErrorBoundary>
```

**API Error Handling**: Centralized interceptor
```typescript
// Axios interceptor handles:
// - 401: Attempt token refresh, retry request
// - 403: Redirect to login
// - 5xx: Log error, show generic message
// - Network errors: Show offline message
```

**Component Error Handling**: Try-catch for async operations
```typescript
try {
  const data = await api.getRepositories()
  setRepositories(data)
} catch (error) {
  showToast('Failed to load repositories', 'error')
  console.error('Repository load error:', error)
}
```

**Error Display Strategy:**
- Recoverable errors: Toast notifications (auto-dismiss)
- Critical errors: Error boundary UI with reload button
- Form validation: Inline error messages
- Loading failures: Retry button with error context

**TypeScript Patterns:**

**Type vs Interface:**
```typescript
// Use interface for object shapes (extendable)
interface User {
  id: string
  name: string
  email: string
}

interface AdminUser extends User {
  permissions: string[]
}

// Use type for unions, primitives, utilities
type UserRole = 'admin' | 'viewer' | 'editor'
type APIResponse<T> = { data: T; meta?: ResponseMeta }
type Nullable<T> = T | null
```

**Naming Conventions:**
- No prefixes: `User` (not `IUser` or `UserType`)
- Enums: PascalCase (`LODLevel`, `ExportFormat`, `ParseStatus`)
- Generic types: Single uppercase letter or descriptive (`T`, `TData`, `TResponse`)

**Enum Patterns:**
```typescript
enum LODLevel {
  System = 1,
  Service = 2,
  File = 3,
  Class = 4,
  Method = 5,
}

enum ExportFormat {
  PlantUML = 'plantuml',
  Mermaid = 'mermaid',
  GLTF = 'gltf',
  PNG = 'png',
  SVG = 'svg',
}
```

### Enforcement Guidelines

**All AI Agents MUST:**

1. **Follow naming conventions exactly**
   - Neo4j: PascalCase nodes, camelCase properties, UPPER_SNAKE_CASE relationships
   - Files: PascalCase components, camelCase utilities/hooks/stores
   - APIs: Plural resources, camelCase query params

2. **Use standardized response formats**
   - Single resources: Direct JSON
   - Collections: Envelope with pagination
   - Errors: RFC 7807 Problem Details
   - Dates: ISO 8601 strings only

3. **Organize code by features**
   - Components, hooks, stores, types co-located in feature folders
   - Shared code in `/shared/` with clear purpose
   - Tests co-located with `.test.ts` suffix

4. **Implement error boundaries**
   - Global boundary for app-level crashes
   - Feature boundaries for isolation
   - Centralized API error handling

5. **Use consistent WebSocket patterns**
   - Dot notation for event names (`position.update`)
   - Standard payload structure with `type`, `userId`, `timestamp`, `data`

6. **Follow Zustand patterns**
   - Feature-based store slices
   - Verb-first action naming
   - Functional updates for nested objects

**Pattern Verification:**

- **Linting**: ESLint rules enforce naming conventions
- **Type Checking**: TypeScript ensures API contracts match
- **Code Review**: Check patterns during PR review
- **Testing**: Integration tests verify cross-agent compatibility

**Pattern Updates:**

- Patterns can evolve but require documentation update
- Breaking changes need migration path
- New patterns added through architecture decision process

### Pattern Examples

**Good Examples:**

**Neo4j Query**:
```cypher
MATCH (r:Repository {id: $repoId})-[:CONTAINS]->(f:File)
WHERE f.language = 'typescript'
RETURN f.fileName, f.lineCount
ORDER BY f.createdAt DESC
```

**API Endpoint**:
```typescript
// GET /api/repositories/:id/viewpoints?lodLevel=3&includeMetadata=true
router.get('/repositories/:id/viewpoints', async (req, res) => {
  const { lodLevel, includeMetadata } = req.query
  // ...
})
```

**React Component with Store**:
```typescript
// features/canvas/Canvas3D.tsx
import { useCanvasStore } from './canvasStore'

export function Canvas3D() {
  const { camera, setCamera } = useCanvasStore()
  
  return <Canvas camera={camera} onCameraChange={setCamera} />
}
```

**WebSocket Event**:
```typescript
socket.emit('position.update', {
  type: 'position.update',
  userId: currentUser.id,
  timestamp: new Date().toISOString(),
  data: { x: 10.5, y: 20.3, z: 5.1 }
})
```

**Redis Cache**:
```typescript
const key = `layout:${repoId}:${commitHash}`
await redis.set(key, JSON.stringify(layoutData), 'EX', 300)
```

**Anti-Patterns (Avoid These):**

❌ **Inconsistent naming**:
```cypher
// Bad - mixed case
MATCH (repository:repository)-[:contains]->(File:file)
```

❌ **Non-standard API responses**:
```json
// Bad - no pagination wrapper for collections
[{ "id": 1 }, { "id": 2 }]
```

❌ **Scattered feature code**:
```
// Bad - feature code split across folders
src/components/Canvas3D.tsx
src/hooks/useCanvas.ts
src/stores/canvas.ts
```

❌ **Inconsistent event naming**:
```typescript
// Bad - mixed conventions
socket.emit('POSITION_UPDATE', data)
socket.emit('viewpoint-created', data)
socket.emit('annotation_added', data)
```

❌ **Cache key inconsistency**:
```
// Bad - mixed separators
redis.get('query/abc123')
redis.get('layout.repo-123.commit-456')
```

## Project Structure & Boundaries

### Repository Organization

**Monorepo Structure** using npm workspaces for code sharing and atomic cross-package changes.

### Complete Project Directory Structure

```
diagram-builder/
├── README.md
├── package.json                    # Root package.json with workspaces
├── tsconfig.json                   # Root TypeScript config
├── .gitignore
├── .nvmrc                          # Node version (20.19+ or 22.12+)
├── LICENSE
│
├── .github/
│   └── workflows/
│       ├── ui-build.yml           # Web UI: lint, test, build
│       ├── backend-build.yml      # API + Parser: lint, test, Docker
│       ├── integration.yml        # E2E tests, parsing validation
│       ├── deploy-staging.yml     # Auto-deploy to staging
│       └── deploy-production.yml  # Manual production deploy
│
├── packages/
│   │
│   ├── ui/                        # Web UI (Vite + React + TypeScript)
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   ├── index.html
│   │   ├── .env.example
│   │   │
│   │   ├── public/
│   │   │   └── assets/
│   │   │       ├── icons/
│   │   │       └── images/
│   │   │
│   │   └── src/
│   │       ├── main.tsx           # Entry point
│   │       ├── App.tsx            # Root component with Router
│   │       ├── index.css          # Tailwind imports
│   │       │
│   │       ├── features/          # Feature-based organization
│   │       │   ├── canvas/        # 3D Visualization (FR10-FR18)
│   │       │   │   ├── Canvas3D.tsx
│   │       │   │   ├── Scene.tsx
│   │       │   │   ├── NodeRenderer.tsx
│   │       │   │   ├── EdgeRenderer.tsx
│   │       │   │   ├── useCamera.ts
│   │       │   │   ├── canvasStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   ├── Canvas3D.test.tsx
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── minimap/       # Dual Mini-map (FR19-FR28)
│   │       │   │   ├── MiniMap.tsx
│   │       │   │   ├── TreeView.tsx
│   │       │   │   ├── SpatialView.tsx
│   │       │   │   ├── minimapStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── search/        # Codebase Search (FR19-FR28)
│   │       │   │   ├── SearchBar.tsx
│   │       │   │   ├── SearchResults.tsx
│   │       │   │   ├── CoordinateNavigator.tsx
│   │       │   │   ├── searchStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── viewpoints/    # Viewpoint Management (FR35-FR43)
│   │       │   │   ├── ViewpointList.tsx
│   │       │   │   ├── ViewpointCard.tsx
│   │       │   │   ├── ViewpointEditor.tsx
│   │       │   │   ├── ShareDialog.tsx
│   │       │   │   ├── viewpointStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── filters/       # LOD & Filter Controls (FR29-FR34)
│   │       │   │   ├── LODControls.tsx
│   │       │   │   ├── FilterPanel.tsx
│   │       │   │   ├── ProfileSelector.tsx
│   │       │   │   ├── filterStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── collaboration/  # Multi-user Sessions (FR35-FR43)
│   │       │   │   ├── SessionPanel.tsx
│   │       │   │   ├── UserAvatar.tsx
│   │       │   │   ├── ChatPanel.tsx
│   │       │   │   ├── collaborationStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── export/        # Export & Documentation (FR44-FR53)
│   │       │   │   ├── ExportDialog.tsx
│   │       │   │   ├── FormatSelector.tsx
│   │       │   │   ├── ExportPreview.tsx
│   │       │   │   ├── exportStore.ts
│   │       │   │   ├── types.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   └── workspace/     # Workspace Management (FR29-FR34)
│   │       │       ├── WorkspaceList.tsx
│   │       │       ├── WorkspaceConfig.tsx
│   │       │       ├── RepoSelector.tsx
│   │       │       ├── workspaceStore.ts
│   │       │       ├── types.ts
│   │       │       └── index.ts
│   │       │
│   │       ├── shared/
│   │       │   ├── components/    # Reusable UI components
│   │       │   │   ├── Button.tsx
│   │       │   │   ├── Toast.tsx
│   │       │   │   ├── Modal.tsx
│   │       │   │   ├── ErrorBoundary.tsx
│   │       │   │   ├── Loading.tsx
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── hooks/         # Shared custom hooks
│   │       │   │   ├── useWebSocket.ts
│   │       │   │   ├── useAuth.ts
│   │       │   │   ├── useAPI.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   ├── lib/           # Utilities
│   │       │   │   ├── apiClient.ts
│   │       │   │   ├── wsClient.ts
│   │       │   │   ├── formatUtils.ts
│   │       │   │   ├── validators.ts
│   │       │   │   ├── testUtils.ts
│   │       │   │   └── index.ts
│   │       │   │
│   │       │   └── types/         # Global types
│   │       │       ├── index.ts
│   │       │       └── api.ts
│   │       │
│   │       └── test/
│   │           └── setup.ts       # Vitest setup
│   │
│   ├── api/                       # REST API + WebSocket Server
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   │
│   │   └── src/
│   │       ├── main.ts            # Entry point
│   │       ├── app.ts             # Express app setup
│   │       │
│   │       ├── config/
│   │       │   ├── database.ts    # Neo4j connection
│   │       │   ├── redis.ts       # Redis connection
│   │       │   ├── jwt.ts         # JWT configuration
│   │       │   └── index.ts
│   │       │
│   │       ├── middleware/
│   │       │   ├── auth.ts        # JWT authentication
│   │       │   ├── errorHandler.ts # RFC 7807 error handler
│   │       │   ├── validation.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── routes/            # API endpoints (FR67-FR72)
│   │       │   ├── repositories.ts  # /api/repositories
│   │       │   ├── viewpoints.ts    # /api/viewpoints
│   │       │   ├── workspaces.ts    # /api/workspaces
│   │       │   ├── exports.ts       # /api/exports
│   │       │   ├── auth.ts          # /api/auth
│   │       │   └── index.ts
│   │       │
│   │       ├── services/          # Business logic
│   │       │   ├── repositoryService.ts
│   │       │   ├── viewpointService.ts
│   │       │   ├── workspaceService.ts
│   │       │   ├── exportService.ts
│   │       │   ├── cacheService.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── repositories/      # Data access layer
│   │       │   ├── neo4jRepository.ts
│   │       │   ├── redisRepository.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── websocket/         # WebSocket server (FR35-FR43)
│   │       │   ├── server.ts
│   │       │   ├── handlers/
│   │       │   │   ├── positionHandler.ts
│   │       │   │   ├── viewpointHandler.ts
│   │       │   │   ├── sessionHandler.ts
│   │       │   │   └── index.ts
│   │       │   └── types.ts
│   │       │
│   │       ├── types/
│   │       │   ├── express.d.ts   # Express type extensions
│   │       │   ├── api.ts
│   │       │   └── index.ts
│   │       │
│   │       └── test/
│   │           ├── integration/
│   │           │   ├── api.test.ts
│   │           │   └── websocket.test.ts
│   │           ├── unit/
│   │           │   ├── services/
│   │           │   └── repositories/
│   │           └── setup.ts
│   │
│   ├── parser/                    # Parser Engine (FR1-FR9)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   │
│   │   └── src/
│   │       ├── index.ts           # Parser entry point
│   │       │
│   │       ├── parsers/
│   │       │   ├── typescript.ts  # TypeScript parser
│   │       │   ├── javascript.ts  # JavaScript parser
│   │       │   └── index.ts
│   │       │
│   │       ├── analyzers/
│   │       │   ├── dependencyAnalyzer.ts
│   │       │   ├── metricCalculator.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── ir/                # Intermediate Representation
│   │       │   ├── builder.ts
│   │       │   ├── validator.ts
│   │       │   ├── types.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── workers/           # Background processing
│   │       │   ├── parseWorker.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── types/
│   │       │   └── index.ts
│   │       │
│   │       └── test/
│   │           ├── fixtures/
│   │           │   ├── typescript/
│   │           │   └── javascript/
│   │           └── parsers/
│   │               └── typescript.test.ts
│   │
│   ├── cli/                       # CLI Tool (FR54-FR60)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   │
│   │   ├── bin/
│   │   │   └── diagram-builder    # CLI executable
│   │   │
│   │   └── src/
│   │       ├── index.ts           # CLI entry point
│   │       │
│   │       ├── commands/
│   │       │   ├── parse.ts       # diagram-builder parse
│   │       │   ├── export.ts      # diagram-builder export
│   │       │   ├── init.ts        # diagram-builder init
│   │       │   └── index.ts
│   │       │
│   │       ├── lib/
│   │       │   ├── config.ts
│   │       │   ├── logger.ts
│   │       │   └── index.ts
│   │       │
│   │       ├── types/
│   │       │   └── index.ts
│   │       │
│   │       └── test/
│   │           └── commands/
│   │               └── parse.test.ts
│   │
│   └── core/                      # Shared Library
│       ├── package.json
│       ├── tsconfig.json
│       │
│       └── src/
│           ├── index.ts
│           │
│           ├── ivm/               # Intermediate Visualization Model
│           │   ├── builder.ts
│           │   ├── validator.ts
│           │   ├── types.ts
│           │   └── index.ts
│           │
│           ├── exporters/         # Export Generators (FR44-FR53)
│           │   ├── plantuml.ts
│           │   ├── mermaid.ts
│           │   ├── gltf.ts
│           │   ├── drawio.ts
│           │   ├── png.ts
│           │   ├── svg.ts
│           │   └── index.ts
│           │
│           ├── layout/            # Layout Algorithms
│           │   ├── forceDirected.ts
│           │   ├── hierarchical.ts
│           │   ├── stabilizer.ts
│           │   └── index.ts
│           │
│           ├── utils/
│           │   ├── lodUtils.ts
│           │   ├── coordinateUtils.ts
│           │   └── index.ts
│           │
│           ├── types/
│           │   ├── graph.ts
│           │   ├── layout.ts
│           │   ├── export.ts
│           │   └── index.ts
│           │
│           └── test/
│               ├── ivm/
│               ├── exporters/
│               └── layout/
│
├── migrations/                    # Neo4j Schema Migrations
│   ├── 001-init-schema.cypher
│   ├── 002-add-indexes.cypher
│   ├── 003-add-language-properties.cypher
│   └── migration-runner.ts
│
├── infrastructure/                # Deployment & Infrastructure
│   │
│   ├── docker/
│   │   ├── Dockerfile.ui
│   │   ├── Dockerfile.api
│   │   ├── Dockerfile.parser
│   │   ├── Dockerfile.cli
│   │   └── docker-compose.yml
│   │
│   ├── kubernetes/
│   │   ├── namespace.yaml
│   │   ├── configmap.yaml
│   │   ├── secrets.yaml.example
│   │   ├── neo4j-statefulset.yaml
│   │   ├── redis-deployment.yaml
│   │   ├── api-deployment.yaml
│   │   ├── ui-deployment.yaml
│   │   ├── ingress.yaml
│   │   └── service.yaml
│   │
│   └── helm/
│       └── diagram-builder/
│           ├── Chart.yaml
│           ├── values.yaml
│           ├── values-staging.yaml
│           ├── values-production.yaml
│           └── templates/
│               ├── deployment.yaml
│               ├── service.yaml
│               ├── ingress.yaml
│               ├── configmap.yaml
│               └── _helpers.tpl
│
├── docs/                          # Documentation
│   ├── architecture/
│   │   ├── decisions.md           # ADRs
│   │   ├── diagrams/
│   │   └── overview.md
│   ├── api/
│   │   ├── rest-api.md
│   │   └── websocket-api.md
│   ├── development/
│   │   ├── setup.md
│   │   ├── contributing.md
│   │   └── testing.md
│   └── deployment/
│       ├── docker.md
│       └── kubernetes.md
│
└── scripts/                       # Development & Deployment Scripts
    ├── setup.sh                   # One-command setup
    ├── dev.sh                     # Start all services locally
    ├── test.sh                    # Run all tests
    ├── build.sh                   # Build all packages
    └── deploy.sh                  # Deployment script
```

### Architectural Boundaries

**API Boundaries:**

**REST API Endpoints** (`packages/api/src/routes/`):
- **Authentication**: `/api/auth/*` - JWT token issuance and validation
- **Repositories**: `/api/repositories` - Parse requests, metadata, graph queries
- **Viewpoints**: `/api/viewpoints` - CRUD operations, sharing, URL generation
- **Workspaces**: `/api/workspaces` - Multi-codebase configurations, profiles
- **Exports**: `/api/exports` - Export generation requests, format selection
- **Health**: `/api/health` - Service health checks

**WebSocket Events** (`packages/api/src/websocket/handlers/`):
- **Position Events**: `position.update`, `position.sync`
- **Viewpoint Events**: `viewpoint.created`, `viewpoint.updated`, `viewpoint.deleted`
- **Session Events**: `session.join`, `session.leave`, `session.sync`
- **Annotation Events**: `annotation.added`, `annotation.removed`, `annotation.updated`
- **Filter Events**: `filter.changed`, `lod.changed`

**Component Boundaries:**

**Frontend Component Communication:**
- **Zustand Stores**: Features communicate via feature-specific stores
  - `canvasStore` ↔ `filterStore` (LOD changes affect canvas rendering)
  - `viewpointStore` ↔ `canvasStore` (Loading viewpoint updates camera)
  - `collaborationStore` ↔ all stores (Multi-user state sync)

- **Event-Driven**: React context for global events
  - Error notifications
  - Toast messages
  - Loading states

- **Props**: Parent-child component communication
  - Direct props for simple data passing
  - Callback props for event handling

**Service Boundaries** (`packages/api/src/services/`):

**Service Layer Responsibilities:**
- **Business Logic**: No HTTP concerns, pure business operations
- **Data Transformation**: Convert between API DTOs and domain models
- **Orchestration**: Coordinate multiple repositories/external services
- **Caching**: Decide what to cache and invalidation logic

**Repository Layer Responsibilities** (`packages/api/src/repositories/`):
- **Data Access**: Direct Neo4j/Redis operations
- **Query Building**: Cypher query construction
- **Connection Management**: Handle database connections
- **No Business Logic**: Pure data operations

**Data Boundaries:**

**Neo4j Schema:**
- **Nodes**: `:Repository`, `:File`, `:Class`, `:Function`, `:Method`
- **Relationships**: `:CONTAINS`, `:DEPENDS_ON`, `:CALLS`, `:IMPORTS`, `:EXTENDS`
- **Properties**: camelCase (`fileName`, `createdAt`, `lineCount`)
- **Access Pattern**: Repository layer only, services never query directly

**Redis Cache:**
- **Keys**: Colon-separated (`query:{hash}`, `layout:{repoId}:{commitHash}`)
- **TTL**: 5 minutes for queries, invalidate on graph changes for layouts
- **Access Pattern**: CacheService wraps all Redis operations

**Database Migrations:**
- **Location**: `/migrations/*.cypher`
- **Execution**: Run via `migration-runner.ts` on startup or deployment
- **Tracking**: `:Migration` nodes in Neo4j track applied migrations

### Requirements to Structure Mapping

**Feature/Epic Mapping:**

**Code Parsing & Analysis (FR1-FR9)**:
- **Parser Engine**: `packages/parser/src/parsers/`
- **Dependency Analysis**: `packages/parser/src/analyzers/dependencyAnalyzer.ts`
- **Metrics Calculation**: `packages/parser/src/analyzers/metricCalculator.ts`
- **Graph Storage**: `packages/api/src/repositories/neo4jRepository.ts`
- **API Endpoints**: `packages/api/src/routes/repositories.ts`

**3D Visualization & Rendering (FR10-FR18)**:
- **3D Canvas**: `packages/ui/src/features/canvas/`
- **Layout Algorithms**: `packages/core/src/layout/`
- **LOD System**: Integrated across canvas, filters, and core IVM builder
- **IVM**: `packages/core/src/ivm/`

**Navigation & Discovery (FR19-FR28)**:
- **Search Interface**: `packages/ui/src/features/search/`
- **Mini-map**: `packages/ui/src/features/minimap/`
- **Coordinate Navigation**: `packages/ui/src/features/search/CoordinateNavigator.tsx`
- **Breadcrumbs/HUD**: `packages/ui/src/features/canvas/` (integrated with canvas)

**Workspace & Configuration (FR29-FR34)**:
- **Workspace Management**: `packages/ui/src/features/workspace/`
- **Configuration Storage**: `packages/api/src/services/workspaceService.ts`
- **Session Persistence**: Redis cache (`workspace:{userId}:{workspaceId}`)

**Collaboration & Sharing (FR35-FR43)**:
- **Viewpoint System**: `packages/ui/src/features/viewpoints/`
- **Multi-user Sessions**: `packages/ui/src/features/collaboration/`
- **WebSocket Server**: `packages/api/src/websocket/`
- **Position Sync**: `packages/api/src/websocket/handlers/positionHandler.ts`

**Export & Documentation (FR44-FR53)**:
- **Export UI**: `packages/ui/src/features/export/`
- **Export Generators**: `packages/core/src/exporters/`
- **Export API**: `packages/api/src/routes/exports.ts`
- **Export Service**: `packages/api/src/services/exportService.ts`

**CLI & Automation (FR54-FR60)**:
- **CLI Tool**: `packages/cli/src/`
- **Commands**: `packages/cli/src/commands/`
- **Shared with API**: Uses `packages/parser/` and `packages/core/` libraries

**Repository Integration (FR61-FR66)**:
- **Git Operations**: `packages/parser/src/` (cloning, checkout)
- **Authentication**: `packages/api/src/middleware/auth.ts`
- **Branch Parsing**: `packages/parser/src/index.ts`

**REST API & Programmatic Access (FR67-FR72)**:
- **API Routes**: `packages/api/src/routes/`
- **API Documentation**: Generated from code + manual docs in `/docs/api/`

**Cross-Cutting Concerns:**

**Authentication & Security**:
- **JWT Middleware**: `packages/api/src/middleware/auth.ts`
- **Token Validation**: Shared across REST API and WebSocket
- **API Client**: `packages/ui/src/shared/lib/apiClient.ts` (adds JWT to headers)

**Error Handling**:
- **API Error Handler**: `packages/api/src/middleware/errorHandler.ts` (RFC 7807)
- **Global Error Boundary**: `packages/ui/src/shared/components/ErrorBoundary.tsx`
- **Feature Boundaries**: Each feature folder has error boundary wrapper

**Logging**:
- **Backend**: Structured JSON logs (production), console (development)
- **Frontend**: Console errors (development), error boundary capture (production)

**Testing**:
- **Unit Tests**: Co-located with source (`.test.ts` suffix)
- **Integration Tests**: `packages/api/src/test/integration/`
- **E2E Tests**: Root `/tests/e2e/` (Playwright or Cypress)

### Integration Points

**Internal Communication:**

**UI → API (REST)**:
```typescript
// packages/ui/src/shared/lib/apiClient.ts
const apiClient = axios.create({
  baseURL: '/api',
  headers: { 'Authorization': `Bearer ${getToken()}` }
})
```

**UI → WebSocket Server**:
```typescript
// packages/ui/src/shared/hooks/useWebSocket.ts
const socket = io('wss://api.diagram-builder.io', {
  auth: { token: getToken() }
})
```

**API → Parser**:
```typescript
// packages/api imports packages/parser
import { parseRepository } from '@diagram-builder/parser'
```

**API → Core**:
```typescript
// packages/api imports packages/core
import { buildIVM, exportToPlantUML } from '@diagram-builder/core'
```

**CLI → Parser + Core**:
```typescript
// packages/cli imports packages/parser and packages/core
import { parseRepository } from '@diagram-builder/parser'
import { exportToMermaid } from '@diagram-builder/core'
```

**External Integrations:**

**Git Platforms**:
- **GitHub/GitLab/Bitbucket**: OAuth authentication, repository cloning
- **Integration Point**: `packages/parser/src/` (handles git operations)

**Neo4j Database**:
- **Connection**: `packages/api/src/config/database.ts`
- **Queries**: `packages/api/src/repositories/neo4jRepository.ts`

**Redis Cache**:
- **Connection**: `packages/api/src/config/redis.ts`
- **Operations**: `packages/api/src/services/cacheService.ts`

**Data Flow:**

**Parsing Flow**:
```
User Request → API → Parser → IR (JSON) → Neo4j Storage
                                        ↓
                                    Cache invalidation (Redis)
```

**Visualization Flow**:
```
User opens workspace → API queries Neo4j → IVM Builder → Frontend renders (Three.js)
                                              ↓
                                         Redis cache (5min TTL)
```

**Export Flow**:
```
User requests export → API queries Neo4j → IVM Builder → Export Generator → Download
```

**Collaboration Flow**:
```
User position change → WebSocket emit → Server broadcast → Other clients update
                                              ↓
                                         Redis pub/sub (multi-server)
```

### File Organization Patterns

**Configuration Files:**

**Root Level**:
- `package.json`: Workspace configuration, scripts, dev dependencies
- `tsconfig.json`: Base TypeScript configuration (extended by packages)
- `.nvmrc`: Node version specification
- `.gitignore`: Git ignore rules

**Package Level** (`packages/*/`):
- `package.json`: Package-specific dependencies and scripts
- `tsconfig.json`: Extends root config, package-specific compiler options
- `.env.example`: Environment variable template
- Config files: `vite.config.ts`, `tailwind.config.js`, etc.

**Infrastructure Level** (`infrastructure/`):
- `docker-compose.yml`: Local development services
- Kubernetes manifests: Service definitions, deployments
- Helm charts: Production deployment configurations

**Source Organization:**

**TypeScript Modules**: Each package follows consistent structure
- `src/index.ts`: Public API (what other packages import)
- Feature folders: Group related functionality
- `types/`: TypeScript type definitions
- `test/`: Tests co-located or in test folder

**Shared Code**: `packages/core/`
- Shared types, utilities, IVM, exporters, layout algorithms
- Consumed by UI, API, and CLI packages

**Test Organization:**

**Unit Tests**: Co-located with source files
```
packages/ui/src/features/canvas/Canvas3D.test.tsx
packages/api/src/services/repositoryService.test.ts
```

**Integration Tests**: Separate test folders
```
packages/api/src/test/integration/api.test.ts
packages/api/src/test/integration/websocket.test.ts
```

**E2E Tests**: Root level
```
tests/e2e/parsing.spec.ts
tests/e2e/visualization.spec.ts
```

**Test Utilities**:
```
packages/ui/src/shared/lib/testUtils.ts
packages/api/src/test/setup.ts
```

**Asset Organization:**

**Static Assets** (`packages/ui/public/`):
- `assets/icons/`: UI icons
- `assets/images/`: Static images
- `favicon.ico`: Site favicon

**Build Output**:
- `packages/ui/dist/`: Vite production build
- `packages/api/dist/`: Compiled TypeScript
- `packages/parser/dist/`: Compiled TypeScript
- `packages/cli/dist/`: Compiled TypeScript + executable

**Docker Images**:
- Built from `infrastructure/docker/Dockerfile.*`
- Pushed to container registry
- Tagged with commit SHA and version

### Development Workflow Integration

**Development Server Structure:**

**Start All Services** (`npm run dev` at root):
```bash
# Starts in parallel:
- Neo4j (Docker Compose)
- Redis (Docker Compose)
- API server (port 3000)
- WebSocket server (port 3001)
- UI dev server (port 5173)
```

**Hot Reload**:
- **UI**: Vite HMR (instant React updates)
- **API**: nodemon watches TypeScript files, restarts on changes
- **Parser/Core**: Changes trigger rebuild, API/CLI pick up new versions

**Build Process Structure:**

**Build Command** (`npm run build`):
```bash
1. Build packages/core (others depend on it)
2. Build packages/parser (API and CLI depend on it)
3. Build packages/api, packages/ui, packages/cli in parallel
4. Run migration-runner (ensure DB schema up to date)
```

**Build Artifacts**:
- TypeScript compiled to JavaScript in `/dist` folders
- Source maps generated for debugging
- Type declarations (`.d.ts`) for TypeScript consumers

**Deployment Structure:**

**Docker Build** (GitHub Actions):
```bash
1. Build all packages (npm run build)
2. Build Docker images for ui, api, parser, cli
3. Push images to registry with commit SHA tag
4. Update Helm chart image tags
```

**Kubernetes Deployment** (Helm):
```bash
1. Create namespace if not exists
2. Apply secrets and configmaps
3. Deploy Neo4j StatefulSet (if not exists)
4. Deploy Redis
5. Run migration job (pre-install hook)
6. Deploy API + WebSocket server
7. Deploy UI
8. Update Ingress for routing
```

**Environment-Specific Deployments**:
- **Staging**: Auto-deploy on push to `main`
- **Production**: Manual approval, tagged releases

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:**
All architectural decisions work together without conflicts:
- **Frontend Stack**: Vite 7.3 + React 19 + TypeScript + Tailwind CSS is a proven combination with excellent developer experience
- **3D Rendering**: react-three-fiber v9.4.2 + @react-three/drei v10.7.7 compatible with React 19, Three.js has mature WebGL support across browsers
- **State Management**: Zustand v5.0.2 integrates seamlessly with React 19 and react-three-fiber
- **Routing**: React Router v7.1.1 latest stable version, supports code splitting and lazy loading
- **Backend Stack**: Node.js 20/22 + TypeScript + Express + Neo4j + Redis is industry-proven at scale
- **Authentication**: JWT works across REST API, WebSocket (handshake), and CLI (token flag)
- **Deployment**: Docker + Kubernetes + Helm standard production stack with horizontal scaling

**Technology Version Compatibility:**
| Tech A | Tech B | Status | Notes |
|--------|--------|--------|-------|
| React 19 | Zustand v5.0.2 | ✅ Compatible | Zustand React 18+ compatible |
| React 19 | React Router v7.1.1 | ✅ Compatible | Latest stable version |
| React 19 | react-three-fiber v9.4.2 | ✅ Compatible | R3F supports React 18+ |
| Node.js 20/22 | Neo4j latest | ✅ Compatible | Neo4j driver supports Node 18+ |
| Node.js 20/22 | Redis v7.4.x | ✅ Compatible | ioredis supports all Node LTS |
| TypeScript | All libraries | ✅ Compatible | All chosen libraries have TS support |

**Pattern Consistency:**
- Implementation patterns align with technology stack decisions
- Feature-based structure fits Zustand's slice pattern
- Neo4j naming (PascalCase nodes, camelCase properties) follows Neo4j community conventions
- API naming (plural resources, camelCase params) follows REST best practices
- WebSocket event naming (dot notation) is industry standard
- RFC 7807 error format enables community tool compatibility

**Structure Alignment:**
- Monorepo with npm workspaces enables code sharing between CLI and web UI
- 5-package structure (ui, api, parser, cli, core) maps directly to architectural subsystems
- Boundaries properly isolate concerns (API endpoints, Component communication, Service layer, Data access)
- Integration points clearly defined (REST, WebSocket, internal package imports)

### Requirements Coverage Validation ✅

**Functional Requirements Coverage (72 FRs):**

**Code Parsing & Analysis (FR1-FR9): ✅ Fully Covered**
- FR1-FR2 (Multi-language parsing): `packages/parser/src/parsers/` with Tree-sitter
- FR3 (Dependency extraction): `packages/parser/src/analyzers/dependencyAnalyzer.ts`
- FR4 (Metric calculation): `packages/parser/src/analyzers/metricCalculator.ts`
- FR5-FR6 (Graph storage): Neo4j with custom Cypher migrations
- FR7-FR9 (Repository integration): Parser handles git clone/checkout operations

**3D Visualization & Rendering (FR10-FR18): ✅ Fully Covered**
- FR10-FR11 (Interactive 3D): `packages/ui/src/features/canvas/` with react-three-fiber
- FR12-FR13 (Force-directed layout): `packages/core/src/layout/forceDirected.ts`
- FR14-FR15 (LOD system): Comprehensive design (graph query depth = LOD level)
- FR16 (Visualization profiles): `filterStore.ts` + pre-configured profile templates
- FR17-FR18 (Dependency rendering, patterns): Three.js EdgeRenderer, NodeRenderer

**Navigation & Discovery (FR19-FR28): ✅ Fully Covered**
- FR19-FR20 (3D camera controls): `useCamera.ts` custom hook
- FR21-FR22 (Codebase search): `packages/ui/src/features/search/`
- FR23-FR24 (Coordinate navigation): `CoordinateNavigator.tsx` (service:class:method:line format)
- FR25-FR26 (Breadcrumbs/HUD): Integrated with canvas feature
- FR27-FR28 (Dual mini-map, path tracing): `packages/ui/src/features/minimap/`

**Workspace & Configuration Management (FR29-FR34): ✅ Fully Covered**
- FR29-FR30 (Multi-codebase workspaces): `workspaceStore.ts` + API workspace service
- FR31 (Parsing settings): Workspace configuration in API
- FR32 (Session persistence): Redis cache with `workspace:{userId}:{workspaceId}` keys
- FR33-FR34 (Custom LOD profiles, team templates): `filterStore.ts` + workspace service

**Collaboration & Sharing (FR35-FR43): ✅ Fully Covered**
- FR35-FR37 (Viewpoint system, URL sharing): `packages/ui/src/features/viewpoints/` + React Router routes
- FR38-FR39 (Multi-user sessions): `packages/api/src/websocket/` + `collaboration` feature
- FR40-FR41 (Spatial avatars, real-time sync): `collaborationStore.ts`, WebSocket with MessagePack, 50ms batching targets <100ms latency
- FR42-FR43 (Coordinate-based communication): WebSocket position events

**Export & Documentation Generation (FR44-FR53): ✅ Fully Covered**
- FR44-FR48 (Multi-format exports): `packages/core/src/exporters/` (plantuml.ts, mermaid.ts, gltf.ts, drawio.ts, png.ts, svg.ts)
- FR49 (LOD-level selection): Export service integrates with unified LOD state
- FR50-FR51 (C4-style diagrams, consistent styling): IVM provides unified visualization model
- FR52-FR53 (Multi-view sheets, metadata inclusion): Export generators support

**CLI & Automation (FR54-FR60): ✅ Fully Covered**
- FR54-FR56 (Headless parsing, format/LOD config): `packages/cli/src/commands/parse.ts`, `export.ts`
- FR57-FR59 (CI/CD integration, <3min execution): GitHub Actions templates, performance architecture targets <2min for 5000 files
- FR60 (Automation): CLI shares core + parser packages for consistent behavior

**Repository Integration (FR61-FR66): ✅ Fully Covered**
- FR61-FR62 (Private auth, OAuth/SSH): JWT + OAuth integration in parser
- FR63-FR64 (Branch-specific parsing, auto-update): Parser handles git checkout, watch capability
- FR65-FR66 (Monorepo support, cross-repository mapping): Multi-repository workspace + graph partitioning with federation layer

**REST API & Programmatic Access (FR67-FR72): ✅ Fully Covered**
- FR67-FR72 (Full API coverage): `packages/api/src/routes/` (repositories, viewpoints, workspaces, exports, auth)
- API Documentation: Generated from code + manual docs in `/docs/api/`

**Non-Functional Requirements Coverage (76 NFRs):**

**Performance (NFR-P1 to NFR-P20): ✅ Architecturally Supported**
- Parsing performance: Worker threads, incremental parsing, two-pass architecture
- Visualization performance: Instanced rendering (O(1) draw calls), frustum culling (viewport-only), spatial partitioning (octree), LOD-based geometry
- Collaboration performance: WebSocket with 50ms batching, MessagePack binary protocol (30-50% smaller than JSON), optimistic updates
- Export performance: Cached IVM models, parallel export generation, template-based generators
- Query performance: Neo4j indexes (id, type, repository, language), Redis caching (5min TTL), connection pooling, depth-limited queries

**Security (NFR-S1 to NFR-S15): ✅ Architecturally Supported**
- Authentication: JWT for all endpoints (REST, WebSocket, CLI)
- Credentials: Environment variables, never committed to git
- Transport: HTTPS/TLS (REST), WSS (WebSocket) in production
- Container security: Least-privilege Docker images, Kubernetes security contexts
- Vulnerability scanning: Integration into CI/CD pipeline

**Integration (NFR-I1 to NFR-I24): ✅ Architecturally Supported**
- GitHub/GitLab/Bitbucket: OAuth authentication + git operations in parser
- CI/CD templates: `.github/workflows/` with GitHub Actions, GitLab CI support planned
- Export format validity: Standards-compliant generators (PlantUML, Mermaid, GLTF, Draw.io specs)
- RESTful API: RFC 7807 Problem Details for errors, proper HTTP methods, resource naming
- Browser compatibility: WebGL support, Chrome/Firefox/Safari/Edge latest 2 versions

**Scalability (NFR-SC1 to NFR-SC17): ✅ Architecturally Supported**
- Codebase scale: Neo4j clustering (3 replicas), progressive loading (viewport-first), lazy loading (N hops from camera)
- User scale: Horizontal scaling (Kubernetes autoscaling 2-20 replicas), stateless API servers, Redis shared cache
- Infrastructure: CDN distribution for UI, Neo4j read replicas, parser worker autoscaling
- Multi-repository: Graph partitioning by repository + federation layer for cross-repo edges, hierarchical indexing (metadata → files → full graph)

### Implementation Readiness Validation ✅

**Decision Completeness:**
- ✅ All 8 critical architectural decisions documented with rationale and versions
- ✅ Technology versions verified and specified: Zustand v5.0.2, React Router v7.1.1, Redis v7.4.x, react-three-fiber v9.4.2, @react-three/drei v10.7.7
- ✅ Trade-offs explicitly documented for each decision (accept X for Y benefits)
- ✅ Cascading implications identified (e.g., JWT → Redis for session caching)
- ✅ Implementation sequence provided (4 phases from foundation to integration)

**Structure Completeness:**
- ✅ Complete monorepo structure with 5 packages (ui, api, parser, cli, core)
- ✅ All directories and key files specified (2050-line architecture document)
- ✅ Integration points clearly mapped (REST API endpoints, WebSocket events, internal package imports)
- ✅ Requirements-to-structure mapping complete (all 72 FRs mapped to specific files/directories)
- ✅ Development, build, and deployment workflows documented

**Pattern Completeness:**
- ✅ 20+ potential conflict points identified and standardized
- ✅ Naming conventions comprehensive:
  - Neo4j: PascalCase nodes, camelCase properties, UPPER_SNAKE_CASE relationships
  - API: Plural resources, camelCase query params, colon-prefixed route params
  - Code: PascalCase components, camelCase hooks/stores/utilities
- ✅ Communication patterns fully specified:
  - WebSocket: Dot notation events (`position.update`, `viewpoint.created`)
  - Zustand: Verb-first actions (`setCamera`, `updateSelection`, `resetCamera`)
  - Redis: Colon-separated cache keys (`query:{hash}`, `layout:{repoId}:{commitHash}`)
- ✅ Process patterns complete:
  - Error handling: Multi-level error boundaries, centralized API interceptor, RFC 7807 format
  - TypeScript: Interface for objects, type for unions/primitives, no prefixes
- ✅ Examples and anti-patterns provided for all major categories

**AI Agent Guidelines:**
- ✅ Clear enforcement rules: "All AI Agents MUST follow naming conventions exactly"
- ✅ Pattern verification mechanisms: ESLint, TypeScript checking, code review, integration tests
- ✅ Pattern update process: Requires documentation update, migration path for breaking changes

### Gap Analysis Results

**Critical Gaps (Block Implementation): NONE**

All architectural decisions necessary to begin implementation are complete and documented.

**Important Gaps (Post-MVP Enhancements):**

1. **Rate Limiting Strategy**: Mentioned as deferred to post-MVP with `express-rate-limit` as option. Implementation pattern could be specified for consistency.
   - **Impact**: Non-blocking, can use defaults initially
   - **Recommendation**: Document simple pattern in post-MVP phase

2. **Structured Logging**: Console-based initially, structured logging tools added later.
   - **Impact**: Non-blocking, console sufficient for MVP
   - **Recommendation**: Add logging library choice (Winston, Pino) in post-MVP

3. **Advanced Authorization (RBAC)**: Simple role checking initially, complex permissions post-MVP.
   - **Impact**: Non-blocking for MVP (simple user roles sufficient)
   - **Recommendation**: Document basic role pattern, defer fine-grained permissions

4. **WebSocket Reconnection Pattern**: Connection resilience mentioned but detailed reconnection strategy not specified.
   - **Impact**: Low, client libraries handle basic reconnection
   - **Recommendation**: Document exponential backoff pattern for consistency

5. **Migration Rollback Strategy**: Migration runner has "fail fast" but rollback approach not detailed.
   - **Impact**: Low, forward-only migrations acceptable for MVP
   - **Recommendation**: Document rollback approach before production deployment

**Nice-to-Have Gaps (Future Optimizations):**

1. **Native Development Setup**: Docker-only approach, native setup mentioned but not detailed
2. **Performance Benchmarking Tools**: Integration tests check performance, but tooling not specified
3. **API Versioning Strategy**: Mentioned but specific approach (/v1/, /v2/ or headers) not documented
4. **API Client Generation**: Could document OpenAPI spec + codegen for type-safe clients
5. **Database Backup Strategy**: Not mentioned in architecture document

**Gap Assessment**: All identified gaps are enhancements, not blockers. The architecture provides sufficient detail for AI agents to begin consistent implementation immediately.

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] Project context thoroughly analyzed (72 FRs, 76 NFRs documented)
- [x] Scale and complexity assessed (HIGH complexity, 8-10 major subsystems)
- [x] Technical constraints identified (Tree-sitter, Neo4j, Three.js, Docker/K8s)
- [x] Cross-cutting concerns mapped (Performance, Security, Scalability, LOD, Real-time sync, Integration, DX)

**✅ Architectural Decisions**
- [x] Critical decisions documented with versions (8 decisions: Zustand, JWT, Neo4j migrations, React Router, Redis, RFC 7807, feature-based structure, GitHub Actions)
- [x] Technology stack fully specified (Frontend: Vite+React+TS+Tailwind, Backend: Node.js+Express+Neo4j+Redis, 3D: Three.js+R3F)
- [x] Integration patterns defined (REST API, WebSocket, MessagePack, IVM)
- [x] Performance considerations addressed (Multi-layer optimization: rendering, query, layout, network)

**✅ Implementation Patterns**
- [x] Naming conventions established (Neo4j, API, code files, tests)
- [x] Structure patterns defined (Monorepo, feature-based organization, co-located tests)
- [x] Communication patterns specified (WebSocket events, Zustand actions, Redis keys)
- [x] Process patterns documented (Error boundaries, TypeScript conventions, cache patterns)

**✅ Project Structure**
- [x] Complete directory structure defined (Monorepo with 5 packages: ui, api, parser, cli, core)
- [x] Component boundaries established (API, Component, Service, Data boundaries)
- [x] Integration points mapped (REST endpoints, WebSocket events, package imports)
- [x] Requirements to structure mapping complete (All 72 FRs mapped to specific files/directories)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION ✅**

**Confidence Level: HIGH**

Based on validation results:
- All technology decisions are compatible and proven at scale
- All 72 functional requirements have architectural support
- All 76 non-functional requirements are addressed
- 20+ AI agent conflict points identified and standardized
- Complete 2050-line monorepo structure defined
- Comprehensive implementation patterns documented
- No critical gaps identified

**Key Strengths:**

1. **Comprehensive Coverage**: Every functional and non-functional requirement mapped to specific architectural components
2. **Technology Maturity**: All chosen technologies are production-proven with strong community support
3. **AI Agent Consistency**: 20+ potential conflict points pre-identified with standardized patterns
4. **Clear Boundaries**: Well-defined boundaries between API, components, services, and data layers
5. **Scalability**: Horizontal scaling built into architecture (Kubernetes, stateless APIs, Neo4j clustering)
6. **Performance**: Multi-layer optimization strategy (rendering, query, layout, network)
7. **Developer Experience**: Feature-based structure, co-located tests, hot reload, clear patterns
8. **Deployment**: Production-grade Docker + Kubernetes + Helm with CI/CD automation

**Areas for Future Enhancement (Post-MVP):**

1. **Observability**: Add structured logging (Winston/Pino), metrics (Prometheus), tracing (OpenTelemetry)
2. **Advanced Security**: Implement rate limiting per endpoint, RBAC for fine-grained permissions
3. **Performance Optimization**: Add performance budgets, real user monitoring (RUM), CDN edge caching
4. **Resilience**: Document circuit breaker patterns, retry strategies, graceful degradation
5. **Developer Tooling**: Add OpenAPI spec generation, API client codegen, dev environment alternatives

### Implementation Handoff

**AI Agent Guidelines:**

- **Follow all architectural decisions exactly as documented** - Technology versions, patterns, and structure are finalized
- **Use implementation patterns consistently across all components** - Check naming conventions before writing any code
- **Respect project structure and boundaries** - Components communicate via defined integration points only
- **Refer to this document for all architectural questions** - This is the single source of truth for the project

**First Implementation Steps:**

1. **Initialize Monorepo** (Story 1.1):
   ```bash
   # Create root package.json with workspaces
   npm init -y
   # Edit package.json to add workspaces: ["packages/*"]

   # Initialize each package
   cd packages/ui && npm create vite@latest . -- --template react-ts
   cd packages/api && npm init -y
   cd packages/parser && npm init -y
   cd packages/cli && npm init -y
   cd packages/core && npm init -y
   ```

2. **Set Up Development Environment** (Story 1.2):
   ```bash
   # Create docker-compose.yml with Neo4j and Redis services
   # Create infrastructure/docker/docker-compose.yml
   # Run: docker-compose up -d
   ```

3. **Initialize Neo4j Schema** (Story 1.3):
   ```bash
   # Create migrations/001-init-schema.cypher
   # Create migrations/migration-runner.ts
   # Run: npm run migrate
   ```

4. **Configure GitHub Actions** (Story 1.4):
   ```bash
   # Create .github/workflows/ui-build.yml
   # Create .github/workflows/backend-build.yml
   ```

**Implementation Priority:**
- **Week 1-2**: Foundation (monorepo setup, Docker Compose, migrations, CI)
- **Week 3-4**: Backend Core (JWT auth, RFC 7807 errors, Neo4j/Redis connections, basic API endpoints)
- **Week 5-6**: Frontend Foundation (Zustand stores, React Router, feature structure, basic 3D canvas)
- **Week 7-8**: Integration (WebSocket server, API client, CI/CD pipelines, E2E tests)

**Development Resources:**
- **Architecture Document**: This document (2500+ lines)
- **PRD**: `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/prd.md`
- **Documentation**: `/docs/` (will be created during implementation)
- **GitHub Actions**: `.github/workflows/` (CI/CD templates)

## Architecture Completion Summary

### Workflow Completion

**Architecture Decision Workflow:** COMPLETED ✅
**Total Steps Completed:** 8
**Date Completed:** 2025-12-29
**Document Location:** /Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/architecture.md

### Final Architecture Deliverables

**📋 Complete Architecture Document**

- All architectural decisions documented with specific versions
- Implementation patterns ensuring AI agent consistency
- Complete project structure with all files and directories
- Requirements to architecture mapping
- Validation confirming coherence and completeness

**🏗️ Implementation Ready Foundation**

- 8 architectural decisions made (Zustand v5.0.2, React Router v7.1.1, JWT, Neo4j migrations, Redis v7.4.x, RFC 7807, feature-based structure, GitHub Actions)
- 20+ implementation patterns defined (naming, structure, format, communication)
- 10 architectural components specified (Parser, Graph DB, 3D Rendering, Navigation, Collaboration, Export, CLI, REST API, WebSocket, Web UI)
- 148 requirements fully supported (72 FRs + 76 NFRs)

**📚 AI Agent Implementation Guide**

- Technology stack with verified versions
- Consistency rules that prevent implementation conflicts
- Project structure with clear boundaries
- Integration patterns and communication standards

### Implementation Handoff

**For AI Agents:**
This architecture document is your complete guide for implementing diagram_builder. Follow all decisions, patterns, and structures exactly as documented.

**First Implementation Priority:**

1. **Initialize Monorepo** using Vite + React + TypeScript template:
   ```bash
   # Create root package.json with workspaces: ["packages/*"]
   npm init -y

   # Initialize packages/ui
   cd packages/ui && npm create vite@latest . -- --template react-ts

   # Install dependencies
   npm install
   npm install -D tailwindcss postcss autoprefixer
   npm install three @react-three/fiber @react-three/drei
   npm install -D @types/three
   npm install -D vitest @testing-library/react @testing-library/jest-dom
   ```

**Development Sequence:**

1. Initialize project using documented starter template (Vite + React + TypeScript + Tailwind)
2. Set up development environment (Docker Compose with Neo4j + Redis)
3. Implement core architectural foundations (JWT auth, Neo4j migrations, Redis caching)
4. Build features following established patterns (feature-based structure, Zustand stores)
5. Maintain consistency with documented rules (naming conventions, error handling, TypeScript patterns)

### Quality Assurance Checklist

**✅ Architecture Coherence**

- [x] All decisions work together without conflicts
- [x] Technology choices are compatible (React 19 + Zustand v5.0.2 + React Router v7.1.1 + Neo4j + Redis)
- [x] Patterns support the architectural decisions (feature-based + Zustand slices)
- [x] Structure aligns with all choices (monorepo with npm workspaces)

**✅ Requirements Coverage**

- [x] All functional requirements are supported (72 FRs mapped to specific components)
- [x] All non-functional requirements are addressed (76 NFRs architecturally supported)
- [x] Cross-cutting concerns are handled (Performance, Security, Scalability, LOD, Real-time sync)
- [x] Integration points are defined (REST API, WebSocket, internal package imports)

**✅ Implementation Readiness**

- [x] Decisions are specific and actionable (all versions verified)
- [x] Patterns prevent agent conflicts (20+ conflict points standardized)
- [x] Structure is complete and unambiguous (complete monorepo with 5 packages)
- [x] Examples are provided for clarity (good examples + anti-patterns documented)

### Project Success Factors

**🎯 Clear Decision Framework**
Every technology choice was made collaboratively with clear rationale, ensuring all stakeholders understand the architectural direction.

**🔧 Consistency Guarantee**
Implementation patterns and rules ensure that multiple AI agents will produce compatible, consistent code that works together seamlessly.

**📋 Complete Coverage**
All project requirements are architecturally supported, with clear mapping from business needs to technical implementation.

**🏗️ Solid Foundation**
The chosen starter template (Vite + React + TypeScript + Tailwind) and architectural patterns provide a production-ready foundation following current best practices.

---

**Architecture Status:** READY FOR IMPLEMENTATION ✅

**Next Phase:** Begin implementation using the architectural decisions and patterns documented herein.

**Document Maintenance:** Update this architecture when major technical decisions are made during implementation.
