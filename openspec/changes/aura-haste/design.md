## Context

AURAの Haste スキルを実装する。Heal で構築した ally ターゲティングと `SkillExecutionContext.targetHero` を再利用する。新しい要素は `buff` effectType と、バフ/デバフの持続時間管理システム。

現在の実装:
- `hero.speed` は `ServerMovementSystem.processMovement` で直接参照（`hero.x += nx * hero.speed * dt`）
- `speed` はレベルアップ時に `xpUtils.ts` で基礎値 + 成長値から再計算される
- `getAllyRange` は `heal` effectType のみハードコード（PR #222 レビュー指摘）
- バフ/デバフの持続時間管理の仕組みは未実装

## Goals / Non-Goals

**Goals:**
- `buff` effectType を追加し、速度バフを実装する
- バフ/デバフ共通の状態管理システムを構築する（再利用可能）
- バフはエンティティ側が自己管理する（受けた側がタイマーを持つ）
- 将来のディスペル（バフ除去）スキルを考慮した設計にする
- `SkillDefinition` に `range` フィールドを追加し、`getAllyRange` の fragility を解消する

**Non-Goals:**
- デバフスキルの実装（Weaken 等は別チケット。システムだけ用意する）
- バフのクライアント側視覚エフェクト
- バフスタック（同種バフの効果累積）

## Decisions

### D1: StatusEffectSchema — バフ/デバフの共通データモデル

```typescript
export class StatusEffectSchema extends Schema {
  @type('string') id: string = ''            // スキルID（例: 'aura-haste'）— MapSchema のキーと同値
  @type('string') buffType: string = ''      // 効果の種類（'speed', 'attackSpeed' 等）
  @type('float32') value: number = 0         // 効果量（正=バフ、負=デバフ）
  @type('float32') remainingDuration: number = 0  // 残り持続時間（秒）
  @type('boolean') isDebuff: boolean = false  // true ならデバフ（ディスペル判定用）
}
```

**理由**: バフとデバフを同じ構造で管理。`isDebuff` フラグにより、将来のディスペルスキルが「敵のバフを消す」「味方のデバフを消す」を判定できる。`value` の正負ではなく明示的フラグにすることで、0ダメージデバフ（スロー等）も正しく分類できる。

### D2: HeroSchema に MapSchema<StatusEffectSchema> を追加

```typescript
@type({ map: StatusEffectSchema }) statusEffects = new MapSchema<StatusEffectSchema>()
```

キーは **スキルID**（例: `'aura-haste'`, `'aura-slow'`）。同じスキルの重ねがけは上書き（持続時間リフレッシュ）。異なるスキルが同じ `buffType` に影響する場合は別エントリとして共存する。

```
statusEffects: {
  'aura-haste':  { buffType: 'speed', value: +80, remainingDuration: 2.5, isDebuff: false }
  'aura-slow':   { buffType: 'speed', value: -50, remainingDuration: 1.0, isDebuff: true }
}
```

**理由**:
- スキルID キーにより、同じスキルの重複は構造的に防止、異なるスキル間の共存は自然に実現
- `@type` で自動的にクライアントに同期
- エンティティ側が保持するため、自己管理パターンに合致
- ディスペル時は `isDebuff` でフィルタして一括削除可能

**代替案**: キーを `buffType` にする → 異なるスキルが同じステータスに影響する場合（Haste + Slow）に後者が前者を上書きしてしまう。却下。

### D3: バフタイマーの自己管理

`tickBuffs(hero, dt)` 関数を新設。毎 tick:
1. `statusEffects` を走査
2. `remainingDuration -= dt`
3. 0 以下になったエントリを MapSchema から削除

`tickCooldowns` の隣に配置し、GameRoom の update ループで呼ぶ。

**理由**: エンティティ側の自己管理パターン。バフの付与元を追跡する必要がなく、エンティティ自身がタイマーを減算して期限切れを処理する。

### D4: バフの上書き挙動

同じスキルのバフを重ねがけした場合、`remainingDuration` と `value` を上書きする。MapSchema のキーがスキルID なので自然に上書きされる。異なるスキルが同じ `buffType` に影響する場合は別エントリとして共存し、効果は合算される。

**理由**: シンプルで直感的。スタック管理は不要。

### D5: 実効ステータスの計算

移動速度の例: `hero.speed + getStatusEffectValue(hero, 'speed')`

`getStatusEffectValue(hero, buffType)` ヘルパーで `statusEffects` 内の `buffType` が一致する全エントリの `value` を合算して返す（なければ 0）。

例: `{ 'aura-haste': { buffType: 'speed', value: +80 }, 'aura-slow': { buffType: 'speed', value: -50 } }` → `getStatusEffectValue(hero, 'speed')` = `+30`

**理由**: 各システム（移動、攻撃等）がバフ値を参照する際の共通パターン。バフの種類が増えても同じ関数で対応できる。複数ソースの効果を自然に合算。

### D6: SkillDefinition に range フィールドを追加

```typescript
export interface SkillDefinition {
  readonly id: string
  readonly targeting: SkillTargeting
  readonly cooldown: number
  readonly range?: number         // ally ターゲティング射程（ally スキル共通）
  readonly effect: SkillEffectParams
}
```

`getAllyRange` を `def.range ?? 0` に簡素化し、effectType に依存しなくする。既存の `aura-heal` も `SkillDefinition.range` に移行。

### D7: BuffEffectParams の設計

```typescript
export interface BuffEffectParams {
  readonly effectType: 'buff'
  readonly buffType: string       // 'speed', 'attackSpeed' 等
  readonly value: number          // 効果量
  readonly duration: number       // 持続秒数
  readonly isDebuff: boolean      // true ならデバフ
}
```

`range` は `SkillDefinition.range` に移動（D6）。`isDebuff` はスキル定義時にデバフかバフかを明示。

## Risks / Trade-offs

- **[Risk] MapSchema の同期コスト** — バフが多数重なるとネットワーク負荷 → 2v2 で同時バフ数は少ない（2-3種程度）、問題なし
- **[Risk] レベルアップ時の speed 再計算** — `xpUtils.ts` が `hero.speed` を上書きするが、バフは `statusEffects` 内の別データなので影響なし
- **[Trade-off] MapSchema vs 個別フィールド** — 個別フィールドの方がアクセスは速いが、再利用性とディスペル対応を優先
- **[Risk] バフ削除のタイミング** — `forEach` 中に `delete` すると問題が起きる可能性 → 削除対象を収集してからバッチ削除
