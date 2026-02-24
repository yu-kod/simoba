## MODIFIED Requirements

### Requirement: ALB + HTTPS リスナー
`modules/game-server/` モジュールは ALB を public サブネットに作成しなければならない（SHALL）。HTTPS リスナー（ポート 443）を ACM 証明書で設定しなければならない（SHALL）。ターゲットグループはポート 2567 でヘルスチェック（`/health`）を行わなければならない（SHALL）。

#### Scenario: ALB が HTTPS でリクエストを受け付ける
- **WHEN** `https://api.simoba.yu-web.site` にリクエストを送信する
- **THEN** ALB が HTTPS を終端し、ターゲットグループの ECS タスクに HTTP で転送する

#### Scenario: ヘルスチェックが正常に機能する
- **WHEN** ALB ターゲットグループがヘルスチェックを実行する
- **THEN** `/health` エンドポイントに HTTP GET でアクセスし、200 レスポンスでヘルシー判定する

### Requirement: セキュリティグループの変更
ECS タスクのセキュリティグループは、ALB のセキュリティグループからのポート 2567 のみを許可しなければならない（SHALL）。直接のパブリックアクセスを禁止しなければならない（SHALL）。ALB 用のセキュリティグループはポート 443 を全世界から許可しなければならない（SHALL）。

#### Scenario: ALB 経由でのみ ECS にアクセス可能
- **WHEN** 外部から ECS タスクのポート 2567 に直接接続を試みる
- **THEN** 接続が拒否される

#### Scenario: ALB からの接続は許可される
- **WHEN** ALB がポート 2567 で ECS タスクに転送する
- **THEN** 接続が許可される

### Requirement: ECS サービスの ALB 統合
ECS サービスは `load_balancer` ブロックで ALB ターゲットグループに登録しなければならない（SHALL）。コンテナ名 `colyseus`、コンテナポート 2567 を指定しなければならない（SHALL）。

#### Scenario: ECS タスクが ALB ターゲットグループに登録される
- **WHEN** ECS サービスが起動する
- **THEN** Fargate タスクが ALB ターゲットグループの healthy ターゲットとして登録される
