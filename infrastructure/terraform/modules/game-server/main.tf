# --- ECR Repository ---
resource "aws_ecr_repository" "game_server" {
  name                 = "simoba-server-${var.environment}"
  image_tag_mutability = "IMMUTABLE"
  force_delete         = var.force_delete_ecr

  image_scanning_configuration {
    scan_on_push = true
  }
}

# --- ECS Cluster ---
resource "aws_ecs_cluster" "game" {
  name = "simoba-game-${var.environment}"
}

# --- IAM Role for ECS Task Execution ---
resource "aws_iam_role" "ecs_task_execution" {
  name = "simoba-ecs-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ecs-tasks.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# --- Security Group: ALB ---
resource "aws_security_group" "alb" {
  name_prefix = "simoba-alb-${var.environment}-"
  description = "Allow HTTPS inbound for ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- Security Group: Fargate Tasks ---
resource "aws_security_group" "fargate" {
  name = "simoba-fargate-${var.environment}"
  description = "Allow Colyseus port inbound from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Colyseus WebSocket from ALB"
    from_port       = var.container_port
    to_port         = var.container_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# --- ALB ---
resource "aws_lb" "game" {
  name               = "simoba-game-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets                    = var.public_subnet_ids
  idle_timeout               = 300
  enable_deletion_protection = var.enable_deletion_protection
}

# --- ALB Target Group ---
resource "aws_lb_target_group" "game" {
  name        = "simoba-game-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "ip"

  health_check {
    path                = "/health"
    protocol            = "HTTP"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}

# --- ALB HTTPS Listener ---
resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.game.arn
  port              = 443
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.game.arn
  }
}

# --- ALB HTTP → HTTPS Redirect ---
resource "aws_lb_listener" "http_redirect" {
  load_balancer_arn = aws_lb.game.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# --- CloudWatch Log Group ---
resource "aws_cloudwatch_log_group" "game" {
  count = var.container_image != "" ? 1 : 0

  name              = "/ecs/simoba-game-${var.environment}"
  retention_in_days = 30
}

# --- ECS Task Definition (Fargate) ---
resource "aws_ecs_task_definition" "game" {
  count = var.container_image != "" ? 1 : 0

  family                   = "simoba-game-${var.environment}"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  cpu                      = var.cpu
  memory                   = var.memory

  container_definitions = jsonencode([{
    name      = "colyseus"
    image     = var.container_image
    essential = true

    portMappings = [{
      containerPort = var.container_port
      protocol      = "tcp"
    }]

    environment = [{
      name  = "PORT"
      value = tostring(var.container_port)
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = aws_cloudwatch_log_group.game[0].name
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "colyseus"
      }
    }
  }])
}

data "aws_region" "current" {}

# --- ECS Service Linked Role ---
# SLR is managed by AWS automatically; removed from Terraform state.
removed {
  from = aws_iam_service_linked_role.ecs

  lifecycle {
    destroy = false
  }
}

# --- ECS Service (Fargate + Public IP) ---
resource "aws_ecs_service" "game" {
  count = var.container_image != "" ? 1 : 0

  name            = "simoba-game-${var.environment}"
  cluster         = aws_ecs_cluster.game.id
  task_definition = aws_ecs_task_definition.game[0].arn
  desired_count                      = var.desired_count
  launch_type                        = "FARGATE"
  health_check_grace_period_seconds  = 60

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.fargate.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.game.arn
    container_name   = "colyseus"
    container_port   = var.container_port
  }

}

# --- ECR Lifecycle Policy ---
resource "aws_ecr_lifecycle_policy" "game_server" {
  repository = aws_ecr_repository.game_server.name

  policy = jsonencode({
    rules = [{
      rulePriority = 1
      description  = "Keep last 10 images"
      selection = {
        tagStatus   = "any"
        countType   = "imageCountMoreThan"
        countNumber = 10
      }
      action = { type = "expire" }
    }]
  })
}
