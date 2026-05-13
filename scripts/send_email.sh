#!/usr/bin/env bash
# scripts/send_email.sh
#
# Send a transactional email via Resend if RESEND_API_KEY is configured,
# else write a draft file under assignments/<date>/<slug>.md and exit 0.
#
# Usage:
#   scripts/send_email.sh \
#     --to "Urvi Sharma <sharmaurvi48@gmail.com>" \
#     --subject "[Vyara] Today's assignments — 2026-05-13" \
#     --body-file assignments/2026-05-13/urvi.md
#
# Reads RESEND_API_KEY and EMAIL_FROM from .env.local in the project root.

set -euo pipefail

TO=""
SUBJECT=""
BODY_FILE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)         TO="$2"; shift 2 ;;
    --subject)    SUBJECT="$2"; shift 2 ;;
    --body-file)  BODY_FILE="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[ -n "$TO" ] && [ -n "$SUBJECT" ] && [ -n "$BODY_FILE" ] || {
  echo "Usage: $0 --to <addr> --subject <s> --body-file <path>" >&2
  exit 2
}
[ -r "$BODY_FILE" ] || { echo "body file not readable: $BODY_FILE" >&2; exit 2; }

# Source .env.local if present (best-effort; tolerate missing keys)
ENV_FILE="$(dirname "$0")/../.env.local"
if [ -f "$ENV_FILE" ]; then
  set -a
  # shellcheck disable=SC1090
  . "$ENV_FILE"
  set +a
fi

if [ -n "${RESEND_API_KEY:-}" ]; then
  FROM="${EMAIL_FROM:-Vyara <no-reply@vyara.local>}"
  BODY_JSON=$(python3 -c 'import json,sys; print(json.dumps(open(sys.argv[1]).read()))' "$BODY_FILE")
  PAYLOAD=$(python3 -c '
import json, sys
print(json.dumps({
  "from":    sys.argv[1],
  "to":      [sys.argv[2]],
  "subject": sys.argv[3],
  "text":    json.loads(sys.argv[4]),
}))' "$FROM" "$TO" "$SUBJECT" "$BODY_JSON")
  echo "→ sending via Resend to $TO"
  curl -sS --fail \
    -X POST "https://api.resend.com/emails" \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD"
  echo
  echo "✓ sent"
else
  echo "RESEND_API_KEY not set — falling back to draft file (already at $BODY_FILE)" >&2
fi
