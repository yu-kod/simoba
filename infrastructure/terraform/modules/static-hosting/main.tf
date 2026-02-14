resource "aws_s3_bucket" "game_client" {
  bucket = var.bucket_name

  tags = {
    Name        = "simoba-game-client"
    Environment = var.environment
  }
}

resource "aws_s3_bucket_website_configuration" "game_client" {
  bucket = aws_s3_bucket.game_client.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
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

resource "aws_s3_bucket_public_access_block" "game_client" {
  bucket = aws_s3_bucket.game_client.id

  block_public_acls       = !var.enable_public_access
  block_public_policy     = !var.enable_public_access
  ignore_public_acls      = !var.enable_public_access
  restrict_public_buckets = !var.enable_public_access
}

resource "aws_s3_bucket_policy" "game_client" {
  count  = var.enable_public_access ? 1 : 0
  bucket = aws_s3_bucket.game_client.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.game_client.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.game_client]
}

resource "aws_cloudfront_distribution" "game_cdn" {
  count   = var.enable_cloudfront ? 1 : 0
  enabled = true

  origin {
    domain_name = aws_s3_bucket_website_configuration.game_client.website_endpoint
    origin_id   = "S3-${var.bucket_name}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${var.bucket_name}"

    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    viewer_protocol_policy = "redirect-to-https"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  tags = {
    Name        = "simoba-cdn"
    Environment = var.environment
  }
}
