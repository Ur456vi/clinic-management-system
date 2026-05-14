#!/usr/bin/env bash
# scripts/ci_gate_all.sh
#
# Runs the CI gate against every branch the PM is reviewing. Used by the
# 07:30 PM cron to filter MERGE candidates before invoking `git merge`.
#
# Reads branch names from stdin (one per line). For each branch:
#   - Checks it out
#   - Runs scripts/ci_gate.sh
#   - Prints a one-line verdict to stdout: "<branch> PASS" or "<branch> FAIL <exit-code>"
# Returns 0 if all branches passed, 1 if any failed (PM uses this to decide).
#
# Usage:
#   echo -e "task/BE-XX\nchore/foo" | scripts/ci_gate_all.sh

set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

PASS=0
FAIL=0
RESULTS=()

while IFS= read -r branch; do
  [ -z "$branch" ] && continue
  echo ""
  echo "=========================================="
  echo "CI GATE: $branch"
  echo "=========================================="
  set +e
  bash scripts/ci_gate.sh "$branch"
  code=$?
  set -e
  if [ $code -eq 0 ]; then
    RESULTS+=("$branch PASS")
    PASS=$((PASS+1))
  else
    RESULTS+=("$branch FAIL exit=$code")
    FAIL=$((FAIL+1))
  fi
done

echo ""
echo "=========================================="
echo "CI GATE SUMMARY"
echo "=========================================="
printf '%s\n' "${RESULTS[@]}"
echo ""
echo "passed: $PASS / $((PASS+FAIL))"

[ $FAIL -eq 0 ] && exit 0 || exit 1
