## REMOVED Requirements

### Requirement: オフラインモード選択
**Reason**: オフラインモードを廃止し、Solo Play（サーバー接続）に置き換え
**Migration**: 「Solo Play」ボタンが同等の機能を提供する（サーバー上の1人用ルームで Bot 対戦）

## MODIFIED Requirements

### Requirement: ロビーシーンの表示
BootScene の次に LobbyScene を表示しなければならない（SHALL）。LobbyScene はゲームモード選択メニューを提供しなければならない（SHALL）。

#### Scenario: ゲーム起動時にロビーが表示される
- **WHEN** ゲームを起動する
- **THEN** BootScene の後に LobbyScene が表示され、モード選択メニューが表示される

#### Scenario: ロビーにモード選択ボタンが表示される
- **WHEN** LobbyScene が表示される
- **THEN** 「Online Battle」ボタンと「Solo Play」ボタンが表示される

## ADDED Requirements

### Requirement: Solo Play モード選択
「Solo Play」ボタンをクリックした場合、`{ mode: 'solo', heroType }` でサーバーに接続しなければならない（SHALL）。接続後、サーバーが即座に `matchPhase = 'playing'` に設定するため、waiting 状態をスキップして GameScene に遷移しなければならない（SHALL）。

#### Scenario: Solo Play でゲームを開始する
- **WHEN** プレイヤーが「Solo Play」ボタンをクリックする
- **THEN** サーバーに `{ mode: 'solo', heroType }` で接続される
- **THEN** `matchPhase` が `'playing'` になった時点で GameScene に遷移する

#### Scenario: Solo Play の接続に失敗した場合
- **WHEN** Solo Play でサーバーへの接続が失敗する
- **THEN** エラーメッセージが表示され、メニューに戻る

## MODIFIED Requirements

### Requirement: GameScene の GameMode 受け取り
GameScene はシーンデータから GameMode を受け取らなければならない（SHALL）。GameMode が渡されない場合はエラーとして扱わなければならない（SHALL）。

#### Scenario: シーンデータから GameMode を受け取る
- **WHEN** LobbyScene から GameMode 付きのシーンデータで GameScene が開始される
- **THEN** GameScene は渡された GameMode を使用してゲームを初期化する

#### Scenario: GameMode が渡されない場合のエラー
- **WHEN** GameScene がシーンデータなし、または GameMode なしで開始される
- **THEN** エラーログを出力し、LobbyScene に遷移する
