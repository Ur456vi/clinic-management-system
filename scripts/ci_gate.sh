#!/usr/bin/env bash
# scripts/ci_gate.sh
#
# Quality gate run by the PM Agent before deciding MERGE on a candidate branch.
# Each gate exits non-zero on failure with a concise summary printed to stderr.
#
# Usage:
#   scripts/ci_gate.sh                  # gate the current branch
#   scripts/ci_gate.sh <branch>         # checkout <branch> and gate it
#
# Exit codes:
#   0   all gates pass — branch is safe to merge
#   2   prisma schema not formatted
#   3   prisma schema invalid
#   4   typecheck failed
#   5   eslint failed
#   6   dependency install failed
#
# Caches node_modules between calls inside the same shell session — set
# VYARA_CI_FRESH=1 to force a clean install.

set -euo pipefail

BRANCH="${1:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ -n "$BRANCH" ]; then
  echo "[ci] checking out $BRANCH"
  git -c advice.detachedHead=false checkout -q "$BRANCH"
fi

HEAD_NOW=$(git rev-parse HEAD)
echo "[ci] gate target: $HEAD_NOW ($(git --no-pager log -1 --pretty=format:'%s' HEAD))"

# --- 1. Install dependencies -------------------------------------------------
INSTALL_SENTINEL=".ci-installed-for"
NEED_INSTALL=1
if [ "${VYARA_CI_FRESH:-0}" = "1" ]; then
  echo "[ci] VYARA_CI_FRESH=1 — forcing fresh install"
  rm -rf node_modules "$INSTALL_SENTINEL"
elif [ -f "$INSTALL_SENTINEL" ] && [ -d node_modules ]; then
  cached_for=$(cat "$INSTALL_SENTINEL" 2>/dev/null)
  current_lock_hash=$(sha256sum package-lock.json 2>/dev/null | awk '{print $1}')
  if [ "$cached_for" = "$current_lock_hash" ]; then
    echo "[ci] reusing cached node_modules (lockfile hash matches)"
    NEED_INSTALL=0
  fi
fi

if [ "$NEED_INSTALL" = "1" ]; then
  echo "[ci] installing dependencies..."
  if ! npm install --silent --no-audit --no-fund --prefer-offline >/tmp/ci-install.log 2>&1; then
    echo "[ci] FAIL: npm install errored. tail:" >&2
    tail -30 /tmp/ci-install.log >&2
    exit 6
  fi
  sha256sum package-lock.json 2>/dev/null | awk '{print $1}' > "$INSTALL_SENTINEL"
  echo "[ci] dependencies installed"
fi

# --- 2. Prisma schema format check -------------------------------------------
echo "[ci] prisma format --check..."
SCHEMA_BEFORE=$(cat prisma/schema.prisma | sha256sum | awk '{print $1}')
npx --offline prisma format >/tmp/ci-prisma-fmt.log 2>&1 || true
SCHEMA_AFTER=$(cat prisma/schema.prisma | sha256sum | awk '{print $1}')
if [ "$SCHEMA_BEFORE" != "$SCHEMA_AFTER" ]; then
  echo "[ci] FAIL: prisma/schema.prisma is not formatted. Run 'npm run prisma:format' and recommit." >&2
  # Restore unformatted version so we don't accidentally taint the working tree
  git checkout -- prisma/schema.prisma 2>/dev/null || true
  exit 2
fi

# --- 3. Prisma schema validation ---------------------------------------------
echo "[ci] prisma validate..."
if ! npx --offline prisma validate >/tmp/ci-prisma-val.log 2>&1; then
  echo "[ci] FAIL: prisma validate errors:" >&2
  tail -20 /tmp/ci-prisma-val.log >&2
  exit 3
fi

# --- 4. TypeScript typecheck -------------------------------------------------
echo "[ci] tsc --noEmit..."
if ! npx --offline tsc --noEmit >/tmp/ci-tsc.log 2>&1; then
  echo "[ci] FAIL: TypeScript errors:" >&2
  tail -40 /tmp/ci-tsc.log >&2
  exit 4
fi

# --- 5. ESLint ---------------------------------------------------------------
echo "[ci] eslint . --quiet..."
if ! npx --offline eslint . --quiet --max-warnings=0 >/tmp/ci-eslint.log 2>&1; then
  echo "[ci] FAIL: ESLint errors:" >&2
  tail -40 /tmp/ci-eslint.log >&2
  exit 5
fi

echo "[ci] ✓ all gates pass"
exit 0
