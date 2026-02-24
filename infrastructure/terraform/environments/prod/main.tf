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

provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"

  default_tags {
    tags = {
      Project     = "simoba"
      Environment = "prod"
      ManagedBy   = "terraform"
    }
  }
}

module "vpc" {
  source = "../../modules/vpc"

  environment = "prod"
}

module "static_hosting" {
  source = "../../modules/static-hosting"

  bucket_name       = var.bucket_name
  environment       = "prod"
  enable_cloudfront = true
  domain_name       = var.domain_name
  certificate_arn   = module.dns.global_certificate_arn
}

module "game_server" {
  source = "../../modules/game-server"

  environment       = "prod"
  vpc_id            = module.vpc.vpc_id
  public_subnet_ids = module.vpc.public_subnet_ids
  container_image   = "012502956603.dkr.ecr.ap-northeast-1.amazonaws.com/simoba-game-prod:de4e027e57eed347478b5ae755dfc105002a799d"
  certificate_arn   = module.dns.regional_certificate_arn
}

module "dns" {
  source = "../../modules/dns"

  providers = {
    aws.us_east_1 = aws.us_east_1
  }

  hosted_zone_id                       = var.hosted_zone_id
  domain_name                          = var.domain_name
  cloudfront_distribution_domain  = module.static_hosting.cloudfront_domain
  cloudfront_distribution_zone_id = module.static_hosting.cloudfront_hosted_zone_id
  alb_dns_name                         = module.game_server.alb_dns_name
  alb_zone_id                          = module.game_server.alb_zone_id
}
