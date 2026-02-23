## ADDED Requirements

### Requirement: workflow_dispatch 手動トリガー
`.github/workflows/deploy.yml` は `workflow_dispatch` イベントで起動しなければならない（SHALL）。入力パラメータとして `action` (`plan` / `apply` / `destroy`) を受け付けなければならない（SHALL）。ブランチ選択は GitHub UI のデフォルト機能を使用しなければならない（SHALL）。

#### Scenario: plan アクションを手動実行する
- **WHEN** GitHub UI で「Run workflow」からブランチを選択し、`action: plan` で実行する
- **THEN** ワークフローが起動し、`terraform-plan` ジョブが実行される

#### Scenario: apply アクションを手動実行する
- **WHEN** GitHub UI で `action: apply` を選択して実行する
- **THEN** `terraform-plan` ジョブ実行後、承認ゲートを経て `terraform-apply` ジョブが実行される

#### Scenario: destroy アクションを手動実行する
- **WHEN** GitHub UI で `action: destroy` を選択して実行する
- **THEN** 承認ゲートを経て `terraform-destroy` ジョブが実行される

### Requirement: OIDC による AWS 認証
ワークフローは GitHub Actions OIDC を使用して AWS に認証しなければならない（SHALL）。`aws-actions/configure-aws-credentials` アクションと `role-to-assume` パラメータを使用しなければならない（SHALL）。AWS アクセスキーを GitHub Secrets に保存してはならない（SHALL NOT）。

#### Scenario: OIDC で一時認証情報を取得する
- **WHEN** ワークフローが AWS 認証ステップを実行する
- **THEN** OIDC トークンで一時的な AWS 認証情報が取得され、Terraform コマンドが実行可能になる

#### Scenario: IAM ロール ARN がシークレットから読まれる
- **WHEN** ワークフローが実行される
- **THEN** `AWS_ROLE_ARN` シークレットから IAM ロール ARN を取得して使用する

### Requirement: terraform-plan ジョブ
`terraform-plan` ジョブは `infrastructure/terraform/environments/prod/` に対して `terraform init` と `terraform plan` を実行しなければならない（SHALL）。Plan 結果を GitHub Actions Artifact として保存しなければならない（SHALL）。Plan のサマリーを Job Summary に出力しなければならない（SHALL）。

#### Scenario: plan が成功する
- **WHEN** `action: plan` または `action: apply` でワークフローが実行される
- **THEN** `terraform init` → `terraform plan -out=tfplan` が実行され、`tfplan` ファイルが Artifact にアップロードされる

#### Scenario: plan サマリーが Job Summary に表示される
- **WHEN** `terraform plan` が完了する
- **THEN** plan の出力が `$GITHUB_STEP_SUMMARY` に書き込まれ、GitHub UI で確認できる

#### Scenario: plan が失敗する
- **WHEN** Terraform の設定にエラーがある
- **THEN** ジョブが失敗ステータスで終了し、エラー内容が表示される

### Requirement: terraform-apply ジョブ
`terraform-apply` ジョブは `action: apply` の場合のみ実行しなければならない（SHALL）。GitHub Environment `prod-deploy` の承認ゲートを通過した後に実行しなければならない（SHALL）。`terraform-plan` ジョブが保存した `tfplan` Artifact を使って `terraform apply` を実行しなければならない（SHALL）。

#### Scenario: 承認後に apply が実行される
- **WHEN** `terraform-plan` ジョブが成功し、`prod-deploy` Environment の承認者が承認する
- **THEN** `terraform apply tfplan` が実行される

#### Scenario: 承認が拒否される
- **WHEN** 承認者が拒否する
- **THEN** `terraform-apply` ジョブは実行されず、ワークフローが終了する

#### Scenario: plan ジョブが失敗した場合
- **WHEN** `terraform-plan` ジョブが失敗した状態で apply ジョブに進む
- **THEN** `terraform-apply` ジョブは実行されない（`needs: terraform-plan` による依存）

### Requirement: terraform-destroy ジョブ
`terraform-destroy` ジョブは `action: destroy` の場合のみ実行しなければならない（SHALL）。GitHub Environment `prod-deploy` の承認ゲートを通過した後に実行しなければならない（SHALL）。

#### Scenario: 承認後に destroy が実行される
- **WHEN** `action: destroy` で実行し、承認者が承認する
- **THEN** `terraform destroy -auto-approve` が実行される

### Requirement: 同時実行の防止
ワークフローは concurrency グループを設定し、同じ環境への同時実行を防止しなければならない（SHALL）。後から起動したワークフローはキューに入り、先行ワークフローの完了を待たなければならない（SHALL）。

#### Scenario: 同時に 2 つの apply が実行される
- **WHEN** ユーザー A が apply を実行中に、ユーザー B が apply を実行する
- **THEN** ユーザー B のワークフローはユーザー A の完了を待ってから実行される

### Requirement: Terraform バージョン固定
ワークフローは `hashicorp/setup-terraform` アクションで Terraform バージョンを固定しなければならない（SHALL）。バージョンは既存の `required_version` 制約 (`>= 1.0`) に準拠しなければならない（SHALL）。

#### Scenario: 指定バージョンの Terraform が使われる
- **WHEN** ワークフローが Terraform セットアップステップを実行する
- **THEN** 指定されたバージョン（例: `1.14.x`）の Terraform がインストールされて使用される
