variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for the parent domain"
  type        = string
}

variable "domain_name" {
  description = "Base domain name (e.g., simoba.yu-web.site)"
  type        = string
}

variable "cloudfront_distribution_domain" {
  description = "CloudFront distribution domain name for frontend alias"
  type        = string
  default     = ""
}

variable "cloudfront_distribution_zone_id" {
  description = "CloudFront distribution hosted zone ID"
  type        = string
  default     = ""
}

variable "alb_dns_name" {
  description = "ALB DNS name for API alias"
  type        = string
  default     = ""
}

variable "alb_zone_id" {
  description = "ALB hosted zone ID for API alias"
  type        = string
  default     = ""
}
