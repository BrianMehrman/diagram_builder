# Port Configuration Reference

**CRITICAL: Standard Port Configuration**

This document defines the **canonical port configuration** for the Diagram Builder project. All configurations, scripts, and documentation MUST use these port numbers.

---

## Standard Ports

| Service | Port | Environment Variable | URL |
|---------|------|---------------------|-----|
| **API Server** | **8741** | `PORT=8741` | http://localhost:8741 |
| **UI Server** | **8742** | `port: 8742` (vite.config.ts) | http://localhost:8742 |
| **Neo4j Browser** | 7474 | NEO4J_URI | http://localhost:7474 |
| **Neo4j Bolt** | 7687 | NEO4J_URI | bolt://localhost:7687 |
| **Redis** | 6379 | REDIS_PORT | localhost:6379 |

### Observability Services (docker-compose `--profile observability`)

| Service | Port | Purpose | URL |
|---------|------|---------|-----|
| **Grafana** | 8743 | Dashboard UI | http://localhost:8743 |
| **Jaeger UI** | 16686 | Trace viewer | http://localhost:16686 |
| **Prometheus** | 9090 | Metrics query | http://localhost:9090 |
| **OTLP HTTP** | 4318 | Trace/metric ingestion | http://localhost:4318 |
| **OTLP gRPC** | 4317 | Trace/metric ingestion | localhost:4317 |
| **Prometheus scrape** | 9464 | API metrics endpoint (internal) | http://api:9464/metrics |

### Kubernetes Port Forwarding

When running in `--mode=k8s`, all services are accessed via port-forwarding through `scripts/port-forward.sh`.
This maps Kubernetes service ports to the same localhost ports:

```bash
# Start port forwarding (runs in foreground, Ctrl+C to stop)
./scripts/port-forward.sh

# Stop port forwarding
./scripts/port-forward.sh --stop
```

| Kubernetes Service | Local Port | URL |
|-------------------|------------|-----|
| `svc/diagram-builder-api` | 8741 | http://localhost:8741 |
| `svc/diagram-builder-ui` | 8742 | http://localhost:8742 |
| `svc/diagram-builder-...-grafana` | 8743 | http://localhost:8743 |
| `svc/diagram-builder-jaeger-query` | 16686 | http://localhost:16686 |
| `svc/diagram-builder-...-prometheus` | 9090 | http://localhost:9090 |

> **Note:** Port 8743 is exclusively reserved for Grafana. Do NOT use it for any application service.

---

## Files That Reference Ports

When updating port configuration, these files MUST be updated to maintain consistency:

### Configuration Files
- `.env` - Root environment file (PORT=8741)
- `.env.example` - Example environment file (PORT=8741)
- `packages/api/.env.example` - API environment example (CORS_ORIGIN=http://localhost:8742)
- `packages/api/src/config/environment.ts` - Default PORT value

### Scripts & Tools
- `scripts/init.sh` - Checks for ports 8741 (API) and 8742 (UI)
- `playwright.config.ts` - baseURL and webServer.url = http://localhost:8742

### Documentation
- `README.md` - Service URLs and getting started guide
- `tests/README.md` - Test environment setup
- `CLAUDE.md` - AI agent context

### Test Files
- `tests/e2e/**/*.spec.ts` - E2E tests that make API calls
- `packages/ui/src/lib/api-client.ts` - API client base URL configuration

---

## Why These Ports?

### API: Port 8741
- **Default in .env.example and environment.ts**: PORT=8741
- Custom port to avoid conflicts with common dev server ports (3000, 8080, 5173)
- Easy to remember: "8741 for backend/API"

### UI: Port 8742
- **Configured in vite.config.ts**: `port: 8742`
- `strictPort: true` is set in `vite.config.ts` — if port 8742 is busy, Vite will exit with an error rather than picking another port. Fix the port conflict before starting the UI.

### Why NOT 3000 or 5173?
- **3000**: Previously used, now migrated to 8742
- **5173**: Vite's internal fallback — disabled via `strictPort: true`

---

## Common Mistakes to Avoid

### ❌ MISTAKE 1: Using Port 5173 for UI
```typescript
// WRONG - Vite uses 8742 (configured), not 5173
baseURL: 'http://localhost:5173'
```

```typescript
// CORRECT
baseURL: 'http://localhost:8742'
```

### ❌ MISTAKE 2: Using Port 3001 for API
```bash
# WRONG - API should use 8741
PORT=3001
```

```bash
# CORRECT
PORT=8741
```

### ❌ MISTAKE 3: Inconsistent Port Checking
```bash
# WRONG - Checking different ports in different places
if lsof -ti:3001 > /dev/null 2>&1; then  # API check
if lsof -ti:5173 > /dev/null 2>&1; then  # UI check
```

```bash
# CORRECT
if lsof -ti:8741 > /dev/null 2>&1; then  # API check
if lsof -ti:8742 > /dev/null 2>&1; then  # UI check
```

---

## Testing Port Configuration

### Verify Ports Are Correct

```bash
# Check .env file
grep "^PORT=" .env
# Expected: PORT=8741

# Check init script
grep -A 1 "lsof -ti:" scripts/init.sh
# Expected: lsof -ti:8741 (API) and lsof -ti:8742 (UI)

# Check Playwright config
grep "baseURL" playwright.config.ts
# Expected: baseURL: process.env.BASE_URL || 'http://localhost:8742'

# Check README
grep "localhost:[0-9]" README.md
# Expected: localhost:8742 (UI) and localhost:8741 (API)
```

### Verify Services Are Running

```bash
# Check running services
lsof -i :8741  # Should show API server (tsx/node)
lsof -i :8742  # Should show UI server (vite)
lsof -i :7687  # Should show Neo4j
lsof -i :6379  # Should show Redis

# Test API health endpoint
curl http://localhost:8741/health

# Test UI loads
curl http://localhost:8742
```

---

## When to Update This Document

This document should be updated if:
1. Port numbers change (requires team discussion)
2. New services are added with new ports
3. New configuration files are created that reference ports
4. Test infrastructure changes affect port usage

---

## Port Change Checklist

If you ever need to change the standard ports, use this checklist:

- [ ] Update `.env` (PORT=)
- [ ] Update `.env.example` (PORT=)
- [ ] Update `packages/api/.env.example` (PORT= and CORS_ORIGIN=)
- [ ] Update `packages/api/src/config/environment.ts` (default PORT value)
- [ ] Update `packages/ui/vite.config.ts` (port and proxy targets)
- [ ] Update `scripts/init.sh` (lsof port checks and output messages)
- [ ] Update `playwright.config.ts` (baseURL and webServer.url)
- [ ] Update `README.md` (all service URL references)
- [ ] Update `tests/README.md` (if it exists)
- [ ] Update `CLAUDE.md` (context for AI agents)
- [ ] Update this file (PORT-CONFIGURATION.md)
- [ ] Search codebase for hardcoded port numbers: `grep -r "localhost:8741\|localhost:8742\|localhost:8743" .`
- [ ] Run tests to verify: `npm run test:e2e`
- [ ] Update docker-compose.yml (if ports are exposed)

---

**Last Updated:** 2026-03-24
**Updated By:** Dev Agent (Story 12-4: Observability Services)
