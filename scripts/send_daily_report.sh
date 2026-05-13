#!/usr/bin/env bash
# scripts/send_daily_report.sh
#
# Generate today's daily report and email it to kunal@chirpin.in via Resend.
# Runs from the 20:00 scheduled task.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
report=$("$ROOT/scripts/daily_report.sh")
echo "[daily-report] generated $report"
"$ROOT/scripts/send_email.sh" --body-file "$report"
