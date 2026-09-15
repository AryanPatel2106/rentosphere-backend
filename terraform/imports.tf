# ─── Declarative Imports for Existing AWS Resources ─────────────────────────
# Terraform 1.5+ automatically adopts existing resources using these import blocks.

# 1. Amazon ECR Repository
import {
  to = aws_ecr_repository.backend
  id = var.backend_repo_name
}

# 2. Frontend S3 Bucket
import {
  to = aws_s3_bucket.frontend
  id = var.frontend_s3_bucket_name
}

# 3. CloudFront Distribution
import {
  to = aws_cloudfront_distribution.frontend
  id = "E2545JMVVM7T7S"
}

# 4. Route 53 Records
import {
  to = aws_route53_record.frontend_a
  id = "${data.aws_route53_zone.main.zone_id}_${var.frontend_subdomain}.${var.domain_name}_A"
}

import {
  to = aws_route53_record.api
  id = "${data.aws_route53_zone.main.zone_id}_${var.backend_subdomain}.${var.domain_name}_A"
}

# 5. IAM Roles
import {
  to = aws_iam_role.ecs_execution
  id = "${var.project_name}-ecs-execution-role"
}

import {
  to = aws_iam_role.ecs_task
  id = "${var.project_name}-ecs-task-role"
}

import {
  to = aws_iam_role.codebuild_backend
  id = "codebuild-${var.project_name}-backend-build-service-role"
}

import {
  to = aws_iam_role.codebuild_frontend
  id = "codebuild-${var.project_name}-frontend-build-service-role"
}

import {
  to = aws_iam_role.codebuild_invalidation
  id = "codebuild-${var.project_name}-cloudfront-invalidation-service-role"
}

# 6. CodeBuild Projects
import {
  to = aws_codebuild_project.backend_build
  id = "${var.project_name}-backend-build"
}

import {
  to = aws_codebuild_project.frontend_build
  id = "${var.project_name}-frontend-build"
}

import {
  to = aws_codebuild_project.cloudfront_invalidation
  id = "${var.project_name}-cloudfront-invalidation"
}

# 7. CodePipelines
import {
  to = aws_codepipeline.backend
  id = "${var.project_name}-backend-pipeline"
}

import {
  to = aws_codepipeline.frontend
  id = "${var.project_name}-frontend-pipeline"
}

# 8. CloudWatch Log Group
import {
  to = aws_cloudwatch_log_group.ecs_backend
  id = "/ecs/${var.project_name}-backend"
}
