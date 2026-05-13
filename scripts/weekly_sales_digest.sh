#!/usr/bin/env bash
# scripts/weekly_sales_digest.sh
#
# Generate the Friday-evening sales digest for Abhishek (Sales Head) at
# reports/sales-digest-<YYYY-MM-DD>.md with RFC822-style headers, ready
# for scripts/send_email.sh.
#
# Scope: last 7 days of activity, framed for a sales conversation —
#   - What shipped (feat: / fix: commits merged into main)
#   - Demo-ready URLs (read from reports/demo-manifest.md if present)
#   - What's still in flight (open task/** and chore/** branches)
#   - Open blockers (REQUEST_CHANGES verdicts from PM in the last 7 days)

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TODAY="$(date +%Y-%m-%d)"
TODAY_PRETTY="$(date '+%A, %B %-d, %Y')"
WEEK_AGO="$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)"
REPORT="reports/sales-digest-$TODAY.md"
mkdir -p reports

SINCE="${WEEK_AGO}T00:00:00"

# --- features shipped this week (feat:/fix: commits merged into main) -------
shipped=$(git --no-pager log --since="$SINCE" --no-merges \
  --pretty=format:'%h|%s' main 2>/dev/null \
  | awk -F'|' '$2 ~ /^(feat|fix)(\([^)]+\))?:/' \
  | awk -F'|' '{printf "- `%s` %s\n", $1, $2}' \
  || true)

# --- merges this week (task/chore branches landed) --------------------------
merges=$(git --no-pager log --since="$SINCE" --merges \
  --pretty=format:'- %s' main 2>/dev/null \
  | sed 's/^- Merge /- /' || true)

# --- demo-ready URLs ---------------------------------------------------------
demo=""
if [ -f reports/demo-manifest.md ]; then
  demo=$(cat reports/demo-manifest.md)
else
  demo="_(no reports/demo-manifest.md yet — PM Agent will populate as features become demo-ready)_"
fi

# --- branches still in flight ------------------------------------------------
open_branches=""
for ref in $(find .git/refs/heads/task .git/refs/heads/chore .git/refs/heads/urvi .git/refs/heads/yasha .git/refs/heads/dhanjay -type f ! -name '*.lock' 2>/dev/null); do
  name=${ref#.git/refs/heads/}
  sha=$(cat "$ref" 2>/dev/null) || continue
  [ -z "$sha" ] && continue
  if ! git merge-base --is-ancestor "$sha" main 2>/dev/null; then
    subject=$(git --no-pager log -1 --pretty=format:'%s' "$sha" 2>/dev/null | head -c 80)
    open_branches+="- \`$name\` — $subject"$'\n'
  fi
done

# --- compose the digest ------------------------------------------------------
cat > "$REPORT" <<EOM
To: Abhishek Sharma <abhishek.sharma@algoborne.com>
Cc: Kunal <kunal@chirpin.in>, Varun Pratap Singh <varunpratapsingh191@gmail.com>
Subject: [Vyara] Weekly sales digest — $TODAY

Hi Abhishek,

Weekly digest of the Vyara engagement for the week ending $TODAY_PRETTY. Framed for sales conversations — what's demo-ready, what shipped, what's still cooking.

## Shipped this week
${shipped:-_(no feature commits merged this week)_}

## Branches merged this week
${merges:-_(no merges this week)_}

## Demo-ready surfaces
$demo

## Still in flight
${open_branches:-_(none — clean queue)_}

## How to use this digest

- **Shipped + demo-ready** → safe to show prospects in live demos this week.
- **Still in flight** → if a prospect asks "do you have X yet?", check this list first; PM Agent's next 07:30 shift may land it.
- For anything you want to commit to a customer timeline, ping Kunal before promising — he has the next-30-day roadmap.

— Vyara PM (autonomous, on behalf of Algoborne)
EOM

echo "$REPORT"
