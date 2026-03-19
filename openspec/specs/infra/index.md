# インフラ仕様

インフラ・CI/CD・デプロイ関連の仕様。

## デプロイ

- [Game Server Infra](/infra/game-server-infra/) — AWS ECS on EC2 によるゲームサーバー基盤
- [Game Server Deploy](/infra/game-server-deploy-workflow/) — GitHub Actions によるサーバーデプロイ
- [Frontend Deploy](/infra/frontend-deploy-workflow/) — S3 + CloudFront への静的デプロイ
- [VPC Networking](/infra/vpc-networking/) — VPC・サブネット・セキュリティグループ
- [Custom Domain & SSL](/infra/custom-domain-ssl/) — Route 53 + ACM 証明書

## テスト & CI

- [CI Testing](/infra/ci-testing/) — GitHub Actions CI パイプライン
- [E2E Testing](/infra/e2e-testing/) — Playwright E2E テスト
- [Unit Testing](/infra/unit-testing/) — Vitest ユニットテスト
- [Code Linting](/infra/code-linting/) — ESLint + Prettier

## 可観測性

- [Logging](/infra/logging/) — LogTape ロギング基盤
