#!/bin/bash
set -e

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

CONTEXT="docker-desktop"
VALUES="values.docker-desktop.yaml"
NAMESPACE="diagram-builder"
CHART_DIR="./helm/diagram-builder"

show_usage() {
  echo ""
  echo -e "${BLUE}Diagram Builder - Helm Deploy Script${NC}"
  echo ""
  echo "Usage: ./scripts/deploy-helm.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  --context=NAME    Kubernetes context (default: docker-desktop)"
  echo "  --values=FILE     Values file under helm/diagram-builder/ (default: values.docker-desktop.yaml)"
  echo "  --namespace=NS    Kubernetes namespace (default: diagram-builder)"
  echo "  -h, --help        Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./scripts/deploy-helm.sh"
  echo "  ./scripts/deploy-helm.sh --context=minikube --values=values.minikube.yaml"
  echo ""
}

for arg in "$@"; do
  case "$arg" in
    --context=*)  CONTEXT="${arg#*=}"  ;;
    --values=*)   VALUES="${arg#*=}"   ;;
    --namespace=*) NAMESPACE="${arg#*=}" ;;
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

# ─── PREREQUISITE CHECK ───────────────────────────────────────────────────────

echo "🔍 Checking prerequisites..."

check_cmd() {
  local cmd="$1"
  local hint="$2"
  if ! command -v "$cmd" > /dev/null 2>&1; then
    echo -e "  ${RED}✗${NC} $cmd not found"
    echo "    Install: $hint"
    exit 1
  fi
  echo -e "  ${GREEN}✓${NC} $cmd"
}

check_cmd helm    "https://helm.sh/docs/intro/install/"
check_cmd kubectl "https://kubernetes.io/docs/tasks/tools/"

# Verify context exists
if ! kubectl config get-contexts "$CONTEXT" > /dev/null 2>&1; then
  echo -e "  ${RED}✗${NC} kubectl context '$CONTEXT' not found"
  echo "    Available contexts:"
  kubectl config get-contexts --no-headers | awk '{print "      " $2}'
  exit 1
fi
echo -e "  ${GREEN}✓${NC} kubectl context: $CONTEXT"

# Verify values file exists
VALUES_PATH="${CHART_DIR}/${VALUES}"
if [ ! -f "$VALUES_PATH" ]; then
  echo -e "  ${RED}✗${NC} Values file not found: $VALUES_PATH"
  echo "    Available values files:"
  ls "${CHART_DIR}"/values*.yaml 2>/dev/null | sed 's/^/      /' || echo "      (none found)"
  exit 1
fi
echo -e "  ${GREEN}✓${NC} values file: $VALUES"

# Verify Helm chart directory exists
if [ ! -f "${CHART_DIR}/Chart.yaml" ]; then
  echo -e "  ${RED}✗${NC} Helm chart not found at $CHART_DIR"
  echo "    Run Story 12-8 to scaffold the Helm chart first."
  exit 1
fi
echo -e "  ${GREEN}✓${NC} helm chart: $CHART_DIR"

# ─── DEPENDENCY UPDATE ────────────────────────────────────────────────────────

CHART_LOCK="${CHART_DIR}/Chart.lock"
CHART_YAML="${CHART_DIR}/Chart.yaml"

needs_dep_update=false
if [ ! -f "$CHART_LOCK" ]; then
  needs_dep_update=true
elif [ "$CHART_YAML" -nt "$CHART_LOCK" ]; then
  needs_dep_update=true
fi

if [ "$needs_dep_update" = "true" ]; then
  echo "📦 Updating Helm dependencies..."
  helm dependency update "$CHART_DIR"
  echo -e "  ${GREEN}✓${NC} Dependencies updated"
else
  echo -e "  ${GREEN}✓${NC} Helm dependencies up to date"
fi

# ─── DEPLOY ───────────────────────────────────────────────────────────────────

echo ""
echo "🚢 Deploying diagram-builder..."
echo -e "   context:   ${BLUE}${CONTEXT}${NC}"
echo -e "   namespace: ${BLUE}${NAMESPACE}${NC}"
echo -e "   values:    ${BLUE}${VALUES}${NC}"
echo ""

if helm upgrade --install diagram-builder "$CHART_DIR" \
  --namespace "$NAMESPACE" \
  --create-namespace \
  --kube-context "$CONTEXT" \
  -f "$VALUES_PATH" \
  --wait \
  --timeout 5m; then

  echo ""
  echo -e "${GREEN}✅ Deployment successful!${NC}"
  echo ""

  echo "📊 Pod status:"
  kubectl get pods --namespace "$NAMESPACE" --context "$CONTEXT" | sed 's/^/  /'

  echo ""
  echo "🌐 Services:"
  kubectl get services --namespace "$NAMESPACE" --context "$CONTEXT" | sed 's/^/  /'

else
  echo ""
  echo -e "${RED}❌ Deployment failed!${NC}"
  echo ""

  echo "📋 Helm status:"
  helm status diagram-builder --namespace "$NAMESPACE" --kube-context "$CONTEXT" 2>/dev/null | head -30 | sed 's/^/  /'

  echo ""
  echo "🔍 Recent pod events (last 50 lines of failing pods):"
  kubectl get pods --namespace "$NAMESPACE" --context "$CONTEXT" \
    --field-selector=status.phase!=Running \
    --no-headers 2>/dev/null | awk '{print $1}' | while read -r pod; do
    echo ""
    echo "  Pod: $pod"
    kubectl logs "$pod" --namespace "$NAMESPACE" --context "$CONTEXT" \
      --tail=50 --previous 2>/dev/null | sed 's/^/    /' || \
    kubectl logs "$pod" --namespace "$NAMESPACE" --context "$CONTEXT" \
      --tail=50 2>/dev/null | sed 's/^/    /' || \
    echo "    (no logs available)"
  done

  exit 1
fi
