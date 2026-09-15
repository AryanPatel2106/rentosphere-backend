terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary AWS Provider for ap-south-1 (Mumbai)
provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "rentosphere"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary AWS Provider for us-east-1 (N. Virginia)
# Required for CloudFront SSL Certificate validation
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "rentosphere"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Current AWS Account & Region Data Sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Availability Zones in ap-south-1
data "aws_availability_zones" "available" {
  state = "available"
}
