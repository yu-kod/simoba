## Why

CloudFront serves the frontend over HTTPS, but the ECS game server only accepts HTTP/WS connections. Browsers block this as Mixed Content, making online multiplayer unusable in production. Custom domains with ALB + ACM provide HTTPS/WSS termination for the game server and a branded URL for the frontend.

## What Changes

- Add ACM wildcard certificate for `*.simoba.yu-web.site` and `simoba.yu-web.site`
- Add ALB with HTTPS listener (port 443) in front of ECS Fargate tasks
- Add Route 53 DNS records for `simoba.yu-web.site` (CloudFront) and `api.simoba.yu-web.site` (ALB)
- **BREAKING**: Update CloudFront to use custom domain + ACM certificate instead of default domain
- **BREAKING**: Update ECS security group to restrict ingress to ALB only (no direct public access)
- Update `VITE_SERVER_URL` to `https://api.simoba.yu-web.site`
- Add required IAM permissions for Route 53, ACM, and ELB to GitHub Actions role

## Capabilities

### New Capabilities
- `custom-domain-ssl`: ACM certificate management, Route 53 DNS records for both frontend and API subdomains

### Modified Capabilities
- `game-server-infra`: Add ALB + target group + HTTPS listener; update ECS service with load balancer configuration; restrict security group ingress to ALB

## Impact

- **Terraform modules**: `static-hosting` (CloudFront aliases + ACM), `game-server` (ALB + SG changes), new `dns` module
- **Terraform environment**: `prod/main.tf` needs hosted_zone_id and domain variables
- **IAM**: GitHub Actions role needs `route53:*`, `acm:*`, `elasticloadbalancing:*` permissions
- **GitHub Secrets**: `VITE_SERVER_URL` updated to `https://api.simoba.yu-web.site`
- **Cost**: +~$18/month for ALB
