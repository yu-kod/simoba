## Why

現在、試合に終了条件がなく、タワーを破壊してもゲームが続行される。プレイヤーは「勝った/負けた」を体験できず、ゲームループが成立していない。勝敗判定 → 結果表示 → タイトルへ戻るフローが必須。

## What Changes

- サーバーに試合フェーズ管理を追加（`playing` → `finished`）
- 敵タワー破壊を勝利条件として判定（どちらかのタワーが折れるまで試合継続）
- 試合終了後はプレイヤー入力・ミニオンスポーン・戦闘を停止
- クライアントに VICTORY / DEFEAT オーバーレイ UI を追加
- オーバーレイからタイトル画面へ戻るボタン

## Capabilities

### New Capabilities
- `match-end`: 試合フェーズ管理、勝敗判定（タワー破壊）、試合終了フロー
- `match-end-ui`: VICTORY/DEFEAT オーバーレイ、タイトルへ戻るボタン

### Modified Capabilities
- `tower-entity`: タワー破壊時にサーバーが勝敗判定をトリガーする連携
- `lane-creeps`: 試合終了時にミニオンスポーン・行動を停止

## Impact

- **サーバー**: `GameRoomState` に `matchPhase` / `winnerTeam` フィールド追加。`GameRoom.gameUpdate` に勝敗チェックロジック追加
- **クライアント**: `GameScene` に試合終了オーバーレイの表示ロジック追加。`OnlineGameMode` / `OfflineGameMode` に `matchResult` メッセージハンドラ追加
- **共有**: `shared/messages.ts` に `MatchResultMessage` 型追加
- **関連 Issue**: #150, #36
