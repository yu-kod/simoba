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

Terraform の Plan / Apply / Destroy を GitHub Actions から手動で実行する。

### 使い方

1. GitHub リポジトリの **Actions** タブを開く
2. 左メニューから **Terraform Deploy** を選択
3. **Run workflow** をクリック
4. ブランチを選択し、action を選ぶ:
   - `plan` — 変更内容を確認 (適用なし)
   - `apply` — Plan 後、承認を経て適用
   - `destroy` — 承認を経てリソース削除

### フロー

```
plan:    Plan → Job Summary に結果表示
apply:   Plan → 承認ゲート (prod-deploy) → Apply
destroy: Destroy Plan 表示 → 承認ゲート (prod-deploy) → Destroy
```

### 初回セットアップ

**AWS 側:**
1. IAM OIDC Identity Provider を作成 (Provider URL: `https://token.actions.githubusercontent.com`)
2. IAM ロールを作成 (trust policy で `repo:yu-kod/simoba:*` に制限)
3. S3 バケット `simoba-terraform-state` と DynamoDB テーブル `simoba-terraform-locks` を作成

**GitHub 側:**
1. Repository Secret に `AWS_ROLE_ARN` を設定
2. Settings > Environments で `prod-deploy` を作成し、Required Reviewers を設定

### 制限

- リポジトリオーナーのみ実行可能
- 同時実行は concurrency グループで防止

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
