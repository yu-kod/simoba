variable "bucket_name" {
  description = "Name of the S3 bucket for static hosting"
  type        = string
}

variable "environment" {
  description = "Environment name (local, dev, prod)"
  type        = string
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Custom domain name for CloudFront (e.g. simoba.yu-web.site). Empty string to use default CloudFront domain."
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN (us-east-1) for CloudFront custom domain"
  type        = string
  default     = ""
}
