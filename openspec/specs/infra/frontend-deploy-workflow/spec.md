# Specification

## Purpose
GitHub Actions によるフロントエンドの手動デプロイワークフロー（S3 + CloudFront）の仕様

## Requirements

### Requirement: Manual workflow trigger with branch selection
ワークフローは `workflow_dispatch` で手動トリガーされ、GitHub UI のブランチセレクタで任意のブランチを選択できること。

#### Scenario: Owner triggers deploy from main branch
- **WHEN** リポジトリオーナーが Actions UI から `main` ブランチを選択し「Run workflow」を実行する
- **THEN** 選択したブランチのコードがチェックアウトされ、ビルドとデプロイが開始される

#### Scenario: Non-owner attempts to trigger
- **WHEN** リポジトリオーナー以外がワークフローを実行しようとする
- **THEN** エラーメッセージが表示され、ワークフローが失敗する

### Requirement: Frontend build step
ワークフローは Node.js 環境をセットアップし、`npm ci` で依存関係をインストールし、`npm run build` でフロントエンドをビルドすること。

#### Scenario: Successful build
- **WHEN** ワークフローがトリガーされる
- **THEN** `npm ci` で依存関係がインストールされ、`npm run build` で `dist/` ディレクトリにビルド成果物が生成される

#### Scenario: Build failure
- **WHEN** `npm run build` がゼロ以外の終了コードを返す
- **THEN** ワークフローが失敗し、S3 へのアップロードは実行されない

### Requirement: S3 upload with sync
ビルド成果物を S3 バケットに同期アップロードすること。古いファイルは削除されること。

#### Scenario: Successful sync
- **WHEN** ビルドが成功する
- **THEN** `dist/` の内容が S3 バケットに同期され、バケット内の不要なファイルは削除される

#### Scenario: S3 bucket not configured
- **WHEN** `S3_BUCKET_NAME` シークレットが未設定
- **THEN** ワークフローがエラーで失敗する

### Requirement: CloudFront cache invalidation
S3 アップロード後に CloudFront のキャッシュを無効化すること。

#### Scenario: Successful invalidation
- **WHEN** S3 同期が完了する
- **THEN** CloudFront ディストリビューションに対して `/*` のキャッシュ無効化が作成される

#### Scenario: CloudFront not configured
- **WHEN** `CLOUDFRONT_DISTRIBUTION_ID` シークレットが未設定
- **THEN** ワークフローがエラーで失敗する

### Requirement: OIDC authentication
AWS 認証は既存の OIDC 方式（`AWS_ROLE_ARN` シークレット）を使用すること。

#### Scenario: Successful authentication
- **WHEN** ワークフローが実行される
- **THEN** OIDC を使用して IAM ロールを引き受け、S3 と CloudFront への操作権限を取得する

### Requirement: Deploy summary
デプロイの結果を GitHub Actions の Job Summary に表示すること。

#### Scenario: Successful deploy
- **WHEN** デプロイが完了する
- **THEN** Job Summary にデプロイ先の URL（CloudFront ドメイン）とアップロードされたファイル数が表示される
