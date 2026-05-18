# Runbook: RDS backup, restore, and final snapshot

Scope: `vyara-prod-rds` (Postgres 16) in `ap-south-1`.
Owner: Cloud Engineer (design). Operator: Kunal / Varun (apply).
Related module: [`infra/terraform/modules/rds`](../../../infra/terraform/modules/rds/README.md).

## Backup policy (recap)

| Type | Frequency | Retention | Storage |
|---|---|---|---|
| Automated snapshot | Daily, 18:30–19:00 UTC | 7 days (variable) | AWS-managed, in `ap-south-1` |
| Transaction logs | Continuous (5-min granularity) | 7 days | AWS-managed |
| Manual snapshot | Pre-major-change, on demand | Indefinite until deleted | AWS-managed |
| Final snapshot | On `terraform destroy` | Indefinite | AWS-managed |

Point-in-time recovery (PITR) window therefore extends 7 days back, to any
5-minute boundary.

## Routine: monthly backup verification (15 min)

Cadence: first Monday of each month. Owner: Cloud Engineer agent files the
ticket; Kunal runs the restore.

1. List the most recent automated snapshot:
   ```
   aws rds describe-db-snapshots \
     --db-instance-identifier vyara-prod-rds \
     --snapshot-type automated \
     --region ap-south-1 \
     --query 'reverse(sort_by(DBSnapshots,&SnapshotCreateTime))[0].DBSnapshotIdentifier'
   ```
2. Restore to a throwaway instance named `vyara-restore-test-<yyyymmdd>`:
   ```
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier vyara-restore-test-$(date +%Y%m%d) \
     --db-snapshot-identifier <snapshot-id> \
     --db-instance-class db.t3.small \
     --no-publicly-accessible \
     --db-subnet-group-name vyara-prod-rds \
     --vpc-security-group-ids <sg-rds-id> \
     --region ap-south-1
   ```
3. Wait for `available` (~10 min), connect from a bastion or `psql` over SSM
   port-forward, run:
   ```sql
   SELECT count(*) FROM patients;
   SELECT max(created_at) FROM consultations;
   ```
   Numbers should match the source within the PITR window (mostly identical).
4. Delete the test instance, skipping the final snapshot:
   ```
   aws rds delete-db-instance \
     --db-instance-identifier vyara-restore-test-$(date +%Y%m%d) \
     --skip-final-snapshot \
     --region ap-south-1
   ```
5. Log result in `reports/restore-drills.md` (date, snapshot age, row counts,
   pass/fail). A failed drill is a P1 — page Kunal and Varun immediately.

## Incident: PITR (point-in-time recovery)

Use when: corruption, accidental `DELETE`/`TRUNCATE`, or app bug wrote bad data.

1. **Stop the bleeding.** Take an app maintenance flag (BE-handled) so no
   further writes land. If the app is already down, skip this step.
2. **Identify the recovery target time.** Look at audit logs or BE-team report
   to pick `T` (UTC). PITR granularity is 5 min.
3. Trigger restore to a new instance:
   ```
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier vyara-prod-rds \
     --target-db-instance-identifier vyara-prod-rds-pitr-<yyyymmddhhmm> \
     --restore-time <ISO-8601 UTC> \
     --db-subnet-group-name vyara-prod-rds \
     --vpc-security-group-ids <sg-rds-id> \
     --no-publicly-accessible \
     --region ap-south-1
   ```
4. Wait for `available` (10–20 min). Validate with the BE team — compare row
   counts and timestamps to the expected state.
5. **Cut over.** Two options:
   - **Swap endpoints (preferred):** rename old instance to `-prebroken`, rename
     restored to `vyara-prod-rds`. CNAME stays. ~2 min downtime.
   - **Re-point app:** update the Secrets Manager value to the new endpoint,
     redeploy. ~5–10 min downtime, but easier to roll back.
6. Take a fresh manual snapshot of the restored instance immediately:
   ```
   aws rds create-db-snapshot \
     --db-instance-identifier vyara-prod-rds \
     --db-snapshot-identifier vyara-postpitr-<yyyymmdd> \
     --region ap-south-1
   ```
7. Delete the `-prebroken` instance once we're confident (24–48 h later) and
   the manual snapshot is in place.

## Incident: instance failure (single-AZ → outage)

In Phase 1 we run single-AZ. If the underlying AZ or instance fails:

1. AWS auto-recovery typically brings the instance back in 5–15 min — wait
   that window first.
2. If still down: launch a Multi-AZ restore from the most recent snapshot in
   the secondary AZ:
   ```
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier vyara-prod-rds-recovery \
     --db-snapshot-identifier <most-recent> \
     --multi-az \
     --db-subnet-group-name vyara-prod-rds \
     --vpc-security-group-ids <sg-rds-id> \
     --region ap-south-1
   ```
3. Update the Secrets Manager value, redeploy app.
4. Post-incident: enable `multi_az = true` permanently. (This drove the
   incident — fix it.)

## `terraform destroy` of the prod RDS

Deletion protection is ON. To destroy intentionally:

1. Take a manual snapshot first (`create-db-snapshot`) — final snapshot is
   automatic but a named manual snapshot makes future restores easier to find.
2. Flip `deletion_protection = false` via `-var` or tfvars.
3. Run `terraform plan` — confirm the only change is `deletion_protection`.
4. Run `terraform apply`.
5. Run `terraform destroy -target=module.rds`. Terraform creates a final
   snapshot named `vyara-prod-rds-final-<timestamp>` before deleting.
6. Verify the final snapshot exists:
   ```
   aws rds describe-db-snapshots \
     --db-instance-identifier vyara-prod-rds \
     --snapshot-type manual --region ap-south-1
   ```

Never run `terraform destroy` on the prod RDS without Kunal's explicit
go-ahead in writing.

## Escalation

- Restore drill fails → page Kunal + Varun within 1 h, file P1 incident.
- PITR in progress → notify Aman (compliance) within 24 h with the restore
  time and reason; needed for DPDP incident log.
- Snapshot retention misconfigured (e.g. retention drops to 0) → P2, fix
  within 24 h via terraform apply.
