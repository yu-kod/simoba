## Context

近接攻撃（BLADE）は `updateAttackState` → 即時 `DamageEvent` → `applyDamage` + `MeleeSwingRenderer` の流れで実装済み。BOLT/AURA は `attackRange` が 200〜300 の遠距離ヒーローだが、プロジェクタイル（飛翔体）の仕組みがないため攻撃エフェクトが再現できない。

既存の `updateAttackState` は純粋関数で `AttackStateResult { hero, damageEvents }` を返す。この関数の戻り値を拡張してプロジェクタイル生成イベントを追加し、GameScene 側でプロジェクタイル配列を管理する設計とする。

## Goals / Non-Goals

**Goals:**
- 追尾型プロジェクタイルの生成・移動・衝突判定・消滅を純粋関数で実装
- BOLT/AURA の攻撃時にプロジェクタイルを発射し、命中時にダメージ適用
- BLADE の近接攻撃は既存の即時ダメージのまま変更なし
- プロジェクタイルをジオメトリック円で描画

**Non-Goals:**
- スキル用プロジェクタイル（直線型、範囲型など） — 将来の別チケット
- プロジェクタイル同士の衝突判定
- プロジェクタイルの回避（追尾型なので必中）

## Decisions

### Decision 1: `projectileSpeed` フィールドで近接/遠距離を判定

`HeroDefinition` に `projectileSpeed: number` と `projectileRadius: number` を追加。`projectileSpeed === 0` なら近接（即時ダメージ）、`> 0` なら遠距離（プロジェクタイル生成）。

**理由:** `attackType: 'melee' | 'ranged'` の enum を追加する方法もあるが、`projectileSpeed` は描画・移動に直接使う値であり、これが 0 かどうかで判定するのが最もシンプル。余分なフィールドを増やさない。

**値:**
- BLADE: `projectileSpeed: 0`, `projectileRadius: 0`
- BOLT: `projectileSpeed: 600`, `projectileRadius: 4`
- AURA: `projectileSpeed: 400`, `projectileRadius: 5`

### Decision 2: `AttackStateResult` に `projectileSpawnEvents` を追加

既存の `damageEvents` と並列に `projectileSpawnEvents` 配列を返す。

```typescript
interface ProjectileSpawnEvent {
  readonly ownerId: string
  readonly ownerTeam: Team
  readonly targetId: string
  readonly startPosition: Position
  readonly damage: number
  readonly speed: number
  readonly radius: number
}

interface AttackStateResult {
  readonly hero: HeroState
  readonly damageEvents: readonly DamageEvent[]
  readonly projectileSpawnEvents: readonly ProjectileSpawnEvent[]
}
```

**理由:** `updateAttackState` は純粋関数であり続ける。遠距離の場合は `damageEvents` を空にし `projectileSpawnEvents` にイベントを入れる。GameScene 側でイベントを受け取りプロジェクタイル配列に追加する。

### Decision 3: プロジェクタイルドメインロジックを独立ファイルに配置

```
src/domain/projectile/
  ProjectileState.ts    — 型定義 + createProjectile
  updateProjectile.ts   — 1つのプロジェクタイルの移動
  checkProjectileHit.ts — 衝突判定
  updateProjectiles.ts  — プール全体の更新（移動 + 衝突判定 + ターゲット消滅チェック）
```

**理由:** プロジェクトの coding style（many small files, feature-based）に従う。各関数が独立した純粋関数なのでファイルごとにテスト可能。

### Decision 4: GameScene でプロジェクタイル配列を `ProjectileState[]` として管理

`this.projectiles: ProjectileState[]` を GameScene に追加。毎フレーム `updateProjectiles()` で更新し、返された `DamageEvent` を既存の `applyDamage` + ヒットフラッシュで処理する。

**理由:** Phase 1 ではエンティティ数が少なく（プレイヤー + 敵1体）、配列の線形スキャンで十分。ECS やオブジェクトプールは Phase 2 以降の最適化対象。

### Decision 5: `ProjectileRenderer` は単一 Graphics オブジェクトで全プロジェクタイルを描画

1つの `Phaser.GameObjects.Graphics` で全プロジェクタイルを毎フレーム描画する。プロジェクタイルごとに Graphics を生成しない。

**理由:** プロジェクタイルは短命で数が変動するため、毎フレーム clear → 全描画がシンプル。個別の GameObject 管理やプーリングは不要な複雑さ。

### Decision 6: 遠距離攻撃時は MeleeSwingRenderer を再生しない

GameScene の `processAttack` で `damageEvents`（近接）と `projectileSpawnEvents`（遠距離）を分けて処理。近接時のみ `meleeSwing.play()` を呼ぶ。

## Risks / Trade-offs

- **追尾型の必中仕様** → 回避不可能なので遠距離ヒーローが強くなりすぎる可能性がある。バランスは `attackDamage` / `attackSpeed` で調整する。Phase 2 以降でスキルによる回避を追加予定。
- **ターゲット消滅時のプロジェクタイル即消去** → 視覚的に唐突に見える可能性があるが、Phase 1 では許容。将来的にフェードアウトアニメーションを検討。
