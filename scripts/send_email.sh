#!/usr/bin/env bash
# scripts/send_email.sh
#
# Send a transactional email via Resend if RESEND_API_KEY is configured.
# Enforces a daily cap (VYARA_EMAIL_DAILY_MAX, default 90).
# Maintains a daily audit log at assignments/.email-log-<YYYY-MM-DD>.txt
#
# Body files use RFC822-style headers:
#
#     To: Urvi Sharma <sharmaurvi48@gmail.com>
#     Subject: [Vyara] Today's assignments - 2026-05-14
#     From: Vyara PM <pm@vyara.local>    # optional, overrides EMAIL_FROM
#
#     Hi Urvi,
#     ...
#
# Usage:
#   scripts/send_email.sh --body-file assignments/2026-05-14/urvi.md
#
# Or override headers on the CLI:
#   scripts/send_email.sh --to "name <addr>" --subject "..." --body-file <path>

set -euo pipefail

BODY_FILE=""
CLI_TO=""
CLI_SUBJECT=""
CLI_FROM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)         CLI_TO="$2"; shift 2 ;;
    --subject)    CLI_SUBJECT="$2"; shift 2 ;;
    --from)       CLI_FROM="$2"; shift 2 ;;
    --body-file)  BODY_FILE="$2"; shift 2 ;;
    *) echo "unknown arg: $1" >&2; exit 2 ;;
  esac
done

[ -n "$BODY_FILE" ] || { echo "Usage: $0 --body-file <path> [--to X --subject Y --from Z]" >&2; exit 2; }
[ -r "$BODY_FILE" ] || { echo "body file not readable: $BODY_FILE" >&2; exit 2; }

# Resolve project root (script lives in <root>/scripts/)
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Source .env.local for credentials (tolerate missing)
if [ -f "$ROOT/.env.local" ]; then
  set -a
  # shellcheck disable=SC1091
  . "$ROOT/.env.local"
  set +a
fi

MAX="${VYARA_EMAIL_DAILY_MAX:-90}"
TODAY="$(date +%Y-%m-%d)"
LOG_DIR="$ROOT/assignments"
LOG_FILE="$LOG_DIR/.email-log-$TODAY.txt"
mkdir -p "$LOG_DIR"
touch "$LOG_FILE"

# --- Parse headers from body file -------------------------------------------
# Reads until first blank line; remaining lines are the body.
declare TO SUBJECT FROM BODY
TO="$CLI_TO"
SUBJECT="$CLI_SUBJECT"
FROM="$CLI_FROM"
BODY=""

in_headers=1
while IFS= read -r line || [ -n "$line" ]; do
  if [ $in_headers -eq 1 ]; then
    if [ -z "$line" ]; then
      in_headers=0
      continue
    fi
    case "$line" in
      To:*)      [ -z "$TO" ]      && TO="${line#To:}"      && TO="${TO# }"     ;;
      Subject:*) [ -z "$SUBJECT" ] && SUBJECT="${line#Subject:}" && SUBJECT="${SUBJECT# }" ;;
      From:*)    [ -z "$FROM" ]    && FROM="${line#From:}"  && FROM="${FROM# }" ;;
      *) ;; # ignore unknown headers
    esac
  else
    BODY+="$line"$'\n'
  fi
done < "$BODY_FILE"

[ -n "$TO" ]      || { echo "no To: header in $BODY_FILE and no --to provided" >&2; exit 2; }
[ -n "$SUBJECT" ] || { echo "no Subject: header in $BODY_FILE and no --subject provided" >&2; exit 2; }
[ -n "$FROM" ]    || FROM="${EMAIL_FROM:-Vyara PM <onboarding@resend.dev>}"

# --- Daily cap check --------------------------------------------------------
SENT_TODAY=$(wc -l < "$LOG_FILE" | tr -d ' ')
if [ "$SENT_TODAY" -ge "$MAX" ]; then
  echo "[email] daily cap reached ($SENT_TODAY/$MAX) — refusing to send to $TO" >&2
  exit 3
fi

# --- Send via Resend (or fall back) -----------------------------------------
if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "[email] RESEND_API_KEY not set — leaving draft at $BODY_FILE (no send)" >&2
  echo "$(date -u +%FT%TZ) DRAFT $TO" >> "$LOG_FILE"
  exit 0
fi

PAYLOAD=$(python3 -c '
import json, sys
print(json.dumps({
  "from":    sys.argv[1],
  "to":      [sys.argv[2]],
  "subject": sys.argv[3],
  "text":    sys.argv[4],
}))' "$FROM" "$TO" "$SUBJECT" "$BODY")

HTTP_CODE=$(curl -sS -o /tmp/resend.out -w "%{http_code}" \
  -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD" || echo "000")

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  ID=$(python3 -c 'import json,sys; print(json.load(open("/tmp/resend.out")).get("id","?"))' 2>/dev/null || echo "?")
  echo "$(date -u +%FT%TZ) SENT  $TO  id=$ID" >> "$LOG_FILE"
  echo "[email] sent to $TO (id=$ID) — daily $(wc -l < "$LOG_FILE" | tr -d ' ')/$MAX"
else
  echo "$(date -u +%FT%TZ) FAIL  $TO  http=$HTTP_CODE" >> "$LOG_FILE"
  echo "[email] FAILED to send to $TO (http $HTTP_CODE):" >&2
  cat /tmp/resend.out >&2
  exit 1
fi
