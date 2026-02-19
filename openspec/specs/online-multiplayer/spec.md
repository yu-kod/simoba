### Requirement: ゲーム開始通知
GameRoom は全プレイヤーが揃った時点で `gameStart` メッセージを全クライアントにブロードキャストしなければならない（SHALL）。

#### Scenario: 2人揃った時にゲーム開始を通知する
- **WHEN** 2人目のプレイヤーが GameRoom に参加する
- **THEN** サーバーが全クライアントに `gameStart` メッセージをブロードキャストする

#### Scenario: 1人だけの場合はゲーム開始しない
- **WHEN** 1人目のプレイヤーが GameRoom に参加する
- **THEN** `gameStart` メッセージはブロードキャストされない

### Requirement: Colyseus サーバーセットアップ
`server/` ディレクトリに Colyseus ゲームサーバーを配置しなければならない（SHALL）。独立した `package.json` と `tsconfig.json` を持ち、`npm run dev:server` でローカル起動できなければならない（SHALL）。WebSocket エンドポイントをポート 2567（Colyseus デフォルト）で待ち受けなければならない（SHALL）。

#### Scenario: サーバーをローカル起動する
- **WHEN** `server/` ディレクトリで `npm run dev:server` を実行する
- **THEN** Colyseus サーバーがポート 2567 で起動し、WebSocket 接続を受け付ける

#### Scenario: サーバーのヘルスチェック
- **WHEN** 起動中のサーバーに HTTP GET `/health` を送信する
- **THEN** 200 OK が返される

### Requirement: GameRoom 定義
`GameRoom` クラスを定義し、最大 2 人のプレイヤーが参加できる Room を提供しなければならない（SHALL）。`onCreate`、`onJoin`、`onLeave`、`onDispose` ライフサイクルを実装しなければならない（SHALL）。

#### Scenario: Room を作成する
- **WHEN** サーバーが起動している状態で、クライアントが `game` Room に参加をリクエストする
- **THEN** GameRoom が作成され、クライアントが参加する

#### Scenario: 2 人目のプレイヤーが参加する
- **WHEN** 1 人のプレイヤーが Room にいる状態で、2 人目のクライアントが参加をリクエストする
- **THEN** 2 人目のプレイヤーが同じ Room に参加する

#### Scenario: 3 人目のプレイヤーは参加できない
- **WHEN** 2 人のプレイヤーが Room にいる状態で、3 人目のクライアントが参加をリクエストする
- **THEN** 参加が拒否される

#### Scenario: プレイヤーが退室する
- **WHEN** プレイヤーが Room から切断する
- **THEN** そのプレイヤーの状態が Room から削除される

### Requirement: ステートスキーマ定義
Colyseus の `@type()` デコレータを使用して、Room 状態スキーマを定義しなければならない（SHALL）。プレイヤー状態は `position`（x, y）、`facing`（ラジアン）、`hp`、`maxHp`、`heroType`、`team` を含まなければならない（SHALL）。

#### Scenario: プレイヤー参加時に初期状態が設定される
- **WHEN** プレイヤーが Room に参加する
- **THEN** プレイヤーのスキーマに初期位置（チームに応じたスポーン位置）、facing 0、最大 HP、デフォルトヒーロータイプ、チーム割り当てが設定される

#### Scenario: 状態変更がバイナリ差分で同期される
- **WHEN** プレイヤーの position が変更される
- **THEN** Colyseus の組み込みバイナリ差分同期により、他のクライアントに変更が伝播される

### Requirement: クライアント接続管理
`NetworkClient` クラスを提供し、Colyseus サーバーへの接続・Room 参加・切断を管理しなければならない（SHALL）。接続状態（`disconnected`、`connecting`、`connected`）を保持しなければならない（SHALL）。

#### Scenario: サーバーに接続して Room に参加する
- **WHEN** LobbyScene でオンライン対戦が選択され `NetworkClient.connect()` を呼び出す
- **THEN** Colyseus サーバーに WebSocket 接続し、`game` Room に参加する

#### Scenario: 接続状態が更新される
- **WHEN** 接続処理が進行する
- **THEN** 状態が `disconnected` → `connecting` → `connected` と遷移する

#### Scenario: 接続失敗時にロビーでエラー表示する
- **WHEN** サーバーが起動していない状態で `NetworkClient.connect()` を呼び出す
- **THEN** 接続状態が `disconnected` に戻り、LobbyScene でエラーメッセージが表示される

### Requirement: プレイヤー位置・facing の同期
ローカルプレイヤーの `position` と `facing` をサーバーに送信しなければならない（SHALL）。送信レートはフレームレートより低い固定間隔（20Hz）でなければならない（SHALL）。リモートプレイヤーの状態変更を受信して描画に反映しなければならない（SHALL）。

#### Scenario: ローカルプレイヤーの位置を送信する
- **WHEN** ローカルプレイヤーが移動する
- **THEN** 50ms 間隔で position と facing がサーバーに送信される

#### Scenario: リモートプレイヤーの位置を受信して描画する
- **WHEN** サーバーからリモートプレイヤーの position/facing 更新を受信する
- **THEN** リモートプレイヤーの HeroRenderer が更新された位置・向きで描画される

#### Scenario: リモートプレイヤーが参加したときに描画が開始される
- **WHEN** リモートプレイヤーが Room に参加する
- **THEN** リモートプレイヤー用の HeroRenderer が生成され、マップ上に表示される

#### Scenario: リモートプレイヤーが退室したときに描画が停止される
- **WHEN** リモートプレイヤーが Room から退室する
- **THEN** リモートプレイヤーの HeroRenderer が破棄され、マップから消える

### Requirement: 攻撃・ダメージの同期
攻撃開始イベントをサーバー経由で相手に送信しなければならない（SHALL）。ダメージイベント（近接の即時ダメージ、プロジェクタイル命中ダメージ）を同期しなければならない（SHALL）。HP 変更を Room 状態スキーマで同期しなければならない（SHALL）。

#### Scenario: 近接攻撃のダメージを同期する
- **WHEN** ローカルプレイヤー（BLADE）がリモートプレイヤーに近接攻撃を命中させる
- **THEN** ダメージイベントがサーバーに送信され、相手クライアントで HP 減少とヒットフラッシュが再生される

#### Scenario: プロジェクタイル生成を同期する
- **WHEN** ローカルプレイヤー（BOLT）が攻撃を発動する
- **THEN** プロジェクタイル生成イベントがサーバー経由で相手クライアントに送信され、プロジェクタイルが描画される

#### Scenario: プロジェクタイル命中ダメージを同期する
- **WHEN** プロジェクタイルがリモートプレイヤーに命中する
- **THEN** ダメージイベントがサーバー経由で同期され、両方のクライアントで HP が更新される

### Requirement: オフラインフォールバック
サーバー未起動時は既存のローカル Bot 対戦モードで動作しなければならない（SHALL）。オンライン/オフラインの切り替えは GameScene のコード変更なしに行えなければならない（SHALL）。

#### Scenario: サーバー未起動でゲームを開始する
- **WHEN** Colyseus サーバーが起動していない状態でゲームを開始する
- **THEN** 接続失敗後、自動的にローカル Bot 対戦モードで動作し、既存の静的敵ヒーローが表示される

#### Scenario: オンラインモードからオフラインモードへの切り替え
- **WHEN** ゲーム中にサーバーとの接続が切れる
- **THEN** ゲームがローカルモードにフォールバックし、プレイが中断されない

### Requirement: 開発時の同時起動
`npm run dev` で Vite（フロントエンド）と Colyseus（バックエンド）を同時に起動できなければならない（SHALL）。

#### Scenario: dev コマンドで両サーバーが起動する
- **WHEN** プロジェクトルートで `npm run dev` を実行する
- **THEN** Vite dev server（ポート 3000）と Colyseus サーバー（ポート 2567）が同時に起動する

### Requirement: Colyseus サーバーの Docker 化
`server/Dockerfile` を提供し、Colyseus サーバーをコンテナとして実行できなければならない（SHALL）。ECS on EC2 デプロイを前提としたイメージ構成でなければならない（SHALL）。

#### Scenario: Docker イメージをビルドして起動する
- **WHEN** `docker build -t simoba-server ./server` && `docker run -p 2567:2567 simoba-server` を実行する
- **THEN** Colyseus サーバーがコンテナ内で起動し、ポート 2567 で接続を受け付ける
