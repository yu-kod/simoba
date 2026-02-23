## Tasks

### Phase 1: EntityManager の内部構造変更

- [x] 1.1 型ガード関数を追加 (`isHero()`, `isTower()`) — `src/domain/entities/typeGuards.ts`
- [x] 1.2 EntityManager を単一 Map 構造に書き換え — `_entities: Map<string, CombatEntityState>` に統一、`_localHero`/`_enemy`/`_remotePlayers` フィールドを廃止
- [x] 1.3 `localHeroId` プロパティを追加 — ローカルプレイヤーの操縦対象 ID
- [x] 1.4 `getHeroes()` メソッドを追加 — `entityType === 'hero'` フィルタ + 型ガード
- [x] 1.5 `allEntities` getter を追加 — Map の全エンティティを返す
- [x] 1.6 `localHero`/`enemy` getter、`updateLocalHero()`/`updateEnemy()`/`resetLocalHero()` を削除
- [x] 1.7 `getEnemies()` deprecated エイリアスを削除
- [x] 1.8 `getEntity()` を単一 Map lookup に簡略化
- [x] 1.9 `getEnemiesOf()` を単一 Map フィルタに簡略化
- [x] 1.10 Remote player 管理メソッド (`addRemotePlayer`, `removeRemotePlayer`, `updateRemotePlayer`, `applyDamageToRemote`) を統一 API に移行
- [x] 1.11 EntityManager のユニットテストを更新

### Phase 2: CombatManager の統一

- [x] 2.1 `applyLocalDamage()` を `updateEntity(targetId, (e) => applyDamage(e, amount))` に簡略化
- [x] 2.2 `processAttack()` の `localHero` 参照を `getEntity(localHeroId)` + `updateEntity` に変更
- [x] 2.3 `handleAttackInput()` の `localHero` 参照を同様に変更
- [x] 2.4 `processProjectiles()` の `localHero.team` 参照を変更
- [x] 2.5 `addRemoteProjectile()` の `getRemotePlayer` 参照を `getEntity` に変更
- [x] 2.6 CombatManager のユニットテストを更新

### Phase 3: GameScene の移行

- [x] 3.1 `heroRenderer`/`enemyRenderer`/`remoteRenderers`/`towerRenderers` を `entityRenderers: Map<string, Renderer>` に統合
- [x] 3.2 `create()` でのエンティティ初期化を `registerEntity` ベースに変更
- [x] 3.3 `update()` の localHero 参照を `getEntity(localHeroId)` / `updateEntity` に変更
- [x] 3.4 `updateDeathRespawn()` を `getHeroes()` ループに変更
- [x] 3.5 `flashEntityRenderer()` を `entityRenderers.get(targetId)?.flash()` に統一
- [x] 3.6 `syncTowerRenderers()` を全レンダラー sync ループに統合
- [x] 3.7 `updateRespawnUI()` の localHero 参照を変更
- [x] 3.8 `debugSwitchHero()` を新 API に対応
- [x] 3.9 カメラ追従を `entityRenderers.get(localHeroId)` 経由に変更

### Phase 4: 周辺コードの移行

- [x] 4.1 `NetworkBridge` の remote player コールバックを新 API に対応
- [x] 4.2 `e2eTestApi.ts` の EntityManager 参照を更新
- [x] 4.3 テストヘルパー `createTestEntityManager()` を追加 — テスト用の EntityManager 構築を1箇所に集約

### Phase 5: テスト実行・検証

- [x] 5.1 全ユニットテスト PASS を確認 (`npm run test:unit`)
- [x] 5.2 全 E2E テスト PASS を確認 (`npx playwright test`)
- [ ] 5.3 手動プレイテスト — ヒーロー移動・攻撃・被ダメージ・死亡/リスポーンが正常動作
