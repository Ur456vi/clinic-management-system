# =============================================================================
# Module: network
# Purpose: VPC, public + private subnets, IGW, route tables, VPC Flow Logs.
# Region: ap-south-1 (Mumbai) — DPDP Act data residency.
# Reference design: docs/infra/network.md
#
# Phase 1 deliberate omissions (see network.md):
#   - No NAT Gateway (private subnets host RDS only, no outbound internet).
#   - No VPC endpoints (PrivateLink). Defer until traffic justifies cost.
#   - No AWS Network Firewall.
# These can be added later without re-IPing — subnet plan is forward-compatible.
# =============================================================================

locals {
  # 2-AZ design matches docs/infra/network.md. The INF-03 backlog title says
  # "3 AZs"; we follow the design doc here. If Aman / Kunal want 3 AZs we add
  # subnet-public-c (10.0.3.0/24) and subnet-private-c (10.0.13.0/24) — CIDR
  # space already reserved.
  azs = ["ap-south-1a", "ap-south-1b"]

  public_subnets = {
    "ap-south-1a" = "10.0.1.0/24"
    "ap-south-1b" = "10.0.2.0/24"
  }

  private_subnets = {
    "ap-south-1a" = "10.0.11.0/24"
    "ap-south-1b" = "10.0.12.0/24"
  }
}

# -----------------------------------------------------------------------------
# VPC
# -----------------------------------------------------------------------------
resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "${var.project}-${var.environment}-vpc"
  }
}

# -----------------------------------------------------------------------------
# Internet Gateway (public egress)
# -----------------------------------------------------------------------------
resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.project}-${var.environment}-igw"
  }
}

# -----------------------------------------------------------------------------
# Public subnets (ALB + EC2 web tier)
# -----------------------------------------------------------------------------
resource "aws_subnet" "public" {
  for_each = local.public_subnets

  vpc_id                  = aws_vpc.this.id
  cidr_block              = each.value
  availability_zone       = each.key
  map_public_ip_on_launch = false # ALB has its own EIPs; EC2 sits behind ALB

  tags = {
    Name = "${var.project}-${var.environment}-subnet-public-${substr(each.key, -1, 1)}"
    Tier = "public"
  }
}

# -----------------------------------------------------------------------------
# Private subnets (RDS today; ECS/Lambda later)
# -----------------------------------------------------------------------------
resource "aws_subnet" "private" {
  for_each = local.private_subnets

  vpc_id            = aws_vpc.this.id
  cidr_block        = each.value
  availability_zone = each.key

  tags = {
    Name = "${var.project}-${var.environment}-subnet-private-${substr(each.key, -1, 1)}"
    Tier = "private"
  }
}

# -----------------------------------------------------------------------------
# Route tables
#   Public  -> default route 0.0.0.0/0 via IGW
#   Private -> no default route (no NAT in Phase 1; RDS is internal-only)
# -----------------------------------------------------------------------------
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.this.id
  }

  tags = {
    Name = "${var.project}-${var.environment}-rt-public"
  }
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.this.id

  tags = {
    Name = "${var.project}-${var.environment}-rt-private"
  }
}

resource "aws_route_table_association" "public" {
  for_each       = aws_subnet.public
  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  for_each       = aws_subnet.private
  subnet_id      = each.value.id
  route_table_id = aws_route_table.private.id
}

# -----------------------------------------------------------------------------
# VPC Flow Logs -> CloudWatch (7-day retention, per network.md)
# -----------------------------------------------------------------------------
resource "aws_cloudwatch_log_group" "flow_logs" {
  count             = var.enable_flow_logs ? 1 : 0
  name              = "/aws/vpc/${var.project}-${var.environment}-flow-logs"
  retention_in_days = 7
}

resource "aws_iam_role" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.project}-${var.environment}-vpc-flow-logs"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "vpc-flow-logs.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "flow_logs" {
  count = var.enable_flow_logs ? 1 : 0
  name  = "${var.project}-${var.environment}-vpc-flow-logs"
  role  = aws_iam_role.flow_logs[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents",
        "logs:DescribeLogGroups",
        "logs:DescribeLogStreams"
      ]
      Resource = "*"
    }]
  })
}

resource "aws_flow_log" "this" {
  count                    = var.enable_flow_logs ? 1 : 0
  iam_role_arn             = aws_iam_role.flow_logs[0].arn
  log_destination          = aws_cloudwatch_log_group.flow_logs[0].arn
  traffic_type             = "ALL"
  vpc_id                   = aws_vpc.this.id
  max_aggregation_interval = 600
}
