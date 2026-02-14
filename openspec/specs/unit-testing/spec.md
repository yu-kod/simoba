## Requirements

### Requirement: Vitest configuration

プロジェクトは `vitest.config.ts` を持ち、`vite.config.ts` のエイリアス設定（`@/*`）を `mergeConfig` で継承しなければならない (SHALL)。テスト環境は `node` とする。`globals: true` で `describe`, `it`, `expect` をインポート不要にしなければならない (SHALL)。

#### Scenario: Vitest config inherits Vite aliases
- **WHEN** テストファイル内で `import { gameConfig } from '@/config/gameConfig'` を記述する
- **THEN** Vitest がパスエイリアスを正しく解決し、インポートが成功する

#### Scenario: Vitest globals are available
- **WHEN** テストファイル内で `describe`, `it`, `expect` をインポートせずに使用する
- **THEN** テストが正常に実行される

### Requirement: Unit test directory structure

ユニットテストは対応するソースファイルと同階層の `__tests__/` ディレクトリに配置しなければならない (SHALL)。ファイル名は `<source-name>.test.ts` の命名規則に従わなければならない (SHALL)。

#### Scenario: Test file colocation
- **WHEN** `src/config/gameConfig.ts` のテストを作成する
- **THEN** テストファイルは `src/config/__tests__/gameConfig.test.ts` に配置される

#### Scenario: Vitest discovers colocated tests
- **WHEN** `npm run test:unit` を実行する
- **THEN** `src/**/__tests__/**/*.test.ts` パターンに一致する全テストファイルが検出・実行される

### Requirement: Coverage reporting

Vitest は `@vitest/coverage-v8` プロバイダーでコードカバレッジを計測しなければならない (SHALL)。カバレッジ対象は `src/` 配下の `.ts` ファイルとし、テストファイルと設定ファイルは除外しなければならない (SHALL)。

#### Scenario: Coverage report generation
- **WHEN** `npm run test:coverage` を実行する
- **THEN** `coverage/` ディレクトリにカバレッジレポートが生成される

#### Scenario: Coverage excludes test files
- **WHEN** カバレッジレポートを生成する
- **THEN** `__tests__/` 配下のファイルと `vite-env.d.ts` はカバレッジ対象から除外される

### Requirement: Test npm scripts

`package.json` に以下のテスト用 scripts を定義しなければならない (SHALL):
- `test` — 全テスト実行（ユニット + E2E）
- `test:unit` — Vitest ユニットテストのみ実行
- `test:coverage` — カバレッジ付きユニットテスト実行

#### Scenario: Run unit tests only
- **WHEN** `npm run test:unit` を実行する
- **THEN** Vitest がユニットテストのみを実行し、結果を表示する

#### Scenario: Run all tests
- **WHEN** `npm test` を実行する
- **THEN** ユニットテストと E2E テストの両方が順番に実行される

### Requirement: Sample unit test

セットアップの動作確認として、`gameConfig` のサンプルユニットテストを含めなければならない (SHALL)。このテストは設定値（解像度、物理エンジン設定）の検証を行う。

#### Scenario: gameConfig test validates resolution
- **WHEN** `gameConfig.test.ts` を実行する
- **THEN** `GAME_WIDTH` が 1280、`GAME_HEIGHT` が 720 であることが検証される

#### Scenario: gameConfig test validates physics
- **WHEN** `gameConfig.test.ts` を実行する
- **THEN** Arcade Physics が有効で、gravity が `{ x: 0, y: 0 }` であることが検証される
