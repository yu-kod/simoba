## Why

プロジェクト全体でロギングが最小限（client: `console.error` 1箇所、server: `console.log` 1箇所）しかなく、デバッグ・運用監視・問題切り分けが困難。Phase 2 のオンラインマルチプレイヤーが動き始めた今、クライアント・サーバー間の問題調査に構造化されたログが不可欠になった。

## What Changes

- **新規**: LogTape（`@logtape/logtape`）を導入 — ゼロ依存、5.3KB、ブラウザ/Node.js 両対応
- **新規**: フロントエンド用ログ設定（コンソール sink、開発時 debug 以上、本番時 warn 以上）
- **新規**: バックエンド用ログ設定（構造化 JSON sink → stdout、CloudWatch Logs Insights 対応）
- **置換**: 既存の `console.log` / `console.error` を LogTape ロガー呼び出しに置き換え
- **新規**: 階層カテゴリによるフィルタリング（`["simoba", "server", "room"]`, `["simoba", "client", "scene"]` 等）

## 技術選定: LogTape

| 項目 | 詳細 |
|------|------|
| パッケージ | `@logtape/logtape` v2.x |
| サイズ | 5.3 KB (min+gz)、依存関係ゼロ |
| ランタイム | Node.js / ブラウザ / Deno / Bun — polyfill 不要 |
| Vite 互換 | ネイティブ ESM、バンドル設定不要 |
| 構造化ログ | テンプレートリテラル + プロパティ |
| パフォーマンス | 214ns/iter（Pino: 326ns、Winston: 2,050ns） |
| 拡張性 | CloudWatch Logs sink、OpenTelemetry sink 等が公式パッケージ |

**Pino を選ばなかった理由**: Worker Threads ベースで Vite バンドルに専用プラグインと Node.js polyfill が必要。ブラウザ対応が二級市民。

**自前実装を選ばなかった理由**: LogTape の階層カテゴリ・sink 抽象・構造化ログの品質を再発明するのは非合理。万が一メンテナンスが止まっても、ゼロ依存なので fork または薄いラッパー経由で自前実装に差し替え可能。

## AWS 連携方針

- バックエンドは **stdout に構造化 JSON** を出力。ECS タスクの awslogs ドライバーが自動で CloudWatch Logs に転送
- JSON 形式により CloudWatch Logs Insights でフィルタ・集計クエリが可能（例: `fields @timestamp, category, message | filter level = "error"`）
- CloudWatch SDK やカスタム連携コードは不要 — ECS のインフラ層が処理する
- 将来の拡張: `@logtape/cloudwatch-logs` sink で直接連携、メトリクスフィルタでエラー率アラーム等

## Non-goals

- CloudWatch SDK の直接利用やカスタムログ転送（ECS の stdout 連携で十分）
- 外部ログ収集サービス（Datadog 等）の追加統合
- クライアントからサーバーへのログ送信（リモートロギング）
- パフォーマンスプロファイリングツールの導入

## Capabilities

### New Capabilities

- `logging`: LogTape ベースのログ基盤。フロントエンド/バックエンド設定、階層カテゴリ、環境別ログレベル制御、構造化 JSON 出力

### Modified Capabilities

（既存スペックの要件変更なし — 実装レベルの `console.*` 置換のみ）

## Impact

- **依存関係**: `@logtape/logtape` を追加（ルート `package.json`、shared で使用するため）
- **shared/**: ログ設定・カテゴリ定義のユーティリティ
- **src/**: フロントエンドログ初期化、既存 `console.error` の置き換え（`src/scenes/GameScene.ts`）
- **server/**: バックエンドログ初期化（JSON sink）、既存 `console.log` の置き換え（`server/src/index.ts`）、Colyseus ルームライフサイクルのログ追加
- **参照スペック**: `openspec/specs/tech-architecture.md`、`openspec/specs/online-multiplayer/`
