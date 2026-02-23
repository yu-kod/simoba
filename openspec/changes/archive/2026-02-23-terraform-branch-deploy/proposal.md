## Why

現在 Terraform の環境設定は `local` (LocalStack) と `prod` があるが、任意のブランチのコードを AWS にデプロイする手段がない。手動で Plan → 承認 → Apply できる GitHub Actions ワークフローを追加し、prod 環境へのデプロイを安全に行えるようにする。

## What Changes

- `.github/workflows/deploy.yml` に `workflow_dispatch` 手動トリガーの GitHub Actions ワークフローを追加。任意のブランチを選択して実行可能
- Plan → GitHub Environment 承認ゲート → Apply の 3 段階フロー
- OIDC (OpenID Connect) による AWS 認証。シークレットに AWS キーを保存しない
- 既存の `infrastructure/terraform/environments/prod/` 構成をそのまま使用

## Capabilities

### New Capabilities
- `github-actions-deploy`: workflow_dispatch 手動トリガーによる Terraform Plan/Apply ワークフロー (OIDC 認証、GitHub Environment 承認ゲート、prod 環境へのデプロイ)

### Modified Capabilities

(なし — 既存の prod Terraform 構成をそのまま使用)

## Non-goals

- 自動デプロイ (push トリガー) は対象外。手動起動のみ
- ブランチごとの独立環境 (dev 環境等は別チケットで対応)
- DNS / カスタムドメインの設定
- LocalStack 環境の変更
- Terraform モジュール自体の変更

## Impact

- **CI/CD**: `.github/workflows/deploy.yml` 新規ファイル。既存の `test.yml` には影響なし
- **AWS**: OIDC Identity Provider + IAM ロールの事前設定が必要
- **GitHub**: Environment (`prod-deploy`) の設定と承認者の登録が必要
- **既存ファイル**: 変更なし。`infrastructure/terraform/environments/prod/` をそのまま利用
- 参照スペック: `openspec/specs/game-server-infra/spec.md`, `openspec/specs/tech-architecture.md`
