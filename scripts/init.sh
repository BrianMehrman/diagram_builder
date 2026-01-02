#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Initializing Diagram Builder environment..."

# Check if Docker services are running
echo "📦 Checking Docker services..."
if ! docker ps | grep -q diagram-builder-neo4j; then
  echo "  Starting Neo4j..."
  docker-compose up -d neo4j
  echo "  Waiting for Neo4j to be ready..."
  sleep 5
else
  echo -e "  ${GREEN}✓${NC} Neo4j already running"
fi

if ! docker ps | grep -q diagram-builder-redis; then
  echo "  Starting Redis..."
  docker-compose up -d redis
  sleep 2
else
  echo -e "  ${GREEN}✓${NC} Redis already running"
fi

# Seed database (idempotent)
echo "🌱 Seeding database..."
cd packages/api && npx tsx src/database/seed-db.ts > /dev/null 2>&1 && cd ../..
echo -e "  ${GREEN}✓${NC} Database seeded"

# Start API server if not running
echo "🔧 Checking API server..."
if lsof -ti:3001 > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} API server already running on port 3001"
else
  echo "  Starting API server..."
  npm run dev:watch --workspace=@diagram-builder/api > /dev/null 2>&1 &
  sleep 3
  echo -e "  ${GREEN}✓${NC} API server started on port 3001"
fi

# Start UI server if not running
echo "🎨 Checking UI server..."
if lsof -ti:5173 > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} UI server already running on port 5173"
elif lsof -ti:3000 > /dev/null 2>&1; then
  echo -e "  ${GREEN}✓${NC} UI server already running on port 3000"
else
  echo "  Starting UI server..."
  npm run dev --workspace=@diagram-builder/ui > /dev/null 2>&1 &
  sleep 5
  echo -e "  ${GREEN}✓${NC} UI server started"
fi

echo -e "${GREEN}✅ Environment ready!${NC}"
echo ""
echo "Services:"
echo "  UI:    http://localhost:5173 or http://localhost:3000"
echo "  API:   http://localhost:3001"
echo "  Neo4j: http://localhost:7474"
echo "  Redis: localhost:6379"
