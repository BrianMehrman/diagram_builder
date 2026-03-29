#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

NAMESPACE="diagram-builder"
CONTEXT="docker-desktop"
PID_FILE="/tmp/diagram-builder-port-forwards.pid"
STOP_MODE=false

show_usage() {
  echo ""
  echo -e "${BLUE}Diagram Builder - Port Forward Script${NC}"
  echo ""
  echo "Usage: ./scripts/port-forward.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --namespace=NS    Kubernetes namespace (default: diagram-builder)"
  echo "  --context=NAME    Kubernetes context (default: docker-desktop)"
  echo "  --stop            Stop active port forwards and exit"
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/port-forward.sh                   # Start port forwarding"
  echo "  ./scripts/port-forward.sh --stop            # Stop port forwarding"
  echo "  ./scripts/port-forward.sh --namespace=prod  # Different namespace"
  echo ""
}

for arg in "$@"; do
  case "$arg" in
    --namespace=*) NAMESPACE="${arg#*=}" ;;
    --context=*)   CONTEXT="${arg#*=}"   ;;
    --stop)        STOP_MODE=true        ;;
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

# ─── STOP MODE ────────────────────────────────────────────────────────────────

stop_forwards() {
  if [ ! -f "$PID_FILE" ]; then
    echo -e "${YELLOW}⚠${NC} No active port forwards found (PID file missing)"
    return 0
  fi

  echo "🔌 Stopping port forwards..."
  while IFS= read -r pid; do
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null
      echo -e "  ${GREEN}✓${NC} Stopped PID $pid"
    fi
  done < "$PID_FILE"

  rm -f "$PID_FILE"
  echo -e "${GREEN}✅ Port forwards stopped${NC}"
}

if [ "$STOP_MODE" = true ]; then
  stop_forwards
  exit 0
fi

# ─── START MODE ───────────────────────────────────────────────────────────────

# Clean up existing forwards first
if [ -f "$PID_FILE" ]; then
  echo "🧹 Cleaning up existing port forwards..."
  stop_forwards
fi

echo "🔌 Starting port forwards (namespace: ${NAMESPACE}, context: ${CONTEXT})..."
echo ""

# Verify kubectl is available
if ! command -v kubectl > /dev/null 2>&1; then
  echo -e "${RED}Error: kubectl not found${NC}"
  echo "  Install: https://kubernetes.io/docs/tasks/tools/"
  exit 1
fi

# Services to forward: "local_port:remote_port service_name description"
declare -a FORWARDS=(
  "8741:8741 svc/diagram-builder-api                                    API"
  "8742:80   svc/diagram-builder-ui                                     UI"
  "8743:80   svc/diagram-builder-kube-prometheus-stack-grafana          Grafana"
  "16686:16686 svc/diagram-builder-jaeger-query                         Jaeger"
  "9090:9090 svc/diagram-builder-kube-prometheus-stack-prometheus       Prometheus"
)

pids=()
failed=()

for fwd in "${FORWARDS[@]}"; do
  ports=$(echo "$fwd" | awk '{print $1}')
  svc=$(echo "$fwd" | awk '{print $2}')
  name=$(echo "$fwd" | awk '{print $3}')
  local_port="${ports%%:*}"

  kubectl port-forward "$svc" "$ports" \
    --namespace "$NAMESPACE" \
    --context "$CONTEXT" \
    > /tmp/diagram-builder-pf-${local_port}.log 2>&1 &

  pid=$!
  sleep 0.5

  if kill -0 "$pid" 2>/dev/null; then
    pids+=("$pid")
    echo -e "  ${GREEN}✓${NC} $name ($svc → localhost:$local_port)"
  else
    failed+=("$name ($svc)")
    echo -e "  ${RED}✗${NC} $name ($svc) — failed to start"
    echo "    Log: $(cat /tmp/diagram-builder-pf-${local_port}.log 2>/dev/null | head -3)"
  fi
done

# Save PIDs
printf '%s\n' "${pids[@]}" > "$PID_FILE"

if [ ${#failed[@]} -gt 0 ]; then
  echo ""
  echo -e "${YELLOW}⚠ Some services failed to forward:${NC}"
  for f in "${failed[@]}"; do
    echo "  - $f"
  done
  echo ""
  echo "  Services may not be deployed yet. Check: kubectl get pods -n $NAMESPACE"
fi

echo ""
echo -e "${GREEN}✅ Port forwarding active${NC}"
echo ""
echo "Service URLs:"
echo -e "  UI:         ${BLUE}http://localhost:8742${NC}"
echo -e "  API:        ${BLUE}http://localhost:8741${NC}"
echo -e "  Grafana:    ${BLUE}http://localhost:8743${NC}"
echo -e "  Jaeger:     ${BLUE}http://localhost:16686${NC}"
echo -e "  Prometheus: ${BLUE}http://localhost:9090${NC}"
echo ""
echo "Press Ctrl+C to stop all port forwards"
echo ""

# Trap SIGINT/SIGTERM for clean shutdown
cleanup() {
  echo ""
  echo "🛑 Shutting down port forwards..."
  stop_forwards
  exit 0
}
trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
