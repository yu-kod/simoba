## MODIFIED Requirements

### Requirement: 試合フェーズ管理
`GameRoomState` は `matchPhase` フィールド（`'waiting' | 'playing' | 'finished'`）を持たなければならない（SHALL）。初期値は `'waiting'` でなければならない（SHALL）。`winnerTeam` フィールド（`'' | 'blue' | 'red'`）を持たなければならない（SHALL）。初期値は `''` でなければならない（SHALL）。`matchEndReason` フィールド（`'' | 'tower_destroyed' | 'player_disconnected'`）を持たなければならない（SHALL）。初期値は `''` でなければならない（SHALL）。全フィールドは Colyseus `@type` で全クライアントに同期されなければならない（SHALL）。

#### Scenario: 初期状態
- **WHEN** GameRoom が作成される
- **THEN** `matchPhase` が `'waiting'`、`winnerTeam` が `''`、`matchEndReason` が `''` である

#### Scenario: プレイヤーが揃って試合開始
- **WHEN** 規定人数のプレイヤーが参加する
- **THEN** `matchPhase` が `'playing'` に変更される

#### Scenario: タワー破壊で試合終了
- **WHEN** いずれかのタワーの `dead` が `true` になる
- **THEN** `matchPhase` が `'finished'` に変更され、`winnerTeam` に破壊されたタワーの敵チームが設定され、`matchEndReason` が `'tower_destroyed'` に設定される

#### Scenario: プレイヤー切断で試合終了
- **WHEN** 試合中にプレイヤーが切断する
- **THEN** `matchPhase` が `'finished'` に変更され、`winnerTeam` に切断者の敵チームが設定され、`matchEndReason` が `'player_disconnected'` に設定される

## MODIFIED Requirements

### Requirement: 勝敗判定
サーバーは `gameUpdate` の各フレーム末尾で全タワーの `dead` 状態をチェックしなければならない（SHALL）。`dead === true` のタワーが見つかった場合、そのタワーのチームの敵チームを `winnerTeam` に設定し、`matchPhase` を `'finished'` に変更し、`matchEndReason` を `'tower_destroyed'` に設定しなければならない（SHALL）。

#### Scenario: blue タワーが破壊される
- **WHEN** blue チームのタワーの `dead` が `true` になる
- **THEN** `winnerTeam` が `'red'`、`matchPhase` が `'finished'`、`matchEndReason` が `'tower_destroyed'` に設定される

#### Scenario: red タワーが破壊される
- **WHEN** red チームのタワーの `dead` が `true` になる
- **THEN** `winnerTeam` が `'blue'`、`matchPhase` が `'finished'`、`matchEndReason` が `'tower_destroyed'` に設定される
