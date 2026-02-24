output "ecr_repository_url" {
  description = "ECR repository URL for the game server image"
  value       = aws_ecr_repository.game_server.repository_url
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.game.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = var.container_image != "" ? aws_ecs_service.game[0].name : null
}

output "alb_dns_name" {
  description = "ALB DNS name for Route 53 alias record"
  value       = aws_lb.game.dns_name
}

output "alb_zone_id" {
  description = "ALB hosted zone ID for Route 53 alias record"
  value       = aws_lb.game.zone_id
}
