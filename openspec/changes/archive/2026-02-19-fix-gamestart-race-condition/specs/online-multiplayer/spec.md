## MODIFIED Requirements

### Requirement: ゲーム開始通知
GameRoom は全プレイヤーが揃った時点で `GameRoomState.gameStarted` フラグを `true` に設定しなければならない（SHALL）。ゲーム開始の通知にはメッセージブロードキャスト（`broadcast('gameStart')`）を使用してはならない（SHALL NOT）。クライアントは `room.onStateChange` で `gameStarted` フラグを監視し、`true` になった時点でゲーム開始処理を行わなければならない（SHALL）。

#### Scenario: 2人揃った時に gameStarted フラグが true になる
- **WHEN** 2人目のプレイヤーが GameRoom に参加する
- **THEN** `GameRoomState.gameStarted` が `true` に設定される
- **THEN** `broadcast('gameStart')` は呼び出されない

#### Scenario: 1人だけの場合は gameStarted が false のまま
- **WHEN** 1人目のプレイヤーが GameRoom に参加する
- **THEN** `GameRoomState.gameStarted` は `false` のままである

#### Scenario: 2人目のクライアントが gameStarted を検知する
- **WHEN** 2人目のプレイヤーの `joinOrCreate` が解決し、`room.onStateChange` を登録する
- **THEN** 次の state patch で `gameStarted === true` を検知し、ゲーム開始処理が実行される

#### Scenario: 1人目のクライアントも gameStarted を検知する
- **WHEN** 1人目のプレイヤーが待機中に `gameStarted` が `true` に変わる
- **THEN** `onStateChange` コールバックが発火し、ゲーム開始処理が実行される

## ADDED Requirements

### Requirement: GameRoomState の gameStarted スキーマフィールド
`GameRoomState` は `gameStarted: boolean` フィールドを Colyseus の `@type('boolean')` デコレータ付きで持たなければならない（SHALL）。初期値は `false` でなければならない（SHALL）。

#### Scenario: Room 作成時の初期状態
- **WHEN** GameRoom が `onCreate` で初期化される
- **THEN** `GameRoomState.gameStarted` は `false` である

#### Scenario: スキーマフィールドがバイナリ同期される
- **WHEN** サーバーが `gameStarted` を `true` に設定する
- **THEN** Colyseus のバイナリ差分同期により、全接続中クライアントに変更が伝播される
