## Context

スキルシステムは判別共用体 `SkillEffectParams` + `SkillEffectHandler` パターンで拡張される。既存の effectType は `dash`, `projectile`, `heal`, `buff` の4種。Nova は5番目の effectType `aoe` を追加する。

`targeting: 'point'` は `SkillTargeting` に定義済みだが、まだどのスキルにも使われていない。`executeSkill` は `targetPosition` を既にコンテキストに渡しているため、point ターゲティングは追加コード不要で動作する。

## Goals / Non-Goals

**Goals:**
- `effectType: 'aoe'` の瞬発型ハンドラーを実装する
- 指定地点中心の範囲内で敵ダメージ + 味方回復を同時に処理する
- `aura-nova` スキル定義を追加する

**Non-Goals:**
- 持続型 AoE（tick ダメージ）のフレームワーク
- 範囲視覚エフェクト（円形インジケーター等）
- ミニオン・タワーへの AoE 効果（ヒーローのみ対象）

## Decisions

### Decision 1: AoE はヒーローのみ対象

**選択:** AoE のダメージ/回復対象はヒーローのみ。ミニオン・タワーは含めない。

**理由:**
- `SkillExecutionContext` は `heroes: MapSchema<HeroSchema>` を持つが、ミニオン・タワーの参照はない
- Nova はサポートスキルであり、対ヒーロー戦での活用が主目的
- ミニオン・タワーへの拡張は将来 context に追加すれば対応可能

**代替案:** context にミニオン・タワーを追加 → スコープ肥大。Phase 1 では不要。

### Decision 2: `applyHeal` と `applyDamage` を直接呼ぶ

**選択:** `HeroSchema.applyHeal()` と `HeroSchema.applyDamage()` を直接使用。`applyDamageToTarget` は使わない。

**理由:**
- AoE は heroes MapSchema をイテレートして対象を直接取得済み
- `applyDamageToTarget` は ID ベースの lookup が目的で、既にヒーロー参照がある場合は冗長
- `applyDamage` は HP クランプと dead フラグ管理を内包

### Decision 3: `lastAttackerSessionId` を AoE ダメージでもセットする

**選択:** AoE でダメージを与えた敵ヒーローに `lastAttackerSessionId = casterId` をセットする。

**理由:** キル XP 配分のため。通常攻撃と同じルール。

### Decision 4: `CombatEventMessage` は返さない（Phase 1）

**選択:** AoE ハンドラーは `void` を返す（他のハンドラーと同様）。ダメージ/回復イベントのブロードキャストは行わない。

**理由:** 既存の `SkillEffectHandler.execute()` は `void` 返り。イベントブロードキャストは将来の課題。

## Risks / Trade-offs

- **[範囲バランス]** AoE 半径と damage/heal 値はバランス調整が必要 → 定数テーブルで管理し、後で調整可能にする
- **[自己回復]** キャスター自身が範囲内にいる場合の処理 → キャスターも味方として回復対象に含める（自然な動作）
