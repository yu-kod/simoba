## Approach

Add a new `dns` Terraform module for ACM + Route 53, extend `game-server` module with ALB resources, and update `static-hosting` module for CloudFront custom domain. All changes are infrastructure-only; no application code changes except updating the `VITE_SERVER_URL` secret.

### ACM Certificate Strategy
- Single wildcard certificate: `*.simoba.yu-web.site` + `simoba.yu-web.site` (SAN)
- DNS validation via Route 53 (automated by Terraform)
- Certificate in `us-east-1` for CloudFront (ACM requirement), separate from `ap-northeast-1` resources
- Use `aws_acm_certificate_validation` to wait for validation before using cert

### ALB Architecture
```
Internet → ALB (443/HTTPS) → Target Group (2567/HTTP) → ECS Fargate Tasks
```
- ALB in public subnets (same as ECS tasks)
- HTTPS listener on port 443 with ACM certificate
- Target group health check on `/health` endpoint (already exists in server)
- Stickiness enabled for WebSocket connection persistence

### DNS Records
- `simoba.yu-web.site` → A (alias) → CloudFront distribution
- `api.simoba.yu-web.site` → A (alias) → ALB

### Security Group Changes
- New SG for ALB: ingress 443 from 0.0.0.0/0
- Update ECS SG: ingress 2567 from ALB SG only (remove public 0.0.0.0/0)

### CloudFront Update
- Add `aliases = ["simoba.yu-web.site"]`
- Reference ACM certificate (must be in us-east-1)
- Keep existing S3 origin configuration

## Key Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| ACM region for CloudFront | us-east-1 | CloudFront requires us-east-1 certificates |
| ACM region for ALB | ap-northeast-1 | ALB uses regional certificate |
| Two certificates vs one | Two (one per region) | CloudFront requires us-east-1; ALB requires ap-northeast-1 |
| ALB vs NLB | ALB | HTTP/HTTPS termination, health checks, WebSocket support |
| DNS module vs inline | Separate module | Reusable, clean separation of concerns |
| WebSocket stickiness | Target group stickiness | Colyseus needs persistent connections |

## Non-goals

- Custom domain for non-prod environments
- WAF or rate limiting on ALB (future work)
- CORS configuration changes (Colyseus handles CORS)
- Multiple AZs for ALB (already using 2 subnets)

## Module Structure

```
modules/
  dns/                    # NEW: ACM + Route 53
    main.tf
    variables.tf
    outputs.tf
  game-server/            # MODIFIED: Add ALB
    main.tf               # Add ALB, target group, HTTPS listener, SG
    variables.tf          # Add domain_name, certificate_arn
    outputs.tf            # Add ALB DNS name
  static-hosting/         # MODIFIED: CloudFront custom domain
    main.tf               # Add aliases, ACM cert reference
    variables.tf          # Add domain_name, certificate_arn
environments/
  prod/
    main.tf               # Add dns module, pass new variables
    variables.tf          # Add hosted_zone_id, domain_name
    terraform.tfvars      # Add domain values
```
