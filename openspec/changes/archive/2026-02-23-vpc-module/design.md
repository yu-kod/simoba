## Context

現在の `game-server` モジュールは ALB + ECS on EC2 構成で、VPC/サブネットを外部変数として要求する。VPC は未作成のため `terraform plan` がハングする。また ALB + NAT Gateway で月額 $50+ かかり、個人プロジェクトには過剰。

既存リソース（維持）: ECR, ECS Cluster, Task Execution IAM Role, CloudWatch Logs
削除対象: ALB, ALB SG, Target Group, Listener, Launch Template, ASG, Capacity Provider, EC2 IAM Role/Instance Profile

## Goals / Non-Goals

**Goals:**
- VPC を Terraform で管理し、game-server モジュールが自己完結できるようにする
- game-server を Fargate + public IP に書き換えてコストを最小化する
- `terraform plan` が入力待ちせず正常に完了する

**Non-Goals:**
- Private subnet / NAT Gateway
- SSL/TLS 終端
- オートスケーリング
- LocalStack 環境の VPC 対応

## Decisions

### 1. Public subnet のみ、NAT Gateway なし
**選択:** VPC に public subnet (2 AZ) のみ配置
**理由:** Fargate タスクに public IP を付与すれば ECR pull も外部通信も直接可能。NAT Gateway ($32/月) が不要。
**代替案:** Private subnet + NAT → コストが高く、単一タスクには不要

### 2. Fargate (serverless) を使用、EC2 不要
**選択:** ECS Fargate with `awsvpc` network mode
**理由:** EC2 インスタンス管理不要、AMI 更新不要、使った分だけ課金。最小構成で ~$10/月。
**代替案:** ECS on EC2 → EC2 管理が必要、固定コスト高い

### 3. ALB を削除し、Fargate タスクに直接アクセス
**選択:** Security Group で Colyseus ポート (2567) を直接公開
**理由:** 単一タスクに ALB は不要。$16/月の削減。WebSocket は Fargate の public IP に直接接続。
**代替案:** ALB を維持 → コスト増、単一タスクにはオーバースペック

### 4. VPC CIDR は /16、サブネットは /24
**選択:** VPC `10.0.0.0/16`, Public subnets `10.0.1.0/24`, `10.0.2.0/24`
**理由:** AWS 推奨のサイズ。将来の拡張に十分な余裕。

### 5. container_image のデフォルト値を設定
**選択:** `container_image` にデフォルト `""` を設定し、空の場合は ECS Service を作成しない
**理由:** 初回 `terraform apply` 時にコンテナイメージがまだ存在しない。`count` で条件分岐。

## Risks / Trade-offs

- **[Public IP の変動]** Fargate タスク再起動で IP が変わる → 将来 Elastic IP or DNS で対応（別チケット）
- **[SSL なし]** 初期は HTTP/WS のみ → 開発段階では許容、本番前に対応
- **[単一タスク]** 冗長性なし → 個人プロジェクトの初期段階では許容
- **[既存 state との衝突]** まだ apply されていないので state は空。破壊的変更だがリスクなし
