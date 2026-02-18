## 1. テスト API の実装

- [x] 1.1 `src/test/e2eTestApi.ts` を作成。`registerTestApi(entityManager, combatManager)` 関数で `window.__test__` に読み取り専用クエリ (`getHeroType`, `getHeroPosition`, `getHeroHp`, `getEnemyHp`, `getEnemyPosition`, `getProjectileCount`) を登録
- [x] 1.2 GameScene.create() で `import.meta.env.DEV` ガード付きで `registerTestApi()` を呼び出す
- [x] 1.3 テスト API のユニットテストを作成 (各クエリが正しい値を返すことを検証)

## 2. E2E テストの書き換え

- [x] 2.1 `e2e/debug-hero-switch.spec.ts` を書き換え。`scene.heroState.*` → `window.__test__.getHeroType()` / `getHeroPosition()` / `getHeroHp()` に置換
- [x] 2.2 `e2e/melee-attack.spec.ts` を書き換え。state 直接書き換えを廃止し、WASD 移動 + 右クリック攻撃 + `waitForFunction` で HP 変化を検知
- [x] 2.3 `e2e/hp-bar.spec.ts` を書き換え。`scene.heroState.hp` / `scene.enemyState.hp` → `window.__test__` API に置換
- [x] 2.4 `e2e/projectile-attack.spec.ts` を書き換え。BOLT 切り替え + WASD 移動 + 右クリック攻撃。`getProjectileCount()` と `getEnemyHp()` で検証

## 3. GameScene クリーンアップ

- [x] 3.1 GameScene から `heroState` getter/setter、`enemyState` getter、`projectiles` getter を削除

## 4. 検証

- [x] 4.1 `npm run test:unit` — 全 PASS 確認
- [x] 4.2 `npm run test:e2e` — 全 PASS 確認
- [x] 4.3 E2E テストで `scene.heroState` / `scene.enemyState` / `scene.projectiles` への直接アクセスがゼロであることを grep で確認
