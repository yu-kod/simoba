## 1. Dependencies & npm scripts

- [x] 1.1 `vitest`, `@vitest/coverage-v8` を devDependencies に追加 (`specs/unit-testing`)
- [x] 1.2 `@playwright/test` を devDependencies に追加 (`specs/e2e-testing`)
- [x] 1.3 `package.json` にテスト用 scripts を追加: `test`, `test:unit`, `test:e2e`, `test:coverage` (`specs/unit-testing`, `specs/e2e-testing`)
- [x] 1.4 `npm install` を実行して依存関係をインストール

## 2. Vitest セットアップ

- [x] 2.1 `vitest.config.ts` を作成: `mergeConfig` で `vite.config.ts` を継承、`globals: true`、environment `node`、カバレッジ設定 (`specs/unit-testing`)
- [x] 2.2 `tsconfig.json` に Vitest globals の型定義を追加 (`specs/unit-testing`)

## 3. Playwright セットアップ

- [x] 3.1 `playwright.config.ts` を作成: `webServer` で Vite 自動起動、テストディレクトリ `e2e/`、Chromium のみ、CI リトライ設定 (`specs/e2e-testing`)
- [x] 3.2 Playwright ブラウザをインストール: `npx playwright install chromium` (`specs/e2e-testing`)

## 4. サンプルテスト作成

- [x] 4.1 `src/config/__tests__/gameConfig.test.ts` を作成: 解像度・物理エンジン設定の検証 (`specs/unit-testing`)
- [x] 4.2 `e2e/game-launch.spec.ts` を作成: Canvas 表示・GameScene ロードの検証 (`specs/e2e-testing`)

## 5. .gitignore 更新

- [x] 5.1 `.gitignore` に `coverage/`, `test-results/`, `playwright-report/` を追加 (`specs/e2e-testing`)

## 6. CI ワークフロー

- [x] 6.1 `.github/workflows/test.yml` を作成: `pull_request` トリガー、`develop`/`main` 対象、ドラフト PR 除外 (`specs/ci-testing`)
- [x] 6.2 `unit-test` ジョブ: Node.js 18 セットアップ、`npm ci`、`npm run test:unit` (`specs/ci-testing`)
- [x] 6.3 `e2e-test` ジョブ: Playwright キャッシュ、ブラウザインストール、`npm run test:e2e`、失敗時アーティファクトアップロード (`specs/ci-testing`)

## 7. 動作確認

- [x] 7.1 `npm run test:unit` を実行し、gameConfig テストが PASS することを確認
- [x] 7.2 `npm run test:e2e` を実行し、game-launch テストが PASS することを確認
- [x] 7.3 `npm run test:coverage` を実行し、カバレッジレポートが生成されることを確認
- [x] 7.4 `npm test` を実行し、全テストが順番に実行されることを確認
