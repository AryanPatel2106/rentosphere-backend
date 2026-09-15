# ─── Terraform Outputs ────────────────────────────────────────────────────────

output "vpc_id" {
  description = "ID of the custom VPC"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "alb_dns_name" {
  description = "DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "api_endpoint" {
  description = "Public URL for the backend API"
  value       = "https://${var.backend_subdomain}.${var.domain_name}"
}

output "frontend_url" {
  description = "Public URL for the frontend application"
  value       = "https://${var.frontend_subdomain}.${var.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "ID of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.id
}

output "cloudfront_domain_name" {
  description = "Domain name of the CloudFront distribution"
  value       = aws_cloudfront_distribution.frontend.domain_name
}

output "s3_frontend_bucket" {
  description = "Name of the S3 bucket hosting the frontend build files"
  value       = aws_s3_bucket.frontend.bucket
}

output "ecr_repository_url" {
  description = "URL of the ECR repository"
  value       = aws_ecr_repository.backend.repository_url
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  description = "Name of the ECS service"
  value       = aws_ecs_service.backend.name
}

output "backend_pipeline_name" {
  description = "Name of the backend AWS CodePipeline"
  value       = aws_codepipeline.backend.name
}

output "frontend_pipeline_name" {
  description = "Name of the frontend AWS CodePipeline"
  value       = aws_codepipeline.frontend.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for pipeline alerts"
  value       = aws_sns_topic.pipeline_notifications.arn
}
