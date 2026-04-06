#!/usr/bin/env bash
# ============================================================================
# Reg-Tech — Database Reset
# Drops, recreates, migrates, and seeds the database
# ============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }

# Load env
if [[ -f .env ]]; then
  set -a
  source .env
  set +a
fi

DB_HOST="${DATABASE_HOST:-localhost}"
DB_PORT="${DATABASE_PORT:-5432}"
DB_USER="${DATABASE_USER:-regtech}"
DB_NAME="${DATABASE_NAME:-regtech}"

echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}  WARNING: This will DESTROY all data!${NC}"
echo -e "${RED}  Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
read -p "Are you sure? Type 'yes' to continue: " CONFIRM

if [[ "$CONFIRM" != "yes" ]]; then
  info "Cancelled."
  exit 0
fi

echo ""
info "Dropping database ${DB_NAME}..."
docker compose exec -T postgres dropdb -U "$DB_USER" --if-exists "$DB_NAME"
success "Database dropped"

info "Creating database ${DB_NAME}..."
docker compose exec -T postgres createdb -U "$DB_USER" "$DB_NAME"
success "Database created"

info "Running migrations..."
pnpm run db:migrate
success "Migrations complete"

info "Seeding database..."
pnpm run db:seed
success "Database seeded"

echo ""
success "Database reset complete!"
echo ""
