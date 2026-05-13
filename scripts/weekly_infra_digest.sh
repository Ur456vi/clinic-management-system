#!/usr/bin/env bash
# scripts/weekly_infra_digest.sh
#
# Generate the Friday-evening infra digest at reports/infra-digest-<date>.md
# with RFC822 headers, ready for scripts/send_email.sh.
#
# Audience: Kunal (PM) + Varun (CEO). Cc CEO. Scope: last 7 days of infra/**
# activity, AWS bill (if available), open infra backlog, security advisories
# the agent saw and either applied or filed for review.

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TODAY="$(date +%Y-%m-%d)"
TODAY_PRETTY="$(date '+%A, %B %-d, %Y')"
WEEK_AGO="$(date -d '7 days ago' +%Y-%m-%d 2>/dev/null || date -v-7d +%Y-%m-%d)"
REPORT="reports/infra-digest-$TODAY.md"
mkdir -p reports

SINCE="${WEEK_AGO}T00:00:00"

# Infra commits this week
infra_commits=$(git --no-pager log --since="$SINCE" --no-merges \
  --pretty=format:'%h|%an|%s' main 2>/dev/null \
  | awk -F'|' '$3 ~ /^(feat|fix|chore)\(INF/ || $2 == "Cloud-Engineer"' \
  | awk -F'|' '{printf "- `%s` %s _(%s)_\n", $1, $3, $2}' \
  || true)

# Infra branches merged this week
infra_merges=$(git --no-pager log --since="$SINCE" --merges \
  --pretty=format:'- %s' main 2>/dev/null \
  | grep -E "Merge infra/" || true)

# Open infra branches
open_infra=""
for ref in $(find .git/refs/heads/infra -type f ! -name '*.lock' 2>/dev/null); do
  name=${ref#.git/refs/heads/}
  sha=$(cat "$ref" 2>/dev/null) || continue
  [ -z "$sha" ] && continue
  if ! git merge-base --is-ancestor "$sha" main 2>/dev/null; then
    subject=$(git --no-pager log -1 --pretty=format:'%s' "$sha" 2>/dev/null | head -c 80)
    open_infra+="- \`$name\` — $subject"$'\n'
  fi
done

# AWS bill snapshot (Phase 2 only)
bill=""
if [ -f reports/aws-bill-current.md ]; then
  bill=$(cat reports/aws-bill-current.md)
else
  bill="_(no AWS bill data yet — Phase 1 design-only, no resources provisioned)_"
fi

cat > "$REPORT" <<EOM
To: Kunal <kunal@chirpin.in>
Cc: Varun Pratap Singh <varunpratapsingh191@gmail.com>
Subject: [Vyara] Weekly infra digest — $TODAY

Hi Kunal,

Friday infra digest for the week ending $TODAY_PRETTY. From the Cloud Engineer agent.

## Infra commits this week
${infra_commits:-_(no infra commits)_}

## Infra branches merged this week
${infra_merges:-_(no merges)_}

## Open infra branches awaiting review / apply
${open_infra:-_(none — clean queue)_}

## AWS bill snapshot
$bill

## Notes from Cloud Engineer

_(filled in by the Friday 17:30 scheduled task — current advisories, upcoming maintenance, anything that needs human action this week)_

— Cloud-Engineer (autonomous, on behalf of Algoborne)
EOM

echo "$REPORT"
