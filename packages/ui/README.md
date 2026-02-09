# UI Package (@diagram-builder/ui)

Web UI for the 3D Codebase Visualization Tool built with Vite, React 19, and Three.js.

## Technology Stack

- **Framework**: React 19 with TypeScript (strict mode)
- **Build Tool**: Vite 7.3
- **Styling**: Tailwind CSS 3.4
- **Routing**: React Router 7.1
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **State Management**: Zustand 5.0 (ONLY - NO Redux, NO Context API)
- **Testing**: Vitest + React Testing Library
- **Real-time**: Socket.io Client

## Folder Structure

This project uses **feature-based organization** (NOT type-based). Code is organized by feature/domain, not by technical type.

```
src/
├── features/              # Feature modules (domain-driven organization)
│   ├── canvas/           # 3D visualization canvas
│   │   ├── components/   # Canvas-specific components
│   │   ├── hooks/        # Canvas-specific hooks
│   │   ├── store.ts      # Canvas Zustand store
│   │   └── index.ts      # Public API
│   ├── minimap/          # 2D/3D minimap
│   ├── navigation/       # Search, breadcrumbs, HUD
│   ├── viewpoints/       # Camera positions and sharing
│   ├── workspace/        # Workspace management
│   ├── export/           # Export dialog and formats
│   └── collaboration/    # Real-time collaboration
├── shared/               # Shared code across features
│   ├── types/           # TypeScript types
│   │   ├── api.ts
│   │   ├── graph.ts
│   │   ├── workspace.ts
│   │   ├── collaboration.ts
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── api-client.ts
│   │   ├── format.ts
│   │   ├── validation.ts
│   │   └── index.ts
│   ├── hooks/           # Shared React hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useKeyPress.ts
│   │   └── index.ts
│   ├── components/      # Shared components
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts
│   └── index.ts
├── test/                # Test setup and utilities
│   └── setup.ts
├── App.tsx              # Root application component
├── main.tsx             # Application entry point
└── index.css            # Global styles + Tailwind directives

```

## Feature Organization Principles

### ✅ DO: Feature-Based Organization

Each feature is self-contained with all related code co-located:

```typescript
features/canvas/
  ├── Canvas3D.tsx           # Main component
  ├── NodeRenderer.tsx       # Sub-component
  ├── EdgeRenderer.tsx       # Sub-component
  ├── hooks/
  │   ├── useCamera.ts       # Feature-specific hook
  │   └── useSelection.ts
  ├── store.ts               # Zustand store for canvas state
  ├── Canvas3D.test.tsx      # Tests co-located with source
  └── index.ts               # Public API exports
```

### ❌ DON'T: Type-Based Organization

```
❌ BAD - Type-based organization
src/
  ├── components/
  ├── hooks/
  ├── stores/
  └── utils/
```

## State Management

**CRITICAL**: Use Zustand ONLY for state management.

- ✅ **DO**: Use Zustand stores
- ❌ **DON'T**: Use Redux
- ❌ **DON'T**: Use React Context API for state

Example Zustand store:

```typescript
// features/canvas/store.ts
import { create } from 'zustand';

interface CanvasState {
  cameraPosition: Position3D;
  selectedNodeId: string | null;
  setCamera: (position: Position3D) => void;
  selectNode: (nodeId: string | null) => void;
}

export const useCanvasStore = create<CanvasState>((set) => ({
  cameraPosition: { x: 0, y: 0, z: 10 },
  selectedNodeId: null,
  setCamera: (position) => set({ cameraPosition: position }),
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
}));
```

## Testing

All tests are **co-located** with source files using `.test.ts` or `.test.tsx` suffix.

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run type checking
npm run type-check

# Run build
npm run build
```

### Test Example

```typescript
// features/canvas/Canvas3D.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Canvas3D } from './Canvas3D';

describe('Canvas3D', () => {
  it('renders the 3D canvas', () => {
    render(<Canvas3D />);
    expect(screen.getByRole('canvas')).toBeDefined();
  });
});
```

## Security

**JWT Token Storage**: Tokens MUST be stored in memory ONLY (NOT localStorage).

```typescript
// ✅ CORRECT - Store token in memory
let authToken: string | null = null;

export function setToken(token: string) {
  authToken = token;
}

export function getToken() {
  return authToken;
}

// ❌ WRONG - Never store tokens in localStorage
localStorage.setItem('token', token); // DON'T DO THIS
```

## Error Handling

Use multi-level error boundaries:

1. **Global Error Boundary**: Catches all application errors
2. **Feature Error Boundaries**: Isolate errors to specific features

```typescript
import { ErrorBoundary } from '@/shared/components';

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/canvas" element={
          <ErrorBoundary fallback={<CanvasError />}>
            <Canvas />
          </ErrorBoundary>
        } />
      </Routes>
    </ErrorBoundary>
  );
}
```

## Performance Targets

- **Rendering**: 60fps minimum with 1000+ nodes
- **WebSocket Sync**: <100ms latency
- **API Queries**: <1s response time (with caching)

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `C` | Toggle Orbit / Fly camera control mode |
| `X` | Toggle X-Ray mode (see inside buildings) |
| `U` | Toggle Underground mode (dependency tunnels) |
| `?` | Open keyboard shortcuts help modal |
| `Home` | Fly camera to root node |
| `Esc` | Close modals / panels, cancel flight, deselect node |
| `Ctrl+Shift+S` / `Cmd+Shift+S` | Copy shareable viewpoint link |
| `Ctrl+K` / `Cmd+K` | Open search |

**Navigation:** Double-click a building to enter Building view. Double-click a class inside a building to enter Cell view. Press `Esc` or use breadcrumbs to navigate back.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Architecture Compliance

Before implementing any feature, **READ**:
- `../../_bmad-output/planning-artifacts/architecture.md`
- `../../_bmad-output/project-context.md`

Follow all architectural decisions and critical rules defined in these documents.
