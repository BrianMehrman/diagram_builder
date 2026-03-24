# Story 12-2: Docker Image Hardening

## Story

**ID:** 12-2
**Key:** 12-2-docker-image-hardening
**Title:** Docker Image Hardening
**Epic:** Epic 12 - Observability & Infrastructure (Group: 12-A Application Containerization)
**Phase:** Implementation
**Priority:** HIGH - Security requirement before any containerized deployment

**Description:**

Harden the Docker images created in Story 12-1: pin base image versions, enforce non-root execution, minimize image size, and scan for CVEs. These measures ensure production-safe container images.

---

## Acceptance Criteria

- **AC-1:** Base image versions pinned to exact tags
- **AC-2:** API runs as non-root user in container
- **AC-3:** Final image size minimized (no dev dependencies, only dist + pruned node_modules)
- **AC-4:** Build and scan commands documented in README
- **AC-5:** Image scan returns zero critical/high CVEs

---

## Tasks/Subtasks

### Task 1: Image hardening

- [x] Pin base image versions (exact tags: `node:22.12-alpine3.21`, `nginx:1.27-alpine3.21`)
- [x] API runs as non-root (`USER node` set before `EXPOSE`; `--chown=node:node` on all COPY in runtime stage)
- [x] Minimize final image size: `npm prune --omit=dev` in builder stage; runtime stage copies only `dist/` + pruned `node_modules`
- [x] Document image build and scan commands in README (`Building Docker Images` section)

### Task 2: CVE scan

- [x] Scan images with `trivy` (ghcr.io/aquasecurity/trivy:latest) — findings recorded below

#### CVE Findings (2026-03-23)

**API image (`diagram-builder-api:local`)**

Alpine base (alpine 3.21.1): 10 total (8 HIGH, 2 CRITICAL)
- `libcrypto3` / `libssl3`: CVE-2025-15467 CRITICAL, CVE-2024-12797 HIGH — fixed in `3.3.6-r0` / `3.3.3-r0`
- Fix: update base to `node:22-alpine` or newer patch image

npm packages: 19 total (18 HIGH, 1 CRITICAL)
- `simple-git` 3.30.0: CVE-2026-28292 **CRITICAL** RCE → fix: upgrade to `3.32.3+`
- `cross-spawn` 7.0.3: CVE-2024-21538 HIGH (ReDoS) → fix: upgrade to `7.0.5+`
- `socket.io-parser` 4.2.5: CVE-2026-33151 HIGH → fix: upgrade socket.io
- `tar` 6.2.1: 6× HIGH path traversal CVEs → fix: upgrade to `7.5.11+`

**UI image (`diagram-builder-ui:local`)**

nginx/Alpine base: 20 total (15 HIGH, 5 CRITICAL)
- `libcrypto3` / `libssl3`: CVE-2025-15467 CRITICAL
- `libexpat`: CVE-2026-32767 CRITICAL
- `libxml2`: CVE-2025-49794 CRITICAL
- Fix: update base to `nginx:1.27-alpine` with a newer patch or use distroless

**AC-5 status:** NOT MET — critical CVEs present. Tracked as backlog for Story 12-2 completion.
These findings are input to the dependency upgrade work in this story.

---

## Dev Notes

### Scan Command

```bash
# Using trivy
trivy image diagram-builder-api:latest
trivy image diagram-builder-ui:latest

# Using docker scout
docker scout cves diagram-builder-api:latest
```

### Dependencies

- **Depends On:** Story 12-1 (Dockerfiles must exist and build successfully before scanning)
- **Enables:** Story 12-3 (Docker Compose uses these hardened images)

### Owner and Estimate

- **Owner:** Dev Team
- **Estimated Effort:** 1-2 hours
- **Priority:** HIGH - Security gate before deployment

---

## Change Log

- **2026-03-22**: Story created from TASKS.md Phase 9 Epic 12-A
- **2026-03-23**: CVE scan completed. Hardening tasks 1-4 already applied in Dockerfile. Task 2 scan complete — critical CVEs found, documented above. Dependency upgrades required to meet AC-5.

**Status:** in-progress
**Created:** 2026-03-22
**Last Updated:** 2026-03-23
