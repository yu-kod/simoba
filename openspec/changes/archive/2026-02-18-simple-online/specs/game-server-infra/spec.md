## ADDED Requirements

### Requirement: ECS on EC2 Terraform モジュール
`infrastructure/terraform/modules/game-server/` に ECS on EC2 デプロイ用の Terraform モジュールを提供しなければならない（SHALL）。ECS クラスター、タスク定義、サービス、EC2 インスタンス（t3.small）を定義しなければならない（SHALL）。

#### Scenario: Terraform モジュールが有効な構成を生成する
- **WHEN** `terraform plan` を game-server モジュールに対して実行する
- **THEN** エラーなく実行計画が生成される

#### Scenario: ECS タスク定義が Colyseus コンテナを参照する
- **WHEN** タスク定義を確認する
- **THEN** `simoba-server` Docker イメージを使用し、ポート 2567 を公開する設定になっている

### Requirement: ALB + WebSocket 対応
Application Load Balancer を配置し、WebSocket 接続をサポートしなければならない（SHALL）。ヘルスチェックパスは `/health` でなければならない（SHALL）。

#### Scenario: ALB が WebSocket 接続をルーティングする
- **WHEN** クライアントが ALB の WebSocket エンドポイントに接続する
- **THEN** 接続が ECS 上の Colyseus コンテナにルーティングされる

#### Scenario: ALB ヘルスチェックが正常に動作する
- **WHEN** ALB がヘルスチェックを実行する
- **THEN** `/health` エンドポイントから 200 OK が返り、ターゲットが healthy と判定される

### Requirement: セキュリティグループ
ECS インスタンス用のセキュリティグループを定義しなければならない（SHALL）。インバウンドは ALB からのポート 2567 のみ許可しなければならない（SHALL）。ALB 用のセキュリティグループはインバウンドポート 80/443 を許可しなければならない（SHALL）。

#### Scenario: ECS インスタンスへの直接アクセスが拒否される
- **WHEN** 外部からECS インスタンスのポート 2567 に直接接続を試みる
- **THEN** 接続が拒否される（ALB 経由のみ許可）

### Requirement: docker-compose による Colyseus ローカル起動
既存の `infrastructure/docker/docker-compose.yml` に Colyseus サーバーのサービスを追加しなければならない（SHALL）。LocalStack と同じネットワークで起動できなければならない（SHALL）。

#### Scenario: docker-compose で Colyseus サーバーが起動する
- **WHEN** `docker-compose up` を `infrastructure/docker/` で実行する
- **THEN** LocalStack と Colyseus サーバーが同時に起動し、ポート 2567 で接続を受け付ける
