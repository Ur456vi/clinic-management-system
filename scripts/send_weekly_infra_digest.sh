#!/usr/bin/env bash
# scripts/send_weekly_infra_digest.sh
#
# Run by the Friday 17:30 IST scheduled task. Generates + sends the weekly
# infra digest via Resend. Counts toward VYARA_EMAIL_DAILY_MAX.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[fri-17:30] generating weekly infra digest..."
digest=$("$ROOT/scripts/weekly_infra_digest.sh")
echo "  → $digest"

if "$ROOT/scripts/send_email.sh" --body-file "$digest"; then
  echo "  ✓ sent"
else
  echo "  ✗ send failed" >&2
  exit 1
fi
