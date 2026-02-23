## Why

Terraform で S3 + CloudFront の基盤は構築できるが、フロントエンドのビルド成果物をデプロイする手段がない。`npm run build` → S3 アップロード → CloudFront キャッシュ無効化の一連の流れを GitHub Actions で自動化し、任意のブランチからワンクリックでデプロイできるようにする。

## What Changes

- GitHub Actions ワークフロー `deploy-frontend.yml` を新規作成
  - `workflow_dispatch` で手動トリガー（ブランチ選択可能）
  - `npm ci` → `npm run build` でビルド
  - `aws s3 sync` で S3 バケットにアップロード
  - `aws cloudfront create-invalidation` でキャッシュ無効化
- 既存の OIDC 認証（`AWS_ROLE_ARN`）を再利用
- オーナーのみ実行可能（既存パターンの `authorize` ジョブ）

## Non-goals

- 自動デプロイ（push トリガー）は対象外。手動トリガーのみ
- カスタムドメインの設定（別チケット）
- 環境ごとの分離（dev/staging — 別チケット）

## Capabilities

### New Capabilities
- `frontend-deploy-workflow`: S3 へのフロントエンドビルド成果物デプロイを行う GitHub Actions ワークフロー

### Modified Capabilities

(なし)

## Impact

- `.github/workflows/deploy-frontend.yml` — 新規ファイル
- IAM ロールに `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`, `cloudfront:CreateInvalidation` の権限が必要（手動で追加）
- 既存の `deploy.yml`（Terraform）とは独立したワークフロー
