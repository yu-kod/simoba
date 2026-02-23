## Context

Terraform で S3 + CloudFront 基盤は構築済み（`static_hosting` モジュール）。既存の `deploy.yml` は Terraform の plan/apply/destroy を行うが、フロントエンドのビルド成果物を S3 にアップロードする仕組みがない。

既存パターン:
- OIDC 認証 (`aws-actions/configure-aws-credentials@v4`)
- `authorize` ジョブによるオーナー制限
- `workflow_dispatch` による手動トリガー

## Goals / Non-Goals

**Goals:**
- 任意のブランチからフロントエンドをビルドし S3 にデプロイできる
- CloudFront キャッシュを自動で無効化する
- 既存の OIDC 認証を再利用する

**Non-Goals:**
- 自動デプロイ（push トリガー）
- カスタムドメイン設定
- 環境分離（dev/staging）
- ビルドのテスト実行（別途 CI で担保）

## Decisions

### 1. Terraform ワークフローとは別ファイルにする
**選択:** `deploy-frontend.yml` を新規作成
**理由:** インフラ変更とアプリデプロイは頻度・リスクが異なる。関心の分離。
**代替案:** `deploy.yml` に `deploy-frontend` アクションを追加 → ファイルが肥大化し、concurrency 制御が複雑になる

### 2. S3 同期に `aws s3 sync --delete` を使用
**選択:** `aws s3 sync dist/ s3://<bucket> --delete`
**理由:** 古いファイルを自動削除し、S3 の内容をビルド成果物と一致させる。差分アップロードで高速。
**代替案:** `aws s3 cp --recursive` → 古いファイルが残り続ける

### 3. バケット名は Terraform output から取得せず、シークレットで管理
**選択:** GitHub Secret `S3_BUCKET_NAME` で指定
**理由:** ワークフロー内で Terraform state を参照するのは複雑で、不要な依存が生まれる。バケット名は変わらない値。
**代替案:** Terraform output を参照 → init + output コマンドが必要で遅い

### 4. CloudFront Distribution ID もシークレットで管理
**選択:** GitHub Secret `CLOUDFRONT_DISTRIBUTION_ID` で指定
**理由:** バケット名と同様、変わらない値をシークレットで管理するのがシンプル。

### 5. Node.js セットアップに `actions/setup-node@v4` を使用
**選択:** `actions/setup-node@v4` + `npm ci`
**理由:** `package-lock.json` からの再現可能なインストール。キャッシュも有効化。

## Risks / Trade-offs

- **[デプロイ先の不一致]** Terraform 未適用の状態でフロントエンドをデプロイすると、バケットが存在しない → IAM ロールの S3 権限がなければエラーで検知可能。GitHub Secret 未設定でもエラーになる
- **[CloudFront 無効化の遅延]** キャッシュ無効化は伝播に数分かかる → 既知の AWS 制約、許容範囲
- **[`--delete` による事故]** ビルド失敗時に空の dist/ を sync すると全ファイル削除 → ビルドステップが失敗すればデプロイに進まないため、ガードされている
