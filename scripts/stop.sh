#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODE=""
STOP_ALL=false
STOP_UI=false
STOP_API=false
STOP_NEO4J=false
STOP_REDIS=false
STOP_DOCKER=false
STOP_SERVERS=false
OBSERVABILITY=false

# Function to stop UI server
stop_ui() {
  echo "🎨 Stopping UI server..."
  if lsof -ti:8742 > /dev/null 2>&1; then
    kill $(lsof -ti:8742) 2>/dev/null
    echo -e "  ${GREEN}✓${NC} UI server stopped (port 8742)"
  else
    echo -e "  ${YELLOW}⚠${NC} UI server not running"
  fi
}

# Function to stop API server
stop_api() {
  echo "🔧 Stopping API server..."
  if lsof -ti:8741 > /dev/null 2>&1; then
    kill $(lsof -ti:8741) 2>/dev/null
    echo -e "  ${GREEN}✓${NC} API server stopped (port 8741)"
  else
    echo -e "  ${YELLOW}⚠${NC} API server not running"
  fi
}

# Function to stop Neo4j
stop_neo4j() {
  echo "📦 Stopping Neo4j..."
  if docker ps -a --format '{{.Names}}' | grep -q '^diagram-builder-neo4j$'; then
    docker rm -f diagram-builder-neo4j > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Neo4j stopped"
  else
    echo -e "  ${YELLOW}⚠${NC} Neo4j not running"
  fi
}

# Function to stop Redis
stop_redis() {
  echo "📦 Stopping Redis..."
  if docker ps -a --format '{{.Names}}' | grep -q '^diagram-builder-redis$'; then
    docker rm -f diagram-builder-redis > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Redis stopped"
  else
    echo -e "  ${YELLOW}⚠${NC} Redis not running"
  fi
}

# Function to stop observability containers
stop_observability() {
  echo "🔭 Stopping observability containers..."
  if docker ps | grep -q diagram-builder-jaeger; then
    docker compose --profile observability down > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Observability containers stopped"
  else
    echo -e "  ${YELLOW}⚠${NC} Observability containers not running"
  fi
}

# Function to stop all Docker services
stop_docker_all() {
  echo "📦 Stopping all Docker Compose services..."
  docker compose --profile infra --profile app --profile observability down > /dev/null 2>&1
  echo -e "  ${GREEN}✓${NC} All Docker services stopped"
}

show_usage() {
  echo ""
  echo -e "${BLUE}Diagram Builder - Stop Script${NC}"
  echo ""
  echo "Usage: ./scripts/stop.sh [OPTIONS]"
  echo ""
  echo "Mode options (mutually exclusive):"
  echo "  --mode=local      Stop local-mode services (servers + infra Docker containers)"
  echo "                    Add --observability to also stop the observability stack"
  echo "  --mode=docker     Stop all Docker Compose services (infra + app + observability)"
  echo "  --mode=k8s        Uninstall Helm release"
  echo ""
  echo "Granular options (use without --mode):"
  echo "  --all             Stop all services (UI, API, Docker)"
  echo "  --ui              Stop UI server only"
  echo "  --api             Stop API server only"
  echo "  --neo4j           Stop Neo4j only"
  echo "  --redis           Stop Redis only"
  echo "  --docker          Stop all Docker services"
  echo "  --servers         Stop UI and API servers only (keep Docker running)"
  echo "  --observability   Stop observability containers only"
  echo ""
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/stop.sh --mode=local                    # Stop servers + infra"
  echo "  ./scripts/stop.sh --mode=local --observability    # Stop servers + infra + observability"
  echo "  ./scripts/stop.sh --mode=docker                   # Stop full Docker stack"
  echo "  ./scripts/stop.sh --mode=k8s                      # Uninstall from Kubernetes"
  echo "  ./scripts/stop.sh --observability                 # Stop observability stack only"
  echo ""
}

if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

while [ $# -gt 0 ]; do
  case "$1" in
    --mode=*)
      MODE="${1#*=}"
      shift
      ;;
    --all)
      STOP_ALL=true
      shift
      ;;
    --ui)
      STOP_UI=true
      shift
      ;;
    --api)
      STOP_API=true
      shift
      ;;
    --neo4j)
      STOP_NEO4J=true
      shift
      ;;
    --redis)
      STOP_REDIS=true
      shift
      ;;
    --docker)
      STOP_DOCKER=true
      shift
      ;;
    --servers)
      STOP_SERVERS=true
      shift
      ;;
    --observability)
      OBSERVABILITY=true
      shift
      ;;
    -h|--help)
      show_usage
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option '$1'${NC}"
      show_usage
      exit 1
      ;;
  esac
done

echo "🛑 Stopping Diagram Builder services..."
echo ""

# ─── MODE-BASED STOP ─────────────────────────────────────────────────────────

if [ -n "$MODE" ]; then
  case "$MODE" in
    local)
      stop_ui
      stop_api
      if [ "$OBSERVABILITY" = "true" ]; then
        stop_observability
      fi
      echo ""
      echo -e "${GREEN}✅ Local services stopped!${NC}"
      ;;
    docker)
      stop_docker_all
      echo ""
      echo -e "${GREEN}✅ Docker stack stopped!${NC}"
      ;;
    k8s)
      NAMESPACE="${NAMESPACE:-diagram-builder}"
      echo "🚢 Uninstalling Helm release (namespace: ${NAMESPACE})..."
      if helm status diagram-builder --namespace "$NAMESPACE" > /dev/null 2>&1; then
        helm uninstall diagram-builder --namespace "$NAMESPACE"
        echo -e "  ${GREEN}✓${NC} Helm release uninstalled"
      else
        echo -e "  ${YELLOW}⚠${NC} Helm release 'diagram-builder' not found in namespace '${NAMESPACE}'"
      fi

      # Stop any active port forwards
      if [ -f /tmp/diagram-builder-port-forwards.pid ]; then
        echo "🔌 Stopping port forwards..."
        bash "$(dirname "$0")/port-forward.sh" --stop
      fi

      echo ""
      echo -e "${GREEN}✅ Kubernetes resources removed!${NC}"
      ;;
    *)
      echo -e "${RED}Error: Invalid mode '$MODE'. Must be local, docker, or k8s.${NC}"
      show_usage
      exit 1
      ;;
  esac
  exit 0
fi

# ─── GRANULAR OPTIONS ────────────────────────────────────────────────────────

if [ "$STOP_ALL" = true ]; then
  stop_ui
  stop_api
  stop_neo4j
  stop_redis
  stop_docker_all
  echo ""
  echo -e "${GREEN}✅ All services stopped!${NC}"
  exit 0
fi

if [ "$STOP_SERVERS" = true ]; then
  stop_ui
  stop_api
  echo ""
  echo -e "${GREEN}✅ Servers stopped! (Docker services still running)${NC}"
  exit 0
fi

if [ "$STOP_DOCKER" = true ]; then
  stop_docker_all
  echo ""
  echo -e "${GREEN}✅ Docker services stopped!${NC}"
  exit 0
fi

if [ "$OBSERVABILITY" = true ]; then
  stop_observability
  echo ""
  echo -e "${GREEN}✅ Observability services stopped!${NC}"
  exit 0
fi

[ "$STOP_UI" = true ]    && stop_ui
[ "$STOP_API" = true ]   && stop_api
[ "$STOP_NEO4J" = true ] && stop_neo4j
[ "$STOP_REDIS" = true ] && stop_redis

echo ""
echo -e "${GREEN}✅ Selected services stopped!${NC}"
