output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = module.static_hosting.bucket_arn
}

output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = module.static_hosting.bucket_name
}

output "website_endpoint" {
  description = "S3 website endpoint URL"
  value       = module.static_hosting.website_endpoint
}

output "cloudfront_domain" {
  description = "CloudFront distribution domain name"
  value       = module.static_hosting.cloudfront_domain
}
