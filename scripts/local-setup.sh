#!/usr/bin/env bash
# scripts/local-setup.sh
#
# One-shot end-to-end local setup: nuke any existing DB volume, start fresh
# Postgres, apply migrations, generate client, seed demo users, print
# credentials. Idempotent — safe to re-run when something gets out of sync.
#
# Usage:  bash scripts/local-setup.sh
#
# After it finishes, run:  npm run dev

set -euo pipefail

cd "$(dirname "$0")/.."

# Colors
G='\033[0;32m'; Y='\033[0;33m'; R='\033[0;31m'; N='\033[0m'
step() { printf "\n${G}==> %s${N}\n" "$1"; }
warn() { printf "${Y}!! %s${N}\n" "$1"; }
fail() { printf "${R}xx %s${N}\n" "$1"; exit 1; }

step "1. Sanity checks"

[ -f .env ] || fail ".env not found. Copy .env.example to .env first."

command -v docker >/dev/null || fail "Docker not installed."
docker ps >/dev/null 2>&1 || fail "Docker daemon is not running. Start Docker Desktop."

command -v node >/dev/null || fail "Node not installed."
[ -d node_modules ] || { step "Installing npm deps (one-time)"; npm install; }

step "2. Drop any existing Postgres volume and start fresh"
docker compose down -v
docker compose up -d postgres

step "3. Wait for Postgres to become healthy"
for i in {1..30}; do
  if docker compose exec -T postgres pg_isready -U postgres -d Vyara >/dev/null 2>&1; then
    echo "   Postgres ready (took ${i}s)"
    break
  fi
  sleep 1
  [ "$i" = "30" ] && fail "Postgres never became ready. Check 'docker compose logs postgres'."
done

step "4. Verify required extensions installed (init script should have run)"
EXTS=$(docker compose exec -T postgres psql -U postgres -d Vyara -tA -c "SELECT extname FROM pg_extension ORDER BY extname;" | tr '\n' ' ')
echo "   Installed: $EXTS"
echo "$EXTS" | grep -q citext   || fail "citext extension missing. Check docker/postgres/init/01-extensions.sql"
echo "$EXTS" | grep -q uuid-ossp || fail "uuid-ossp extension missing."

step "5. Apply Prisma migrations"
npx prisma migrate deploy

step "6. Generate Prisma client"
npx prisma generate

step "7. Seed demo data (users, departments, patients, treatment plans)"
npm run prisma:seed

step "8. Done. Demo credentials:"
cat <<'CREDS'

   Doctor    : dr.yuvraaj@example.com  /  Demo@123
   Admin     : admin@vyara.local       /  Demo@123
   Reception : reception@example.com   /  Demo@123
   Patient   : priya.patient@example.com / Demo@123

   Next step:  npm run dev
   Then open:  http://localhost:3000

CREDS
