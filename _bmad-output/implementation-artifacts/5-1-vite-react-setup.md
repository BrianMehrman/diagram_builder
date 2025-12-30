# Story 5-1: Vite + React Setup

## Story

**ID:** 5-1
**Key:** 5-1-vite-react-setup
**Title:** Initialize Vite project with React 19, TypeScript, Tailwind CSS, React Router, and Vitest testing
**Epic:** Epic 5 - UI Package (@diagram-builder/ui)
**Phase:** Phase 5 - UI Package

**Description:**

Set up the foundational frontend application for the @diagram-builder/ui package using Vite as the build tool and React 19 as the UI framework. This establishes the development environment, tooling, and infrastructure that all subsequent UI features (Canvas, MiniMap, Navigation, Viewpoints, etc.) will build upon.

The UI package provides the interactive 3D visualization experience in the browser, with routing for different views, styling with Tailwind CSS, and comprehensive component testing with Vitest and React Testing Library.

This story creates the frontend infrastructure that Stories 5.2-5.14 will extend with features.

---

## Acceptance Criteria

- **AC-1:** Vite project initialized with React 19
  - Vite 7.3 configured as build tool and dev server
  - React 19 installed with concurrent features enabled
  - TypeScript configured in strict mode
  - Development server starts with hot module replacement (HMR)
  - Production build creates optimized bundle in `dist/` directory

- **AC-2:** TypeScript strict mode configuration
  - tsconfig.json with strict: true enabled
  - Configured for React JSX transform (jsx: "react-jsx")
  - Target ES2022 for modern browser support
  - Path aliases configured for clean imports (e.g., @/components)
  - NO `any` types allowed in codebase

- **AC-3:** Tailwind CSS integrated and configured
  - Tailwind CSS latest version installed
  - PostCSS and Autoprefixer configured
  - Tailwind directives added to main CSS file
  - Tailwind config includes custom theme (if needed)
  - Utility classes work in development and production builds

- **AC-4:** React Router v7 configured with code splitting
  - React Router v7.1.1 installed
  - Route configuration with lazy loading for code splitting
  - Basic route structure: / (home), /workspace/:id (workspace view)
  - Route guards prepared for authentication (to be implemented later)
  - Browser history mode configured

- **AC-5:** Vitest and React Testing Library configured
  - Vitest latest version installed for unit/component tests
  - @testing-library/react installed for component testing
  - @testing-library/jest-dom for DOM matchers
  - Vitest config for React environment (jsdom or happy-dom)
  - Test scripts in package.json: `npm test`, `npm test:ui`, `npm test:coverage`
  - Co-located test files with `.test.tsx` suffix

- **AC-6:** Feature-based directory structure created
  - src/features/ directory for feature-based organization
  - src/shared/ directory for shared utilities and types
  - Example feature structure created (e.g., src/features/canvas/)
  - NO type-based organization (no /components/, /hooks/ at root)
  - Directory structure documented in README

- **AC-7:** Comprehensive test coverage
  - Sample component with co-located test file
  - Test for Vite HMR and React rendering
  - Test for Tailwind CSS classes applying correctly
  - Test for React Router navigation
  - All tests pass 100%

---

## Tasks/Subtasks

### Task 1: Initialize Vite project with React 19 and TypeScript
- [ ] Create `packages/ui/` directory in monorepo
- [ ] Run `npm create vite@latest` with React + TypeScript template
- [ ] Install React 19: `npm install react@19 react-dom@19`
- [ ] Install TypeScript and types: `npm install -D typescript @types/react @types/react-dom`
- [ ] Configure Vite config (`vite.config.ts`) with React plugin
- [ ] Configure tsconfig.json for React and strict mode
- [ ] Add npm scripts: `dev` (dev server), `build` (production build), `preview` (preview build)
- [ ] Verify dev server starts: `npm run dev`
- [ ] Verify production build works: `npm run build`

### Task 2: Configure TypeScript strict mode and path aliases
- [ ] Set `strict: true` in tsconfig.json
- [ ] Configure `jsx: "react-jsx"` for modern JSX transform
- [ ] Set target to ES2022 for modern features
- [ ] Configure path aliases in tsconfig.json (e.g., `@/*` → `./src/*`)
- [ ] Update Vite config to resolve path aliases
- [ ] Test TypeScript compilation: `tsc --noEmit`
- [ ] Ensure NO `any` types in any files

### Task 3: Install and configure Tailwind CSS
- [ ] Install Tailwind CSS: `npm install -D tailwindcss postcss autoprefixer`
- [ ] Initialize Tailwind config: `npx tailwindcss init -p`
- [ ] Configure `tailwind.config.js` with content paths: `./index.html`, `./src/**/*.{js,ts,jsx,tsx}`
- [ ] Create main CSS file (`src/index.css`) with Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- [ ] Import CSS in main entry point (`src/main.tsx`)
- [ ] Test Tailwind classes in sample component
- [ ] Verify Tailwind classes work in development and production builds

### Task 4: Set up React Router v7 with code splitting
- [ ] Install React Router: `npm install react-router@7.1.1 react-router-dom@7.1.1`
- [ ] Create `src/routes/` directory for route configuration
- [ ] Configure route structure with lazy loading:
  ```typescript
  const routes = [
    { path: '/', element: <HomePage />, lazy: () => import('./features/home/HomePage') },
    { path: '/workspace/:id', lazy: () => import('./features/workspace/WorkspacePage') }
  ]
  ```
- [ ] Set up RouterProvider in main.tsx with browser history
- [ ] Create placeholder route components (HomePage, WorkspacePage)
- [ ] Test navigation between routes
- [ ] Verify code splitting in production build (separate chunks)

### Task 5: Configure Vitest and React Testing Library
- [ ] Install Vitest: `npm install -D vitest`
- [ ] Install React Testing Library: `npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event`
- [ ] Install jsdom or happy-dom: `npm install -D jsdom` (for DOM environment)
- [ ] Create Vitest config (`vitest.config.ts`) with:
  - React environment (jsdom)
  - Setup file for testing-library/jest-dom
  - Coverage configuration
- [ ] Create test setup file (`src/test/setup.ts`) to import @testing-library/jest-dom
- [ ] Add test scripts to package.json:
  ```json
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
  ```
- [ ] Write sample component test to validate setup

### Task 6: Create feature-based directory structure
- [ ] Create `src/features/` directory
- [ ] Create `src/shared/` directory for utilities, types, constants
- [ ] Create example feature structure:
  ```
  src/features/canvas/
  ├── Canvas3D.tsx
  ├── Canvas3D.test.tsx
  ├── canvasStore.ts
  ├── useCamera.ts
  └── types.ts
  ```
- [ ] Create `src/shared/types/` for shared TypeScript types
- [ ] Create `src/shared/utils/` for shared utilities
- [ ] Document directory structure in README.md
- [ ] Add architectural rule: NO type-based directories at root (no /components/, /hooks/)

### Task 7: Write tests and validate setup
- [ ] Write sample component test using React Testing Library
- [ ] Test Vite HMR updates in development mode
- [ ] Test Tailwind CSS utility classes apply correctly
- [ ] Test React Router navigation between routes
- [ ] Test lazy-loaded route components
- [ ] Run `npm test` and verify all tests pass
- [ ] Run `npm run build` and verify production build succeeds
- [ ] Run `npm run preview` and manually test production build
- [ ] Run TypeScript type checking: `tsc --noEmit`
- [ ] Fix any failing tests or build issues

---

## Dev Notes

### Architecture Context

**Package Location:** `packages/ui/`
**Package Name:** `@diagram-builder/ui`

**Dependencies from Previous Phases:**
- Phase 1: Monorepo infrastructure, TypeScript configuration, ESLint
- Phase 2: `@diagram-builder/core` (will be consumed in later stories)
- Phase 4: `@diagram-builder/api` (will connect via REST/WebSocket in later stories)

**Technology Stack:**
- Vite: 7.3 (build tool, dev server with HMR)
- React: 19 (with concurrent features)
- TypeScript: Latest stable (strict mode)
- Tailwind CSS: Latest (utility-first CSS framework)
- React Router: v7.1.1 (routing with code splitting)
- Vitest: Latest (testing framework)
- @testing-library/react: Latest (component testing)

### Key Architecture Decisions (from architecture.md and project-context.md)

1. **Feature-Based Organization (CRITICAL - Agents Often Get This Wrong):**
   ```
   ✅ CORRECT:
   src/features/
   ├── canvas/
   │   ├── Canvas3D.tsx
   │   ├── Canvas3D.test.tsx
   │   ├── canvasStore.ts
   │   ├── useCamera.ts
   │   └── types.ts

   ❌ WRONG (Type-based):
   src/
   ├── components/
   ├── hooks/
   ├── stores/
   └── types/
   ```
   - Each feature is self-contained with its own components, hooks, stores, types
   - Shared utilities go in `src/shared/`
   - NO root-level `/components/`, `/hooks/`, `/stores/` directories

2. **Zustand State Management (Will be Used in Later Stories):**
   - ONLY Zustand for state management (NO Redux, NO Context API)
   - Feature-based stores (canvasStore, viewpointStore, etc.)
   - This story sets up the structure; stores will be added in Stories 5.4+

3. **Multi-Level Error Boundaries (Will be Implemented in Story 5.3):**
   - Global error boundary at app root
   - Feature-level error boundaries for each major feature
   - This story sets up routing; error boundaries added in Story 5.3

4. **Performance Requirements (NFR-P4, NFR-P5, NFR-P6):**
   - 60fps rendering minimum (Three.js rendering in Stories 5.4-5.6)
   - <16ms input-to-render latency
   - Code splitting essential for large React app
   - React Router lazy loading configured in this story

5. **Testing Strategy:**
   - Co-located tests next to source files (NOT in separate test directories)
   - Use Vitest for all tests (matches backend testing framework)
   - Use @testing-library/react for component testing (user-centric tests)
   - 100% test coverage required before marking complete

### Implementation Guidance

**Vite Configuration:**
```typescript
// vite.config.ts (example structure)
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173
  }
})
```

**TypeScript Configuration:**
```json
// tsconfig.json (example)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**React Router Setup:**
```typescript
// src/main.tsx (example)
import React from 'react'
import ReactDOM from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'

const router = createBrowserRouter([
  {
    path: '/',
    lazy: () => import('./features/home/HomePage')
  },
  {
    path: '/workspace/:id',
    lazy: () => import('./features/workspace/WorkspacePage')
  }
])

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
)
```

**Vitest Configuration:**
```typescript
// vitest.config.ts (example)
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true
  }
})
```

**Sample Component Test:**
```typescript
// src/features/home/HomePage.test.tsx (example)
import { render, screen } from '@testing-library/react'
import { HomePage } from './HomePage'

describe('HomePage', () => {
  it('should render welcome message', () => {
    render(<HomePage />)
    expect(screen.getByText(/welcome/i)).toBeInTheDocument()
  })
})
```

### Critical Constraints

- **TypeScript strict mode:** NO `any` types allowed (use `unknown` with type guards)
- **Feature-based organization:** Organize by feature, NOT by type
- **Co-located tests:** `.test.tsx` files next to components
- **React 19 features:** Use concurrent features, no legacy patterns
- **Tailwind CSS only:** NO custom CSS files (except index.css for Tailwind directives)
- **Code splitting required:** Use React Router lazy loading for all routes

### Testing Requirements

All tests must:
- Use Vitest framework
- Use @testing-library/react for component tests
- Be co-located with source files (`.test.tsx` suffix)
- Pass 100% before marking tasks complete
- Test user interactions, not implementation details
- Use accessibility queries (getByRole, getByLabelText) when possible

**Test Examples:**
```typescript
// Component test with user interaction
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

describe('SampleComponent', () => {
  it('should handle button click', async () => {
    const user = userEvent.setup()
    render(<SampleComponent />)

    const button = screen.getByRole('button', { name: /click me/i })
    await user.click(button)

    expect(screen.getByText(/clicked/i)).toBeInTheDocument()
  })
})
```

### Reference Files

- Architecture: `_bmad-output/planning-artifacts/architecture.md`
- Project Context: `_bmad-output/project-context.md`
- Phase Overview: `TASKS.md` (Phase 5.1)

---

## Dev Agent Record

### Implementation Plan

_This section will be populated by the dev agent during implementation_

### Debug Log

_This section will be populated by the dev agent during implementation_

### Completion Notes

_This section will be populated by the dev agent after completion_

---

## File List

_This section will be populated by the dev agent with all new, modified, or deleted files_

---

## Change Log

_This section will be populated by the dev agent with implementation changes_

---

## Status

**Current Status:** ready-for-dev
**Created:** 2025-12-29
**Last Updated:** 2025-12-29
