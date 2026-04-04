# Epic 12-A: Containerization Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate the existing Docker images build and run correctly, then scan for CVEs — completing Stories 12-1 and 12-2.

**Architecture:** Dockerfiles already exist (`docker/api/Dockerfile`, `docker/ui/Dockerfile`, `docker/ui/nginx.conf`, `.dockerignore`). This plan only covers the remaining validation and scan tasks — no new files to write.

**Tech Stack:** Docker, docker scout or trivy, Node.js 22 Alpine, nginx 1.27 Alpine

---

## Story 12-1: Validate Docker Builds

### Task 1: Build the API image

**Files:** none — validation only

- [ ] From repo root, build the API image:
  ```bash
  docker build -f docker/api/Dockerfile -t diagram-builder-api:local .
  ```
  Expected: build completes without errors. Note the final image size.

- [ ] If build fails, read the error output carefully. Common issues:
  - Missing workspace package in COPY step → add it to the Dockerfile
  - tree-sitter native build fails → ensure `python3 make g++` apk packages are in stage 1
  - TypeScript compile error → fix in source, not Dockerfile

- [ ] Verify image was created:
  ```bash
  docker images diagram-builder-api:local
  ```
  Expected: one row with a size under 500MB.

### Task 2: Validate API container starts and /health responds

- [ ] Start the API container (requires running Neo4j and Redis — use existing `docker-compose --profile infra up -d` first):
  ```bash
  docker-compose --profile infra up -d
  docker run --rm --network diagram-builder_default \
    -e NODE_ENV=development \
    -e NEO4J_URI=bolt://neo4j:7687 \
    -e NEO4J_USER=neo4j \
    -e NEO4J_PASSWORD=password \
    -e REDIS_HOST=redis \
    -e JWT_SECRET=dev-secret \
    -p 4001:4000 \
    diagram-builder-api:local
  ```

- [ ] In a second terminal, hit the health endpoint:
  ```bash
  curl -s http://localhost:4001/health
  ```
  Expected: `200 OK` with a JSON body like `{"status":"ok"}`.

- [ ] Stop the container (`Ctrl+C` or `docker stop`).

- [ ] Update Story 12-1 checklist — mark validation tasks complete.

### Task 3: Build the UI image

- [ ] Build the UI image:
  ```bash
  docker build -f docker/ui/Dockerfile -t diagram-builder-ui:local .
  ```
  Expected: build completes without errors.

- [ ] Verify the image:
  ```bash
  docker images diagram-builder-ui:local
  ```
  Expected: size under 50MB (nginx + static assets only).

- [ ] Run a quick smoke test:
  ```bash
  docker run --rm -p 8742:80 diagram-builder-ui:local
  curl -s -o /dev/null -w "%{http_code}" http://localhost:8742/
  ```
  Expected: `200`.

- [ ] Stop the container.

---

## Story 12-2: CVE Scan

### Task 4: Scan images for CVEs

- [ ] Install trivy if not available:
  ```bash
  brew install trivy
  # or: docker pull aquasec/trivy
  ```

- [ ] Scan the API image:
  ```bash
  trivy image --severity HIGH,CRITICAL diagram-builder-api:local
  ```
  Expected: zero HIGH or CRITICAL CVEs. If any found, note the package names.

- [ ] Scan the UI image:
  ```bash
  trivy image --severity HIGH,CRITICAL diagram-builder-ui:local
  ```
  Expected: zero HIGH or CRITICAL CVEs.

- [ ] If CVEs found:
  - For Alpine OS packages: `apk upgrade` in the relevant Dockerfile stage usually fixes these — add `RUN apk upgrade --no-cache` after the `FROM` line in the runtime stage
  - For npm packages: run `npm audit fix` in the affected workspace package, rebuild
  - Rebuild and re-scan until clean

### Task 5: Commit and update story status

- [ ] Update `docs/epics/epic-12/stories/12-1-dockerfiles-for-api-and-ui.md` — mark all tasks done, set `Status: done`
- [ ] Update `docs/epics/epic-12/stories/12-2-docker-image-hardening.md` — mark CVE scan task done, set `Status: done`

- [ ] Commit:
  ```bash
  git add docs/epics/epic-12/stories/12-1-dockerfiles-for-api-and-ui.md
  git add docs/epics/epic-12/stories/12-2-docker-image-hardening.md
  git commit -m "docs: mark stories 12-1 and 12-2 complete after validation"
  ```

---

**Estimated time:** 1-2 hours
**Stories completed:** 12-1, 12-2
**Next plan:** `2026-03-22-epic-12c-winston-otel.md`
