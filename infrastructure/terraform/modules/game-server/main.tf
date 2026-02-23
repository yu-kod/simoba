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

# --- Security Group: Fargate Tasks ---
resource "aws_security_group" "fargate" {
  name_prefix = "simoba-fargate-${var.environment}-"
  description = "Allow Colyseus port inbound for Fargate tasks"
  vpc_id      = var.vpc_id

  ingress {
    description = "Colyseus WebSocket"
    from_port   = var.container_port
    to_port     = var.container_port
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

# --- ECS Service (Fargate + Public IP) ---
resource "aws_ecs_service" "game" {
  count = var.container_image != "" ? 1 : 0

  name            = "simoba-game-${var.environment}"
  cluster         = aws_ecs_cluster.game.id
  task_definition = aws_ecs_task_definition.game[0].arn
  desired_count   = var.desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = var.public_subnet_ids
    security_groups  = [aws_security_group.fargate.id]
    assign_public_ip = true
  }
}
