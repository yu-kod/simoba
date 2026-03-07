## 1. コア実装

- [x] 1.1 `server/src/game/ServerBotTalentSystem.ts` を作成 — `spendBotTalents(heroes, TALENT_TREES)` 関数を実装（取得可能ノードからランダム選択、ポイントがなくなるまでループ）
- [x] 1.2 `GameRoom.gameUpdate()` にレベルアップ処理後の Bot タレント消費呼び出しを追加

## 2. テスト

- [x] 2.1 `server/src/__tests__/ServerBotTalentSystem.test.ts` を作成 — Bot がポイント保持時にタレントを取得する / ポイント0でスキップ / 人間プレイヤーをスキップ / 取得可能ノードなしでスキップ / 複数ポイント連続消費
- [x] 2.2 `npm test` + `npm run lint` で全テスト・lint PASS を確認
