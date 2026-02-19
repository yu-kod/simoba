## Context

現在のエンティティシステムはヒーロー専用に設計されている:

- `shared/types.ts`: `EntityState` → `CombatEntityState` の2層だが、`dead` や `radius` がない
- `Hero.ts`: `HeroState extends CombatEntityState` にヒーロー固有と汎用フィールドが混在
- `updateAttackState`: 引数・戻り値が `HeroState` 固定
- `EntityManager`: `localHero`, `enemy`, `remotePlayers` — 全て `HeroState`
- `CombatManager`: ターゲット解決・ダメージ適用がヒーローのみ
- `deathRespawn.ts`: `checkDeath` が `HeroState` 固定でリスポーンロジックと結合

Phase 1 の残りデリバラブル（タワー、ミニオン、ボス）すべてが攻撃・被ダメージ・死亡の仕組みを必要とするため、ヒーロー専用の型と管理システムを汎用化する。

## Goals / Non-Goals

**Goals:**
- 全戦闘エンティティが共通の型階層を持ち、discriminated union で型安全に分岐可能
- `updateAttackState`, `applyDamage`, `checkDeath` が任意のエンティティ型で動作
- `EntityManager` が全エンティティタイプを統一的に管理
- 既存ヒーロー API の後方互換を維持し、既存のシーンコードの変更を最小限に
- 既存テストが修正後に全 PASS

**Non-Goals:**
- タワー・ミニオン・ボスの具体的な State / Definition 実装
- ターゲット優先度・アグロシステム
- スポーンシステム（リスポーン/ウェーブ/タイムド）
- レンダリング層・サーバーサイドの変更

## Decisions

### Decision 1: 型階層 — 3層インターフェース継承

```
EntityState (id, position, team)
  └─ CombatEntityState (hp, maxHp, dead, radius, entityType)
       ├─ AttackerEntityState (stats, attackCooldown, attackTargetId, facing)
       │    ├─ HeroState (type, level, xp, respawnTimer, deathPosition)
       │    ├─ TowerState (将来)
       │    ├─ MinionState (将来)
       │    └─ BossState (将来)
       └─ (将来: StructureState — HP あり攻撃なし、例: 拠点)
```

**Rationale:** CombatEntityState と AttackerEntityState を分離することで、「HP を持つが攻撃しない」エンティティ（拠点等）も表現可能。MOBA の全エンティティカテゴリをカバーする最小限の階層。

**Alternative:** 全部 CombatEntityState に統合して optional フィールドにする → 型安全性が下がる。却下。

### Decision 2: `entityType` は string literal union の discriminant

```typescript
export type EntityType = 'hero' | 'tower' | 'minion' | 'boss' | 'structure'

export interface CombatEntityState extends EntityState {
  readonly entityType: EntityType
  readonly hp: number
  readonly maxHp: number
  readonly dead: boolean
  readonly radius: number
}
```

**Rationale:** TypeScript の discriminated union パターンにより、`switch (entity.entityType)` で型が自動的に絞り込まれる。`instanceof` チェック不要で、イミュータブル state パターンと相性が良い。

**Alternative:** `entity instanceof HeroState` のようなクラスベース → イミュータブル plain object パターンと相性が悪い。却下。

### Decision 3: `Team` 型に `'neutral'` を追加

```typescript
export type Team = 'blue' | 'red' | 'neutral'
```

**Rationale:** ボスは中立エンティティ。`getEnemiesOf(team)` は `team !== entity.team` で判定するが、neutral エンティティは両チームから攻撃可能。

**ロジック:**
- `getEnemiesOf('blue')` → team が `'red'` または `'neutral'` のエンティティを返す
- `getEnemiesOf('red')` → team が `'blue'` または `'neutral'` のエンティティを返す
- `getEnemiesOf('neutral')` → 全エンティティ（ボスが全員を攻撃する場合）

### Decision 4: `radius` をエンティティ state に持たせる

**Before:** `getEntityRadius(id)` が `HERO_DEFINITIONS[hero.type].radius` をルックアップ
**After:** `CombatEntityState.radius` を直接参照

```typescript
// Before
getEntityRadius(id: string): number {
  if (id === this._localHero.id) return HERO_DEFINITIONS[this._localHero.type].radius
  // ... hero-specific lookup
}

// After
getEntityRadius(id: string): number {
  const entity = this.getEntity(id)
  return entity?.radius ?? DEFAULT_ENTITY_RADIUS
}
```

**Rationale:** エンティティタイプごとの定義ルックアップが不要になり、新しいエンティティタイプ追加時に `getEntityRadius` を変更する必要がない。`createHeroState` で `radius` を state にコピーするだけ。

**Trade-off:** state に固定値が含まれる冗長性。しかし、将来的にバフでサイズが変わる可能性もあり、state に持つ方が柔軟。

### Decision 5: `updateAttackState` のジェネリクス化

```typescript
// Before
export function updateAttackState(
  hero: HeroState, target: CombatEntityState | null, ...
): AttackStateResult

export interface AttackStateResult {
  readonly hero: HeroState
  ...
}

// After
export function updateAttackState<T extends AttackerEntityState>(
  entity: T, target: CombatEntityState | null, ...
): AttackStateResult<T>

export interface AttackStateResult<T extends AttackerEntityState> {
  readonly entity: T
  ...
}
```

**Rationale:** 既存の `applyDamage<T extends CombatEntityState>` と同じパターン。TypeScript の spread operator が型パラメータ T を維持するため、`{ ...entity, attackCooldown: newValue }` は T 型のまま返る。

### Decision 6: EntityManager のレジストリ設計

既存のヒーロー専用 API を維持しつつ、汎用レジストリを追加:

```typescript
class EntityManager {
  // ---- 既存 API（後方互換）----
  private _localHero: HeroState
  private _enemy: HeroState
  private readonly _remotePlayers: Map<string, HeroState>
  get localHero(): HeroState
  get enemy(): HeroState
  updateLocalHero(updater): void
  updateEnemy(updater): void

  // ---- 新規: 汎用レジストリ ----
  private readonly _entities: Map<string, CombatEntityState>

  registerEntity(entity: CombatEntityState): void
  removeEntity(id: string): void
  updateEntity<T extends CombatEntityState>(id: string, updater: (e: T) => T): void

  // ---- 統合検索（ヒーロー + レジストリを横断）----
  getEntity(id: string): CombatEntityState | null    // 既存を拡張
  getEnemiesOf(team: Team): CombatEntityState[]       // 新規
  getEntityRadius(id: string): number                  // 既存を簡素化
}
```

**ポイント:**
- `getEntity(id)` — まずヒーロー（localHero, enemy, remotePlayers）を検索、なければレジストリを検索
- `getEnemiesOf(team)` — `team !== entity.team` かつ `!entity.dead` の全エンティティ。neutral は両チームの敵
- 既存の `getEnemies()` は `getEnemiesOf(this._localHero.team)` のエイリアスとして維持（後方互換）

**Alternative:** EntityManager を完全に書き直してヒーローもレジストリに統合 → 変更量が膨大で既存シーンコードに大きく影響。却下。段階的に移行する方がリスクが低い。

### Decision 7: CombatManager の汎用化

```typescript
// applyLocalDamage — レジストリも検索
applyLocalDamage(targetId: string, amount: number): void {
  const em = this.entityManager
  // 1. ヒーローを検索（既存）
  if (targetId === em.enemy.id) { em.updateEnemy(...); return }
  if (em.applyDamageToRemote(targetId, amount)) return
  // 2. レジストリを検索（新規）
  em.updateEntity(targetId, (e) => applyDamage(e, amount))
}

// processProjectiles — 全エンティティをターゲットに
processProjectiles(deltaSeconds: number): CombatEvents {
  const targets = this.entityManager.getEnemiesOf(this.entityManager.localHero.team)
  // ... 既存ロジック
}
```

### Decision 8: `checkDeath` の汎用化と責務分離

```typescript
// 汎用: あらゆる CombatEntityState の死亡判定
export function checkDeath<T extends CombatEntityState>(entity: T): T {
  if (entity.dead || entity.hp > 0) return entity
  return { ...entity, dead: true }
}

// ヒーロー専用: 汎用 checkDeath + リスポーン情報セット
export function checkHeroDeath(
  hero: HeroState,
  respawnTime: number = DEFAULT_RESPAWN_TIME
): HeroState {
  if (hero.dead || hero.hp > 0) return hero
  return {
    ...checkDeath(hero),
    respawnTimer: respawnTime,
    deathPosition: hero.position,
    attackTargetId: null,
  }
}
```

**Rationale:** 死亡判定（`hp <= 0 → dead: true`）はエンティティ共通の関心事。リスポーン/スポーンは「いつ・どこに・何を出現させるか」という別の責務であり、エンティティごとに異なる（ヒーロー: タイマーリスポーン、タワー: 永久破壊、ミニオン: 除去）。今回は `checkDeath` の汎用化のみ。

## Risks / Trade-offs

### Risk 1: 破壊的変更によるテスト修正量
`CombatEntityState` に必須フィールド（`dead`, `radius`, `entityType`）を追加するため、全テストのモックデータ修正が必要。
→ **Mitigation:** テストヘルパー関数 `createMockCombatEntity(overrides)` を作成し、デフォルト値を提供。既存テストはヘルパー経由でモック生成に移行。

### Risk 2: EntityManager の二重構造（ヒーロー専用 + レジストリ）
段階的移行のため一時的に2つの管理系統が共存する。
→ **Mitigation:** `getEntity()` / `getEnemiesOf()` が両方を透過的に検索するため、呼び出し側は違いを意識しない。将来的にヒーローもレジストリに統合可能（別 Issue）。

### Risk 3: `getEnemiesOf()` のパフォーマンス
全レジストリ + 全ヒーローを毎フレーム走査する。
→ **Mitigation:** Phase 1 のエンティティ数は最大でも 4 ヒーロー + 2 タワー + 数十ミニオン程度。Map イテレーションで十分。キャッシュは premature optimization。

## Open Questions

- ヒーローを将来的にレジストリに統合するか、専用 API を維持し続けるか（現時点では後方互換を優先）
