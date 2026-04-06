#!/usr/bin/env bash
# ============================================================================
# Reg-Tech Platform — Mac Development Setup
# ============================================================================
# Run: chmod +x scripts/setup-mac.sh && ./scripts/setup-mac.sh
# Safe to run multiple times (idempotent).
# ============================================================================

set -euo pipefail

# --- Colors ---
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*"; exit 1; }
step()    { echo -e "\n${CYAN}━━━ $* ━━━${NC}"; }

# --- Detect project root ---
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

echo -e "${CYAN}"
echo "  ╔═══════════════════════════════════════════╗"
echo "  ║     Reg-Tech Platform — Mac Setup         ║"
echo "  ║     Regulatory Technology Platform        ║"
echo "  ╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================================================
# 1. Homebrew
# ============================================================================
step "1/8  Checking Homebrew"
if command -v brew &>/dev/null; then
  success "Homebrew is installed ($(brew --version | head -1))"
else
  info "Installing Homebrew..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # Add to PATH for Apple Silicon
  if [[ -f /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  success "Homebrew installed"
fi

# ============================================================================
# 2. Node.js via nvm
# ============================================================================
step "2/8  Checking Node.js"
export NVM_DIR="${HOME}/.nvm"
[[ -s "$NVM_DIR/nvm.sh" ]] && source "$NVM_DIR/nvm.sh"

if ! command -v nvm &>/dev/null; then
  info "Installing nvm..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
  export NVM_DIR="${HOME}/.nvm"
  source "$NVM_DIR/nvm.sh"
  success "nvm installed"
fi

REQUIRED_NODE="22"
CURRENT_NODE=$(node --version 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [[ "$CURRENT_NODE" -ge "$REQUIRED_NODE" ]]; then
  success "Node.js $(node --version) is installed"
else
  info "Installing Node.js $REQUIRED_NODE..."
  nvm install "$REQUIRED_NODE"
  nvm use "$REQUIRED_NODE"
  nvm alias default "$REQUIRED_NODE"
  success "Node.js $(node --version) installed"
fi

# ============================================================================
# 3. pnpm
# ============================================================================
step "3/8  Checking pnpm"
if command -v pnpm &>/dev/null; then
  success "pnpm is installed ($(pnpm --version))"
else
  info "Installing pnpm..."
  npm install -g pnpm@latest
  success "pnpm $(pnpm --version) installed"
fi

# ============================================================================
# 4. Docker Desktop
# ============================================================================
step "4/8  Checking Docker"
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  success "Docker is running ($(docker --version))"
else
  if command -v docker &>/dev/null; then
    warn "Docker is installed but not running. Please start Docker Desktop."
    echo "    Open Docker Desktop from Applications, then re-run this script."
    exit 1
  else
    info "Installing Docker Desktop via Homebrew..."
    brew install --cask docker
    echo ""
    warn "Docker Desktop installed. Please:"
    echo "    1. Open Docker Desktop from Applications"
    echo "    2. Complete the initial setup"
    echo "    3. Re-run this script"
    exit 1
  fi
fi

# ============================================================================
# 5. Environment file
# ============================================================================
step "5/8  Setting up environment"
if [[ -f .env ]]; then
  success ".env file already exists"
else
  cp .env.example .env
  success "Created .env from .env.example"
  warn "Review .env and update secrets before production use"
fi

# ============================================================================
# 6. Install dependencies
# ============================================================================
step "6/8  Installing dependencies"
pnpm install
success "Dependencies installed"

# ============================================================================
# 7. Start infrastructure services
# ============================================================================
step "7/8  Starting Docker services (PostgreSQL, Redis, MinIO)"
docker compose up -d postgres redis minio

info "Waiting for services to be healthy..."
RETRIES=30
for i in $(seq 1 $RETRIES); do
  PG_HEALTHY=$(docker compose ps postgres --format json 2>/dev/null | grep -c '"healthy"' || true)
  REDIS_HEALTHY=$(docker compose ps redis --format json 2>/dev/null | grep -c '"healthy"' || true)

  if [[ "$PG_HEALTHY" -ge 1 ]] && [[ "$REDIS_HEALTHY" -ge 1 ]]; then
    success "All services are healthy"
    break
  fi

  if [[ "$i" -eq "$RETRIES" ]]; then
    warn "Services may still be starting. Check: docker compose ps"
    break
  fi

  printf "  Waiting... (%d/%d)\r" "$i" "$RETRIES"
  sleep 2
done

# ============================================================================
# 8. Database setup
# ============================================================================
step "8/8  Setting up database"
info "Running migrations..."
pnpm run db:migrate 2>/dev/null || warn "Migration command not yet configured — will work after first build"

info "Seeding database..."
pnpm run db:seed 2>/dev/null || warn "Seed command not yet configured — will work after first build"

# ============================================================================
# Summary
# ============================================================================
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${CYAN}Start development:${NC}"
echo "    pnpm run dev          # All apps"
echo "    bash scripts/dev.sh   # All apps + Docker"
echo ""
echo -e "  ${CYAN}Individual apps:${NC}"
echo "    pnpm --filter @reg-tech/api run start:dev     # API     → http://localhost:3000"
echo "    pnpm --filter @reg-tech/fi-portal run dev     # FI      → http://localhost:3001"
echo "    pnpm --filter @reg-tech/tax-portal run dev    # TA      → http://localhost:3002"
echo ""
echo -e "  ${CYAN}Infrastructure:${NC}"
echo "    MinIO Console  → http://localhost:9001  (regtech / regtech-secret)"
echo "    PostgreSQL     → localhost:5432          (regtech / regtech)"
echo "    Redis          → localhost:6379"
echo ""
echo -e "  ${CYAN}VS Code:${NC}"
echo "    code .                                   # Open project"
echo "    code .vscode/reg-tech.code-workspace     # Open multi-root workspace"
echo ""
echo -e "  ${CYAN}Useful commands:${NC}"
echo "    pnpm run build        # Build all packages"
echo "    pnpm run test         # Run all tests"
echo "    pnpm run lint         # Lint all code"
echo "    bash scripts/reset-db.sh  # Reset database"
echo ""
