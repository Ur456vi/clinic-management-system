#!/usr/bin/env bash
# scripts/send_weekly_sales_digest.sh
#
# Run by the Friday 18:00 IST scheduled task. Generates the weekly sales
# digest and sends it via Resend. Counts toward VYARA_EMAIL_DAILY_MAX.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo "[fri-18:00] generating weekly sales digest..."
digest=$("$ROOT/scripts/weekly_sales_digest.sh")
echo "  → $digest"

if "$ROOT/scripts/send_email.sh" --body-file "$digest"; then
  echo "  ✓ sent"
else
  echo "  ✗ send failed" >&2
  exit 1
fi
