# Specification

## Purpose
試合終了時の VICTORY/DEFEAT オーバーレイ表示とロビーへの遷移UIの仕様

## Requirements

### Requirement: VICTORY / DEFEAT オーバーレイ
`matchPhase` が `'finished'` に変更されたとき、クライアントはゲーム画面上にフルスクリーン半透明オーバーレイを表示しなければならない（SHALL）。表示テキストは `matchEndReason` と `winnerTeam` に基づいて以下のように決定しなければならない（SHALL）:

- `matchEndReason` が `'tower_destroyed'` でローカルプレイヤーのチームが `winnerTeam` と一致する場合: 「VICTORY」
- `matchEndReason` が `'tower_destroyed'` でローカルプレイヤーのチームが `winnerTeam` と一致しない場合: 「DEFEAT」
- `matchEndReason` が `'player_disconnected'` でローカルプレイヤーのチームが `winnerTeam` と一致する場合: 「VICTORY」
- `matchEndReason` が `'player_disconnected'` でローカルプレイヤーのチームが `winnerTeam` と一致しない場合: 「DISCONNECTED」と「味方が切断したため終了」のサブテキスト

テキストはジオメトリックスタイルで画面中央に大きく表示しなければならない（SHALL）。

#### Scenario: タワー破壊による勝利表示
- **WHEN** `matchPhase` が `'finished'` になり、`matchEndReason` が `'tower_destroyed'` で、ローカルプレイヤーのチームが `winnerTeam` と一致する
- **THEN** 画面中央に「VICTORY」テキストが表示される

#### Scenario: タワー破壊による敗北表示
- **WHEN** `matchPhase` が `'finished'` になり、`matchEndReason` が `'tower_destroyed'` で、ローカルプレイヤーのチームが `winnerTeam` と一致しない
- **THEN** 画面中央に「DEFEAT」テキストが表示される

#### Scenario: 切断による勝利表示
- **WHEN** `matchPhase` が `'finished'` になり、`matchEndReason` が `'player_disconnected'` で、ローカルプレイヤーのチームが `winnerTeam` と一致する
- **THEN** 画面中央に「VICTORY」テキストが表示される

#### Scenario: 味方切断による終了表示
- **WHEN** `matchPhase` が `'finished'` になり、`matchEndReason` が `'player_disconnected'` で、ローカルプレイヤーのチームが `winnerTeam` と一致しない
- **THEN** 画面中央に「DISCONNECTED」テキストと「味方が切断したため終了」のサブテキストが表示される

### Requirement: ロビーへ戻るボタン
オーバーレイ上に「Back to Lobby」ボタンを表示しなければならない（SHALL）。ボタンをクリックすると、Colyseus ルームから離脱し、`LobbyScene` に遷移しなければならない（SHALL）。

#### Scenario: ロビーへ戻る
- **WHEN** プレイヤーが「Back to Lobby」ボタンをクリックする
- **THEN** Colyseus ルームから `leave()` が呼ばれ、`LobbyScene` が開始される

### Requirement: オーバーレイ中の入力無効化
オーバーレイ表示中は、ゲーム内の操作（移動、攻撃、スキル）の入力を受け付けてはならない（SHALL NOT）。「Back to Lobby」ボタンのクリックのみ受け付けなければならない（SHALL）。

#### Scenario: オーバーレイ中の移動入力
- **WHEN** オーバーレイが表示されている状態でプレイヤーが WASD キーを押す
- **THEN** ヒーローは移動しない
