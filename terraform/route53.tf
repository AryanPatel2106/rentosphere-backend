# ─── Amazon Route 53 (DNS) ───────────────────────────────────────────────────

# Existing Route 53 Hosted Zone
data "aws_route53_zone" "main" {
  name         = "${var.domain_name}."
  private_zone = false
}

# Backend API A-Record (Alias to ALB)
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.backend_subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

# Frontend IPv4 A-Record (Alias to CloudFront)
resource "aws_route53_record" "frontend_a" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.frontend_subdomain}.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}

# Frontend IPv6 AAAA-Record (Alias to CloudFront)
resource "aws_route53_record" "frontend_aaaa" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "${var.frontend_subdomain}.${var.domain_name}"
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.frontend.domain_name
    zone_id                = aws_cloudfront_distribution.frontend.hosted_zone_id
    evaluate_target_health = false
  }
}
