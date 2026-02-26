## ADDED Requirements

### Requirement: Solo モードのルーム設定
GameRoom は `onCreate` の options に `mode: 'solo'` が指定された場合、`maxClients` を 1 に設定しなければならない（SHALL）。Solo モードでは、プレイヤーが `onJoin` した時点で即座に `matchPhase` を `'playing'` に遷移し、タワーを配置しなければならない（SHALL）。

#### Scenario: Solo モードでルームが作成される
- **WHEN** クライアントが `{ mode: 'solo', heroType: 'BLADE' }` で Room に参加する
- **THEN** `maxClients` が 1 に設定される
- **THEN** `onJoin` 完了時に `matchPhase` が `'playing'` になる
- **THEN** タワーが配置される

#### Scenario: Solo モードで3人目が参加できない
- **WHEN** Solo モードの Room に2人目のクライアントが参加をリクエストする
- **THEN** 参加が拒否される（maxClients=1）

#### Scenario: 通常モードでは従来通り2人必要
- **WHEN** クライアントが `mode` オプションなしで Room に参加する
- **THEN** `maxClients` は 2 のまま
- **THEN** 2人揃うまで `matchPhase` は `'waiting'` のまま

### Requirement: Bot ヒーローの自動追加
Solo モードでプレイヤーが参加した後、サーバーは敵チームに Bot ヒーローを1体追加しなければならない（SHALL）。Bot ヒーローは `HeroSchema` を使用し、ID は `bot-<team>-<index>` 形式でなければならない（SHALL）。Bot のヒーロータイプはランダムに選択しなければならない（SHALL）。

#### Scenario: Solo モードで Bot が追加される
- **WHEN** Solo モードでプレイヤー（blue チーム）が参加する
- **THEN** red チームに Bot ヒーローが1体追加される
- **THEN** Bot の ID は `bot-red-0` 形式である
- **THEN** Bot の HeroSchema に正しいステータス（maxHp, speed, attackDamage 等）が設定される

#### Scenario: Bot ヒーローが heroes MapSchema に登録される
- **WHEN** Bot ヒーローが追加される
- **THEN** `state.heroes` MapSchema に Bot が含まれる
- **THEN** クライアントは Bot を通常のヒーローと同じ方法でレンダリングする

### Requirement: ServerBotSystem による Bot AI
ServerBotSystem は各ゲームティックで Bot ヒーローごとに `InputMessage` を生成し、`playerInputs` Map に注入しなければならない（SHALL）。既存の `processMovement` と `processHeroCombat` がそのまま Bot の入力を処理する。

#### Scenario: Bot が最寄りの敵に向かって移動する
- **WHEN** Bot の攻撃範囲内に敵エンティティがいない
- **THEN** Bot は最寄りの敵エンティティ（ミニオン、タワー、ヒーロー）に向かって移動する InputMessage を生成する

#### Scenario: Bot が射程内の敵を攻撃する
- **WHEN** Bot の攻撃範囲内に敵エンティティがいる
- **THEN** Bot は `attackTargetId` を設定した InputMessage を生成する
- **THEN** Bot の `moveDir` は `{ x: 0, y: 0 }` である（移動停止）

#### Scenario: Bot が死亡中は入力を生成しない
- **WHEN** Bot ヒーローが `dead === true` である
- **THEN** ServerBotSystem はその Bot の InputMessage を生成しない

#### Scenario: Bot のターゲット優先順位
- **WHEN** 複数の敵エンティティが射程外にいる
- **THEN** Bot は最も近い敵エンティティを対象とする
