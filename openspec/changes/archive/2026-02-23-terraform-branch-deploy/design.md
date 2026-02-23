## Context

現在の Terraform 構成:
- `infrastructure/terraform/environments/prod/main.tf` — S3 backend、`static_hosting` + `game_server` モジュール
- `infrastructure/terraform/environments/local/main.tf` — LocalStack 向け、`static_hosting` のみ
- モジュール: `static-hosting` (S3 + CloudFront)、`game-server` (ECS on EC2 + ALB)

prod 環境に任意ブランチのコードをデプロイする GitHub Actions ワークフローが必要。
prod の `main.tf` にある `container_image` は `${module.game_server.ecr_repository_url}:latest` と循環参照になっている点に注意が必要。

## Goals / Non-Goals

**Goals:**
- 任意ブランチから手動で prod 環境に Terraform Plan/Apply を実行できる
- Plan 結果を確認し、承認後に Apply を実行する安全なフロー
- AWS キーをシークレットに保存しない (OIDC 認証)

**Non-Goals:**
- ブランチごとの独立環境構築
- dev 環境の追加 (別チケット)
- 自動デプロイ (push トリガー)
- Docker イメージのビルド・プッシュ (Terraform の Plan/Apply のみ)
- Terraform モジュールの変更

## Decisions

### 1. AWS 認証: OIDC

**選択:** GitHub Actions OIDC + `aws-actions/configure-aws-credentials`

**理由:** AWS アクセスキーをシークレットに保存すると漏洩リスクがある。OIDC は一時的な認証情報を使い、リポジトリ・ブランチ単位で制限できる。

**代替案:**
- AWS Access Key/Secret を GitHub Secrets に保存 — シンプルだがキーのローテーション管理が必要
- AWS SSO — セットアップが複雑

**前提条件:** AWS 側で以下の事前設定が必要:
- IAM OIDC Identity Provider (`token.actions.githubusercontent.com`)
- IAM ロール (trust policy で `repo:yu-kod/simoba:*` に制限)
- ロール ARN を GitHub Secrets `AWS_ROLE_ARN` に設定

### 2. ワークフロートリガー: workflow_dispatch

**選択:** `workflow_dispatch` で `action` (plan/apply/destroy) と `environment` (prod) を入力

**理由:** 手動起動でブランチを GitHub UI から選択可能。意図しないデプロイを防止。

**フロー:**
1. GitHub UI で「Run workflow」→ ブランチ選択 → action 選択
2. `plan` → `terraform plan` 実行、結果を Job Summary に出力
3. `apply` → Plan 実行後、GitHub Environment 承認ゲートを通過してから `terraform apply`
4. `destroy` → 承認後に `terraform destroy`

### 3. 承認ゲート: GitHub Environment

**選択:** GitHub Environment の Required Reviewers 機能

**理由:** GitHub ネイティブの承認フローで追加ツール不要。`apply` / `destroy` 時のみ承認を要求。

**Environment 設定:**
- `prod-deploy`: Required Reviewers を設定。`plan` は承認不要、`apply` / `destroy` は承認必須

### 4. Terraform State: 既存 S3 backend

**選択:** `prod/main.tf` の既存 S3 backend をそのまま使用

**理由:** 新しい環境を作るわけではないので、state ファイルは既存の `prod/terraform.tfstate` をそのまま参照。

### 5. ジョブ構成: plan + apply の 2 ジョブ

**選択:**
- `terraform-plan` ジョブ: init → plan → Artifact に tfplan 保存 → Job Summary に出力
- `terraform-apply` ジョブ: Artifact から tfplan 取得 → `environment: prod-deploy` (承認ゲート) → apply
- `terraform-destroy` ジョブ: `environment: prod-deploy` (承認ゲート) → destroy

**理由:** plan の結果を人間が確認してから apply する安全なフロー。plan ファイルを Artifact で受け渡すことで、plan 時と apply 時の差分を防ぐ。

## Risks / Trade-offs

- **[State lock 競合]** 複数人が同時に plan/apply すると DynamoDB lock で片方が失敗する → ワークフローの concurrency group で同時実行を防止
- **[OIDC 設定漏れ]** IAM ロールの trust policy が正しくないと認証失敗 → README にセットアップ手順を記載
- **[prod 直接操作]** 承認ゲートがあるが、plan なしで apply を選択できてしまう → apply 時にも内部で plan を実行し、差分があれば適用
- **[container_image 循環参照]** `prod/main.tf` の `container_image` が `module.game_server.ecr_repository_url` を参照 → 初回は ECR が存在しないため plan 失敗の可能性。別途対応が必要

## Open Questions

- ECR への Docker イメージプッシュは別ワークフローで行うか？(今回のスコープ外だが、apply 前にイメージが必要)
- `prod/main.tf` の `container_image` 循環参照をどう解決するか？ (既存の問題)
