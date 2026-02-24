output "regional_certificate_arn" {
  description = "ACM certificate ARN in ap-northeast-1 (for ALB)"
  value       = aws_acm_certificate_validation.regional.certificate_arn
}

output "global_certificate_arn" {
  description = "ACM certificate ARN in us-east-1 (for CloudFront)"
  value       = aws_acm_certificate_validation.global.certificate_arn
}

output "frontend_domain" {
  description = "Frontend domain name"
  value       = var.domain_name
}

output "api_domain" {
  description = "API domain name"
  value       = "api.${var.domain_name}"
}
