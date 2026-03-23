# Story 12-1: Dockerfiles for API and UI

## Story

**ID:** 12-1
**Key:** 12-1-dockerfiles-for-api-and-ui
**Title:** Dockerfiles for API and UI
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-A Application Containerization)
**Phase:** Implementation
**Priority:** HIGH - Foundation for all Docker-based deployment modes

**Description:**

Create multi-stage Dockerfiles for the API and UI services, along with nginx configuration and a root `.dockerignore`. These enable containerized deployment and are required by Epic 12-B (Docker Compose full stack) and Epic 12-D (Helm charts).

---

## Acceptance Criteria

- **AC-1:** API Dockerfile created with 3-stage build (deps → builder → runtime)
- **AC-2:** UI Dockerfile created with 3-stage build (deps → builder → nginx runtime)
- **AC-3:** nginx.conf created with SPA routing, API proxy, security headers, and gzip
- **AC-4:** `.dockerignore` created excluding build artifacts and sensitive files
- **AC-5:** Both images build successfully with `docker build`
- **AC-6:** API container starts and `/health` responds `200`

---

## Tasks/Subtasks

### Task 1: API Dockerfile

- [x] Create `docker/api/Dockerfile` (multi-stage: deps → builder → runtime)
  - Stage 1 `deps`: `node:22.12-alpine3.21` — installs build tools (python3, make, g++ for tree-sitter), copies workspace manifests, runs `npm ci`
  - Stage 2 `builder`: compiles core → parser → api in dependency order; runs `npm prune --omit=dev`
  - Stage 3 `runtime`: `node:22.12-alpine3.21` — copies pruned node_modules + dist only; `USER node`; `EXPOSE 4000`; `CMD ["node", "dist/server.js"]`
- [x] Add `HEALTHCHECK` to API Dockerfile (node inline HTTP check against `/health`)

### Task 2: UI Dockerfile

- [x] Create `docker/ui/Dockerfile` (multi-stage: deps → builder → runtime)
  - Stage 1 `deps`: `node:22.12-alpine3.21` — copies workspace manifests, runs `npm ci`
  - Stage 2 `builder`: builds core then UI (`tsc && vite build`)
  - Stage 3 `runtime`: `nginx:1.27-alpine3.21` — copies `packages/ui/dist` to nginx html; `EXPOSE 80`
- [x] Add `HEALTHCHECK` to UI Dockerfile (`wget -qO- http://localhost/`)

### Task 3: nginx configuration

- [x] Create `docker/ui/nginx.conf`
  - SPA routing: `try_files $uri $uri/ /index.html`
  - Proxy `/api/` → `http://api:4000` with forwarding headers
  - Proxy `/socket.io/` → `http://api:4000` with WebSocket upgrade headers and 24h timeout
  - Gzip compression for text assets; immutable cache headers for hashed assets
  - Security headers (X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy)

### Task 4: .dockerignore

- [x] Create `.dockerignore` at repo root
  - Excludes `node_modules`, `packages/*/node_modules`, `packages/*/dist`, `.env*`, test output, logs, IDE files, `_bmad-output/`, `docs/`

### Task 5: Validation

- [ ] Validate both images build successfully: `docker build -f docker/api/Dockerfile .`
- [ ] Validate API container starts and `/health` responds `200`

---

## Dev Notes

### Files Involved

- `docker/api/Dockerfile` (create)
- `docker/ui/Dockerfile` (create)
- `docker/ui/nginx.conf` (create)
- `.dockerignore` (create)

### Dependencies

- **Enables:** Story 12-2 (image hardening), Story 12-3 (Docker Compose profiles), Story 12-8 (Helm chart)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 3-4 hours
- **Priority:** HIGH - Blocks all Docker/K8s deployment work

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-A

**Status:** in-progress
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
