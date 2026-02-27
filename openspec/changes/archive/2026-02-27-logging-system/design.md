## Context

現状ロギングは `console.error` 1箇所（client）と `console.log` 1箇所（server）のみ。
Phase 2 でオンラインマルチプレイが動いており、クライアント・サーバー間の問題調査に構造化ログが必要。

LogTape v2.x を採用し、フロントエンド（Phaser/Vite）とバックエンド（Colyseus/Node.js）で統一的なログ基盤を整備する。

## Goals / Non-Goals

**Goals:**
- LogTape を導入し、フロントエンド/バックエンドで同一ライブラリ・同一カテゴリ規約のロギングを実現
- バックエンドで CloudWatch Logs Insights 対応の構造化 JSON 出力
- 既存 `console.*` 呼び出しの完全置き換え
- ESLint ルールで今後の `console.*` 直接使用を抑制

**Non-Goals:**
- CloudWatch SDK の直接利用（ECS stdout 連携で十分）
- リモートロギング（クライアント→サーバー）
- ログレベルのランタイム動的変更 UI

## Decisions

### D1: パッケージ配置 — ルート `package.json` に追加

`@logtape/logtape` はルートの `package.json` の `dependencies` に追加する。
`shared/` から import するため、サーバー側の `server/package.json` にも追加する。

**代替案**: shared 専用パッケージとして workspace に切り出す → 現時点では workspace 構成が過剰。

### D2: ログ設定の配置

| 環境 | 設定ファイル | 内容 |
|------|------------|------|
| Frontend | `src/config/logging.ts` | `configure()` でコンソール sink、環境別レベル |
| Backend | `server/src/config/logging.ts` | `configure()` で JSON sink + コンソール sink |

各エントリポイント（`src/main.ts`, `server/src/index.ts`）の最初で `await configure(...)` を呼ぶ。

**代替案**: shared に統一設定 → sink が環境依存（ブラウザ console vs Node.js stdout）なので分離が自然。

### D3: カテゴリ定数の定義場所

カテゴリ文字列をハードコードせず、`shared/logging.ts` にカテゴリファクトリを置く：

```typescript
// shared/logging.ts
import { getLogger } from '@logtape/logtape'

export const createClientLogger = (subsystem: string) =>
  getLogger(['simoba', 'client', subsystem])

export const createServerLogger = (subsystem: string) =>
  getLogger(['simoba', 'server', subsystem])
```

使用側：
```typescript
// src/scenes/GameScene.ts
import { createClientLogger } from '@shared/logging'
const logger = createClientLogger('scene')

// server/src/rooms/GameRoom.ts
import { createServerLogger } from '@shared/logging'
const logger = createServerLogger('room')
```

### D4: バックエンド JSON sink の実装

LogTape のカスタム sink で `process.stdout.write` に JSON を出力する：

```typescript
function jsonStdoutSink(record: LogRecord): void {
  const entry = {
    timestamp: record.timestamp.toISOString(),
    level: record.level,
    category: record.category.join('.'),
    message: renderMessage(record),
    ...record.properties,
  }
  process.stdout.write(JSON.stringify(entry) + '\n')
}
```

CloudWatch Logs Insights クエリ例:
```
fields @timestamp, category, message
| filter level = "error"
| sort @timestamp desc
```

**代替案**: `@logtape/cloudwatch-logs` を使う → ECS awslogs ドライバーが stdout を自動転送するため不要。将来移行は容易。

### D5: ESLint `no-console` ルール

`eslint.config.mjs` に `no-console: "warn"` を追加する。現在のフラット config 形式に準拠。

- `src/**/*.ts` と `server/src/**/*.ts` に適用
- テストファイル（`**/*.test.ts`, `**/__tests__/**`）は除外
- 移行中に `// eslint-disable-next-line no-console` が必要な箇所はロガーに置き換えるので不要になる

### D6: フロントエンドログ初期化タイミング

`src/main.ts` で `new Phaser.Game(gameConfig)` の**前**に `await configure(...)` を呼ぶ。
LogTape の `configure()` は async だが、トップレベル await が使える（Vite ESM ビルド）。

## Risks / Trade-offs

- **[Risk] LogTape がメンテナンス停止** → ゼロ依存・5KB なので fork または薄いラッパー経由で自前実装に差し替え可能。`shared/logging.ts` のファクトリ関数が唯一の結合点。
- **[Risk] ログ出力がゲーム FPS に影響** → LogTape は 214ns/iter。60Hz ティック（16.6ms）に対して無視できる。大量ログ時は `lowestLevel` で抑制。
- **[Trade-off] JSON sink は自前実装** → `@logtape/cloudwatch-logs` を使えば公式だが、stdout 出力のみなら 10行のカスタム sink で十分。

## Open Questions

（なし — 技術選定・配置・設定方針は確定済み）
