## ADDED Requirements

### Requirement: ESLint 設定ファイル

プロジェクトルートに `eslint.config.js` (flat config 形式) を配置しなければならない (SHALL)。TypeScript パーサーを使用し、`src/` 配下の `.ts` ファイルを対象としなければならない (SHALL)。

#### Scenario: ESLint 設定が存在する
- **WHEN** プロジェクトルートを確認する
- **THEN** `eslint.config.js` が存在し、flat config 形式で記述されている

#### Scenario: TypeScript ファイルが解析対象である
- **WHEN** `npm run lint` を実行する
- **THEN** `src/` 配下の全 `.ts` ファイルが ESLint の解析対象となる

#### Scenario: テストファイルが解析対象に含まれる
- **WHEN** `npm run lint` を実行する
- **THEN** `src/**/__tests__/**/*.test.ts` もルール違反があれば検出される

### Requirement: Prettier 設定ファイル

プロジェクトルートに `.prettierrc` を配置しなければならない (SHALL)。既存コードスタイル（single quote, no semicolons, 2-space indent）を維持する設定でなければならない (SHALL)。

#### Scenario: Prettier 設定が存在する
- **WHEN** プロジェクトルートを確認する
- **THEN** `.prettierrc` が存在する

#### Scenario: 既存スタイルが維持される
- **WHEN** 既存の `.ts` ファイルに `npx prettier --check` を実行する
- **THEN** フォーマット差分が発生しない（既存スタイルと一致する）

### Requirement: ESLint と Prettier の競合解消

`eslint-config-prettier` を使用して、ESLint のフォーマット系ルールを無効化しなければならない (SHALL)。ESLint はロジック系ルール、Prettier はフォーマットを担当する分離を維持しなければならない (SHALL)。

#### Scenario: フォーマットルールが競合しない
- **WHEN** Prettier でフォーマット済みのファイルに `npm run lint` を実行する
- **THEN** フォーマットに起因する ESLint エラーが発生しない

### Requirement: npm scripts

`package.json` に `lint` と `format` スクリプトを定義しなければならない (SHALL)。

#### Scenario: lint スクリプトが実行可能
- **WHEN** `npm run lint` を実行する
- **THEN** ESLint がプロジェクト全体を検査し、違反があればエラーコードで終了する

#### Scenario: format スクリプトが実行可能
- **WHEN** `npm run format` を実行する
- **THEN** Prettier がプロジェクト全体のコードを整形する

### Requirement: 既存コードの準拠

導入時に全既存 `.ts` ファイルが ESLint と Prettier のルールに準拠した状態でなければならない (SHALL)。

#### Scenario: 全ファイルが lint を通過する
- **WHEN** セットアップ完了後に `npm run lint` を実行する
- **THEN** エラーが 0 件で終了する

#### Scenario: 全ファイルが format 済みである
- **WHEN** セットアップ完了後に `npx prettier --check "src/**/*.ts"` を実行する
- **THEN** 差分が 0 件で終了する
