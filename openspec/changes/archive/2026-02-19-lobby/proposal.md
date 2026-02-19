## Why

現在はゲーム起動後すぐに GameScene が開始されるため、オンライン 1v1 対戦をテストできない。2人のプレイヤーが揃うまで待機するロビー画面がなく、接続タイミングを合わせる手段がない。Issue #86 で対応する。

## What Changes

- **LobbyScene を新規作成**: 「オンライン対戦」「オフラインで遊ぶ」の選択画面と、対戦相手の待機画面を提供する
- **シーン遷移フローの変更**: BootScene → GameScene の直接遷移を BootScene → LobbyScene → GameScene に変更する
- **GameMode の選択をロビーで行う**: 現在 GameScene 内でハードコードされている GameMode（Online/Offline）の決定をロビーに移す
- **サーバー側に "全員揃った" 通知を追加**: GameRoom が 2人揃ったことをクライアントに通知する `gameStart` メッセージを追加する

## Non-goals

- ヒーロー選択画面（Issue #56 で対応）
- マッチメイキングキュー・ランキング（Issue #57 の本格版で対応）
- ルーム ID 指定やプライベートマッチ
- プレイヤー名入力やアカウント
- 試合結果画面・リザルト

## Capabilities

### New Capabilities
- `lobby-scene`: ロビー画面のシーン管理、UI 表示、GameMode 選択、シーン遷移フロー

### Modified Capabilities
- `online-multiplayer`: GameRoom に全員揃った通知（`gameStart`）メッセージを追加、GameMode の初期化タイミングを LobbyScene に移動

## Impact

- `src/scenes/BootScene.ts` — 遷移先を LobbyScene に変更
- `src/scenes/LobbyScene.ts` — 新規作成
- `src/scenes/GameScene.ts` — GameMode をシーンデータとして受け取るように変更
- `server/src/rooms/GameRoom.ts` — `gameStart` メッセージ送信の追加
- `src/network/OnlineGameMode.ts` — 接続タイミングの変更（LobbyScene で接続開始）
- `src/config/gameConfig.ts` — シーン一覧に LobbyScene を追加
- 参照スペック: `openspec/specs/online-multiplayer/spec.md`
