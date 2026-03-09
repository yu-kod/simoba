# Specification

## Purpose

オーラヒールスキル — 味方ヒーローまたは自分自身を回復するスキルの定義、エフェクトハンドラ、回復ロジックを担う。

## Requirements

### Requirement: HealEffectParams 定義
`shared/skills/skillDefinitions.ts` に `HealEffectParams` インターフェースを追加しなければならない（SHALL）。`effectType: 'heal'`、`healAmount: number`（回復量）、`range: number`（味方選択射程 px）を持たなければならない（SHALL）。`SkillEffectParams` 共用体に `HealEffectParams` を追加しなければならない（SHALL）。

#### Scenario: HealEffectParams の型定義
- **WHEN** `HealEffectParams` を定義する
- **THEN** `effectType` が `'heal'`、`healAmount` が `number`、`range` が `number` のプロパティを持つ

#### Scenario: SkillEffectParams 共用体の拡張
- **WHEN** `SkillEffectParams` 型を参照する
- **THEN** `DashEffectParams | ProjectileEffectParams | HealEffectParams` の共用体である

### Requirement: aura-heal スキル定義
`SKILL_DEFINITIONS` に `aura-heal` エントリを追加しなければならない（SHALL）。`targeting` は `'ally'`、`cooldown` は `10` 秒、`effect` は `HealEffectParams` で `healAmount: 120`、`range: 400` でなければならない（SHALL）。

#### Scenario: aura-heal スキル定義の参照
- **WHEN** `getSkillDefinition('aura-heal')` を呼び出す
- **THEN** `targeting: 'ally'`、`cooldown: 10`、`effect.effectType: 'heal'`、`effect.healAmount: 120`、`effect.range: 400` のスキル定義が返される

### Requirement: healEffectHandler
サーバーに `healEffectHandler` を実装しなければならない（SHALL）。`effectType: 'heal'` として効果ハンドラレジストリに登録しなければならない（SHALL）。実行時に `ctx.targetHero` の HP を `params.healAmount` 分回復しなければならない（SHALL）。`ctx.targetHero` が存在しない場合は `ctx.hero`（自分自身）を回復しなければならない（SHALL）。

#### Scenario: 味方ヒーローの回復
- **WHEN** `targetHero` がHP 200/500 の味方で、`healAmount: 120` で実行する
- **THEN** `targetHero` の HP が 320 になる

#### Scenario: 自己回復フォールバック
- **WHEN** `targetHero` が undefined で、自分のHPが 300/500 で `healAmount: 120` で実行する
- **THEN** 自分の HP が 420 になる

#### Scenario: maxHp を超えない回復
- **WHEN** 対象のHPが 450/500 で `healAmount: 120` で実行する
- **THEN** 対象の HP が 500 になる（maxHp でクランプ）

### Requirement: CombatEntitySchema.applyHeal
`CombatEntitySchema` に `applyHeal(amount: number)` メソッドを追加しなければならない（SHALL）。HP を `amount` 分増加させ、`maxHp` を超えないようクランプしなければならない（SHALL）。`dead` 状態のエンティティに対しては何もしてはならない（SHALL）。

#### Scenario: 通常の回復
- **WHEN** HP 200、maxHp 500 のエンティティに `applyHeal(100)` を呼ぶ
- **THEN** HP が 300 になる

#### Scenario: maxHp クランプ
- **WHEN** HP 480、maxHp 500 のエンティティに `applyHeal(100)` を呼ぶ
- **THEN** HP が 500 になる

#### Scenario: 死亡エンティティへの回復は無効
- **WHEN** `dead: true` のエンティティに `applyHeal(100)` を呼ぶ
- **THEN** HP は変化しない
