## Context

フロントエンドデプロイ (`deploy-frontend.yml`) は S3 sync + CloudFront invalidation で完成済み。ゲームサーバー側は Terraform で ECR リポジトリ・ECS Fargate クラスター・タスク定義の基盤が構築済みだが、Docker イメージのビルド・プッシュ・ECS 再デプロイのパイプラインが存在しない。

既存リソース:
- `server/Dockerfile` — マルチステージビルド（builder + production）
- `infrastructure/terraform/modules/game-server/main.tf` — ECR, ECS Cluster, Fargate Task Definition, Service
- `.github/workflows/deploy-frontend.yml` — 参考パターン（authorize + OIDC + deploy）

## Goals / Non-Goals

**Goals:**
- 手動トリガーで任意ブランチからゲームサーバーをデプロイ可能にする
- Docker イメージビルド → ECR プッシュ → ECS 再デプロイの一連のフローを自動化
- `deploy-frontend.yml` と一貫したパターン（authorize, OIDC, Job Summary）

**Non-Goals:**
- 自動デプロイ（push/merge トリガー）
- Blue/Green や Canary デプロイ戦略
- サービスディスカバリ・DNS 更新
- ヘルスチェックや rollback の自動化

## Decisions

### 1. ECS デプロイ方式: aws ecs update-service --force-new-deployment

**選択**: AWS CLI で直接タスク定義登録 + サービス更新
**理由**: Terraform はインフラ定義用であり、デプロイのたびに `terraform apply` を走らせるのは重い。AWS CLI の `register-task-definition` + `update-service` が最もシンプル。
**代替案**: `aws-actions/amazon-ecs-deploy-task-definition` アクション — 便利だが、タスク定義 JSON の管理が複雑になる。CLI で十分。

### 2. イメージタグ戦略: コミット SHA

**選択**: `${{ github.sha }}` をイメージタグに使用（ECR は IMMUTABLE タグ設定済み）
**理由**: IMMUTABLE タグのため `latest` は上書きできない。SHA タグならどのコミットのイメージか追跡可能。
**代替案**: セマンティックバージョニング — 手動管理が必要でオーバーヘッド大。

### 3. タスク定義の更新方法: 現在の定義を取得して image だけ差し替え

**選択**: `aws ecs describe-task-definition` で現在の定義を取得 → `containerDefinitions[0].image` を新イメージに差し替え → `register-task-definition` で新リビジョン登録
**理由**: Terraform で管理されているタスク定義の設定（CPU, メモリ, ポート, ログ設定等）を壊さずにイメージだけ更新できる。

### 4. ビルドコンテキスト: リポジトリルート

**選択**: Docker ビルドコンテキストはリポジトリルート、Dockerfile は `server/Dockerfile`
**理由**: Dockerfile が `COPY shared/ ./shared/` でルートからの相対パスを使っているため。`.dockerignore` でコンテキストサイズを制限。

## Risks / Trade-offs

- **[Terraform とのドリフト]** → CLI でタスク定義を更新すると Terraform state とずれる。次の `terraform apply` で上書きされる可能性。→ Terraform 側の `container_image` 変数を空にしておけばタスク定義自体が Terraform 管理外（count=0）。デプロイ時に CLI で直接作成する。
- **[初回デプロイ]** → ECS Service が存在しない初回は `update-service` が失敗する。→ 初回は `create-service` を使うか、Terraform で `container_image` を指定して先にサービスを作っておく。ワークフローでは存在確認をして分岐。
