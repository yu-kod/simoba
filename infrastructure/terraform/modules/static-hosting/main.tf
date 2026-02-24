resource "aws_s3_bucket" "game_client" {
  bucket = var.bucket_name

  tags = {
    Name        = "simoba-game-client"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_versioning" "game_client" {
  bucket = aws_s3_bucket.game_client.id

  versioning_configuration {
    status = var.environment == "prod" ? "Enabled" : "Suspended"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "game_client" {
  bucket = aws_s3_bucket.game_client.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# --- Block all public access (CloudFront OAC handles access) ---
resource "aws_s3_bucket_public_access_block" "game_client" {
  bucket = aws_s3_bucket.game_client.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# --- Bucket policy: allow CloudFront OAC only ---
resource "aws_s3_bucket_policy" "game_client" {
  count  = var.enable_cloudfront ? 1 : 0
  bucket = aws_s3_bucket.game_client.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowCloudFrontOAC"
        Effect    = "Allow"
        Principal = { Service = "cloudfront.amazonaws.com" }
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.game_client.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = aws_cloudfront_distribution.game_cdn[0].arn
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.game_client]
}

# --- CloudFront Origin Access Control ---
resource "aws_cloudfront_origin_access_control" "game_cdn" {
  count = var.enable_cloudfront ? 1 : 0

  name                              = "simoba-s3-oac-${var.environment}"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

# --- CloudFront Distribution ---
resource "aws_cloudfront_distribution" "game_cdn" {
  count   = var.enable_cloudfront ? 1 : 0
  enabled = true

  default_root_object = "index.html"

  origin {
    domain_name              = aws_s3_bucket.game_client.bucket_regional_domain_name
    origin_id                = "S3-${var.bucket_name}"
    origin_access_control_id = aws_cloudfront_origin_access_control.game_cdn[0].id
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.bucket_name}"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
  }

  # SPA routing: return index.html for 403/404 from S3
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  aliases = var.domain_name != "" ? [var.domain_name] : []

  viewer_certificate {
    cloudfront_default_certificate = var.domain_name == ""
    acm_certificate_arn            = var.domain_name != "" ? var.certificate_arn : null
    ssl_support_method             = var.domain_name != "" ? "sni-only" : null
    minimum_protocol_version       = var.domain_name != "" ? "TLSv1.2_2021" : null
  }

  tags = {
    Name        = "simoba-cdn"
    Environment = var.environment
  }
}
