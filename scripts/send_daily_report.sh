#!/usr/bin/env bash
# scripts/send_daily_report.sh
#
# Run by the 12:00 scheduled task. Generates and sends two reports back-to-back:
#   1. Daily task report   (reports/<YYYY-MM-DD>.md)        — overall git activity
#   2. AI developer report (reports/ai-dev-<YYYY-MM-DD>.md) — AI-agent activity
#
# Both go to kunal@chirpin.in via Resend and count toward VYARA_EMAIL_DAILY_MAX.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

fail=0

echo "[12:00-cron] generating daily task report..."
daily=$("$ROOT/scripts/daily_report.sh")
echo "  → $daily"
if "$ROOT/scripts/send_email.sh" --body-file "$daily"; then
  echo "  ✓ sent"
else
  echo "  ✗ send failed" >&2
  fail=$((fail+1))
fi

echo "[12:00-cron] generating AI developer report..."
aidev=$("$ROOT/scripts/ai_dev_report.sh")
echo "  → $aidev"
if "$ROOT/scripts/send_email.sh" --body-file "$aidev"; then
  echo "  ✓ sent"
else
  echo "  ✗ send failed" >&2
  fail=$((fail+1))
fi

exit $fail
