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

variable "enable_public_access" {
  description = "Allow public access to S3 bucket"
  type        = bool
  default     = true
}
