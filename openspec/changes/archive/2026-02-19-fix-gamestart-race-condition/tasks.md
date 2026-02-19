## 1. サーバー側: GameRoomState スキーマ変更

- [x] 1.1 `GameRoomState` に `@type('boolean') gameStarted = false` フィールドを追加 (`server/src/schema/GameRoomState.ts`)
- [x] 1.2 `GameRoom.onJoin` で `broadcast('gameStart')` を `this.state.gameStarted = true` に置換 (`server/src/rooms/GameRoom.ts`)

## 2. サーバーテスト: デグレ防止

- [x] 2.1 既存テストを更新: 2人参加時に `state.gameStarted === true` を検証 (`server/src/__tests__/GameRoom.test.ts`)
- [x] 2.2 1人参加時に `state.gameStarted === false` のままであることを検証
- [x] 2.3 `broadcast('gameStart')` が呼び出されないことを明示的に検証（`room.broadcast` のモックで確認）

## 3. クライアント側: LobbyScene 変更

- [x] 3.1 `watchForGameReady` を `room.onMessage('gameStart')` から `room.onStateChange` + `gameStarted` フラグ監視に変更 (`src/scenes/LobbyScene.ts`)
- [x] 3.2 `onStateChange` で `gameStarted === true` を検知したら `onGameStart()` を呼び出す
- [x] 3.3 ゲーム開始後に重複呼び出しを防ぐガード（`lobbyState` チェック）が機能することを確認

## 4. 検証

- [x] 4.1 サーバーユニットテスト全パス (`cd server && npm test`)
- [x] 4.2 クライアント TypeScript 型チェック (`npx tsc --noEmit`)
- [x] 4.3 既存ユニットテスト全パス (`npm run test:unit`)
- [x] 4.4 E2E テスト全パス (`npm run test:e2e`)
