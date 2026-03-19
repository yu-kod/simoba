# Specification

## Purpose
AURA ヒーローの Nova スキル仕様 — 指定地点に AoE 効果を発生させ、敵にダメージ・味方に回復を与える

## Requirements

### Requirement: AoEEffectParams 型定義
`SkillEffectParams` 判別共用体に `AoEEffectParams` を追加しなければならない（SHALL）。`AoEEffectParams` は `effectType: 'aoe'`、`damage: number`（敵へのダメージ量）、`healAmount: number`（味方への回復量）、`radius: number`（効果半径 px）を持たなければならない（SHALL）。

#### Scenario: AoEEffectParams の型識別
- **WHEN** `effectType === 'aoe'` の `SkillEffectParams` を判定する
- **THEN** `damage`, `healAmount`, `radius` フィールドにアクセスできる

### Requirement: aura-nova スキル定義
`SKILL_DEFINITIONS` に `aura-nova` エントリを追加しなければならない（SHALL）。`targeting` は `'point'` でなければならない（SHALL）。`cooldown` は `16` 秒でなければならない（SHALL）。`effect.effectType` は `'aoe'` でなければならない（SHALL）。`effect.damage` は `80`、`effect.healAmount` は `60`、`effect.radius` は `200` でなければならない（SHALL）。

#### Scenario: aura-nova 定義の参照
- **WHEN** `getSkillDefinition('aura-nova')` を呼び出す
- **THEN** `targeting: 'point'`, `cooldown: 16`, `effect.effectType: 'aoe'`, `effect.damage: 80`, `effect.healAmount: 60`, `effect.radius: 200` が返される

### Requirement: AoE エフェクトハンドラー
`effectType: 'aoe'` に対応する `SkillEffectHandler` を実装しなければならない（SHALL）。ハンドラーは `ctx.targetPosition` を中心に `params.radius` 以内のヒーローを検索しなければならない（SHALL）。

#### Scenario: 範囲内の敵にダメージ
- **WHEN** AoE が発動し、`targetPosition` から `radius` 以内に敵チームのヒーローがいる
- **THEN** そのヒーローに `params.damage` のダメージが適用される

#### Scenario: 範囲内の味方に回復
- **WHEN** AoE が発動し、`targetPosition` から `radius` 以内に同チームのヒーロー（キャスター含む）がいる
- **THEN** そのヒーローに `params.healAmount` の回復が適用される

#### Scenario: 範囲外のヒーローには効果なし
- **WHEN** AoE が発動し、ヒーローが `targetPosition` から `radius` より遠くにいる
- **THEN** そのヒーローにはダメージも回復も適用されない

#### Scenario: 死亡ヒーローは対象外
- **WHEN** AoE が発動し、範囲内に死亡したヒーローがいる
- **THEN** そのヒーローにはダメージも回復も適用されない

### Requirement: AoE ダメージでキル XP 帰属を記録
AoE でダメージを与えた敵ヒーローに `lastAttackerSessionId` をキャスターのセッション ID にセットしなければならない（SHALL）。

#### Scenario: AoE ダメージ後のキルクレジット
- **WHEN** AoE ダメージで敵ヒーローの HP が 0 になる
- **THEN** そのヒーローの `lastAttackerSessionId` がキャスターの ID になっている

### Requirement: ハンドラー登録
`registerAllEffectHandlers` で `aoeEffectHandler` を登録しなければならない（SHALL）。

#### Scenario: AoE ハンドラーが登録されている
- **WHEN** `registerAllEffectHandlers()` が呼ばれた後に `getEffectHandler('aoe')` を呼ぶ
- **THEN** `aoeEffectHandler` が返される

### Requirement: point ターゲティングの動作
`targeting: 'point'` のスキルは、クリック座標をそのまま `targetPosition` として `SkillExecutionContext` に渡さなければならない（SHALL）。特別なターゲット解決（ally/enemy のようなヒーロー検索）は行わない（SHALL NOT）。

#### Scenario: point ターゲティングで targetPosition が設定される
- **WHEN** `targeting: 'point'` のスキル `aura-nova` を `target: { x: 500, y: 300 }` で発動する
- **THEN** `SkillExecutionContext.targetPosition` が `{ x: 500, y: 300 }` になる
