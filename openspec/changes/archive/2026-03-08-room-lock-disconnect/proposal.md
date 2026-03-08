## Why

マッチ中にプレイヤーが切断すると、残されたプレイヤーは不利な状態で戦い続けることになる。5-10分の短いマッチで再接続を待つのは非現実的であり、切断時に即座にマッチを終了させて全員を次のゲームへ送る仕組みが必要。また、マッチ開始後に新規プレイヤーが途中参加できてしまう問題もある。

## What Changes

- **ルームロック**: マッチ開始時（`matchPhase = 'playing'`）に `this.lock()` を呼び、途中参加をブロック
- **切断時マッチ終了**: `onLeave` で試合中の切断を検知し、切断者の相手チームを勝者として `endMatch` を呼ぶ
- **終了理由の追加**: `GameRoomState` に `matchEndReason` フィールドを追加し、通常終了（`tower_destroyed`）と切断終了（`player_disconnected`）を区別
- **クライアント表示の分岐**: 切断終了時、切断者の味方には「味方が切断したため終了」、相手チームには「VICTORY」を表示
- **ソロモード除外**: ソロモードでは切断＝単にルーム終了（勝敗判定なし）

## Capabilities

### New Capabilities
- `room-lock-disconnect`: ルームロック、切断検知によるマッチ終了、終了理由の管理

### Modified Capabilities
- `match-end`: 終了理由（`matchEndReason`）フィールドの追加、切断による終了トリガーの追加
- `match-end-ui`: 切断終了時の表示メッセージ分岐（味方切断 vs 通常敗北）

## Impact

- `server/src/rooms/GameRoom.ts` — `onLeave` にマッチ終了ロジック追加、`onJoin` にルームロック追加
- `server/src/schema/GameRoomState.ts` — `matchEndReason` フィールド追加
- `server/src/game/ServerMatchSystem.ts` — 切断終了の純粋関数追加
- `src/scenes/GameScene.ts` — 終了理由に応じた表示分岐
- `openspec/specs/match-end/spec.md` — 終了理由の要件追加
- `openspec/specs/match-end-ui/spec.md` — 切断時表示の要件追加
