## ADDED Requirements

### Requirement: ゲームサーバーデプロイワークフロー
`.github/workflows/deploy-game-server.yml` に GitHub Actions ワークフローを提供しなければならない（SHALL）。`workflow_dispatch` で手動トリガーし、任意のブランチから実行可能でなければならない（SHALL）。

#### Scenario: ワークフローが手動トリガーで実行できる
- **WHEN** GitHub Actions UI から `Deploy Game Server` ワークフローを手動実行する
- **THEN** 選択したブランチのコードでワークフローが開始される

### Requirement: オーナー認可
リポジトリオーナー以外のユーザーがワークフローを実行した場合、エラーで中断しなければならない（SHALL）。

#### Scenario: オーナー以外が実行するとエラーになる
- **WHEN** リポジトリオーナー以外のユーザーがワークフローを実行する
- **THEN** `authorize` ジョブがエラーで失敗し、デプロイは実行されない

### Requirement: Docker イメージビルドと ECR プッシュ
`server/Dockerfile` を使って Docker イメージをビルドし、ECR リポジトリにプッシュしなければならない（SHALL）。イメージタグには Git コミット SHA を使用しなければならない（SHALL）。

#### Scenario: Docker イメージが ECR にプッシュされる
- **WHEN** デプロイワークフローのビルドステップが完了する
- **THEN** ECR リポジトリに `<commit-sha>` タグ付きのイメージが存在する

### Requirement: ECS サービス再デプロイ
新しいタスク定義を登録し、ECS サービスを更新して新しいタスクを起動しなければならない（SHALL）。`--force-new-deployment` で強制再デプロイしなければならない（SHALL）。

#### Scenario: ECS サービスが新しいイメージで更新される
- **WHEN** ECR プッシュ後に ECS デプロイステップが実行される
- **THEN** 新しいタスク定義が登録され、ECS サービスが更新される

### Requirement: OIDC 認証
AWS 認証は OIDC を使用し、`aws-actions/configure-aws-credentials@v4` でキーレス認証を行わなければならない（SHALL）。

#### Scenario: OIDC でキーレス認証される
- **WHEN** AWS Credentials ステップが実行される
- **THEN** `secrets.AWS_ROLE_ARN` を使って OIDC トークン交換で一時認証情報を取得する

### Requirement: デプロイサマリー
ワークフロー完了時に GitHub Job Summary にデプロイ結果を表示しなければならない（SHALL）。ブランチ名、コミット SHA、イメージ URI、ECS クラスター・サービス名を含めなければならない（SHALL）。

#### Scenario: Job Summary にデプロイ情報が表示される
- **WHEN** デプロイワークフローが正常完了する
- **THEN** Job Summary にブランチ、コミット SHA、イメージ URI、ECS 情報のテーブルが表示される

### Requirement: .dockerignore
プロジェクトルートに `.dockerignore` を配置し、ビルドに不要なファイルを除外しなければならない（SHALL）。`node_modules`、`.git`、`dist`、テストファイル、インフラコードを除外しなければならない（SHALL）。

#### Scenario: Docker ビルドコンテキストが最適化される
- **WHEN** Docker イメージをビルドする
- **THEN** `.dockerignore` で指定されたファイルがビルドコンテキストに含まれない
