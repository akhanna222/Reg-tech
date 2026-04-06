#!/usr/bin/env bash
# ============================================================================
# Reg-Tech — Quick Dev Startup
# Starts Docker services and all apps in parallel
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# Cleanup on exit
cleanup() {
  echo ""
  info "Shutting down..."
  kill 0 2>/dev/null || true
  info "Dev servers stopped. Docker services are still running."
  info "Run 'docker compose down' to stop infrastructure."
}
trap cleanup EXIT INT TERM

# Check .env
if [[ ! -f .env ]]; then
  warn "No .env file found. Copying from .env.example..."
  cp .env.example .env
fi

# Start Docker if not running
info "Checking Docker services..."
if ! docker compose ps --services --filter "status=running" 2>/dev/null | grep -q postgres; then
  info "Starting Docker services..."
  docker compose up -d postgres redis minio

  info "Waiting for services..."
  sleep 5

  for i in $(seq 1 20); do
    if docker compose exec -T postgres pg_isready -U regtech &>/dev/null; then
      success "PostgreSQL is ready"
      break
    fi
    sleep 1
  done

  for i in $(seq 1 10); do
    if docker compose exec -T redis redis-cli ping &>/dev/null; then
      success "Redis is ready"
      break
    fi
    sleep 1
  done
else
  success "Docker services already running"
fi

echo ""
success "Starting development servers..."
echo ""
echo -e "  ${GREEN}API${NC}         → http://localhost:3000/api"
echo -e "  ${GREEN}Swagger${NC}     → http://localhost:3000/api/docs"
echo -e "  ${GREEN}FI Portal${NC}   → http://localhost:3001"
echo -e "  ${GREEN}Tax Portal${NC}  → http://localhost:3002"
echo -e "  ${GREEN}MinIO${NC}       → http://localhost:9001"
echo ""

# Start all apps via Turborepo
pnpm run dev
