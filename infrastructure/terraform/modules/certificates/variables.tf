variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID for DNS validation records"
  type        = string
}

variable "domain_name" {
  description = "Base domain name (e.g., simoba.yu-web.site)"
  type        = string
}
