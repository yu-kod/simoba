## Why

2人目のプレイヤーがオンライン対戦に参加すると「Waiting for opponent...」のまま固まり、ゲームが開始されない。`broadcast('gameStart')` が `onJoin` 内で即時発火するため、クライアントがリスナーを登録する前にメッセージが配信されてしまうレースコンディションが原因。lobby 実装時の PR レビューで `onStateChange` ポーリングから `onMessage` に変更した際にデグレした。

## What Changes

- サーバー: `GameRoomState` スキーマに `gameStarted: boolean` フラグを追加。`broadcast('gameStart')` を廃止し、state フラグのセットに置換
- クライアント: `room.onMessage('gameStart')` を廃止し、`room.onStateChange` で `gameStarted` フラグを監視する方式に変更
- テスト: サーバーユニットテストで `gameStarted` フラグの検証を追加。E2E テスト（オンラインモード）でレースコンディション再発防止を検証

## Non-goals

- マッチメイキングロジックの変更（Room 検索・作成は現行のまま）
- 3人以上対戦の対応
- 再接続・リジョイン機能

## Capabilities

### New Capabilities
（なし）

### Modified Capabilities
- `online-multiplayer`: 「ゲーム開始通知」の仕組みをメッセージベースからステートベースに変更。クライアントの接続・リスナー登録タイミングに依存しないロバストな通知方式にする

## Impact

- `server/src/schema/GameRoomState.ts` — `gameStarted` フィールド追加
- `server/src/rooms/GameRoom.ts` — `broadcast('gameStart')` → `this.state.gameStarted = true`
- `server/src/__tests__/GameRoom.test.ts` — テスト更新
- `src/scenes/LobbyScene.ts` — `onMessage` → `onStateChange` 監視
- `openspec/specs/online-multiplayer/spec.md` — ゲーム開始通知 Requirement の更新
