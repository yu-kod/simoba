## Context

プロジェクトは TypeScript strict mode で開発されており、既存コードは single quote / no semicolons / 2-space indent のスタイルで統一されている。Linter と Formatter が未導入のため、スタイル違反の検出・修正は手動に頼っている。Claude Code の PostToolUse hooks が Prettier auto-format を前提にしているが、prettier パッケージ自体がインストールされていない。

## Goals / Non-Goals

**Goals:**

- `npm run lint` でコード品質の静的解析を実行可能にする
- `npm run format` でコード整形を実行可能にする
- CI で PR 時に lint を自動チェックする
- 既存コードスタイルを変更せず、ルールとして明文化する

**Non-Goals:**

- Husky / lint-staged（Claude Code hooks で代替）
- stylelint（CSS 未使用）
- EditorConfig（Prettier が管理）
- カスタム ESLint プラグイン作成

## Decisions

### 1. ESLint flat config（eslint.config.js）を採用する

**選択:** ESLint v9+ の flat config 形式

**理由:** ESLint v9 からデフォルトであり、.eslintrc は非推奨。新規プロジェクトなので最新形式で始める。

**却下した代替案:**
- `.eslintrc.json` — 旧形式、将来的に削除予定

### 2. typescript-eslint で TypeScript 統合する

**選択:** `typescript-eslint` パッケージ（v8+）

**理由:** flat config に対応した公式推奨パッケージ。tsconfig.json の型情報を利用した高度なルール（type-checked）を有効にできる。

**却下した代替案:**
- `@typescript-eslint/eslint-plugin` + `@typescript-eslint/parser` の個別インストール — v8 からは `typescript-eslint` 統合パッケージが推奨

### 3. Prettier はデフォルト設定 + 最小限のオーバーライドとする

**選択:** `.prettierrc` に既存スタイルに合わせた最小設定のみ

```json
{
  "singleQuote": true,
  "semi": false,
  "trailingComma": "es5"
}
```

**理由:** 既存コードが single quote / no semicolons で統一されており、それを維持する。それ以外は Prettier デフォルト（printWidth: 80, tabWidth: 2）で十分。

### 4. eslint-config-prettier で競合解消する

**選択:** `eslint-config-prettier` を ESLint 設定の最後に追加

**理由:** ESLint のフォーマット系ルールと Prettier が競合するのを防ぐ。Prettier がフォーマットを担当し、ESLint はロジック系ルールに集中する。

### 5. CI に独立した lint ジョブを追加する

**選択:** `.github/workflows/test.yml` に `lint` ジョブを追加

**理由:** テストと lint は独立して実行可能。並列実行で CI 時間を短縮できる。lint 失敗とテスト失敗を明確に区別できる。

## Risks / Trade-offs

- **[既存コード修正の差分が大きい]** → format 適用は専用コミットで分離し、ロジック変更と混在させない
- **[ESLint strict ルールが厳しすぎる可能性]** → recommended ベースで始め、問題があれば個別ルールを調整
- **[CI 時間の増加]** → lint は npm install + eslint のみで 30 秒程度。テストと並列なので合計時間への影響は最小
