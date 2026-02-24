variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-northeast-1"
}

variable "bucket_name" {
  description = "S3 bucket name for game client"
  type        = string
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for the parent domain"
  type        = string
}

variable "domain_name" {
  description = "Base domain name for the application (e.g., simoba.yu-web.site)"
  type        = string
}
