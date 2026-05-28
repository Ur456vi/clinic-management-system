# Runbook — Web tier (ALB + EC2 ASG)

Branch of origin: `infra/INF-05-ec2-alb-asg`. Region: `ap-south-1` (Mumbai). Reviewer / applier: Kunal (PM) or Varun (CEO).

This runbook covers (1) first-time apply of the web tier, (2) how to confirm health afterwards, and (3) the two ops scenarios that come up most: deploying a new image (placeholder for INF-10) and replacing a broken instance.

## 1. First-time apply

Pre-reqs:

- `infra/INF-02-terraform-skeleton`, `INF-03-vpc-subnets`, `INF-04-rds-postgresql` already merged + applied. `terraform output -raw vpc_id` returns a value in `envs/prod`.
- AWS CLI configured for `ap-south-1` with admin creds (Kunal or Varun).

```
cd infra/terraform/envs/prod
terraform init
terraform plan -out web.tfplan
terraform apply web.tfplan
```

Expected new resources (≈15):

- 2 security groups (`sg-alb`, `sg-public-web`) + their rules
- 1 ALB, 1 target group, 1 HTTP listener (HTTPS listener only if `acm_certificate_arn` is set)
- 1 launch template, 1 ASG, 1 EC2 instance (the `desired_capacity=1`)
- the RDS security-group rule now resolves (sg-rds → ingress from `sg-public-web` instead of the stop-gap value)

If `terraform plan` shows the RDS module wanting to **replace** the ingress rule, that is expected on this one apply: the source SG id is moving from the stop-gap variable to `module.web.web_security_group_id`. Subsequent plans should show no drift.

## 2. Verify health (≤5 minutes after apply)

1. `terraform output alb_dns_name` — note the DNS.
2. Wait ~2 min for the ASG instance to come up. In the EC2 console (or via `aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names vyara-prod-asg-web --region ap-south-1`) confirm `Instances[0].LifecycleState == InService` and `HealthStatus == Healthy`.
3. `curl -sS -o /dev/null -w '%{http_code}\n' http://<alb_dns_name>/api/health` → `200`.
4. If the target group shows the instance as `unhealthy`:
   - SSH is closed; connect via SSM Session Manager (after INF-07 lands) or temporarily set `admin_ssh_cidrs = ["<your-ip>/32"]` and `terraform apply` to break-glass.
   - `sudo journalctl -u cloud-final --no-pager | tail -200` to see user-data progress.
   - `sudo docker ps` should show `vyara-placeholder` listening on `:${app_port}`.
   - `curl -sS localhost:8080/api/health` should return `ok`.

## 3. Deploy a new application image (interim, until INF-10 lands)

Until the GitHub Actions pipeline (INF-10) is in place, deploys are manual SSM `RunCommand`s. Pattern:

```
aws ssm send-command \
  --region ap-south-1 \
  --document-name "AWS-RunShellScript" \
  --targets "Key=tag:aws:autoscaling:groupName,Values=vyara-prod-asg-web" \
  --parameters 'commands=[
    "docker pull <image>:<tag>",
    "docker rm -f vyara-app || true",
    "docker run -d --restart unless-stopped --name vyara-app -p 8080:8080 --env-file /etc/vyara/app.env <image>:<tag>"
  ]'
```

Once INF-07 lands the instance profile + Secrets Manager, the `--env-file` step is replaced by the app reading the secret JSON directly via the SDK.

## 4. Replace a broken instance

Drop the instance; the ASG re-launches a fresh one from the launch template:

```
aws autoscaling terminate-instance-in-auto-scaling-group \
  --region ap-south-1 \
  --instance-id <i-...> \
  --no-should-decrement-desired-capacity
```

Or, to roll the whole ASG (e.g. after a launch-template change Terraform didn't auto-refresh):

```
aws autoscaling start-instance-refresh \
  --region ap-south-1 \
  --auto-scaling-group-name vyara-prod-asg-web \
  --preferences MinHealthyPercentage=50
```

## 5. Scale up / down

For a planned spike, raise `asg_desired_capacity` (e.g. `-var asg_desired_capacity=2`) and `terraform apply`. The hard ceiling is `asg_max_size` (default 3); raise that variable too if you need more. CPU-based auto-scaling lands with INF-09; don't add manual scaling policies that the alarms will fight.

## 6. Rollback

If a Terraform change breaks the tier (e.g. user-data fails), the safest rollback is to revert the offending commit, `terraform plan`, confirm it shows the launch-template version going down, and `terraform apply`. The ASG then rolls instances back to the prior good template via the same instance-refresh mechanism.

If the ALB itself is unreachable, the fastest recovery is usually `aws autoscaling start-instance-refresh` with the **previous** launch-template version forced; see AWS docs for `set-instance-protection` if you need to pin a known-good instance during recovery.
