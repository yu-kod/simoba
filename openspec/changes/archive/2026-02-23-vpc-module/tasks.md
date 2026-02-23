## 1. VPC モジュール作成

- [x] 1.1 `infrastructure/terraform/modules/vpc/` を新規作成（`main.tf`, `variables.tf`, `outputs.tf`）
- [x] 1.2 VPC リソース（CIDR `10.0.0.0/16`）を定義
- [x] 1.3 Public subnets（2 AZ: `10.0.1.0/24`, `10.0.2.0/24`）を定義
- [x] 1.4 Internet Gateway + Route table（`0.0.0.0/0` → IGW）を定義
- [x] 1.5 outputs に `vpc_id`, `public_subnet_ids` を公開

## 2. game-server モジュール書き換え

- [x] 2.1 ALB 関連リソースを削除（`aws_lb`, `aws_lb_target_group`, `aws_lb_listener`, `aws_security_group.alb`）
- [x] 2.2 EC2 関連リソースを削除（`aws_launch_template`, `aws_autoscaling_group`, `aws_ecs_capacity_provider`, `aws_ecs_cluster_capacity_providers`, EC2 IAM Role/Instance Profile）
- [x] 2.3 Security Group を Fargate 用に書き換え（ポート 2567 を直接公開）
- [x] 2.4 Task Definition を Fargate 互換に変更（`awsvpc`, `FARGATE`）
- [x] 2.5 ECS Service を Fargate + public IP 構成に変更（`network_configuration` 追加）
- [x] 2.6 `container_image` が空の場合 Service/Task を作成しない（`count` 条件分岐）
- [x] 2.7 variables.tf を更新（`private_subnet_ids`, `instance_type` 削除、`public_subnet_ids` の説明更新）
- [x] 2.8 outputs.tf を更新（`alb_dns_name` 削除）

## 3. prod 環境の更新

- [x] 3.1 `prod/main.tf` に VPC モジュールを追加し、game_server に output を接続
- [x] 3.2 `prod/variables.tf` から `vpc_id`, `public_subnet_ids`, `private_subnet_ids` を削除
- [x] 3.3 `prod/terraform.tfvars` から不要な変数を削除（存在する場合）
