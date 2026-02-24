## Tasks

- [x] Task 1: DNS モジュール作成（ACM 証明書 + Route 53）
- [x] Task 2: game-server モジュールに ALB 追加
- [x] Task 3: static-hosting モジュールに CloudFront カスタムドメイン追加
- [x] Task 4: prod 環境にモジュール統合
- [x] Task 5: IAM 権限ドキュメント + VITE_SERVER_URL 更新

### Task 1: DNS モジュール作成（ACM 証明書 + Route 53）

Create `infrastructure/terraform/modules/dns/`.

**Files:**
- `modules/dns/main.tf` — ACM certificates (us-east-1 + ap-northeast-1), DNS validation records, frontend/API A-alias records
- `modules/dns/variables.tf` — hosted_zone_id, domain_name, cloudfront_distribution, alb_dns_name, alb_zone_id
- `modules/dns/outputs.tf` — certificate ARNs (both regions), domain names

**Details:**
- us-east-1 provider alias for CloudFront ACM certificate
- ap-northeast-1 certificate for ALB
- `aws_acm_certificate_validation` to wait for validation
- Wildcard SAN: `*.simoba.yu-web.site` + `simoba.yu-web.site`

### Task 2: game-server モジュールに ALB 追加

Modify `infrastructure/terraform/modules/game-server/main.tf`.

**Changes:**
- Add `aws_lb` (ALB) in public subnets
- Add `aws_lb_target_group` (port 2567, health check `/health`)
- Add `aws_lb_listener` (HTTPS 443, ACM cert from dns module)
- Add `aws_security_group` for ALB (ingress 443 from 0.0.0.0/0)
- Update ECS security group: change ingress from 0.0.0.0/0 to ALB SG
- Add `load_balancer` block to `aws_ecs_service`
- New variables: `certificate_arn`, `alb_subnet_ids` (or reuse public_subnet_ids)
- New outputs: `alb_dns_name`, `alb_zone_id`

### Task 3: static-hosting モジュールに CloudFront カスタムドメイン追加

Modify `infrastructure/terraform/modules/static-hosting/main.tf`.

**Changes:**
- Add `aliases` to CloudFront distribution
- Update `viewer_certificate` from `cloudfront_default_certificate` to ACM certificate
- New variables: `domain_name` (optional), `certificate_arn` (optional)
- Conditional: only set aliases and ACM cert when domain_name is provided

### Task 4: prod 環境にモジュール統合

Modify `infrastructure/terraform/environments/prod/`.

**Changes:**
- `main.tf`: Add `module "dns"` with hosted_zone_id, domain_name, CloudFront/ALB references
- `main.tf`: Pass `certificate_arn` to `game_server` and `static_hosting` modules
- `main.tf`: Add `aws` provider alias for `us-east-1` (required for CloudFront ACM)
- `variables.tf`: Add `hosted_zone_id`, `domain_name`
- `terraform.tfvars`: Add `hosted_zone_id = "Z02956541GQAWF6V9L2QH"`, `domain_name = "simoba.yu-web.site"`

### Task 5: IAM 権限ドキュメント + VITE_SERVER_URL 更新

**Manual steps (documented):**

#### 1. GitHub Actions IAM role に追加する権限

以下のポリシーを GitHub Actions の IAM ロールにアタッチする:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Route53",
      "Effect": "Allow",
      "Action": [
        "route53:GetHostedZone",
        "route53:ChangeResourceRecordSets",
        "route53:ListResourceRecordSets",
        "route53:GetChange"
      ],
      "Resource": [
        "arn:aws:route53:::hostedzone/Z02956541GQAWF6V9L2QH",
        "arn:aws:route53:::change/*"
      ]
    },
    {
      "Sid": "ACM",
      "Effect": "Allow",
      "Action": [
        "acm:RequestCertificate",
        "acm:DescribeCertificate",
        "acm:DeleteCertificate",
        "acm:ListTagsForCertificate",
        "acm:AddTagsToCertificate"
      ],
      "Resource": "*"
    },
    {
      "Sid": "ELB",
      "Effect": "Allow",
      "Action": [
        "elasticloadbalancing:CreateLoadBalancer",
        "elasticloadbalancing:DeleteLoadBalancer",
        "elasticloadbalancing:DescribeLoadBalancers",
        "elasticloadbalancing:DescribeLoadBalancerAttributes",
        "elasticloadbalancing:ModifyLoadBalancerAttributes",
        "elasticloadbalancing:CreateTargetGroup",
        "elasticloadbalancing:DeleteTargetGroup",
        "elasticloadbalancing:DescribeTargetGroups",
        "elasticloadbalancing:DescribeTargetGroupAttributes",
        "elasticloadbalancing:ModifyTargetGroupAttributes",
        "elasticloadbalancing:CreateListener",
        "elasticloadbalancing:DeleteListener",
        "elasticloadbalancing:DescribeListeners",
        "elasticloadbalancing:DescribeTags",
        "elasticloadbalancing:AddTags",
        "elasticloadbalancing:RemoveTags",
        "elasticloadbalancing:SetSecurityGroups"
      ],
      "Resource": "*"
    }
  ]
}
```

#### 2. GitHub Secret 更新

- `VITE_SERVER_URL` を `https://api.simoba.yu-web.site` に更新
