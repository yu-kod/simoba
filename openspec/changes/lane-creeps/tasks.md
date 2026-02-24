## 1. ミニオン型定義・定数（shared）

- [x] 1.1 `shared/entities/Minion.ts` — `MinionDefinition`, `MinionState`, `createMinionState`, `MELEE_MINION`, `RANGED_MINION` を定義（specs: lane-creeps, entity-registry）
- [x] 1.2 `shared/constants.ts` — `MINION_WAVE_INTERVAL`, `MINION_XP_REWARD`, `XP_GRANT_RANGE`, `MinionWaveConfig`, `getWaveConfig` を追加（specs: lane-creeps）
- [x] 1.3 `src/domain/entities/typeGuards.ts` — `isMinion()` 型ガードを追加（specs: entity-registry）
- [x] 1.4 ユニットテスト: `createMinionState`, `isMinion`, `getWaveConfig` のテスト

## 2. EntityManager 拡張

- [x] 2.1 `src/scenes/EntityManager.ts` — `getMinions(): MinionState[]` メソッドを追加（specs: entity-registry）
- [x] 2.2 ユニットテスト: `getMinions` がミニオンのみを返すことを検証

## 3. ミニオン移動AI

- [x] 3.1 `src/domain/systems/minionMovement.ts` — `updateMinionMovement(minion, deltaSeconds): MinionState` 純粋関数を実装（specs: lane-creeps）
- [x] 3.2 ユニットテスト: blue は右進、red は左進、戦闘中は停止

## 4. ミニオンターゲット選択

- [x] 4.1 `src/domain/systems/minionTargeting.ts` — `selectMinionTarget(minion, enemies)` 優先度付きターゲット選択を実装（specs: lane-creeps, attack-system）
- [x] 4.2 ユニットテスト: 優先度（ミニオン > タワー > ヒーロー）、同カテゴリ最近接、dead 除外

## 5. CombatManager ミニオン攻撃処理

- [x] 5.1 `src/scenes/CombatManager.ts` — `processMinionAttacks(deltaSeconds)` を追加。`selectMinionTarget` + `updateAttackState` を使用（specs: attack-system）
- [x] 5.2 タワーのターゲット候補にミニオンを追加（`processTowerAttacks` の enemies にミニオンが含まれることを確認）（specs: attack-system）
- [x] 5.3 ユニットテスト: 近接→DamageEvent、遠距離→ProjectileSpawnEvent、処理順序

## 6. XP 付与システム

- [x] 6.1 `src/domain/systems/grantXp.ts` — `grantXp(hero, amount): HeroState` 純粋関数を実装（specs: hero-stats）
- [x] 6.2 `src/domain/systems/minionXpDistribution.ts` — 死亡位置から範囲内ヒーローへXP均等分配ロジック（specs: hero-stats）
- [x] 6.3 ユニットテスト: XP 加算、均等分配、範囲外除外、dead ヒーロー除外

## 7. ミニオン死亡処理

- [x] 7.1 ミニオン死亡判定（既存 `checkDeath` を使用）+ 200ms delay 後のレジストリ削除ロジックを実装（specs: lane-creeps）
- [x] 7.2 死亡時に XP 分配を呼び出す統合（specs: lane-creeps, hero-stats）
- [x] 7.3 ユニットテスト: HP0 で dead、delay 後削除、リスポーンなし

## 8. ウェーブスポーンシステム

- [x] 8.1 `src/domain/systems/minionSpawn.ts` — `spawnWave(team, matchTime, waveConfig): MinionState[]` 純粋関数を実装（specs: lane-creeps）
- [x] 8.2 ユニットテスト: 構成（近接3+遠距離1）、スポーン位置、タイミング

## 9. MinionRenderer（クライアント描画）

- [x] 9.1 `src/scenes/effects/MinionRenderer.ts` — Container + body（円/ダイヤモンド）+ HpBarRenderer で描画（specs: lane-creeps）
- [x] 9.2 `sync(minionState)`, `flash()`, `destroy()` メソッドの実装
- [x] 9.3 ユニットテスト: 生成、sync でHP反映、dead で非表示

## 10. GameScene 統合（オフラインモード）

- [x] 10.1 `GameScene` にスポーンタイマーを追加（30秒間隔で `spawnWave` を呼び出し `registerEntity` + `MinionRenderer` 作成）
- [x] 10.2 `updateOfflineCombat` にミニオン移動 + `processMinionAttacks` を追加（ヒーロー→ミニオン→タワー→プロジェクタイルの順）
- [x] 10.3 ミニオン死亡処理 + XP分配を `updateDeathRespawn` に統合
- [x] 10.4 `syncEntityRenderers` にミニオン分岐（`isMinion` → `MinionRenderer.sync`）を追加
- [x] 10.5 動作確認: ブラウザで30秒ごとにミニオンが出現→前進→戦闘→死亡→削除の一連フローを目視確認

## 11. サーバー統合（Colyseus）

- [x] 11.1 `server/src/schema/MinionSchema.ts` — Colyseus schema を定義（specs: lane-creeps）
- [x] 11.2 `server/src/schema/GameRoomState.ts` — `minions: MapSchema<MinionSchema>` を追加
- [x] 11.3 `server/src/game/ServerMinionSystem.ts` — サーバー側スポーン/移動AI/戦闘/死亡処理
- [x] 11.4 `server/src/rooms/GameRoom.ts` — `gameUpdate` に ServerMinionSystem 呼び出しを追加
- [x] 11.5 `server/src/game/combatUtils.ts` — ダメージ適用先に minions MapSchema を追加
- [x] 11.6 `server/src/game/ServerTowerSystem.ts` — タワーのターゲット候補にミニオンを追加

## 12. クライアントオンライン同期

- [ ] 12.1 `GameScene` にサーバーミニオン state の受信・同期処理を追加（`handleServerMinionUpdate`）
- [ ] 12.2 サーバーからの minion 追加/更新/削除をレンダラーと EntityManager に反映

## 13. テスト・仕上げ

- [ ] 13.1 全ユニットテスト PASS を確認（`npm run test:unit`）
- [ ] 13.2 E2E テスト: ミニオンスポーン・移動・戦闘の基本フロー確認（`npm run test:e2e`）
- [ ] 13.3 レベルアップシステムの GitHub Issue を作成（XP付与のみ実装、レベルアップは別 Issue）
