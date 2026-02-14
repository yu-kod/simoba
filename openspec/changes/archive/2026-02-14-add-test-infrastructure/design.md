## Context

Phaser.js + Vite + TypeScript のセットアップが完了し、BootScene / GameScene のプレースホルダーが動作する状態。これからゲームロジック（移動、スキル、物理演算、AI）を実装していく前に、テスト基盤を確立する。

現在のプロジェクト構成:
- `src/main.ts` — エントリーポイント
- `src/config/gameConfig.ts` — Phaser 設定
- `src/scenes/BootScene.ts`, `GameScene.ts` — シーン
- ビルド: `vite.config.ts`, `tsconfig.json`
- CI: `.github/workflows/claude.yml`, `claude-code-review.yml`

## Goals / Non-Goals

**Goals:**
- Vitest でユニットテストを即座に書ける環境
- Playwright でブラウザ上のゲーム動作を E2E テストできる環境
- `npm test` 一発で全テストが実行される
- CI (GitHub Actions) で PR ごとにテストが自動実行される
- カバレッジレポート生成 (target: 80%+)

**Non-Goals:**
- Phaser.js の Canvas/WebGL 描画のビジュアルテスト
- ゲームループのフレーム単位テスト
- 負荷テスト・パフォーマンスベンチマーク

## Decisions

### 1. ユニットテスト: Vitest

**選択:** Vitest

**理由:**
- Vite ネイティブ — `vite.config.ts` の設定（エイリアス `@/*` 等）をそのまま共有
- Jest 互換 API — 学習コスト最小
- HMR 対応の watch モードで高速フィードバック
- `@vitest/coverage-v8` で V8 ベースのカバレッジ (c8 より高速)

**却下案:**
- **Jest**: Vite プロジェクトでは設定の二重管理が必要 (`babel.config` 等)。ESM サポートも不完全
- **Mocha/Chai**: 設定が多く、Vite 統合なし

### 2. E2E テスト: Playwright

**選択:** Playwright (`@playwright/test`)

**理由:**
- Chromium, Firefox, WebKit のクロスブラウザ対応
- `webServer` 設定で Vite dev server を自動起動
- Auto-wait 機能で Canvas ゲームのロード待機が容易
- トレース、スクリーンショット、動画のビルトインサポート

**却下案:**
- **Cypress**: Canvas 内の操作サポートが弱い。WebKit 非対応
- **Puppeteer**: テストフレームワークではなくブラウザ自動化ツール。アサーション別途必要

### 3. テストディレクトリ構造: コロケーション + 分離

**選択:** ユニットは `src/**/__tests__/`、E2E は `e2e/`

```
src/
  config/
    __tests__/
      gameConfig.test.ts
    gameConfig.ts
  scenes/
    __tests__/
      BootScene.test.ts
    BootScene.ts
e2e/
  game-launch.spec.ts
  playwright.config.ts
```

**理由:**
- ユニットテストはソースに近い場所に置くことで発見性が高い
- E2E テストはアプリケーション全体を対象とするため、ルートレベルに分離
- Vitest のデフォルトパターン `**/*.test.ts` と自然に整合

### 4. Vitest 設定: `vitest.config.ts` 分離

**選択:** `vitest.config.ts` を独立ファイルとして作成

**理由:**
- `vite.config.ts` にテスト設定を混ぜると関心の分離が崩れる
- `vitest.config.ts` は `vite.config.ts` を `mergeConfig` で継承 → エイリアス等は自動共有
- テスト固有設定（coverage、environment、globals）を明確に分離

### 5. CI ワークフロー: 単一ワークフロー + マトリクス

**選択:** `.github/workflows/test.yml` を新規作成

**理由:**
- 既存の `claude.yml` (Claude Code) や `claude-code-review.yml` (レビュー) とは責務が異なる
- `pull_request` イベントでトリガー
- ユニットテストと E2E テストを並列ジョブで実行

## Risks / Trade-offs

**[Phaser.js のユニットテストが難しい]** → ゲームロジック（ダメージ計算、クールダウン管理、AI 判定）を純粋関数として Phaser 非依存に設計し、それをテスト対象にする。Scene クラス自体のテストは E2E に委ねる。

**[Playwright の Canvas 操作制限]** → Canvas 内の個別要素は DOM セレクタで取得できない。`page.evaluate()` で `window.game` 経由のゲーム状態検証と、スクリーンショット比較（将来）で対応。

**[CI の Playwright ブラウザインストール時間]** → `actions/cache` で `~/.cache/ms-playwright` をキャッシュし、初回以降は高速化。

**[カバレッジ 80% 目標と Phase 1 の現実]** → 現時点のコードは少量。ゲームロジック実装時に TDD で自然にカバレッジを達成する方針。基盤だけ先に整える。
