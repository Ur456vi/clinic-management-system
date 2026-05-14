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
CLI_CC=""
CLI_SUBJECT=""
CLI_FROM=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --to)         CLI_TO="$2"; shift 2 ;;
    --cc)         CLI_CC="$2"; shift 2 ;;
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
declare TO CC SUBJECT FROM BODY
TO="$CLI_TO"
CC="$CLI_CC"
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
      Cc:*)      [ -z "$CC" ]      && CC="${line#Cc:}"      && CC="${CC# }"     ;;
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
# Recipient-sends already counted today (sum of to + cc per send)
SENT_TODAY=$(awk '
  /^.* SENT  /  { n=1; if ($0 ~ /cc=/) { cc=$0; sub(/.*cc=/,"",cc); sub(/ .*/,"",cc); split(cc, a, ","); for (i in a) if (a[i] != "") n++ } total += n }
  END { print total+0 }
' "$LOG_FILE")
# This send will count: 1 (to) + (count of cc addresses, if any)
THIS_SEND=1
if [ -n "$CC" ]; then
  CC_COUNT=$(awk -F, '{n=0; for (i=1; i<=NF; i++) if ($i ~ /[^[:space:]]/) n++; print n}' <<<"$CC")
  THIS_SEND=$((1 + CC_COUNT))
fi
if [ $((SENT_TODAY + THIS_SEND)) -gt "$MAX" ]; then
  echo "[email] daily cap would be exceeded ($SENT_TODAY+$THIS_SEND > $MAX) — refusing to send to $TO${CC:+ cc=$CC}" >&2
  exit 3
fi

# --- Send via Resend (or fall back) -----------------------------------------
if [ -z "${RESEND_API_KEY:-}" ]; then
  echo "[email] RESEND_API_KEY not set — leaving draft at $BODY_FILE (no send)" >&2
  echo "$(date -u +%FT%TZ) DRAFT $TO" >> "$LOG_FILE"
  exit 0
fi

# HTML body. Preference order:
#   1. A sibling <basename>.html file next to the .md draft.
#   2. Auto-rendered from the markdown body via scripts/render_email_html.py.
# This means every email goes out HTML by default; PMs only have to write .md.
HTML_FILE="${BODY_FILE%.md}.html"
HTML_BODY=""
if [ -r "$HTML_FILE" ] && [ "$HTML_FILE" != "$BODY_FILE" ]; then
  HTML_BODY="$(cat "$HTML_FILE")"
elif [ -x "$ROOT/scripts/render_email_html.py" ] || [ -r "$ROOT/scripts/render_email_html.py" ]; then
  if HTML_BODY="$(python3 "$ROOT/scripts/render_email_html.py" \
        --subject "$SUBJECT" --body-file "$BODY_FILE" 2>/dev/null)"; then
    :
  else
    echo "[email] HTML auto-render failed; falling back to text-only" >&2
    HTML_BODY=""
  fi
fi

PAYLOAD=$(python3 -c '
import json, sys
payload = {
  "from":    sys.argv[1],
  "to":      [sys.argv[2]],
  "subject": sys.argv[3],
  "text":    sys.argv[4],
}
cc = sys.argv[5].strip() if len(sys.argv) > 5 else ""
if cc:
    payload["cc"] = [a.strip() for a in cc.split(",") if a.strip()]
html = sys.argv[6] if len(sys.argv) > 6 else ""
if html:
    payload["html"] = html
print(json.dumps(payload))' "$FROM" "$TO" "$SUBJECT" "$BODY" "$CC" "$HTML_BODY")

RESP_FILE=$(mktemp -t resend.XXXXXX)
trap 'rm -f "$RESP_FILE"' EXIT

if HTTP_CODE=$(curl -sS -o "$RESP_FILE" -w "%{http_code}" \
  -X POST "https://api.resend.com/emails" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD"); then
  : # curl ok; HTTP_CODE holds the status
else
  HTTP_CODE="000"
fi

if [[ "$HTTP_CODE" =~ ^2 ]]; then
  ID=$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1])).get("id","?"))' "$RESP_FILE" 2>/dev/null || echo "?")
  echo "$(date -u +%FT%TZ) SENT  $TO${CC:+ cc=$CC}  id=$ID" >> "$LOG_FILE"
  echo "[email] sent to $TO${CC:+ cc=$CC} (id=$ID) — daily ~$(wc -l < "$LOG_FILE" | tr -d ' ') sends, recipient-cap $MAX"
else
  echo "$(date -u +%FT%TZ) FAIL  $TO${CC:+ cc=$CC}  http=$HTTP_CODE" >> "$LOG_FILE"
  echo "[email] FAILED to send to $TO (http $HTTP_CODE):" >&2
  cat "$RESP_FILE" >&2
  echo >&2
  exit 1
fi
