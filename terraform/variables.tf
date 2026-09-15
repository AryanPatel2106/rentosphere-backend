variable "aws_region" {
  description = "Primary AWS Region for Rentosphere resources"
  type        = string
  default     = "ap-south-1"
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "rentosphere"
}

variable "domain_name" {
  description = "Base Route 53 domain name"
  type        = string
  default     = "clouddrive.page"
}

variable "frontend_subdomain" {
  description = "Subdomain for the React frontend (e.g. rentosphere.clouddrive.page)"
  type        = string
  default     = "rentosphere"
}

variable "backend_subdomain" {
  description = "Subdomain for the backend API (e.g. api.clouddrive.page)"
  type        = string
  default     = "api"
}

variable "vpc_cidr" {
  description = "CIDR block for the custom VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  description = "CIDR blocks for public subnets (across 2 AZs)"
  type        = list(string)
  default     = ["10.0.1.0/24", "10.0.2.0/24"]
}

variable "container_port" {
  description = "Port exposed by the backend container"
  type        = number
  default     = 5000
}

variable "backend_cpu" {
  description = "Fargate CPU units for backend task"
  type        = number
  default     = 256
}

variable "backend_memory" {
  description = "Fargate memory (MB) for backend task"
  type        = number
  default     = 512
}

variable "backend_desired_count" {
  description = "Desired number of backend tasks running in ECS"
  type        = number
  default     = 1
}

variable "backend_repo_name" {
  description = "Name of the ECR repository"
  type        = string
  default     = "rentosphere-backend"
}

variable "frontend_s3_bucket_name" {
  description = "Name of the S3 bucket for frontend static files"
  type        = string
  default     = "rentosphere-frontend-260543925645"
}

variable "github_connection_arn" {
  description = "ARN of the AWS CodeConnections / CodeStar connection to GitHub"
  type        = string
  default     = "arn:aws:codeconnections:ap-south-1:260543925645:connection/73f1020b-17bb-49bf-b6bd-e93fe61e7931"
}

variable "github_backend_repo" {
  description = "GitHub repository for backend (owner/repo)"
  type        = string
  default     = "AryanPatel2106/rentosphere-backend"
}

variable "github_frontend_repo" {
  description = "GitHub repository for frontend (owner/repo)"
  type        = string
  default     = "AryanPatel2106/rentosphere-frontend"
}

variable "github_branch" {
  description = "Git branch to trigger CI/CD pipelines"
  type        = string
  default     = "main"
}

variable "secrets_manager_arn" {
  description = "ARN of the AWS Secrets Manager secret for backend environment"
  type        = string
  default     = "arn:aws:secretsmanager:ap-south-1:260543925645:secret:rentosphere/backend-SaVP1e"
}

variable "alb_acm_certificate_arn" {
  description = "ARN of the ACM certificate in ap-south-1 for the Application Load Balancer"
  type        = string
  default     = "arn:aws:acm:ap-south-1:260543925645:certificate/f9adb7a0-a9eb-4d59-bb9c-efd155fc66a1"
}

variable "cloudfront_acm_certificate_arn" {
  description = "ARN of the ACM certificate in us-east-1 for CloudFront"
  type        = string
  default     = "arn:aws:acm:us-east-1:260543925645:certificate/e25f83ec-b8d3-44e1-ba86-b1fc99fc1067"
}

variable "notification_email" {
  description = "Optional email address to receive SNS pipeline build notifications"
  type        = string
  default     = "aryanpatel8082@gmail.com"
}
