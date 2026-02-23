## Why

`game_server` モジュールが VPC/サブネットを要求するが、VPC がまだ存在しない。また現在の構成は ALB + ECS on EC2 で月額 $50+ かかり、個人プロジェクトにはオーバースペック。VPC を Terraform で管理し、game-server を Fargate + public IP の低コスト構成に書き換える。

## What Changes

- `infrastructure/terraform/modules/vpc/` を新規作成
  - VPC, Public subnets (2 AZ), Internet Gateway, Route table
  - Private subnet / NAT Gateway は不要（Fargate が public subnet で動くため）
- `infrastructure/terraform/modules/game-server/` を Fargate 構成に書き換え
  - **削除:** ALB, ALB Security Group, Target Group, Listener, Launch Template, ASG, Capacity Provider, EC2 IAM Role/Instance Profile
  - **維持:** ECR, ECS Cluster, Task Execution IAM Role, CloudWatch Logs
  - **変更:** Task Definition → Fargate 互換 (`awsvpc` network mode), ECS Service → Fargate + public IP
- `infrastructure/terraform/environments/prod/main.tf` を更新
  - VPC モジュール追加、game_server に VPC output を接続
  - **BREAKING:** `vpc_id`, `public_subnet_ids`, `private_subnet_ids` 変数を削除

## Non-goals

- Private subnet / NAT Gateway（現時点では不要）
- SSL/TLS 終端（別チケット、Let's Encrypt or ACM）
- 複数タスクへのスケーリング
- LocalStack 環境の VPC 対応

## Capabilities

### New Capabilities
- `vpc-networking`: AWS VPC ネットワーク基盤（VPC, Public subnets, IGW, Route table）

### Modified Capabilities
- `game-server-infra`: ALB + ECS on EC2 構成から Fargate + public IP 構成に変更

## Impact

- `infrastructure/terraform/modules/vpc/` — 新規モジュール
- `infrastructure/terraform/modules/game-server/` — 大幅書き換え（ALB/EC2 関連リソース削除）
- `infrastructure/terraform/environments/prod/main.tf` — VPC モジュール追加、変数削除
- `infrastructure/terraform/environments/prod/variables.tf` — `vpc_id`, `public_subnet_ids`, `private_subnet_ids` 削除
- `infrastructure/terraform/environments/prod/terraform.tfvars` — 不要な変数削除
- 月額コスト: ~$50+ → ~$10（Fargate 最小構成）
