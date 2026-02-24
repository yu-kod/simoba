output "frontend_domain" {
  description = "Frontend domain name"
  value       = var.domain_name
}

output "api_domain" {
  description = "API domain name"
  value       = "api.${var.domain_name}"
}
