## 1. ワークフロー基盤

- [x] 1.1 `.github/workflows/deploy-frontend.yml` を作成し、`workflow_dispatch` トリガーと `concurrency` を設定
- [x] 1.2 `authorize` ジョブを追加（リポジトリオーナーのみ実行可能）
- [x] 1.3 OIDC 認証ステップを追加（`aws-actions/configure-aws-credentials@v4`）

## 2. ビルド

- [x] 2.1 `actions/setup-node@v4` で Node.js セットアップ（npm キャッシュ有効化）
- [x] 2.2 `npm ci` で依存関係インストール
- [x] 2.3 `npm run build` でフロントエンドビルド

## 3. デプロイ

- [x] 3.1 `aws s3 sync dist/ s3://${{ secrets.S3_BUCKET_NAME }} --delete` で S3 にアップロード
- [x] 3.2 `aws cloudfront create-invalidation` で CloudFront キャッシュ無効化

## 4. レポート

- [x] 4.1 デプロイ結果を Job Summary に出力（URL、ファイル数）

## 5. ドキュメント

- [x] 5.1 README にフロントエンドデプロイワークフローの説明を追加
- [x] 5.2 必要な GitHub Secrets (`S3_BUCKET_NAME`, `CLOUDFRONT_DISTRIBUTION_ID`) をドキュメントに記載
