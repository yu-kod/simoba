## ADDED Requirements

### Requirement: ゲーム開始通知
GameRoom は全プレイヤーが揃った時点で `gameStart` メッセージを全クライアントにブロードキャストしなければならない（SHALL）。

#### Scenario: 2人揃った時にゲーム開始を通知する
- **WHEN** 2人目のプレイヤーが GameRoom に参加する
- **THEN** サーバーが全クライアントに `gameStart` メッセージをブロードキャストする

#### Scenario: 1人だけの場合はゲーム開始しない
- **WHEN** 1人目のプレイヤーが GameRoom に参加する
- **THEN** `gameStart` メッセージはブロードキャストされない

## MODIFIED Requirements

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
