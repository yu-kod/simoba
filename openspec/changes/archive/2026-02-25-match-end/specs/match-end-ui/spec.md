## ADDED Requirements

### Requirement: VICTORY / DEFEAT オーバーレイ
`matchPhase` が `'finished'` に変更されたとき、クライアントはゲーム画面上にフルスクリーン半透明オーバーレイを表示しなければならない（SHALL）。ローカルプレイヤーのチームが `winnerTeam` と一致する場合は「VICTORY」、一致しない場合は「DEFEAT」と表示しなければならない（SHALL）。テキストはジオメトリックスタイルで画面中央に大きく表示しなければならない（SHALL）。

#### Scenario: 勝利表示
- **WHEN** `matchPhase` が `'finished'` になり、ローカルプレイヤーのチームが `winnerTeam` と一致する
- **THEN** 画面中央に「VICTORY」テキストが半透明オーバーレイ上に表示される

#### Scenario: 敗北表示
- **WHEN** `matchPhase` が `'finished'` になり、ローカルプレイヤーのチームが `winnerTeam` と一致しない
- **THEN** 画面中央に「DEFEAT」テキストが半透明オーバーレイ上に表示される

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
