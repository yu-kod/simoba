## Why

Linter / Formatter が未導入のままコードベースが拡大しており、コードスタイルの一貫性を手動で維持するのが困難になってきた。また Claude Code の hooks が Prettier の存在を前提としているが、パッケージ自体が未インストールである。エンティティ・システムの実装が本格化する前にルールを確立する。

## What Changes

- ESLint (flat config) + TypeScript パーサーを導入し `npm run lint` で静的解析を実行可能にする
- Prettier を導入し `npm run format` でコード整形を実行可能にする
- eslint-config-prettier で ESLint と Prettier の競合ルールを無効化する
- CI (`.github/workflows/test.yml`) に lint ステップを追加し、PR 時に自動チェックする
- 既存コードを lint / format して統一する

## Non-goals

- Husky / lint-staged によるコミットフック — Claude Code hooks で代替しているため不要
- stylelint — CSS は使用していない（Canvas 描画のみ）
- EditorConfig — Prettier が一元管理するため不要

## Capabilities

### New Capabilities

- `code-linting`: ESLint の設定・ルール・CI 統合に関する要件

### Modified Capabilities

- `ci-testing`: CI ワークフローに lint ジョブを追加（`openspec/specs/ci-testing/`）

## Impact

- **新規依存**: eslint, @eslint/js, typescript-eslint, prettier, eslint-config-prettier
- **新規ファイル**: `eslint.config.js`, `.prettierrc`
- **変更ファイル**: `.github/workflows/test.yml`, `package.json`
- **既存コード**: 全 `.ts` ファイルが format 適用対象（既存スタイル: single quote, no semicolons, 2-space indent — 変更なし）
