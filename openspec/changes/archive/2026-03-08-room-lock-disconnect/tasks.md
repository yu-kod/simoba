## 1. サーバー: スキーマ・定数

- [x] 1.1 `GameRoomState` に `matchEndReason: string`（`@type('string')`）フィールドを追加、初期値 `''`（spec: match-end）

## 2. サーバー: マッチ終了ロジック

- [x] 2.1 `ServerMatchSystem.ts` の `endMatch` に `matchEndReason = 'tower_destroyed'` のセットを追加（spec: match-end）
- [x] 2.2 `ServerMatchSystem.ts` に `endMatchByDisconnect(state, disconnectedTeam)` 純粋関数を追加 — `winnerTeam` = 敵チーム、`matchEndReason = 'player_disconnected'` をセット（spec: room-lock-disconnect）
- [x] 2.3 `ServerMatchSystem` のユニットテスト追加 — `endMatch` で `matchEndReason` が `'tower_destroyed'` になること、`endMatchByDisconnect` で `'player_disconnected'` になること、べき等性の確認（spec: match-end, room-lock-disconnect）

## 3. サーバー: ルームロック・切断処理

- [x] 3.1 `GameRoom.onJoin` で `matchPhase = 'playing'` 遷移時に `this.lock()` を呼ぶ（ソロモード・オンライン両方）（spec: room-lock-disconnect）
- [x] 3.2 `GameRoom.onLeave` を拡張 — 試合中 && !ソロモード の場合に `endMatchByDisconnect` を呼ぶ。待機中・試合終了後・ソロモードはヒーロー削除のみ（spec: room-lock-disconnect）
- [x] 3.3 `GameRoom` のユニットテスト追加 — ルームロック呼び出し、切断時終了、待機中離脱で終了しないこと、ソロモードで終了しないこと（spec: room-lock-disconnect）

## 4. クライアント: 終了表示の分岐

- [x] 4.1 `GameScene.ts` のオーバーレイ表示ロジックを `matchEndReason` で分岐 — tower_destroyed: VICTORY/DEFEAT、player_disconnected + 勝者: VICTORY、player_disconnected + 敗者: DISCONNECTED + サブテキスト（spec: match-end-ui）
- [x] 4.2 クライアントのユニットテスト追加 — 4パターンの表示テキスト分岐を検証（spec: match-end-ui）

## 5. 検証

- [x] 5.1 `npm test` 全テスト通過を確認
- [x] 5.2 `npm run lint` 通過を確認
