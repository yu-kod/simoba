## MODIFIED Requirements

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
