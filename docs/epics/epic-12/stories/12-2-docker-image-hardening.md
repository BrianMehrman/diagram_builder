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

- [ ] Scan images with `docker scout` or `trivy` — zero critical/high CVEs (run after first successful build)

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

**Status:** in-progress
**Created:** 2026-03-22
**Last Updated:** 2026-03-22
