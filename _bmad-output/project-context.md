---
project_name: 'diagram_builder'
user_name: 'Brian'
date: '2025-12-29'
sections_completed: ['technology_stack', 'implementation_rules', 'naming_conventions', 'patterns', 'testing', 'anti_patterns']
existing_patterns_found: 20
source_documents: ['/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/architecture.md']
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

### Frontend Stack
- **Vite**: 7.3 (build tool, dev server)
- **React**: 19 (with concurrent features)
- **TypeScript**: Latest stable (strict mode enabled)
- **Tailwind CSS**: Latest (utility-first CSS)
- **react-three-fiber**: v9.4.2 (declarative Three.js)
- **@react-three/drei**: v10.7.7 (3D helpers)
- **Zustand**: v5.0.2 (state management)
- **React Router**: v7.1.1 (routing with code splitting)
- **Vitest**: Latest (testing framework)
- **Testing Library**: Latest (@testing-library/react)

### Backend Stack
- **Node.js**: 20.19+ or 22.12+ (LTS versions)
- **TypeScript**: Latest stable
- **Express**: Latest (REST API server)
- **Neo4j**: Latest (graph database)
- **Redis**: v7.4.x (caching, pub/sub)
- **ioredis**: Latest (Redis client)
- **jsonwebtoken**: Latest (JWT authentication)
- **Socket.io**: Latest (WebSocket server)
- **MessagePack**: @msgpack/msgpack (binary protocol)

### Development & Deployment
- **Docker**: Latest (local development)
- **Kubernetes**: Latest (production deployment)
- **Helm**: Latest (deployment charts)
- **GitHub Actions**: Latest (CI/CD)

### Project Structure
- **Monorepo**: npm workspaces with 5 packages: `ui`, `api`, `parser`, `cli`, `core`
- **Package Manager**: npm

---

## Critical Implementation Rules

### MUST Follow These Rules

1. **Always Read Architecture Document First**
   - Architecture document: `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/architecture.md`
   - ALL technology decisions, patterns, and structures are documented there
   - Check the document before making ANY architectural decisions

2. **Feature-Based Organization (Frontend)**
   ```
   src/
   ├── features/           # Organize by feature, NOT by type
   │   ├── canvas/         # Each feature is self-contained
   │   │   ├── Canvas3D.tsx
   │   │   ├── useCamera.ts
   │   │   ├── canvasStore.ts
   │   │   ├── types.ts
   │   │   └── Canvas3D.test.tsx
   ```
   - **DO NOT** organize by type (all components together, all hooks together)
   - **DO** co-locate everything related to a feature

3. **Zustand State Management Patterns**
   ```typescript
   // ✅ CORRECT: Feature-based stores with verb-first actions
   export const useCanvasStore = create<CanvasStore>((set) => ({
     camera: { position: [0, 0, 0], target: [0, 0, 0] },

     // Actions: verb-first naming
     setCamera: (camera) => set({ camera }),
     updateSelection: (selection) => set({ selection }),
     resetCamera: () => set({ camera: initialCamera }),
   }))
   ```
   - Action naming: `set{Property}`, `update{Property}`, `add{Item}`, `remove{Item}`, `reset{Property}`, `toggle{Property}`
   - **NEVER** use Redux, Context API, or other state management - ONLY Zustand

4. **Neo4j Naming Conventions (CRITICAL - Agents Often Get This Wrong)**
   ```cypher
   // ✅ CORRECT
   MATCH (r:Repository {id: $repoId})-[:CONTAINS]->(f:File)
   WHERE f.language = 'typescript'
   RETURN f.fileName, f.lineCount

   // ❌ WRONG - inconsistent casing
   MATCH (repository:repository)-[:contains]->(File:file)
   ```
   - **Node Labels**: PascalCase (`:Repository`, `:File`, `:Class`, `:Function`)
   - **Properties**: camelCase (`fileName`, `createdAt`, `lineCount`)
   - **Relationships**: UPPER_SNAKE_CASE (`:CONTAINS`, `:DEPENDS_ON`, `:CALLS`)

5. **Error Handling Requirements**
   - **Frontend**: Multi-level error boundaries (global + feature-level)
   - **Backend**: RFC 7807 Problem Details format for ALL errors
   ```json
   {
     "type": "https://diagram-builder.io/errors/parsing-failed",
     "title": "Repository Parsing Failed",
     "status": 422,
     "detail": "Tree-sitter syntax error at src/index.ts:42",
     "instance": "/api/parse/repo-abc123"
   }
   ```
   - **NEVER** return plain error messages or custom error formats

6. **JWT Authentication Everywhere**
   - REST API: `Authorization: Bearer <token>` header
   - WebSocket: Token in connection handshake
   - CLI: `--token` flag or environment variable
   - **NEVER** use session cookies or other auth methods

7. **TypeScript Strict Mode**
   - `strict: true` in tsconfig.json
   - **NEVER** use `any` - use `unknown` and type guards
   - **Interface** for object shapes, **type** for unions/primitives
   - **NO** prefixes: Use `User` not `IUser` or `UserType`

8. **Co-located Tests**
   ```
   features/canvas/
   ├── Canvas3D.tsx
   ├── Canvas3D.test.tsx    # ✅ Test next to component
   ├── useCamera.ts
   └── useCamera.test.ts     # ✅ Test next to hook
   ```
   - **NEVER** put tests in separate `/tests/` or `/__tests__/` directories
   - Use `.test.ts` or `.test.tsx` suffix

---

## Naming Conventions

### File Naming
- **Components**: PascalCase (`Canvas3D.tsx`, `MiniMap.tsx`)
- **Hooks**: camelCase (`useCamera.ts`, `useLOD.ts`)
- **Stores**: camelCase with Store suffix (`canvasStore.ts`, `viewpointStore.ts`)
- **Utilities**: camelCase (`apiClient.ts`, `formatUtils.ts`)
- **Types**: `types.ts` within features, shared in `/shared/types/`
- **Tests**: Same as source with `.test.ts` suffix

### API Naming
- **Resources**: Plural nouns (`/api/repositories`, `/api/viewpoints`)
- **Route params**: Colon prefix (`:id`, `:viewpointId`)
- **Query params**: camelCase (`?lodLevel=3`, `?includeMetadata=true`)

### WebSocket Events
- **Pattern**: Dot notation with category prefix
- **Examples**: `position.update`, `viewpoint.created`, `session.join`
- **NEVER** use snake_case, UPPER_CASE, or other formats

### Redis Cache Keys
- **Pattern**: Colon-separated hierarchy
- **Examples**: `query:{hash}`, `layout:{repoId}:{commitHash}`, `workspace:{userId}:{workspaceId}`
- **NEVER** use dots, slashes, or other separators

---

## Code Organization Patterns

### Monorepo Package Structure
```
diagram-builder/
├── packages/
│   ├── ui/          # Web UI (Vite + React)
│   ├── api/         # REST API + WebSocket server
│   ├── parser/      # Parser engine (Tree-sitter)
│   ├── cli/         # CLI tool
│   └── core/        # Shared library (IVM, exporters, layout)
```

### Import Patterns
```typescript
// ✅ CORRECT: Package imports in monorepo
import { parseRepository } from '@diagram-builder/parser'
import { buildIVM, exportToPlantUML } from '@diagram-builder/core'

// ✅ CORRECT: Relative imports within same package
import { useCanvasStore } from './canvasStore'
import { Canvas3D } from '../canvas/Canvas3D'
```

### Component Structure
```typescript
// ✅ CORRECT: Component with hooks and store
import { useCanvasStore } from './canvasStore'
import { useCamera } from './useCamera'

export function Canvas3D() {
  const { camera, setCamera } = useCanvasStore()
  const { controls } = useCamera(camera, setCamera)

  return <Canvas camera={camera} controls={controls} />
}
```

---

## Testing Requirements

### Test Co-location
- Tests MUST be next to source files with `.test.ts` suffix
- **NEVER** create separate test directories

### Test Structure (Vitest)
```typescript
// ✅ CORRECT: Vitest test structure
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Canvas3D } from './Canvas3D'

describe('Canvas3D', () => {
  it('should render 3D canvas', () => {
    render(<Canvas3D />)
    expect(screen.getByRole('canvas')).toBeInTheDocument()
  })
})
```

### Testing Priorities
1. **Unit tests**: All business logic, utilities, hooks
2. **Component tests**: All React components
3. **Integration tests**: API endpoints, database operations
4. **E2E tests**: Critical user flows

---

## Performance Requirements

### Frontend Performance
- **60fps minimum** for 3D rendering (use instanced rendering)
- **<16ms** input-to-render latency
- Use Web Workers for heavy computations
- Implement LOD system (Level of Detail based on graph query depth)

### Backend Performance
- **<1 second** query response time (use Redis caching, 5min TTL)
- **<2 seconds** per 100 files parsing
- **<100ms** WebSocket synchronization (use 50ms batching, MessagePack)
- Connection pooling for Neo4j

---

## Security Requirements

### Authentication
- JWT for ALL endpoints (REST, WebSocket, CLI)
- **NEVER** store JWT in localStorage (memory only in web UI)
- Token expiration: 24 hours (configurable)

### Transport
- HTTPS/TLS for REST API (production)
- WSS (Secure WebSocket) for real-time (production)
- **NEVER** use HTTP or WS in production

### Credentials
- Environment variables ONLY
- **NEVER** commit secrets to git
- Use `.env.example` with placeholder values

---

## Anti-Patterns (DO NOT DO THESE)

### ❌ DO NOT Use Other State Management
```typescript
// ❌ WRONG - DO NOT use Redux
import { createSlice } from '@reduxjs/toolkit'

// ❌ WRONG - DO NOT use Context API for state
const StateContext = createContext()

// ✅ CORRECT - ONLY use Zustand
import { create } from 'zustand'
```

### ❌ DO NOT Organize by Type
```
// ❌ WRONG
src/
├── components/    # All components together
├── hooks/         # All hooks together
├── stores/        # All stores together

// ✅ CORRECT
src/
├── features/
│   ├── canvas/    # Feature-based
│   │   ├── Canvas3D.tsx
│   │   ├── useCamera.ts
│   │   ├── canvasStore.ts
```

### ❌ DO NOT Use Separate Test Directories
```
// ❌ WRONG
src/components/Canvas3D.tsx
tests/components/Canvas3D.test.tsx

// ✅ CORRECT
src/features/canvas/Canvas3D.tsx
src/features/canvas/Canvas3D.test.tsx
```

### ❌ DO NOT Use Wrong Naming Conventions
```cypher
-- ❌ WRONG Neo4j naming
MATCH (repository:repository)-[:contains]->(File:file)

-- ✅ CORRECT Neo4j naming
MATCH (r:Repository)-[:CONTAINS]->(f:File)
```

### ❌ DO NOT Return Non-Standard Errors
```json
// ❌ WRONG
{ "error": "Something went wrong", "code": 500 }

// ✅ CORRECT (RFC 7807)
{
  "type": "https://diagram-builder.io/errors/parsing-failed",
  "title": "Repository Parsing Failed",
  "status": 422,
  "detail": "Tree-sitter syntax error at src/index.ts:42",
  "instance": "/api/parse/repo-abc123"
}
```

### ❌ DO NOT Skip Error Boundaries
```typescript
// ❌ WRONG - No error boundary
<Router>
  <Canvas3D />
</Router>

// ✅ CORRECT - Multi-level boundaries
<ErrorBoundary fallback={<GlobalErrorFallback />}>
  <Router>
    <ErrorBoundary fallback={<FeatureErrorFallback />}>
      <Canvas3D />
    </ErrorBoundary>
  </Router>
</ErrorBoundary>
```

---

## Development Workflow

### Branch Strategy
- Main branch: `main`
- Feature branches: `feature/{description}`
- Bug fixes: `fix/{description}`

### Commit Messages
- Follow conventional commits pattern
- End with: `🤖 Generated with [Claude Code](https://claude.com/claude-code)`
- Co-authored line: `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>`

### Code Quality
- ESLint + TypeScript checking before commit
- All tests must pass
- No `any` types allowed
- Strict mode enabled

---

## Critical Reminders for AI Agents

1. **Read architecture.md BEFORE implementing** - All decisions are documented there
2. **Use Zustand ONLY** - No Redux, no Context API for state
3. **Feature-based organization** - Co-locate components, hooks, stores, tests
4. **Neo4j naming is critical** - PascalCase nodes, camelCase properties, UPPER_SNAKE_CASE relationships
5. **RFC 7807 for ALL errors** - No custom error formats
6. **Co-locate tests** - `.test.ts` suffix next to source files
7. **Multi-level error boundaries** - Global + feature-level
8. **JWT everywhere** - REST, WebSocket, CLI all use JWT
9. **No time estimates** - AI development speed has fundamentally changed
10. **TypeScript strict mode** - No `any`, use `unknown` with type guards

---

**Last Updated:** 2025-12-29
**Source:** Architecture document at `/Users/brianmehrman/projects/diagram_builder/_bmad-output/planning-artifacts/architecture.md`
