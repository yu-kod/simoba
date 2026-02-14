variable "aws_region" {
  description = "AWS region for LocalStack"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name for game client"
  type        = string
}
