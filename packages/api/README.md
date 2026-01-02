# API Package - Database Seeding Guide

## Overview

The API package includes comprehensive database seed data for development and testing. This guide explains how to reset and reseed your Neo4j database.

## Seed Data Contents

The seed script (`src/database/seed-db.ts`) creates:

### 1. Test Workspaces (3)

- **default-workspace**: Basic single-user workspace
  - Owner: `dev-user`
  - Empty repository list
  - Basic settings
  
- **multi-repo-workspace**: Multi-repository example
  - Owner: `dev-user`
  - Members: `dev-user` (owner), `test-admin` (admin)
  - 3 repositories: JavaScript, TypeScript, Multi-language
  - Advanced settings with filters
  
- **collab-workspace**: Collaboration testing workspace
  - Owner: `dev-user`
  - Members: `dev-user` (owner), `test-admin` (admin), `test-editor` (editor), `test-viewer` (viewer)
  - 1 repository: TypeScript sample
  - Collaboration enabled

### 2. Test Repositories (3)

- **repo-sample-javascript**: JavaScript example (42 files, 15 classes, 87 functions)
- **repo-sample-typescript**: TypeScript example (68 files, 34 classes, 156 functions)
- **repo-sample-multilang**: Multi-language example (125 files, 48 classes, 223 functions)

### 3. Test Viewpoints (3)

- **viewpoint-overview-js**: High-level JavaScript overview
- **viewpoint-detailed-ts**: Detailed TypeScript view with annotations
- **viewpoint-collab**: Shared collaboration view

### 4. Export History (3)

- PlantUML export from default workspace
- Mermaid export from multi-repo workspace
- PNG export from collaboration workspace

## Database Reset & Reseed Process

### Option 1: Full Reset (Clean Slate)

This completely removes all data and starts fresh.

```bash
# Stop the API server if running
# Ctrl+C or kill the process

# Reset Neo4j database (removes ALL data)
docker-compose down -v

# Restart Neo4j with fresh database
docker-compose up -d

# Wait for Neo4j to start (10-15 seconds)
sleep 15

# Start API server (automatically seeds database)
npm run dev
```

### Option 2: Manual Reseed (Keep Existing Data)

If you want to keep existing data and just add seed data:

```bash
# The seed script is idempotent and checks for existing data
# It will skip creation if data already exists

# Restart the API server to trigger seeding
npm run dev

# Or manually trigger via Neo4j Browser:
# 1. Open http://localhost:7474
# 2. Run queries to manually create data (see seed-db.ts for examples)
```

### Option 3: Selective Delete & Reseed

Remove specific data types and reseed:

```bash
# Connect to Neo4j Browser: http://localhost:7474

# Delete all workspaces
MATCH (w:Workspace) DETACH DELETE w

# Delete all repositories  
MATCH (r:Repository) DETACH DELETE r

# Delete all viewpoints
MATCH (v:Viewpoint) DETACH DELETE v

# Delete all exports
MATCH (e:Export) DETACH DELETE e

# Then restart API to reseed
npm run dev
```

## Environment-Specific Considerations

### Development Environment

- Seed data runs automatically on server startup
- Safe to run multiple times (idempotent)
- Default user: `dev-user`
- Default workspace: `default-workspace`

### Test Environment

When running tests:

```bash
# Tests use the same seeding mechanism
npm test

# For e2e tests that need seed data
npm run test:e2e
```

The test suite automatically handles database setup and teardown.

### Production Environment

**⚠️ NEVER run seed data in production!**

The seed script only runs in development mode. Production databases should be managed through proper migration and backup processes.

## Troubleshooting

### Issue: "Workspaces already exist, skipping seed"

**Cause**: Seed script detected existing data and skipped creation.

**Solution**: 
- If you want fresh data, use Option 1 (Full Reset)
- If existing data is okay, no action needed

### Issue: "Failed to seed database: Connection refused"

**Cause**: Neo4j is not running or not accessible.

**Solution**:
```bash
# Check Neo4j status
docker-compose ps

# If not running, start it
docker-compose up -d neo4j

# Wait and retry
sleep 15
npm run dev
```

### Issue: "Expected at least 3 workspaces, found 0"

**Cause**: Seed script failed to create data, possibly due to constraint violations.

**Solution**:
```bash
# Check Neo4j logs
docker-compose logs neo4j

# Verify constraints exist
# Open Neo4j Browser and run:
SHOW CONSTRAINTS

# If constraints missing, restart with fresh database
docker-compose down -v
docker-compose up -d
```

### Issue: Cannot access default workspace in UI

**Cause**: Workspace not seeded or auth mismatch.

**Solution**:
```bash
# Verify workspace exists
# In Neo4j Browser:
MATCH (w:Workspace {id: 'default-workspace'}) RETURN w

# Check owner matches your user
# The default user is 'dev-user'

# If missing, trigger reseed
docker-compose down -v
docker-compose up -d
npm run dev
```

## Validation

After seeding, you can validate the data:

```cypher
// In Neo4j Browser (http://localhost:7474)

// Count nodes by type
MATCH (w:Workspace) RETURN 'Workspaces' as type, count(w) as count
UNION
MATCH (r:Repository) RETURN 'Repositories' as type, count(r) as count
UNION  
MATCH (v:Viewpoint) RETURN 'Viewpoints' as type, count(v) as count
UNION
MATCH (e:Export) RETURN 'Exports' as type, count(e) as count

// List all workspaces
MATCH (w:Workspace) 
RETURN w.id, w.name, w.ownerId, w.repositories

// Verify default workspace
MATCH (w:Workspace {id: 'default-workspace'})
RETURN w
```

Expected results:
- Workspaces: 3+
- Repositories: 3+
- Viewpoints: 3+
- Exports: 3+

## Custom Seed Data

To add your own seed data:

1. Edit `src/database/seed-db.ts`
2. Add new data to the appropriate arrays (workspaces, repositories, etc.)
3. Follow the existing patterns for IDs and structure
4. Ensure idempotency (check before creating)
5. Restart server to apply changes

Example:
```typescript
const workspaces = [
  // ... existing workspaces
  {
    id: 'my-custom-workspace',
    name: 'My Custom Workspace',
    description: 'Custom test workspace',
    ownerId: 'dev-user',
    // ... rest of properties
  },
];
```

## Additional Resources

- [Neo4j Cypher Documentation](https://neo4j.com/docs/cypher-manual/current/)
- [Project Context](_bmad-output/project-context.md) - Critical architecture rules
- [Architecture Document](_bmad-output/planning-artifacts/architecture.md) - System design
