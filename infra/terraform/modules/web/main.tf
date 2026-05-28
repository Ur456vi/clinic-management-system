# =============================================================================
# Module: web
# Purpose: Internet-facing ALB, EC2 launch template (Ubuntu 22.04 + Docker),
#          and Auto Scaling Group across the public subnets.
# Region : ap-south-1 (Mumbai) — DPDP Act data residency.
#
# Reference design: docs/infra/README.md (production stack) and
#                   docs/infra/network.md (sg-public-web, sg-alb).
#
# Phase 1 deliberate choices (see cost.md + README.md):
#   - t3.medium on-demand (Reserved purchase is out-of-band).
#   - ASG min=1, max=3, desired=1. Scale-out alarms land in INF-09.
#   - Single ALB, two AZs (matches network.md 2-AZ design).
#   - HTTPS listener is conditional on an ACM cert ARN. INF-08 supplies it.
#   - No NAT — EC2 reaches the internet via the IGW + its own public ENI
#     during user-data bootstrap. Application traffic to RDS stays inside the
#     VPC (sg-rds allows sg-public-web → 5432 only).
#   - SSH closed by default. Prefer SSM Session Manager once INF-07 lands.
# =============================================================================

locals {
  name = "${var.project}-${var.environment}"

  common_tags = {
    Project     = var.project
    Environment = var.environment
    ManagedBy   = "terraform"
    Module      = "web"
    Component   = "web-tier"
  }

  # When the caller doesn't pin an AMI, resolve the latest Canonical Ubuntu
  # 22.04 LTS amd64 via SSM Parameter Store. Same parameter Canonical publishes
  # for every region, so this also works for ap-south-1.
  resolved_ami_id = var.ami_id != "" ? var.ami_id : data.aws_ssm_parameter.ubuntu_2204[0].value

  https_enabled = var.acm_certificate_arn != ""
}

data "aws_ssm_parameter" "ubuntu_2204" {
  count = var.ami_id == "" ? 1 : 0
  name  = "/aws/service/canonical/ubuntu/server/22.04/stable/current/amd64/hvm/ebs-gp2/ami-id"
}

# -----------------------------------------------------------------------------
# Security group: sg-alb
#   Inbound : 80 + 443 from the public internet.
#   Outbound: only to sg-public-web on the app port. Keeps the ALB from being
#             a pivot point if it were ever compromised.
# -----------------------------------------------------------------------------
resource "aws_security_group" "alb" {
  name        = "${local.name}-sg-alb"
  description = "Public ALB — 80/443 from internet, egress restricted to web SG"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name}-sg-alb"
  })
}

resource "aws_security_group_rule" "alb_ingress_http" {
  type              = "ingress"
  from_port         = 80
  to_port           = 80
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
  description       = "HTTP from internet (redirected to HTTPS once cert exists)"
}

resource "aws_security_group_rule" "alb_ingress_https" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS from internet"
}

resource "aws_security_group_rule" "alb_egress_to_web" {
  type                     = "egress"
  from_port                = var.app_port
  to_port                  = var.app_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.alb.id
  source_security_group_id = aws_security_group.web.id
  description              = "ALB -> web tier app port"
}

# -----------------------------------------------------------------------------
# Security group: sg-public-web
#   Inbound : app_port from sg-alb only; optional 22 from admin CIDRs.
#   Outbound: any (instances pull packages + reach RDS + AWS APIs).
# -----------------------------------------------------------------------------
resource "aws_security_group" "web" {
  name        = "${local.name}-sg-public-web"
  description = "EC2 web tier — app port from ALB; SSH from admins (optional)"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, {
    Name = "${local.name}-sg-public-web"
  })
}

resource "aws_security_group_rule" "web_ingress_from_alb" {
  type                     = "ingress"
  from_port                = var.app_port
  to_port                  = var.app_port
  protocol                 = "tcp"
  security_group_id        = aws_security_group.web.id
  source_security_group_id = aws_security_group.alb.id
  description              = "App port from ALB"
}

resource "aws_security_group_rule" "web_ingress_ssh" {
  count             = length(var.admin_ssh_cidrs) > 0 ? 1 : 0
  type              = "ingress"
  from_port         = 22
  to_port           = 22
  protocol          = "tcp"
  cidr_blocks       = var.admin_ssh_cidrs
  security_group_id = aws_security_group.web.id
  description       = "SSH break-glass from admin CIDRs (prefer SSM)"
}

resource "aws_security_group_rule" "web_egress_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 0
  protocol          = "-1"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.web.id
  description       = "All egress (yum/apt, ECR/Docker Hub, AWS APIs, RDS)"
}

# -----------------------------------------------------------------------------
# Application Load Balancer.
# -----------------------------------------------------------------------------
resource "aws_lb" "this" {
  name               = "${local.name}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = var.public_subnet_ids

  # Phase-1 default. Move to true once ALB access logging bucket exists (INF-06).
  enable_deletion_protection = false
  idle_timeout               = 60

  tags = merge(local.common_tags, {
    Name = "${local.name}-alb"
  })
}

resource "aws_lb_target_group" "app" {
  name        = "${local.name}-tg-app"
  port        = var.app_port
  protocol    = "HTTP"
  target_type = "instance"
  vpc_id      = var.vpc_id

  deregistration_delay = 30 # short — stateless app, no long-lived connections

  health_check {
    path                = var.health_check_path
    protocol            = "HTTP"
    port                = "traffic-port"
    matcher             = "200"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-tg-app"
  })
}

# HTTP listener — redirects to HTTPS once a cert is configured, else forwards
# directly so operators can smoke-test before INF-08 lands.
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.this.arn
  port              = 80
  protocol          = "HTTP"

  dynamic "default_action" {
    for_each = local.https_enabled ? [1] : []
    content {
      type = "redirect"
      redirect {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "HTTP_301"
      }
    }
  }

  dynamic "default_action" {
    for_each = local.https_enabled ? [] : [1]
    content {
      type             = "forward"
      target_group_arn = aws_lb_target_group.app.arn
    }
  }
}

resource "aws_lb_listener" "https" {
  count             = local.https_enabled ? 1 : 0
  load_balancer_arn = aws_lb.this.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.acm_certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# -----------------------------------------------------------------------------
# EC2 launch template + ASG.
#   user_data installs Docker so the deploy pipeline (INF-10) can `docker run`
#   the app image. The app image itself + secrets injection arrive with INF-07
#   (instance profile -> Secrets Manager) and INF-10 (GitHub Actions deploy).
# -----------------------------------------------------------------------------
resource "aws_launch_template" "web" {
  name_prefix   = "${local.name}-lt-"
  image_id      = local.resolved_ami_id
  instance_type = var.instance_type

  vpc_security_group_ids = [aws_security_group.web.id]

  dynamic "iam_instance_profile" {
    for_each = var.iam_instance_profile_name != "" ? [1] : []
    content {
      name = var.iam_instance_profile_name
    }
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size           = var.root_volume_gb
      volume_type           = "gp3"
      encrypted             = true
      delete_on_termination = true
    }
  }

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required" # IMDSv2 only
    http_put_response_hop_limit = 1
  }

  monitoring {
    enabled = true # 1-minute CloudWatch metrics
  }

  user_data = base64encode(templatefile("${path.module}/user-data/bootstrap.sh.tftpl", {
    app_port = var.app_port
  }))

  tag_specifications {
    resource_type = "instance"
    tags = merge(local.common_tags, {
      Name = "${local.name}-web"
    })
  }

  tag_specifications {
    resource_type = "volume"
    tags          = local.common_tags
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_autoscaling_group" "web" {
  name                = "${local.name}-asg-web"
  vpc_zone_identifier = var.public_subnet_ids
  target_group_arns   = [aws_lb_target_group.app.arn]

  min_size         = var.asg_min_size
  max_size         = var.asg_max_size
  desired_capacity = var.asg_desired_capacity

  health_check_type         = "ELB"
  health_check_grace_period = 120

  launch_template {
    id      = aws_launch_template.web.id
    version = "$Latest"
  }

  # Roll instances with a fresh launch-template version when user-data or AMI
  # changes. INF-10 will switch to instance refresh triggered by image digest.
  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${local.name}-web"
    propagate_at_launch = true
  }

  dynamic "tag" {
    for_each = local.common_tags
    content {
      key                 = tag.key
      value               = tag.value
      propagate_at_launch = true
    }
  }

  lifecycle {
    # desired_capacity may drift via scaling policies (added in INF-09); keep
    # Terraform from fighting them.
    ignore_changes = [desired_capacity]
  }
}
