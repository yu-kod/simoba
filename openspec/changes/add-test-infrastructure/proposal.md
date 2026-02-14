## Why

Phase 1 のゲームロジック実装が本格化する前に、テスト基盤を整備する。Phaser.js セットアップ完了後の今が導入タイミングとして最適。テストなしでゲームロジック（移動、スキル、衝突判定、ミニオン AI 等）を積み上げるとリグレッションリスクが高まる。

## What Changes

- **Vitest** をユニット/インテグレーションテストフレームワークとして導入
- **Playwright** を E2E テストフレームワークとして導入
- テスト用の npm scripts (`test`, `test:unit`, `test:e2e`, `test:coverage`) を追加
- CI パイプラインにテスト実行ステップを追加（GitHub Actions）
- テストディレクトリ構造の規約を確立（`src/**/__tests__/` + `e2e/`）

## Non-goals

- 既存コード（BootScene, GameScene プレースホルダー）への網羅的テスト追加
- ビジュアルリグレッションテスト（スクリーンショット比較）
- パフォーマンステスト / 負荷テスト
- Phaser.js 内部 API のモック体系構築（必要になった時点で段階的に追加）

## Capabilities

### New Capabilities

- `unit-testing`: Vitest によるユニットテスト基盤。設定、ディレクトリ構造規約、カバレッジ設定、サンプルテスト
- `e2e-testing`: Playwright による E2E テスト基盤。設定、テストディレクトリ構造、ブラウザでのゲーム起動確認テスト
- `ci-testing`: GitHub Actions でのテスト自動実行。PR 時にユニット + E2E テストを実行

### Modified Capabilities

_(なし — テスト基盤は新規追加であり、既存仕様の変更は不要)_

## Impact

- **Dependencies**: `vitest`, `@vitest/coverage-v8`, `playwright`, `@playwright/test` を devDependencies に追加
- **package.json**: テスト用 scripts 追加
- **tsconfig.json**: テストファイル用の設定拡張が必要になる可能性
- **GitHub Actions**: テスト実行ワークフロー追加（参照: `openspec/specs/tech-architecture.md` CI/CD セクション）
- **ディレクトリ構造**: `src/**/__tests__/` と `e2e/` ディレクトリを新設
