## 1. ワークフロー基盤

- [x] 1.1 `.github/workflows/deploy.yml` を作成し、`workflow_dispatch` トリガーに `action` 入力 (plan/apply/destroy) を定義する (specs: workflow_dispatch 手動トリガー)
- [x] 1.2 concurrency グループを設定し、同一環境への同時実行を防止する (specs: 同時実行の防止)
- [x] 1.3 `permissions: id-token: write` を設定し、OIDC トークン取得を許可する (specs: OIDC による AWS 認証)

## 2. AWS 認証

- [x] 2.1 `aws-actions/configure-aws-credentials` ステップを追加し、OIDC で `AWS_ROLE_ARN` シークレットを使って認証する (specs: OIDC による AWS 認証)

## 3. terraform-plan ジョブ

- [x] 3.1 `hashicorp/setup-terraform` で Terraform バージョンを固定する (specs: Terraform バージョン固定)
- [x] 3.2 `infrastructure/terraform/environments/prod/` で `terraform init` → `terraform plan -out=tfplan` を実行する (specs: terraform-plan ジョブ)
- [x] 3.3 plan 結果を `$GITHUB_STEP_SUMMARY` に出力する (specs: terraform-plan ジョブ)
- [x] 3.4 `tfplan` ファイルを GitHub Actions Artifact としてアップロードする (specs: terraform-plan ジョブ)

## 4. terraform-apply ジョブ

- [x] 4.1 `action == 'apply'` 条件で実行し、`needs: terraform-plan` で依存を設定する (specs: terraform-apply ジョブ)
- [x] 4.2 `environment: prod-deploy` を設定し、承認ゲートを有効にする (specs: terraform-apply ジョブ)
- [x] 4.3 Artifact から `tfplan` をダウンロードし、`terraform apply tfplan` を実行する (specs: terraform-apply ジョブ)

## 5. terraform-destroy ジョブ

- [x] 5.1 `action == 'destroy'` 条件で実行し、`environment: prod-deploy` の承認ゲートを設定する (specs: terraform-destroy ジョブ)
- [x] 5.2 `terraform init` → `terraform destroy -auto-approve` を実行する (specs: terraform-destroy ジョブ)

## 6. 検証

- [x] 6.1 ワークフローの YAML 構文を検証する (`actionlint` またはドライラン)
- [x] 6.2 GitHub Environment (`prod-deploy`) のセットアップ手順を PR 本文に記載する
