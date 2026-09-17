# ─── Amazon ECS (Fargate) ────────────────────────────────────────────────────

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.project_name}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-cluster"
  }
}

# CloudWatch Log Group for ECS Backend Logs
resource "aws_cloudwatch_log_group" "ecs_backend" {
  name              = "/ecs/${var.project_name}-backend"
  retention_in_days = 14

  tags = {
    Name = "${var.project_name}-ecs-backend-logs"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "backend" {
  family                   = "${var.project_name}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.backend_cpu)
  memory                   = tostring(var.backend_memory)
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name      = "${var.project_name}-backend"
      image     = "${data.aws_caller_identity.current.account_id}.dkr.ecr.${var.aws_region}.amazonaws.com/${var.backend_repo_name}:latest"
      essential = true

      portMappings = [
        {
          containerPort = var.container_port
          hostPort      = var.container_port
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "PORT"
          value = tostring(var.container_port)
        },
        {
          name  = "ACCESS_TOKEN_EXPIRY"
          value = "1d"
        },
        {
          name  = "AWS_REGION"
          value = var.aws_region
        },
        {
          name  = "CLIENT_URL"
          value = "https://${var.frontend_subdomain}.${var.domain_name}"
        }
      ]

      secrets = [
        {
          name      = "MONGO_URI"
          valueFrom = "${var.secrets_manager_arn}:MONGO_URI::"
        },
        {
          name      = "ACCESS_TOKEN_SECRET"
          valueFrom = "${var.secrets_manager_arn}:ACCESS_TOKEN_SECRET::"
        },
        {
          name      = "SES_FROM_EMAIL"
          valueFrom = "${var.secrets_manager_arn}:SES_FROM_EMAIL::"
        },
        {
          name      = "GOOGLE_MAPS_API_KEY"
          valueFrom = "${var.secrets_manager_arn}:GOOGLE_MAPS_API_KEY::"
        },
        {
          name      = "RAZORPAY_KEY_ID"
          valueFrom = "${var.secrets_manager_arn}:RAZORPAY_KEY_ID::"
        },
        {
          name      = "RAZORPAY_KEY_SECRET"
          valueFrom = "${var.secrets_manager_arn}:RAZORPAY_KEY_SECRET::"
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.ecs_backend.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "ecs"
        }
      }
    }
  ])

  tags = {
    Name = "${var.project_name}-task-def"
  }
}

# ECS Fargate Service
resource "aws_ecs_service" "backend" {
  name            = "${var.project_name}-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.backend.arn
  desired_count   = var.backend_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = aws_subnet.public[*].id
    security_groups  = [aws_security_group.ecs.id]
    assign_public_ip = true
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.backend.arn
    container_name   = "${var.project_name}-backend"
    container_port   = var.container_port
  }

  depends_on = [
    aws_lb_listener.https
  ]

  tags = {
    Name = "${var.project_name}-service"
  }
}
