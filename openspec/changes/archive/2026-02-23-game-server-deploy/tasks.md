## 1. ビルドコンテキスト最適化

- [x] 1.1 `.dockerignore` をプロジェクトルートに作成（node_modules, .git, dist, tests, infrastructure, openspec 等を除外）

## 2. GitHub Actions ワークフロー

- [x] 2.1 `.github/workflows/deploy-game-server.yml` を作成 — workflow_dispatch, concurrency, permissions, env 定義
- [x] 2.2 authorize ジョブ — オーナー以外のユーザーをブロック
- [x] 2.3 build-and-deploy ジョブ — checkout, OIDC 認証, ECR ログイン, Docker ビルド & プッシュ（SHA タグ）
- [x] 2.4 ECS デプロイステップ — 現タスク定義取得 → image 差し替え → 新リビジョン登録 → サービス更新（force-new-deployment）
- [x] 2.5 Job Summary ステップ — ブランチ、コミット SHA、イメージ URI、ECS クラスター・サービス名を表示

## 3. ドキュメント更新

- [x] 3.1 `README.md` にゲームサーバーデプロイの手順と必要な Secrets (`ECR_REPOSITORY_URL`) を追記
