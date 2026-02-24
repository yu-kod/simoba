variable "environment" {
  description = "Environment name (dev, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID for the game server"
  type        = string
}

variable "public_subnet_ids" {
  description = "List of public subnet IDs for Fargate tasks"
  type        = list(string)
}

variable "force_delete_ecr" {
  description = "Whether to force-delete all images in ECR on destroy"
  type        = bool
  default     = false
}

variable "container_image" {
  description = "Docker image URI for the Colyseus server. Empty string skips ECS Service creation."
  type        = string
  default     = ""
}

variable "container_port" {
  description = "Port the Colyseus container listens on"
  type        = number
  default     = 2567
}

variable "desired_count" {
  description = "Desired number of ECS tasks"
  type        = number
  default     = 1
}

variable "cpu" {
  description = "CPU units for the Fargate task (256, 512, 1024, 2048, 4096)"
  type        = number
  default     = 256
}

variable "memory" {
  description = "Memory in MiB for the Fargate task"
  type        = number
  default     = 512
}

variable "certificate_arn" {
  description = "ACM certificate ARN for ALB HTTPS listener"
  type        = string
}

variable "enable_deletion_protection" {
  description = "Enable ALB deletion protection to prevent accidental destruction"
  type        = bool
  default     = true
}
