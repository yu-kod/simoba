## ADDED Requirements

### Requirement: ロビーシーンの表示
BootScene の次に LobbyScene を表示しなければならない（SHALL）。LobbyScene はゲームモード選択メニューを提供しなければならない（SHALL）。

#### Scenario: ゲーム起動時にロビーが表示される
- **WHEN** ゲームを起動する
- **THEN** BootScene の後に LobbyScene が表示され、モード選択メニューが表示される

#### Scenario: ロビーにモード選択ボタンが表示される
- **WHEN** LobbyScene が表示される
- **THEN** 「オンライン対戦」ボタンと「オフラインで遊ぶ」ボタンが表示される

### Requirement: オフラインモード選択
「オフラインで遊ぶ」ボタンをクリックした場合、OfflineGameMode で GameScene に遷移しなければならない（SHALL）。

#### Scenario: オフラインモードでゲームを開始する
- **WHEN** プレイヤーが「オフラインで遊ぶ」ボタンをクリックする
- **THEN** OfflineGameMode が生成され、GameScene に遷移してローカル Bot 対戦が開始される

### Requirement: オンラインモード接続
「オンライン対戦」ボタンをクリックした場合、Colyseus サーバーに接続を開始しなければならない（SHALL）。接続中は「接続中...」の表示をしなければならない（SHALL）。

#### Scenario: オンライン対戦ボタンをクリックして接続する
- **WHEN** プレイヤーが「オンライン対戦」ボタンをクリックする
- **THEN** Colyseus サーバーへの接続が開始され、「接続中...」が表示される

#### Scenario: 接続に失敗した場合
- **WHEN** サーバーへの接続が失敗する
- **THEN** エラーメッセージが表示され、メニューに戻るボタンが表示される

### Requirement: 対戦相手の待機
サーバーに接続後、対戦相手が揃うまで待機画面を表示しなければならない（SHALL）。待機中は「対戦相手を待っています...」と表示しなければならない（SHALL）。

#### Scenario: 1人目のプレイヤーが待機する
- **WHEN** プレイヤーがサーバーに接続し、Room に参加したが対戦相手がまだいない
- **THEN** 「対戦相手を待っています...」が表示される

#### Scenario: 待機中にキャンセルできる
- **WHEN** 待機中にプレイヤーが「キャンセル」ボタンをクリックする
- **THEN** Room から退出し、モード選択メニューに戻る

### Requirement: ゲーム開始遷移
サーバーから `gameStart` メッセージを受信した場合、GameScene に遷移しなければならない（SHALL）。遷移時に OnlineGameMode をシーンデータとして渡さなければならない（SHALL）。

#### Scenario: 2人揃ってゲームが開始される
- **WHEN** サーバーから `gameStart` メッセージを受信する
- **THEN** 「ゲーム開始!」が短時間表示された後、OnlineGameMode 付きで GameScene に遷移する

### Requirement: GameScene の GameMode 受け取り
GameScene はシーンデータから GameMode を受け取らなければならない（SHALL）。GameMode が渡されない場合は OfflineGameMode をフォールバックとして使用しなければならない（SHALL）。

#### Scenario: シーンデータから GameMode を受け取る
- **WHEN** LobbyScene から GameMode 付きのシーンデータで GameScene が開始される
- **THEN** GameScene は渡された GameMode を使用してゲームを初期化する

#### Scenario: GameMode が渡されない場合のフォールバック
- **WHEN** GameScene がシーンデータなし、または GameMode なしで開始される
- **THEN** OfflineGameMode がデフォルトとして使用される

### Requirement: ロビー UI のスタイル
ロビー UI は Phaser の Text/Graphics で描画しなければならない（SHALL）。プロジェクトのジオメトリックスタイルに準拠しなければならない（SHALL）。

#### Scenario: ボタンがインタラクティブに動作する
- **WHEN** プレイヤーがボタン上にマウスを移動する
- **THEN** ボタンのハイライト表示が変化し、クリック可能であることが視覚的に示される
