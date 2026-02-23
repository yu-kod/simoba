## 1. 型階層の整理 (shared/types.ts, Hero.ts)

- [x] 1.1 `shared/types.ts` — `Team` 型に `'neutral'` を追加 [entity-registry spec: Team 型の neutral サポート]
- [x] 1.2 `shared/types.ts` — `EntityType` 型を追加 (`'hero' | 'tower' | 'minion' | 'boss' | 'structure'`) [entity-registry spec: entityType による型判別]
- [x] 1.3 `shared/types.ts` — `CombatEntityState` に `entityType`, `dead`, `radius` フィールドを追加 [entity-registry spec: エンティティ型階層]
- [x] 1.4 `shared/types.ts` — `AttackerEntityState` インターフェースを新設 (`CombatEntityState` 拡張 + `stats`, `attackCooldown`, `attackTargetId`, `facing`) [entity-registry spec: エンティティ型階層]
- [x] 1.5 `src/domain/entities/Hero.ts` — `HeroState` を `AttackerEntityState` 拡張に変更。`dead`, `radius` を親から継承し、`entityType: 'hero'` を追加 [entity-registry spec: エンティティ型階層]
- [x] 1.6 `src/domain/entities/heroDefinitions.ts` — `createHeroState` で `dead: false`, `radius: HERO_DEFINITIONS[type].radius`, `entityType: 'hero'` を state に含める [entity-registry spec: radius をエンティティ state に保持]

## 2. updateAttackState のジェネリクス化

- [x] 2.1 `src/domain/systems/updateAttackState.ts` — `AttackStateResult` を `AttackStateResult<T extends AttackerEntityState>` に変更。`hero` フィールドを `entity` にリネーム [attack-system spec: 攻撃状態マシン]
- [x] 2.2 `src/domain/systems/updateAttackState.ts` — `updateAttackState` の引数を `<T extends AttackerEntityState>(entity: T, ...)` に変更 [attack-system spec: 攻撃状態マシン]
- [x] 2.3 呼び出し元の修正 — `CombatManager.processAttack` の `attackResult.hero` → `attackResult.entity` に変更 [attack-system spec: 攻撃状態マシン]

## 3. checkDeath の汎用化

- [x] 3.1 `src/domain/systems/deathRespawn.ts` — 汎用 `checkDeath<T extends CombatEntityState>` を新設（`dead: true` のみセット） [entity-registry spec: 汎用死亡判定]
- [x] 3.2 `src/domain/systems/deathRespawn.ts` — 既存の `checkDeath` を `checkHeroDeath` にリネームし、内部で汎用 `checkDeath` を使用するラッパーに変更 [entity-registry spec: 汎用死亡判定]
- [x] 3.3 呼び出し元の修正 — `checkDeath(hero)` → `checkHeroDeath(hero)` に変更 [entity-registry spec: 汎用死亡判定]

## 4. EntityManager のエンティティレジストリ

- [x] 4.1 `src/scenes/EntityManager.ts` — `_entities: Map<string, CombatEntityState>` レジストリを追加 [entity-registry spec: エンティティレジストリへの登録・削除]
- [x] 4.2 `src/scenes/EntityManager.ts` — `registerEntity`, `removeEntity`, `updateEntity<T>` メソッドを追加 [entity-registry spec: エンティティレジストリへの登録・削除]
- [x] 4.3 `src/scenes/EntityManager.ts` — `getEntity(id)` をヒーロー + レジストリの横断検索に拡張 [entity-registry spec: 統合エンティティ検索]
- [x] 4.4 `src/scenes/EntityManager.ts` — `getEnemiesOf(team)` を追加（dead 除外、neutral 対応） [entity-registry spec: チーム別敵エンティティ検索]
- [x] 4.5 `src/scenes/EntityManager.ts` — 既存 `getEnemies()` を `getEnemiesOf(localHero.team)` のエイリアスに変更 [entity-registry spec: チーム別敵エンティティ検索]
- [x] 4.6 `src/scenes/EntityManager.ts` — `getEntityRadius(id)` を `entity.radius` 直接参照に簡素化 [entity-registry spec: radius をエンティティ state に保持]

## 5. CombatManager の汎用化

- [x] 5.1 `src/scenes/CombatManager.ts` — `applyLocalDamage` をレジストリ内エンティティにも適用可能に拡張 [attack-system spec: ダメージ適用]
- [x] 5.2 `src/scenes/CombatManager.ts` — `processProjectiles` のターゲットリストを `getEnemiesOf(team)` に変更 [attack-system spec: 全エンティティへのプロジェクタイル当たり判定]
- [x] 5.3 `src/scenes/CombatManager.ts` — `handleAttackInput` の敵検索を `getEnemiesOf(team)` に変更 [attack-system spec: 全エンティティへのクリックターゲット]

## 6. テストヘルパー & 既存テスト修正

- [x] 6.1 テストヘルパー `createMockCombatEntity(overrides)` / `createMockAttackerEntity(overrides)` を作成（デフォルト値付き）
- [x] 6.2 `src/domain/entities/__tests__/Hero.test.ts` — `entityType`, `dead`, `radius` フィールド追加に対応
- [x] 6.3 `src/domain/systems/__tests__/updateAttackState.test.ts` — `AttackerEntityState` ジェネリクスに対応。`result.hero` → `result.entity` に変更
- [x] 6.4 `src/domain/systems/__tests__/deathRespawn.test.ts` — `checkDeath` → `checkHeroDeath` リネーム + 汎用 `checkDeath` テスト追加
- [x] 6.5 `src/domain/systems/__tests__/applyDamage.test.ts`, `findClickTarget.test.ts`, `isInAttackRange.test.ts` — モックデータに `dead`, `radius`, `entityType` 追加
- [x] 6.6 `src/scenes/__tests__/EntityManager.test.ts` — レジストリ CRUD, `getEnemiesOf`, `getEntityRadius` 簡素化のテスト追加
- [x] 6.7 `src/scenes/__tests__/CombatManager.test.ts` — レジストリ内エンティティへのダメージ適用テスト追加

## 7. 全テスト PASS 確認

- [x] 7.1 `npm run test:unit` — 全ユニットテスト PASS
- [x] 7.2 `npm run test:e2e` — 全 E2E テスト PASS
- [x] 7.3 TypeScript コンパイルエラーなし確認 (`npx tsc --noEmit`)
