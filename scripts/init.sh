#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODE="local"

show_usage() {
  echo ""
  echo -e "${BLUE}Diagram Builder - Init Script${NC}"
  echo ""
  echo "Usage: ./scripts/init.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --mode=local      (default) Start infra via Docker Compose, run API/UI as Node processes"
  echo "  --mode=docker     Start all services (infra + app + observability) via Docker Compose"
  echo "  --mode=k8s        Deploy via Helm to Kubernetes, set up port forwarding"
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/init.sh                  # local mode (default)"
  echo "  ./scripts/init.sh --mode=local"
  echo "  ./scripts/init.sh --mode=docker"
  echo "  ./scripts/init.sh --mode=k8s"
  echo ""
}

# Parse arguments
for arg in "$@"; do
  case "$arg" in
    --mode=*)
      MODE="${arg#*=}"
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option '$arg'${NC}"
      show_usage
      exit 1
      ;;
  esac
done

# Validate mode
case "$MODE" in
  local|docker|k8s) ;;
  *)
    echo -e "${RED}Error: Invalid mode '$MODE'. Must be local, docker, or k8s.${NC}"
    show_usage
    exit 1
    ;;
esac

print_urls() {
  local mode="$1"
  echo ""
  echo -e "${GREEN}✅ Environment ready! (mode: ${mode})${NC}"
  echo ""
  echo "Services:"
  echo -e "  UI:         ${BLUE}http://localhost:3000${NC}"
  echo -e "  API:        ${BLUE}http://localhost:4000${NC}"
  echo -e "  Neo4j:      ${BLUE}http://localhost:7474${NC}"
  echo -e "  Redis:      localhost:6379"
  if [ "$mode" != "local" ] || [ "${OBSERVABILITY:-false}" = "true" ]; then
    echo ""
    echo "Observability:"
    echo -e "  Grafana:    ${BLUE}http://localhost:3001${NC}"
    echo -e "  Jaeger:     ${BLUE}http://localhost:16686${NC}"
    echo -e "  Prometheus: ${BLUE}http://localhost:9090${NC}"
  fi
  echo ""
}

# ─── LOCAL MODE ──────────────────────────────────────────────────────────────

init_local() {
  echo "🚀 Initializing Diagram Builder (local mode)..."

  echo "📦 Checking Docker services..."
  if ! docker ps | grep -q diagram-builder-neo4j; then
    echo "  Starting Neo4j..."
    docker compose --profile infra up -d neo4j
    echo "  Waiting for Neo4j to be ready..."
    sleep 5
  else
    echo -e "  ${GREEN}✓${NC} Neo4j already running"
  fi

  if ! docker ps | grep -q diagram-builder-redis; then
    echo "  Starting Redis..."
    docker compose --profile infra up -d redis
    sleep 2
  else
    echo -e "  ${GREEN}✓${NC} Redis already running"
  fi

  echo "🌱 Seeding database..."
  cd packages/api && npx tsx src/database/seed-db.ts > /dev/null 2>&1 && cd ../..
  echo -e "  ${GREEN}✓${NC} Database seeded"

  echo "🔧 Checking API server..."
  if lsof -ti:4000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} API server already running on port 4000"
  else
    echo "  Starting API server..."
    npm run dev:watch --workspace=@diagram-builder/api > /dev/null 2>&1 &
    sleep 3
    echo -e "  ${GREEN}✓${NC} API server started on port 4000"
  fi

  echo "🎨 Checking UI server..."
  if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} UI server already running on port 3000"
  else
    echo "  Starting UI server..."
    npm run dev --workspace=@diagram-builder/ui > /dev/null 2>&1 &
    sleep 5
    echo -e "  ${GREEN}✓${NC} UI server started on port 3000"
  fi

  print_urls "local"
}

# ─── DOCKER MODE ─────────────────────────────────────────────────────────────

wait_for_health() {
  local service="$1"
  local max_attempts=30
  local attempt=0

  echo -n "  Waiting for ${service}..."
  while [ $attempt -lt $max_attempts ]; do
    status=$(docker compose ps --format json 2>/dev/null | \
      python3 -c "import sys,json; data=[json.loads(l) for l in sys.stdin if l.strip()]; \
        svc=[s for s in data if s.get('Service')=='${service}']; \
        print(svc[0].get('Health','') if svc else '')" 2>/dev/null || echo "")
    if [ "$status" = "healthy" ]; then
      echo -e " ${GREEN}✓${NC}"
      return 0
    fi
    sleep 2
    attempt=$((attempt + 1))
    echo -n "."
  done
  echo -e " ${YELLOW}⚠ timeout (service may still be starting)${NC}"
}

init_docker() {
  echo "🚀 Initializing Diagram Builder (docker mode)..."

  echo "📦 Starting all Docker Compose services..."
  docker compose --profile infra --profile app --profile observability up -d --build
  echo -e "  ${GREEN}✓${NC} Services started"

  echo "⏳ Waiting for health checks..."
  wait_for_health "neo4j"
  wait_for_health "redis"
  wait_for_health "api"

  echo "🌱 Seeding database..."
  # Run seed inside the api container
  docker compose exec api npx tsx src/database/seed-db.ts > /dev/null 2>&1 || \
    echo -e "  ${YELLOW}⚠${NC} Seed skipped (API may still be starting — run manually: docker compose exec api npx tsx src/database/seed-db.ts)"
  echo -e "  ${GREEN}✓${NC} Database seeded"

  OBSERVABILITY=true print_urls "docker"
}

# ─── K8S MODE ────────────────────────────────────────────────────────────────

check_prereq() {
  local cmd="$1"
  local install_hint="$2"
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} $cmd not found — $install_hint"
    return 1
  fi
  echo -e "  ${GREEN}✓${NC} $cmd"
  return 0
}

init_k8s() {
  echo "🚀 Initializing Diagram Builder (k8s mode)..."

  echo "🔍 Checking prerequisites..."
  local missing=0
  check_prereq "kubectl" "https://kubernetes.io/docs/tasks/tools/" || missing=1
  check_prereq "helm"    "https://helm.sh/docs/intro/install/"     || missing=1

  if [ $missing -ne 0 ]; then
    echo -e "${RED}Error: Missing prerequisites. Install the tools above and retry.${NC}"
    exit 1
  fi

  echo "🚢 Deploying via Helm..."
  bash "$(dirname "$0")/deploy-helm.sh"

  echo "🔌 Setting up port forwarding..."
  bash "$(dirname "$0")/port-forward.sh"

  OBSERVABILITY=true print_urls "k8s"
}

# ─── DISPATCH ────────────────────────────────────────────────────────────────

case "$MODE" in
  local)  init_local  ;;
  docker) init_docker ;;
  k8s)    init_k8s    ;;
esac
