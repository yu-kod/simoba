## 1. サーバー側: gameStart 通知 (online-multiplayer spec)

- [x] 1.1 GameRoom の `onJoin` で `players.size === maxClients` を検知し、全クライアントに `gameStart` メッセージをブロードキャストする
- [x] 1.2 `gameStart` のユニットテストを追加する（2人参加で送信、1人のみで未送信）

## 2. OnlineGameMode の接続分離 (online-multiplayer spec)

- [x] 2.1 `OnlineGameMode` に既存の Room を外部から渡せるコンストラクタオプションを追加する（`room` を受け取った場合は `onSceneCreate` で接続をスキップ）
- [x] 2.2 `NetworkClient` に `gameStart` メッセージのコールバック登録メソッドを追加する

## 3. LobbyScene 基盤 (lobby-scene spec)

- [x] 3.1 `src/scenes/LobbyScene.ts` を作成し、画面状態（`menu | connecting | waiting | starting | error`）の型定義と状態管理を実装する
- [x] 3.2 `src/config/gameConfig.ts` のシーン一覧に LobbyScene を追加する
- [x] 3.3 `BootScene` の遷移先を `GameScene` から `LobbyScene` に変更する

## 4. ロビー UI: メニュー画面 (lobby-scene spec)

- [x] 4.1 タイトルテキストとモード選択ボタン（「オンライン対戦」「オフラインで遊ぶ」）を Phaser Text/Graphics で描画する
- [x] 4.2 ボタンのホバーハイライトとクリックイベントを実装する

## 5. オフラインモード遷移 (lobby-scene spec)

- [x] 5.1 「オフラインで遊ぶ」ボタンクリックで OfflineGameMode を生成し、`this.scene.start('GameScene', { gameMode })` で遷移する

## 6. GameScene の GameMode 受け取り (lobby-scene spec)

- [x] 6.1 GameScene の `init(data)` でシーンデータから GameMode を受け取るように変更する
- [x] 6.2 GameMode が渡されない場合のフォールバック（OfflineGameMode）を実装する
- [x] 6.3 既存の `initGameMode()` 内のハードコード `new OnlineGameMode()` を削除し、受け取った GameMode を使用するように変更する

## 7. オンラインモード: 接続と待機 (lobby-scene spec)

- [x] 7.1 「オンライン対戦」ボタンクリックで状態を `connecting` に遷移し、「接続中...」を表示する
- [x] 7.2 `NetworkClient.connect()` を呼び出し、成功時に状態を `waiting` に遷移して「対戦相手を待っています...」を表示する
- [x] 7.3 接続失敗時に状態を `error` に遷移し、エラーメッセージと「戻る」ボタンを表示する
- [x] 7.4 待機中の「キャンセル」ボタンで Room から退出し、メニューに戻る

## 8. ゲーム開始遷移 (lobby-scene spec)

- [x] 8.1 `gameStart` メッセージ受信時に状態を `starting` に遷移し、「ゲーム開始!」を短時間表示する
- [x] 8.2 OnlineGameMode に接続済み Room を渡して生成し、`this.scene.start('GameScene', { gameMode })` で遷移する

## 9. テスト

- [x] 9.1 GameRoom の `gameStart` ブロードキャストのユニットテストを作成する
- [x] 9.2 GameScene の GameMode 受け取り（フォールバック含む）のユニットテストを作成する
- [x] 9.3 E2E テスト: ゲーム起動時にロビーが表示され、「オフラインで遊ぶ」でゲームが開始されることを検証する
