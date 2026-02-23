## Why

Terraform で ECR/ECS Fargate 基盤は構築済みだが、Docker イメージのビルド・プッシュと ECS サービス更新を行うデプロイパイプラインが存在しない。フロントエンドの S3 デプロイワークフロー (`deploy-frontend.yml`) は完成しており、ゲームサーバー側にも同等の CI/CD が必要。

## What Changes

- GitHub Actions ワークフロー `deploy-game-server.yml` を新規作成
  - `workflow_dispatch` で手動トリガー（ブランチ選択可能）
  - Docker イメージビルド & ECR プッシュ
  - ECS サービスの新タスク定義で再デプロイ（force new deployment）
  - OIDC 認証（既存 IAM ロール再利用）
  - オーナーのみ実行可能（authorize ジョブ）
  - Job Summary でデプロイ結果表示
- `.dockerignore` を新規作成（ビルドコンテキスト最適化）

## Non-goals

- Dockerfile の変更（既に `server/Dockerfile` が存在）
- 自動デプロイ（push トリガー）— 手動 dispatch のみ
- Blue/Green や Rolling デプロイ戦略 — Fargate デフォルトで十分
- サービスディスカバリや DNS 更新 — Phase 2+ の別チケット

## Capabilities

### New Capabilities
- `game-server-deploy-workflow`: ゲームサーバーの Docker ビルド・ECR プッシュ・ECS 再デプロイを行う GitHub Actions ワークフロー

### Modified Capabilities

(なし)

## Impact

- `.github/workflows/deploy-game-server.yml` — 新規ファイル
- `.dockerignore` — 新規ファイル
- `README.md` — デプロイ手順セクション更新
- AWS Secrets: `AWS_ROLE_ARN` (既存), `ECR_REPOSITORY_URL` (新規)
- 既存の `server/Dockerfile` と `infrastructure/terraform/modules/game-server/` に依存
