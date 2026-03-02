## 1. 定数・純粋関数 (spec: respawn-timer-scaling)

- [x] 1.1 `RESPAWN_TIMES` テーブルを `shared/constants.ts` に追加する（`[0, 3, 5, 8, 12, 15]` — index=level）
- [x] 1.2 `computeRespawnTime(level)` 純粋関数を `shared/systems/respawnTimer.ts` に作成する
- [x] 1.3 `computeRespawnTime` のユニットテストを作成する（Lv1〜5、範囲外クランプ）

## 2. サーバー統合 (spec: death-respawn)

- [x] 2.1 `processDeathAndRespawn` で `DEFAULT_RESPAWN_TIME` の代わりに `computeRespawnTime(hero.level)` を使用する
- [x] 2.2 `ServerDeathSystem.test.ts` にレベル連動リスポーンタイマーのテストを追加する

## 3. 検証

- [x] 3.1 全テスト実行（`npm run test:unit`）して PASS を確認する
