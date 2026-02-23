## Why

現在の E2E テストは `window.game.scene.getScene('GameScene')` 経由で内部 state (`heroState`, `enemyState`, `projectiles`) を直接読み書きしている。テスト入力として内部 state を書き換え、検証にも内部 state を読み取るため、リファクタリングのたびに E2E テストが壊れる。#76 で互換ゲッターを追加して対処したが、根本的な改善が必要。

## What Changes

- **入力のブラックボックス化**: テストの操作はキーボード/マウスのみ。内部 state の直接書き換え (`scene.heroState = {...}`) を廃止
- **読み取り専用テスト API の導入**: `window.__test__` に読み取り専用のゲーム状態クエリを公開。Canvas ゲームではピクセルから数値（HP 等）を判定するのが困難なため、最小限の読み取り API を提供する現実的アプローチを採る
- **GameScene ゲッターの廃止**: `heroState` setter、`enemyState` getter、`projectiles` getter を GameScene から削除。代わりに `window.__test__` API を使用
- **4 テストファイルの書き換え**: `melee-attack`, `hp-bar`, `projectile-attack`, `debug-hero-switch`

### Non-goals

- `game-launch.spec.ts` と `map-rendering.spec.ts` は変更しない（既にブラックボックス的）
- ビジュアルリグレッションテスト（スクリーンショット比較）の拡充は本スコープ外
- テストカバレッジの拡大は含まない（既存テストの質の向上のみ）

## Capabilities

### New Capabilities

- `e2e-test-api`: dev ビルド限定で `window.__test__` に公開する読み取り専用クエリ API

### Modified Capabilities

（既存の spec レベルの要件変更なし）

## Impact

- `e2e/melee-attack.spec.ts` — 全面書き換え
- `e2e/hp-bar.spec.ts` — 全面書き換え
- `e2e/projectile-attack.spec.ts` — 全面書き換え
- `e2e/debug-hero-switch.spec.ts` — 全面書き換え
- `src/scenes/GameScene.ts` — ゲッター削除 + テスト API 登録
- 新規: テスト API モジュール（`src/test/` または `src/scenes/` 配下）
