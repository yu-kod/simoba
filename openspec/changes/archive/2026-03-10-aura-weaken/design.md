## Overview

Weaken は AURA の初デバフスキル。敵ヒーローの攻撃力を一定時間低下させる。既存の StatusEffect システム（`isDebuff: true`）を再利用し、新たに `enemy` ターゲティングを追加する。

## Design Decisions

### ターゲット解決の統合（resolveHeroTarget）

`resolveAllyTarget` と `resolveEnemyTarget` はチームフィルタの向きだけが異なる。重複を避けるため、共通の `resolveHeroTarget` を作りフィルタを引数で渡す。

```typescript
function resolveHeroTarget(
  hero: HeroSchema, casterId: string,
  target: { x: number; y: number },
  heroes: MapSchema<HeroSchema>, range: number,
  filter: (candidate: HeroSchema, candidateId: string) => boolean,
): HeroSchema | null {
  // filter を満たす最寄りヒーローを range 内で検索
  // 該当なし → null
}
```

- **ally**: `filter = (c, sid) => sid !== casterId && c.team === hero.team && !c.dead`、フォールバック = 自分
- **enemy**: `filter = (c) => c.team !== hero.team && !c.dead`、フォールバック = null（不発）

`executeSkill` 内で `targeting === 'enemy'` かつ `targetHero === null` なら `null` を返す（CD 未消費）。

### `SkillTargeting` 拡張

```typescript
export type SkillTargeting = 'direction' | 'point' | 'self' | 'ally' | 'enemy'
```

`SkillDefinition.range` は `ally` と `enemy` の両方で使用する。

### 実効ステータス計算の汎用化（getEffectiveStat）

`StatusEffectSystem.ts` に汎用ヘルパーを追加し、各システムのステータス計算を統一する:

```typescript
export function getEffectiveStat(base: number, hero: HeroSchema, buffType: string): number {
  return Math.max(0, base + getStatusEffectValue(hero, buffType))
}
```

- `ServerMovementSystem` の speed 計算: `getEffectiveStat(hero.speed, hero, 'speed')` に置換
- `ServerCombatManager` の attackDamage 計算: `getEffectiveStat(hero.attackDamage, hero, 'attackDamage')` に置換
- 今後 `attackSpeed` や `defense` 等のデバフ/バフ追加時も同じパターンで一行で済む
- `Math.max(0, ...)` のクランプ忘れを防止

### buffEffectHandler の再利用

既存の `buffEffectHandler` はそのまま動作する。`ctx.targetHero` に敵ヒーローが渡され、`statusEffects` にデバフが追加される。`isDebuff: true` フラグは将来の dispel 用。

### スキルパラメータ

| パラメータ | 値 | 備考 |
|-----------|-----|------|
| cooldown | 14 | 長めのCD |
| range | 500 | 射程（攻撃よりやや長い） |
| buffType | `'attackDamage'` | 攻撃力に影響 |
| value | -15 | 攻撃力を15低下（固定値） |
| duration | 4 | 4秒間 |
| isDebuff | true | デバフフラグ |

## File Changes

| File | Change |
|------|--------|
| `shared/skills/skillDefinitions.ts` | `SkillTargeting` に `'enemy'` 追加、`aura-weaken` 定義 |
| `server/src/game/ServerSkillExecutionSystem.ts` | `resolveHeroTarget` 統合、`resolveAllyTarget`/`resolveEnemyTarget` をフィルタ切替に、enemy 分岐追加 |
| `server/src/game/StatusEffectSystem.ts` | `getEffectiveStat` 汎用ヘルパー追加 |
| `server/src/game/ServerCombatManager.ts` | attackDamage 3箇所を `getEffectiveStat` に置換 |
| `server/src/game/ServerMovementSystem.ts` | speed 計算を `getEffectiveStat` に置換 |
| テスト | 敵ターゲティング、デバフ適用、攻撃力低下反映、getEffectiveStat |
