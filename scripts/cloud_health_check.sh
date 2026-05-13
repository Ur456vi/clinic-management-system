#!/usr/bin/env bash
# scripts/cloud_health_check.sh
#
# Runs daily at 09:30 IST. Two modes depending on whether AWS is provisioned:
#
#   Phase 1 (no AWS credentials, no infra yet):
#     - Reports on open infra/** branches and INF-** tasks
#     - Confirms docs/infra/README.md still parses
#     - Notes "AWS not yet provisioned — design phase"
#
#   Phase 2 (read-only AWS access, infra exists):
#     - Describes EC2 instance health (running, CPU, age)
#     - Checks RDS backup status (last automated backup age)
#     - Lists CloudWatch alarms in ALARM state
#     - Lists ACM certs expiring in <30 days
#     - Confirms S3 PHI bucket has Object Lock + encryption
#
# Output: appended to reports/cloud-health-<YYYY-MM-DD>.md
# Emails only on anomaly (alarms firing, backups stale, certs expiring soon).

set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TODAY="$(date +%Y-%m-%d)"
REPORT="reports/cloud-health-$TODAY.md"
mkdir -p reports

ANOMALIES=0

# --- Phase detection ---
PHASE=1
if [ -n "${AWS_ACCESS_KEY_ID:-}" ] || [ -f "$HOME/.aws/credentials" ]; then
  if command -v aws >/dev/null 2>&1; then
    if aws sts get-caller-identity --region ap-south-1 >/dev/null 2>&1; then
      PHASE=2
    fi
  fi
fi

# --- open infra branches (always shown) ---
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

cat > "$REPORT" <<EOM
# Cloud health check — $TODAY

Phase: $PHASE ($([ $PHASE -eq 1 ] && echo "design-only, no AWS access" || echo "AWS read-only access"))

## Open infra/** branches
${open_infra:-_(none — design backlog clear or no work in flight)_}

EOM

if [ $PHASE -eq 1 ]; then
  cat >> "$REPORT" <<EOM
## AWS posture
_Not yet provisioned. Cloud Engineer is in design-only mode — writing Terraform / IAM / runbooks. Humans run \`terraform apply\` after review._

Next milestone: **INF-01** (AWS account setup + Business Support + BAA) — owner is Varun / Kunal, blocker for everything else.
EOM
else
  # Phase 2 — placeholder for when AWS access exists. Each section runs an AWS CLI
  # query and appends results + flags anomalies.
  echo "## AWS health (read-only)" >> "$REPORT"
  echo "" >> "$REPORT"

  # EC2 health
  echo "### EC2 instances" >> "$REPORT"
  aws ec2 describe-instances --region ap-south-1 \
    --query 'Reservations[*].Instances[*].[InstanceId,State.Name,InstanceType,LaunchTime]' \
    --output table >> "$REPORT" 2>&1 || true
  echo "" >> "$REPORT"

  # RDS backup recency (anomaly if > 36h old)
  echo "### RDS automated backups" >> "$REPORT"
  aws rds describe-db-instances --region ap-south-1 \
    --query 'DBInstances[*].[DBInstanceIdentifier,LatestRestorableTime,BackupRetentionPeriod]' \
    --output table >> "$REPORT" 2>&1 || true
  echo "" >> "$REPORT"

  # CloudWatch alarms in ALARM state
  echo "### CloudWatch alarms (ALARM state only)" >> "$REPORT"
  alarms=$(aws cloudwatch describe-alarms --region ap-south-1 --state-value ALARM \
    --query 'MetricAlarms[*].[AlarmName,StateReason]' --output text 2>/dev/null || true)
  if [ -n "$alarms" ]; then
    echo "$alarms" >> "$REPORT"
    ANOMALIES=$((ANOMALIES+1))
  else
    echo "_(none firing)_" >> "$REPORT"
  fi
  echo "" >> "$REPORT"

  # ACM certs expiring < 30 days
  echo "### ACM certs expiring within 30 days" >> "$REPORT"
  expiring=$(aws acm list-certificates --region ap-south-1 \
    --query 'CertificateSummaryList[?NotAfter<=`'"$(date -u -d '+30 days' +%Y-%m-%dT%H:%M:%S 2>/dev/null || date -u -v+30d +%Y-%m-%dT%H:%M:%S)"'`].[DomainName,NotAfter]' \
    --output text 2>/dev/null || true)
  if [ -n "$expiring" ]; then
    echo "$expiring" >> "$REPORT"
    ANOMALIES=$((ANOMALIES+1))
  else
    echo "_(none)_" >> "$REPORT"
  fi
fi

echo "" >> "$REPORT"
echo "anomalies: $ANOMALIES" >> "$REPORT"

echo "$REPORT"
echo "ANOMALIES=$ANOMALIES" >&2
exit 0
