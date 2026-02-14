terraform {
  required_version = ">= 1.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "simoba-terraform-state"
    key            = "prod/terraform.tfstate"
    region         = "ap-northeast-1"
    encrypt        = true
    dynamodb_table = "simoba-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "simoba"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "static_hosting" {
  source = "../../modules/static-hosting"

  bucket_name       = var.bucket_name
  environment       = "prod"
  enable_cloudfront = true
}
