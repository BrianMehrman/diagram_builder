#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to stop UI server
stop_ui() {
  echo "🎨 Stopping UI server..."
  if lsof -ti:3000 > /dev/null 2>&1; then
    kill $(lsof -ti:3000) 2>/dev/null
    echo -e "  ${GREEN}✓${NC} UI server stopped (port 3000)"
  else
    echo -e "  ${YELLOW}⚠${NC} UI server not running"
  fi
}

# Function to stop API server
stop_api() {
  echo "🔧 Stopping API server..."
  if lsof -ti:4000 > /dev/null 2>&1; then
    kill $(lsof -ti:4000) 2>/dev/null
    echo -e "  ${GREEN}✓${NC} API server stopped (port 4000)"
  else
    echo -e "  ${YELLOW}⚠${NC} API server not running"
  fi
}

# Function to stop Neo4j
stop_neo4j() {
  echo "📦 Stopping Neo4j..."
  if docker ps | grep -q diagram-builder-neo4j; then
    docker-compose stop neo4j > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Neo4j stopped"
  else
    echo -e "  ${YELLOW}⚠${NC} Neo4j not running"
  fi
}

# Function to stop Redis
stop_redis() {
  echo "📦 Stopping Redis..."
  if docker ps | grep -q diagram-builder-redis; then
    docker-compose stop redis > /dev/null 2>&1
    echo -e "  ${GREEN}✓${NC} Redis stopped"
  else
    echo -e "  ${YELLOW}⚠${NC} Redis not running"
  fi
}

# Function to stop all Docker services
stop_docker() {
  echo "📦 Stopping all Docker services..."
  docker-compose down > /dev/null 2>&1
  echo -e "  ${GREEN}✓${NC} All Docker services stopped"
}

# Function to show usage
show_usage() {
  echo ""
  echo -e "${BLUE}Diagram Builder - Stop Script${NC}"
  echo ""
  echo "Usage: ./scripts/stop.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --all           Stop all services (UI, API, Docker)"
  echo "  --ui            Stop UI server only"
  echo "  --api           Stop API server only"
  echo "  --neo4j         Stop Neo4j only"
  echo "  --redis         Stop Redis only"
  echo "  --docker        Stop all Docker services (Neo4j + Redis)"
  echo "  --servers       Stop UI and API servers only (keep Docker running)"
  echo "  -h, --help      Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/stop.sh --all         # Stop everything"
  echo "  ./scripts/stop.sh --ui --api    # Stop just the servers"
  echo "  ./scripts/stop.sh --neo4j       # Stop just Neo4j"
  echo ""
}

# Parse command line arguments
if [ $# -eq 0 ]; then
  show_usage
  exit 0
fi

STOP_ALL=false
STOP_UI=false
STOP_API=false
STOP_NEO4J=false
STOP_REDIS=false
STOP_DOCKER=false
STOP_SERVERS=false

while [ $# -gt 0 ]; do
  case "$1" in
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

# Handle --all flag
if [ "$STOP_ALL" = true ]; then
  stop_ui
  stop_api
  stop_docker
  echo ""
  echo -e "${GREEN}✅ All services stopped!${NC}"
  exit 0
fi

# Handle --servers flag
if [ "$STOP_SERVERS" = true ]; then
  stop_ui
  stop_api
  echo ""
  echo -e "${GREEN}✅ Servers stopped! (Docker services still running)${NC}"
  exit 0
fi

# Handle --docker flag (stops both Neo4j and Redis)
if [ "$STOP_DOCKER" = true ]; then
  stop_docker
  echo ""
  echo -e "${GREEN}✅ Docker services stopped!${NC}"
  exit 0
fi

# Stop individual services as requested
if [ "$STOP_UI" = true ]; then
  stop_ui
fi

if [ "$STOP_API" = true ]; then
  stop_api
fi

if [ "$STOP_NEO4J" = true ]; then
  stop_neo4j
fi

if [ "$STOP_REDIS" = true ]; then
  stop_redis
fi

echo ""
echo -e "${GREEN}✅ Selected services stopped!${NC}"
