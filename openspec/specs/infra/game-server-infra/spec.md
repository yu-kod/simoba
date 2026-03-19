# Specification

## Purpose
ECS on EC2 Terraform モジュール、ALB/HTTPS リスナー、セキュリティグループなどのゲームサーバーインフラ仕様

## Requirements

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

### Requirement: ALB + HTTPS リスナー
`modules/game-server/` モジュールは ALB を public サブネットに作成しなければならない（SHALL）。HTTPS リスナー（ポート 443）を ACM 証明書で設定しなければならない（SHALL）。ターゲットグループはポート 2567 でヘルスチェック（`/health`）を行わなければならない（SHALL）。

#### Scenario: ALB が HTTPS でリクエストを受け付ける
- **WHEN** `https://api.simoba.yu-web.site` にリクエストを送信する
- **THEN** ALB が HTTPS を終端し、ターゲットグループの ECS タスクに HTTP で転送する

#### Scenario: ヘルスチェックが正常に機能する
- **WHEN** ALB ターゲットグループがヘルスチェックを実行する
- **THEN** `/health` エンドポイントに HTTP GET でアクセスし、200 レスポンスでヘルシー判定する

### Requirement: セキュリティグループ
ECS タスクのセキュリティグループは、ALB のセキュリティグループからのポート 2567 のみを許可しなければならない（SHALL）。直接のパブリックアクセスを禁止しなければならない（SHALL）。ALB 用のセキュリティグループはポート 443 を全世界から許可しなければならない（SHALL）。

#### Scenario: ALB 経由でのみ ECS にアクセス可能
- **WHEN** 外部から ECS タスクのポート 2567 に直接接続を試みる
- **THEN** 接続が拒否される

#### Scenario: ALB からの接続は許可される
- **WHEN** ALB がポート 2567 で ECS タスクに転送する
- **THEN** 接続が許可される

### Requirement: ECS サービスの ALB 統合
ECS サービスは `load_balancer` ブロックで ALB ターゲットグループに登録しなければならない（SHALL）。コンテナ名 `colyseus`、コンテナポート 2567 を指定しなければならない（SHALL）。

#### Scenario: ECS タスクが ALB ターゲットグループに登録される
- **WHEN** ECS サービスが起動する
- **THEN** Fargate タスクが ALB ターゲットグループの healthy ターゲットとして登録される
