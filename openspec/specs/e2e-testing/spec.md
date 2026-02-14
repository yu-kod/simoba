## Requirements

### Requirement: Playwright configuration

プロジェクトルートに `playwright.config.ts` を配置しなければならない (SHALL)。設定は以下を含まなければならない (SHALL):
- `webServer` で Vite dev server (`npm run dev`) を自動起動
- テストディレクトリ: `e2e/`
- デフォルトブラウザ: Chromium
- リトライ: CI 環境では 2 回、ローカルでは 0 回

#### Scenario: Playwright auto-starts dev server
- **WHEN** `npm run test:e2e` を実行する
- **THEN** Vite dev server が自動的に起動し、テスト完了後に停止する

#### Scenario: Playwright config specifies test directory
- **WHEN** Playwright がテストファイルを検索する
- **THEN** `e2e/` ディレクトリ配下の `*.spec.ts` ファイルのみが対象となる

### Requirement: E2E test directory structure

E2E テストは プロジェクトルートの `e2e/` ディレクトリに配置しなければならない (SHALL)。ファイル名は `<feature-name>.spec.ts` の命名規則に従わなければならない (SHALL)。

#### Scenario: E2E test file location
- **WHEN** ゲーム起動の E2E テストを作成する
- **THEN** テストファイルは `e2e/game-launch.spec.ts` に配置される

### Requirement: E2E test npm script

`package.json` に `test:e2e` script を定義しなければならない (SHALL)。このスクリプトは Playwright テストを実行する。

#### Scenario: Run E2E tests
- **WHEN** `npm run test:e2e` を実行する
- **THEN** Playwright が E2E テストを実行し、結果を表示する

### Requirement: Test artifacts output

Playwright はテスト失敗時にスクリーンショットとトレースを保存しなければならない (SHALL)。出力先は `test-results/` ディレクトリとする。`.gitignore` でこのディレクトリを除外しなければならない (SHALL)。

#### Scenario: Failed test captures screenshot
- **WHEN** E2E テストが失敗する
- **THEN** 失敗時のスクリーンショットが `test-results/` に保存される

#### Scenario: Test artifacts excluded from git
- **WHEN** `git status` を実行する
- **THEN** `test-results/` ディレクトリは追跡されない

### Requirement: Sample E2E test

セットアップの動作確認として、ゲーム起動確認の E2E テストを含めなければならない (SHALL)。このテストは Phaser キャンバスがブラウザに表示されることを検証する。

#### Scenario: Game canvas renders
- **WHEN** ブラウザで `http://localhost:3000` にアクセスする
- **THEN** `#game-container` 内に `<canvas>` 要素が表示される

#### Scenario: Game scene loads
- **WHEN** ゲームが起動完了する
- **THEN** `window.game` オブジェクトが存在し、アクティブなシーンが `GameScene` である
