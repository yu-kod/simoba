## ADDED Requirements

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
