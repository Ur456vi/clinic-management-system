#!/usr/bin/env bash
# scripts/send_morning_assignments.sh
#
# Run by the 09:00 scheduled task. Iterates assignments/<today>/*.md and
# sends each one via scripts/send_email.sh. Body files use the RFC822-style
# header format documented in send_email.sh.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TODAY="$(date +%Y-%m-%d)"
DIR="$ROOT/assignments/$TODAY"

if [ ! -d "$DIR" ]; then
  echo "[emailer-9am] no assignments directory for $TODAY at $DIR" >&2
  exit 0
fi

shopt -s nullglob
files=("$DIR"/*.md)
if [ ${#files[@]} -eq 0 ]; then
  echo "[emailer-9am] $DIR is empty — nothing to send"
  exit 0
fi

echo "[emailer-9am] $(date -u +%FT%TZ) — found ${#files[@]} draft(s) in $DIR"
fail=0
for f in "${files[@]}"; do
  echo "  - $f"
  if ! "$ROOT/scripts/send_email.sh" --body-file "$f"; then
    fail=$((fail+1))
  fi
done
echo "[emailer-9am] done. failures: $fail / ${#files[@]}"
exit $fail
