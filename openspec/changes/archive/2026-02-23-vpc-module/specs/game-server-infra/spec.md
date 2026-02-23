## MODIFIED Requirements

### Requirement: ECS on EC2 Terraform モジュール
`infrastructure/terraform/modules/game-server/` に ECS Fargate デプロイ用の Terraform モジュールを提供しなければならない（SHALL）。ECS クラスター、Fargate タスク定義、ECS Service を定義しなければならない（SHALL）。タスクは `awsvpc` network mode で public IP を付与しなければならない（SHALL）。コンテナイメージが未指定の場合、ECS Service を作成しないこと（SHALL）。

#### Scenario: Terraform モジュールが有効な構成を生成する
- **WHEN** `terraform plan` を game-server モジュールに対して実行する
- **THEN** エラーなく実行計画が生成される

#### Scenario: ECS タスク定義が Fargate 互換である
- **WHEN** タスク定義を確認する
- **THEN** `requires_compatibilities` が `FARGATE`、`network_mode` が `awsvpc`、ポート 2567 を公開する設定になっている

#### Scenario: コンテナイメージ未指定時に Service が作成されない
- **WHEN** `container_image` が空文字列で `terraform plan` を実行する
- **THEN** ECS Service と Task Definition は作成されない

### Requirement: セキュリティグループ
Fargate タスク用のセキュリティグループを定義しなければならない（SHALL）。インバウンドはポート 2567 を全世界から許可しなければならない（SHALL）。

#### Scenario: 外部から Colyseus ポートにアクセスできる
- **WHEN** 外部から Fargate タスクのポート 2567 に接続を試みる
- **THEN** 接続が許可される

## REMOVED Requirements

### Requirement: ALB + WebSocket 対応
**Reason**: Fargate + public IP 構成に変更。ALB を削除しコストを削減。
**Migration**: クライアントは Fargate タスクの public IP に直接 WebSocket 接続する。

### Requirement: docker-compose による Colyseus ローカル起動
**Reason**: 本変更のスコープ外。ローカル開発環境は別途対応。
**Migration**: なし（既存の docker-compose は変更しない）
