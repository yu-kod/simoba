# --- Route 53: Frontend → CloudFront ---
resource "aws_route53_record" "frontend" {
  count = var.create_frontend_record ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = var.cloudfront_distribution_domain
    zone_id                = var.cloudfront_distribution_zone_id
    evaluate_target_health = false
  }
}

# --- Route 53: API → ALB ---
resource "aws_route53_record" "api" {
  count = var.create_api_record ? 1 : 0

  zone_id = var.hosted_zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = var.alb_dns_name
    zone_id                = var.alb_zone_id
    evaluate_target_health = true
  }
}
