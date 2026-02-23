# simoba

Browser-based casual MOBA x .io game. 2v2 micro arena, max 5 min per match.

## Tech Stack

- **Frontend:** Phaser.js 3.x + Vite + TypeScript
- **Backend (Phase 2+):** Colyseus (WebSocket)
- **Infra:** Terraform + AWS (S3/CloudFront, ECS)

## Getting Started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # Production build
npm run preview  # Preview production build
```

## Testing

```bash
npm run test:unit      # Vitest unit tests
npm run test:e2e       # Playwright E2E tests
npm run test:coverage  # Coverage report
```

## Deploy (GitHub Actions)

### Terraform Deploy

Terraform の Plan / Apply / Destroy を手動で実行する。

1. **Actions** タブ → **Terraform Deploy** → **Run workflow**
2. ブランチを選択し、action を選ぶ:
   - `plan` — 変更内容を確認 (適用なし)
   - `apply` — Plan → 承認ゲート (prod-deploy) → Apply
   - `destroy` — 承認ゲート (prod-deploy) → Destroy

### Frontend Deploy

フロントエンドをビルドし S3 にデプロイ、CloudFront キャッシュを無効化する。

1. **Actions** タブ → **Deploy Frontend** → **Run workflow**
2. デプロイしたいブランチを選択して実行

フロー: Checkout → `npm ci` → `npm run build` → S3 sync → CloudFront invalidation

### 初回セットアップ

**AWS 側:**
1. IAM OIDC Identity Provider を作成 (Provider URL: `https://token.actions.githubusercontent.com`)
2. IAM ロールを作成 (trust policy で `repo:yu-kod/simoba:*` に制限)
3. S3 バケット `simoba-terraform-state` と DynamoDB テーブル `simoba-terraform-locks` を作成

**GitHub 側:**

| Secret | 用途 |
|--------|------|
| `AWS_ROLE_ARN` | OIDC で引き受ける IAM ロールの ARN |
| `S3_BUCKET_NAME` | フロントエンドデプロイ先の S3 バケット名 |
| `CLOUDFRONT_DISTRIBUTION_ID` | CloudFront ディストリビューション ID |

Environment `prod-deploy` を作成し、Required Reviewers を設定。

### 制限

- リポジトリオーナーのみ実行可能
- 同時実行は concurrency グループで防止（Terraform / Frontend それぞれ独立）

## Project Structure

```
src/
  config/       # Game configuration
  scenes/       # Phaser scenes
openspec/
  specs/        # Game and tech specifications
infrastructure/ # Terraform + LocalStack
```

## License

Private
