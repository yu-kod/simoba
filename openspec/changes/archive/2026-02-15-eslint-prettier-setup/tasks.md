## 1. パッケージインストール

- [x] 1.1 `eslint`, `@eslint/js`, `typescript-eslint`, `prettier`, `eslint-config-prettier` を devDependencies にインストールする
- [x] 1.2 `package.json` に `lint` と `format` スクリプトを追加する（`"lint": "eslint src/"`, `"format": "prettier --write \"src/**/*.ts\""`)

## 2. 設定ファイル作成

- [x] 2.1 `eslint.config.js` を作成する（flat config, typescript-eslint recommended, eslint-config-prettier を最後に適用）
- [x] 2.2 `.prettierrc` を作成する（`singleQuote: true`, `semi: false`, `trailingComma: "es5"`）

## 3. 既存コードの修正

- [x] 3.1 `npx prettier --write "src/**/*.ts"` で全ファイルをフォーマットする
- [x] 3.2 `npm run lint` を実行し、ESLint エラーがあれば修正する
- [x] 3.3 `npm run lint` がエラー 0 件で通ることを確認する

## 4. CI 統合

- [x] 4.1 `.github/workflows/test.yml` に `lint` ジョブを追加する（`unit-test`, `e2e-test` と並列実行）
- [x] 4.2 全テスト（`npm run test:unit`, `npm run test:e2e`）が引き続き PASS することを確認する
