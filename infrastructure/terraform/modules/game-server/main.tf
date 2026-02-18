# --- ECR Repository ---
resource "aws_ecr_repository" "game_server" {
  name                 = "simoba-server-${var.environment}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

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

# --- IAM Role for EC2 Instances (ECS Container Instances) ---
resource "aws_iam_role" "ecs_instance" {
  name = "simoba-ecs-instance-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "ec2.amazonaws.com"
      }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_instance" {
  name = "simoba-ecs-instance-${var.environment}"
  role = aws_iam_role.ecs_instance.name
}

# --- Security Group: ALB ---
resource "aws_security_group" "alb" {
  name_prefix = "simoba-alb-${var.environment}-"
  description = "Allow HTTP/HTTPS inbound for ALB"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
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

# --- Security Group: ECS Instances ---
resource "aws_security_group" "ecs" {
  name_prefix = "simoba-ecs-${var.environment}-"
  description = "Allow traffic from ALB only"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Colyseus from ALB"
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
  subnets            = var.public_subnet_ids
}

resource "aws_lb_target_group" "game" {
  name        = "simoba-game-${var.environment}"
  port        = var.container_port
  protocol    = "HTTP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  health_check {
    path                = "/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 10
    matcher             = "200"
  }

  stickiness {
    type            = "lb_cookie"
    cookie_duration = 86400
    enabled         = true
  }
}

resource "aws_lb_listener" "game_http" {
  load_balancer_arn = aws_lb.game.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.game.arn
  }
}

# --- Launch Template for EC2 ---
data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/optimized-ami/amazon-linux-2023/recommended/image_id"
}

resource "aws_launch_template" "ecs" {
  name_prefix   = "simoba-ecs-${var.environment}-"
  image_id      = data.aws_ssm_parameter.ecs_ami.value
  instance_type = var.instance_type

  iam_instance_profile {
    arn = aws_iam_instance_profile.ecs_instance.arn
  }

  vpc_security_group_ids = [aws_security_group.ecs.id]

  user_data = base64encode(<<-EOF
    #!/bin/bash
    echo "ECS_CLUSTER=${aws_ecs_cluster.game.name}" >> /etc/ecs/ecs.config
    EOF
  )
}

# --- ECS Capacity Provider (EC2 Auto Scaling) ---
resource "aws_autoscaling_group" "ecs" {
  name_prefix         = "simoba-ecs-${var.environment}-"
  vpc_zone_identifier = var.private_subnet_ids
  min_size            = 0
  max_size            = 2
  desired_capacity    = var.desired_count

  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest"
  }

  tag {
    key                 = "AmazonECSManaged"
    value               = "true"
    propagate_at_launch = true
  }
}

resource "aws_ecs_capacity_provider" "ec2" {
  name = "simoba-ec2-${var.environment}"

  auto_scaling_group_provider {
    auto_scaling_group_arn = aws_autoscaling_group.ecs.arn

    managed_scaling {
      status          = "ENABLED"
      target_capacity = 100
    }
  }
}

resource "aws_ecs_cluster_capacity_providers" "game" {
  cluster_name       = aws_ecs_cluster.game.name
  capacity_providers = [aws_ecs_capacity_provider.ec2.name]

  default_capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }
}

# --- ECS Task Definition ---
resource "aws_ecs_task_definition" "game" {
  family                   = "simoba-game-${var.environment}"
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  cpu                      = var.cpu
  memory                   = var.memory

  container_definitions = jsonencode([{
    name      = "colyseus"
    image     = var.container_image
    essential = true
    cpu       = var.cpu
    memory    = var.memory

    portMappings = [{
      containerPort = var.container_port
      hostPort      = var.container_port
      protocol      = "tcp"
    }]

    environment = [{
      name  = "PORT"
      value = tostring(var.container_port)
    }]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/simoba-game-${var.environment}"
        "awslogs-region"        = data.aws_region.current.name
        "awslogs-stream-prefix" = "colyseus"
        "awslogs-create-group"  = "true"
      }
    }
  }])
}

data "aws_region" "current" {}

# --- ECS Service ---
resource "aws_ecs_service" "game" {
  name            = "simoba-game-${var.environment}"
  cluster         = aws_ecs_cluster.game.id
  task_definition = aws_ecs_task_definition.game.arn
  desired_count   = var.desired_count

  capacity_provider_strategy {
    capacity_provider = aws_ecs_capacity_provider.ec2.name
    weight            = 1
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.game.arn
    container_name   = "colyseus"
    container_port   = var.container_port
  }

  depends_on = [aws_lb_listener.game_http]
}
