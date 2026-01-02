# Port Configuration Reference

**CRITICAL: Standard Port Configuration**

This document defines the **canonical port configuration** for the Diagram Builder project. All configurations, scripts, and documentation MUST use these port numbers.

---

## Standard Ports

| Service | Port | Environment Variable | URL |
|---------|------|---------------------|-----|
| **API Server** | **4000** | `PORT=4000` | http://localhost:4000 |
| **UI Server** | **3000** | N/A (Vite default) | http://localhost:3000 |
| **Neo4j Browser** | 7474 | NEO4J_URI | http://localhost:7474 |
| **Neo4j Bolt** | 7687 | NEO4J_URI | bolt://localhost:7687 |
| **Redis** | 6379 | REDIS_PORT | localhost:6379 |

---

## Files That Reference Ports

When updating port configuration, these files MUST be updated to maintain consistency:

### Configuration Files
- `.env` - Root environment file (PORT=4000)
- `.env.example` - Example environment file (PORT=4000)
- `packages/api/.env.example` - API environment example (CORS_ORIGIN=http://localhost:3000)
- `packages/api/src/config/environment.ts` - Default PORT value

### Scripts & Tools
- `scripts/init.sh` - Checks for ports 4000 (API) and 3000 (UI)
- `playwright.config.ts` - baseURL and webServer.url = http://localhost:3000

### Documentation
- `README.md` - Service URLs and getting started guide
- `tests/README.md` - Test environment setup
- `CLAUDE.md` - AI agent context

### Test Files
- `tests/e2e/**/*.spec.ts` - E2E tests that make API calls
- `packages/ui/src/lib/api-client.ts` - API client base URL configuration

---

## Why These Ports?

### API: Port 4000
- **Default in .env.example and environment.ts**: PORT=4000
- Distinct from common dev server ports (3000, 8080, 5173)
- Easy to remember: "4000 for backend/API"

### UI: Port 3000
- **Vite's default**: When you run `npm run dev` in the UI package, Vite uses port 3000 by default
- Industry standard for React development servers
- If port 3000 is busy, Vite will auto-increment (3001, 3002, etc.)

### Why NOT 3001 or 5173?
- **3001**: Too close to 3000, causes confusion
- **5173**: Vite's fallback port, not the default. Only used if 3000 is taken.

---

## Common Mistakes to Avoid

### ❌ MISTAKE 1: Using Port 5173 for UI
```typescript
// WRONG - Vite uses 3000 by default, not 5173
baseURL: 'http://localhost:5173'
```

```typescript
// CORRECT
baseURL: 'http://localhost:3000'
```

### ❌ MISTAKE 2: Using Port 3001 for API
```bash
# WRONG - API should use 4000
PORT=3001
```

```bash
# CORRECT
PORT=4000
```

### ❌ MISTAKE 3: Inconsistent Port Checking
```bash
# WRONG - Checking different ports in different places
if lsof -ti:3001 > /dev/null 2>&1; then  # API check
if lsof -ti:5173 > /dev/null 2>&1; then  # UI check
```

```bash
# CORRECT
if lsof -ti:4000 > /dev/null 2>&1; then  # API check
if lsof -ti:3000 > /dev/null 2>&1; then  # UI check
```

---

## Testing Port Configuration

### Verify Ports Are Correct

```bash
# Check .env file
grep "^PORT=" .env
# Expected: PORT=4000

# Check init script
grep -A 1 "lsof -ti:" scripts/init.sh
# Expected: lsof -ti:4000 (API) and lsof -ti:3000 (UI)

# Check Playwright config
grep "baseURL" playwright.config.ts
# Expected: baseURL: process.env.BASE_URL || 'http://localhost:3000'

# Check README
grep "localhost:[0-9]" README.md
# Expected: localhost:3000 (UI) and localhost:4000 (API)
```

### Verify Services Are Running

```bash
# Check running services
lsof -i :4000  # Should show API server (tsx/node)
lsof -i :3000  # Should show UI server (vite)
lsof -i :7687  # Should show Neo4j
lsof -i :6379  # Should show Redis

# Test API health endpoint
curl http://localhost:4000/health

# Test UI loads
curl http://localhost:3000
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
- [ ] Update `scripts/init.sh` (lsof port checks and output messages)
- [ ] Update `playwright.config.ts` (baseURL and webServer.url)
- [ ] Update `README.md` (all service URL references)
- [ ] Update `tests/README.md` (if it exists)
- [ ] Update `CLAUDE.md` (context for AI agents)
- [ ] Update this file (PORT-CONFIGURATION.md)
- [ ] Search codebase for hardcoded port numbers: `grep -r "localhost:3001\|localhost:5173" .`
- [ ] Run tests to verify: `npm run test:e2e`
- [ ] Update docker-compose.yml (if ports are exposed)

---

**Last Updated:** 2026-01-02
**Updated By:** Dev Agent (Story 5.5-3: E2E Test Validation)
