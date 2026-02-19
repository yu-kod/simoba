## 1. タワー状態・定義 (tower-entity spec)

- [x] 1.1 `src/domain/entities/towerDefinitions.ts` を作成 — `TowerDefinition` 型と デフォルトタワーのステータス定義（stats, radius, projectileSpeed, projectileRadius）
- [x] 1.2 `src/domain/entities/Tower.ts` を作成 — `TowerState` 型定義と `createTowerState(id, team, position, definition)` ファクトリ関数
- [x] 1.3 `src/domain/entities/__tests__/Tower.test.ts` を作成 — TowerState の初期値、immutability、dead 判定のユニットテスト

## 2. タワー自動ターゲット選択 (tower-entity spec)

- [x] 2.1 `src/domain/systems/towerTargeting.ts` を作成 — `selectTowerTarget(tower, enemies)` 純粋関数（射程内の最近接生存敵を返す）
- [x] 2.2 `src/domain/systems/__tests__/towerTargeting.test.ts` を作成 — 射程内1体、複数体、射程外、dead除外、ターゲットなしのテスト

## 3. CombatManager のタワー攻撃統合 (attack-system spec)

- [x] 3.1 `CombatManager` に `processTowerAttacks(deltaSeconds)` メソッドを追加 — 全生存タワーに対して selectTowerTarget → updateAttackState を実行し、ProjectileSpawnEvent を返す
- [x] 3.2 `src/scenes/__tests__/CombatManager.test.ts` にタワー攻撃処理のテストを追加 — ターゲット選択、プロジェクタイル生成、dead タワーのスキップ

## 4. タワーレンダリング (tower-entity spec)

- [x] 4.1 `src/scenes/effects/TowerRenderer.ts` を作成 — Container + bodyGraphics + HpBarRenderer、sync()/flash()/destroy() メソッド
- [x] 4.2 `mapRenderer.ts` から `drawTowers()` の呼び出しを削除し、タワーの静的描画を廃止

## 5. GameScene 統合 (tower-entity spec)

- [x] 5.1 `GameScene.create()` でタワーエンティティを生成し、EntityManager に登録、TowerRenderer を作成
- [x] 5.2 `GameScene.update()` に `processTowerAttacks()` 呼び出しを追加（hero攻撃の後、projectile解決の前）
- [x] 5.3 タワーの被ダメージ処理を統合 — ダメージ適用 + EntityManager 更新 + TowerRenderer.flash() + HP バー同期
- [x] 5.4 タワー破壊時の処理を統合 — dead 判定で TowerRenderer を非表示化

## 6. E2E テスト

- [x] 6.1 タワーが描画されていることを検証する E2E テストを追加（タワー位置に Canvas 要素が存在するか）
