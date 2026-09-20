# ─── S3 Bucket for User Uploaded Property Images & Media ─────────────────────

resource "aws_s3_bucket" "media" {
  bucket        = "${var.project_name}-media-${data.aws_caller_identity.current.account_id}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-media-bucket"
    Environment = "production"
  }
}

# Public access block configuration: Allow public policy so images can be served publicly
resource "aws_s3_bucket_public_access_block" "media" {
  bucket = aws_s3_bucket.media.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

# S3 Bucket Policy: Allow Public Read for property images
resource "aws_s3_bucket_policy" "media_public_read" {
  depends_on = [aws_s3_bucket_public_access_block.media]
  bucket     = aws_s3_bucket.media.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.media.arn}/*"
      }
    ]
  })
}

# CORS Configuration: Allow direct browser uploads from frontend origins
resource "aws_s3_bucket_cors_configuration" "media" {
  bucket = aws_s3_bucket.media.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "HEAD"]
    allowed_origins = [
      "https://${var.frontend_subdomain}.${var.domain_name}",
      "http://localhost:5173",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:3000"
    ]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

output "media_s3_bucket" {
  value       = aws_s3_bucket.media.bucket
  description = "S3 bucket for property images and media"
}
