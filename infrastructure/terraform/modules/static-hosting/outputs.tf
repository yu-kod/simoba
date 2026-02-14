output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.game_client.arn
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.game_client.id
}

output "website_endpoint" {
  description = "S3 website endpoint URL"
  value       = aws_s3_bucket_website_configuration.game_client.website_endpoint
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.game_cdn[0].domain_name : null
}
