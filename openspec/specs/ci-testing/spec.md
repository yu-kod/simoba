## Requirements

### Requirement: CI test workflow

`.github/workflows/test.yml` を作成しなければならない (SHALL)。このワークフローは `pull_request` イベント（`opened`, `synchronize`, `reopened`）でトリガーされなければならない (SHALL)。対象ブランチは `develop` と `main` とする。

#### Scenario: PR triggers test workflow
- **WHEN** `develop` ブランチへの PR が作成または更新される
- **THEN** テストワークフローが自動的に開始される

#### Scenario: Workflow does not run on draft PRs
- **WHEN** ドラフト PR が作成される
- **THEN** テストワークフローは実行されない

### Requirement: Unit test CI job

ワークフローは `unit-test` ジョブを含まなければならない (SHALL)。このジョブは Node.js セットアップ、依存関係インストール、Vitest 実行を行う。

#### Scenario: Unit tests pass in CI
- **WHEN** `unit-test` ジョブが実行される
- **THEN** `npm run test:unit` が実行され、結果が GitHub Actions に表示される

#### Scenario: Unit test failure blocks merge
- **WHEN** ユニットテストが失敗する
- **THEN** ジョブがエラーステータスで終了し、PR のマージがブロックされる

### Requirement: E2E test CI job

ワークフローは `e2e-test` ジョブを含まなければならない (SHALL)。このジョブは Playwright ブラウザのインストールとキャッシュ、E2E テスト実行を行う。`unit-test` ジョブと並列に実行されなければならない (SHALL)。

#### Scenario: E2E tests run in CI
- **WHEN** `e2e-test` ジョブが実行される
- **THEN** Playwright が Chromium でE2E テストを実行する

#### Scenario: Playwright browsers are cached
- **WHEN** 2 回目以降のワークフロー実行時
- **THEN** `~/.cache/ms-playwright` がキャッシュから復元され、ブラウザインストールがスキップされる

### Requirement: Node.js version consistency

CI ワークフローは Node.js 18 を使用しなければならない (SHALL)。`package.json` の `engines.node` と一致させる。

#### Scenario: CI uses correct Node version
- **WHEN** ワークフローが Node.js をセットアップする
- **THEN** Node.js 18.x が使用される

### Requirement: Lint CI job

ワークフロー `.github/workflows/test.yml` に `lint` ジョブを含まなければならない (SHALL)。このジョブは `unit-test` および `e2e-test` ジョブと並列に実行されなければならない (SHALL)。ESLint の実行結果が GitHub Actions に表示されなければならない (SHALL)。

#### Scenario: Lint が CI で実行される
- **WHEN** PR が作成または更新される
- **THEN** `lint` ジョブが `npm run lint` を実行する

#### Scenario: Lint 失敗が PR をブロックする
- **WHEN** ESLint がエラーを検出する
- **THEN** `lint` ジョブがエラーステータスで終了し、PR のステータスチェックが失敗する

#### Scenario: Lint が他のテストと並列実行される
- **WHEN** CI ワークフローが開始される
- **THEN** `lint`、`unit-test`、`e2e-test` が依存関係なく並列で実行される

### Requirement: Test artifacts upload

E2E テスト失敗時、Playwright のテスト結果（スクリーンショット、トレース）を GitHub Actions アーティファクトとしてアップロードしなければならない (SHALL)。

#### Scenario: Failed E2E uploads artifacts
- **WHEN** E2E テストが失敗する
- **THEN** `test-results/` の内容が GitHub Actions アーティファクトとしてダウンロード可能になる
