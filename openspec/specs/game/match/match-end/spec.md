# Specification

## Purpose
試合フェーズ管理（waiting/playing/finished）、タワー破壊による勝敗判定の仕様

## Requirements

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

### Requirement: gameStarted の廃止
既存の `gameStarted: boolean` フィールドは `matchPhase` に統合されなければならない（SHALL）。`gameStarted` を参照していた箇所は `matchPhase !== 'waiting'` に置き換えなければならない（SHALL）。

#### Scenario: gameStarted の代替
- **WHEN** クライアントがゲーム開始を検知する
- **THEN** `matchPhase` が `'waiting'` から `'playing'` への変更を listen して判定する

### Requirement: 勝敗判定
サーバーは `gameUpdate` の各フレーム末尾で全タワーの `dead` 状態をチェックしなければならない（SHALL）。`dead === true` のタワーが見つかった場合、そのタワーのチームの敵チームを `winnerTeam` に設定し、`matchPhase` を `'finished'` に変更し、`matchEndReason` を `'tower_destroyed'` に設定しなければならない（SHALL）。

#### Scenario: blue タワーが破壊される
- **WHEN** blue チームのタワーの `dead` が `true` になる
- **THEN** `winnerTeam` が `'red'`、`matchPhase` が `'finished'`、`matchEndReason` が `'tower_destroyed'` に設定される

#### Scenario: red タワーが破壊される
- **WHEN** red チームのタワーの `dead` が `true` になる
- **THEN** `winnerTeam` が `'blue'`、`matchPhase` が `'finished'`、`matchEndReason` が `'tower_destroyed'` に設定される

### Requirement: 試合終了後のゲームロジック停止
`matchPhase` が `'finished'` の間、サーバーは全てのゲームロジック（移動、攻撃、ミニオンスポーン、プロジェクタイル処理、死亡判定）を実行してはならない（SHALL NOT）。プレイヤーからの入力メッセージを処理してはならない（SHALL NOT）。

#### Scenario: 試合終了後に入力を送信
- **WHEN** `matchPhase` が `'finished'` の状態でプレイヤーが入力を送信する
- **THEN** サーバーは入力を無視し、ゲーム状態は変化しない

#### Scenario: 試合終了後のミニオンスポーン
- **WHEN** `matchPhase` が `'finished'` の状態でミニオンスポーン時間に達する
- **THEN** 新しいミニオンはスポーンされない
