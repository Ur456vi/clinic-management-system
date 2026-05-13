#!/usr/bin/env bash
# scripts/ai_dev_report.sh
#
# Generate the daily AI-developer activity report at
# reports/ai-dev-<YYYY-MM-DD>.md with RFC822 headers, ready for
# scripts/send_email.sh.
#
# Scope: last 24 hours of activity attributable to the AI side of the team
# (Dev-Agent-*, Orchestrator, PM-Agent, "Claude (Night Shift)" authors;
# merges of task/** branches).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TODAY="$(date +%Y-%m-%d)"
TODAY_PRETTY="$(date '+%A, %B %-d, %Y')"
REPORT="reports/ai-dev-$TODAY.md"
mkdir -p reports

SINCE="${TODAY}T00:00:00"

# --- AI dev commits today (non-merge, AI authors) ---------------------------
ai_commits=$(git --no-pager log --since="$SINCE" --no-merges \
  --pretty=format:'%h|%an|%s' main 2>/dev/null \
  | awk -F'|' '
      $2 ~ /^Dev-Agent-/        { print; next }
      $2 == "Orchestrator"      { print; next }
      $2 == "PM-Agent"          { print; next }
      $2 == "Claude (Night Shift)" { print; next }
    ' \
  | awk -F'|' '{printf "- `%s` %s _(%s)_\n", $1, $3, $2}' \
  || true)

# --- Today's merge commits targeting task/** branches -----------------------
# (subject-based — author varies between Orchestrator and PM-Agent across history)
ai_merges=$(git --no-pager log --since="$SINCE" --merges \
  --pretty=format:'%h|%an|%s' main 2>/dev/null \
  | awk -F'|' '$3 ~ /^Merge task\//' \
  | awk -F'|' '{
      branch=$3; sub(/^Merge /,"",branch);
      printf "- `%s` → `%s` _(merger: %s)_\n", $1, branch, $2
    }' \
  || true)

# --- AI branches still open (not yet reachable from main) -------------------
ai_open=""
for ref in $(find .git/refs/heads/task -type f ! -name '*.lock' 2>/dev/null); do
  name=${ref#.git/refs/heads/}
  sha=$(cat "$ref" 2>/dev/null) || continue
  [ -z "$sha" ] && continue
  if ! git merge-base --is-ancestor "$sha" main 2>/dev/null; then
    info=$(git --no-pager log -1 --pretty=format:'%an|%s' "$sha" 2>/dev/null)
    author=${info%%|*}
    subject=${info#*|}
    case "$author" in
      Dev-Agent-*|Orchestrator|"PM-Agent"|"Claude (Night Shift)")
        ai_open+="- \`$name\` — $subject _(by $author)_"$'\n' ;;
    esac
  fi
done

# --- Compose the email ------------------------------------------------------
cat > "$REPORT" <<EOM
To: Kunal <kunal@chirpin.in>
Cc: Varun Pratap Singh <varunpratapsingh191@gmail.com>
Subject: [Vyara] AI developer report — $TODAY

Hi Kunal,

AI agent activity for $TODAY_PRETTY (last 24 hours).

## AI dev commits today
${ai_commits:-_(none)_}

## Merges to main today (AI branches)
${ai_merges:-_(none)_}

## AI branches still open (awaiting next 07:30 PM)
${ai_open:-_(none — clean queue)_}

Two LLM-heavy AI jobs run daily: the 05:00 dev shift (orchestrator + 2 dev
agents in parallel) and the 07:30 PM (review + merge pass). Both inside the
IST off-peak window (05:00–18:30 IST = US night → US early-morning).

— Vyara PM (autonomous)
EOM

echo "$REPORT"
