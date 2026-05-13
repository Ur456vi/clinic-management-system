#!/usr/bin/env bash
# scripts/daily_report.sh
#
# Generate today's Vyara daily task report at reports/<YYYY-MM-DD>.md with
# RFC822-style headers, ready for scripts/send_email.sh.
#
# Pulls data from:
#   - git log (today's merges, today's commits)
#   - the working ref state (open branches)
#   - assignments/<today>/ (drafted assignments)
#   - assignments/.email-log-<today>.txt (emails sent)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TODAY="$(date +%Y-%m-%d)"
TODAY_PRETTY="$(date '+%A, %B %-d, %Y')"
REPORT="reports/$TODAY.md"
mkdir -p reports

SINCE="${TODAY}T00:00:00"

# --- gather merges today (commits with "Merge" in subject) -------------------
merges=$(git --no-pager log --since="$SINCE" --merges --pretty=format:'- %s' main 2>/dev/null | sed 's/^- Merge /- /' || true)

# --- gather feature commits today --------------------------------------------
feat=$(git --no-pager log --since="$SINCE" --no-merges --pretty=format:'- %h %s (%an)' main 2>/dev/null || true)

# --- open branches (not yet merged into main) --------------------------------
open_branches=""
for ref in $(find .git/refs/heads/task .git/refs/heads/chore -type f ! -name '*.lock' 2>/dev/null); do
  name=${ref#.git/refs/heads/}
  sha=$(cat "$ref" 2>/dev/null) || continue
  [ -z "$sha" ] && continue
  if ! git merge-base --is-ancestor "$sha" main 2>/dev/null; then
    subject=$(git --no-pager log -1 --pretty=format:'%s' "$sha" 2>/dev/null | head -c 80)
    open_branches+="- \`$name\` — $subject"$'\n'
  fi
done

# --- today's drafted assignments ---------------------------------------------
drafted=""
if [ -d "assignments/$TODAY" ]; then
  for f in assignments/$TODAY/*.md; do
    [ -f "$f" ] || continue
    who=$(basename "$f" .md)
    subj=$(grep -m1 '^Subject:' "$f" | sed 's/^Subject: *//')
    drafted+="- $who → $f ($subj)"$'\n'
  done
fi

# --- emails sent today -------------------------------------------------------
emails_today=""
emails_count=0
log="assignments/.email-log-$TODAY.txt"
if [ -f "$log" ]; then
  emails_count=$(wc -l < "$log" | tr -d ' ')
  emails_today=$(awk '{print "- " $0}' "$log")
fi

# --- compose the report ------------------------------------------------------
cat > "$REPORT" <<EOM
To: Kunal <kunal@chirpin.in>
From: Vyara PM <onboarding@resend.dev>
Subject: [Vyara] Daily task report — $TODAY

Hi Kunal,

Daily status for $TODAY_PRETTY.

## Merged to main today
${merges:-_(none)_}

## Commits on main today
${feat:-_(none)_}

## Open PRs awaiting next PM review
${open_branches:-_(none)_}

## Today's frontend assignments (drafted by PM at 02:00)
${drafted:-_(none drafted)_}

## Emails sent today ($emails_count total — cap 90)
${emails_today:-_(none yet)_}

— Vyara PM (autonomous)
EOM

echo "$REPORT"
