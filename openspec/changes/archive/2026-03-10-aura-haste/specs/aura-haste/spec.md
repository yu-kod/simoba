## ADDED Requirements

### Requirement: StatusEffectSchema データモデル
`server/src/schema/StatusEffectSchema.ts` に `StatusEffectSchema` クラスを新規作成しなければならない（SHALL）。`id: string`（スキルID、MapSchema のキーと同値）、`buffType: string`（効果種別）、`value: float32`（効果量）、`remainingDuration: float32`（残り秒数）、`isDebuff: boolean`（デバフフラグ）を `@type` デコレータ付きで持たなければならない（SHALL）。

#### Scenario: StatusEffectSchema のフィールド
- **WHEN** `StatusEffectSchema` のインスタンスを生成する
- **THEN** `id`, `buffType`, `value`, `remainingDuration`, `isDebuff` の各フィールドが存在し、初期値はそれぞれ `''`, `''`, `0`, `0`, `false` である

### Requirement: HeroSchema に statusEffects を追加
`HeroSchema` に `statusEffects: MapSchema<StatusEffectSchema>` フィールドを `@type({ map: StatusEffectSchema })` で追加しなければならない（SHALL）。キーはスキルID（例: `'aura-haste'`）でなければならない（SHALL）。クライアントに同期されなければならない（SHALL）。

#### Scenario: 初期状態
- **WHEN** ヒーローが生成される
- **THEN** `statusEffects` が空の MapSchema である

#### Scenario: 異なるスキルが同じ buffType に影響する場合の共存
- **WHEN** `aura-haste`（`buffType: 'speed'`, `value: +80`）と `aura-slow`（`buffType: 'speed'`, `value: -50`）が同時に付与されている
- **THEN** `statusEffects` に `'aura-haste'` と `'aura-slow'` の2エントリが別々に存在する

### Requirement: BuffEffectParams 定義
`shared/skills/skillDefinitions.ts` に `BuffEffectParams` インターフェースを追加しなければならない（SHALL）。`effectType: 'buff'`、`buffType: string`（効果種別）、`value: number`（効果量）、`duration: number`（持続秒数）、`isDebuff: boolean`（デバフフラグ）を持たなければならない（SHALL）。`SkillEffectParams` 共用体に `BuffEffectParams` を追加しなければならない（SHALL）。

#### Scenario: BuffEffectParams の型定義
- **WHEN** `BuffEffectParams` を定義する
- **THEN** `effectType`, `buffType`, `value`, `duration`, `isDebuff` のプロパティを持つ

#### Scenario: SkillEffectParams 共用体の拡張
- **WHEN** `SkillEffectParams` 型を参照する
- **THEN** `DashEffectParams | ProjectileEffectParams | HealEffectParams | BuffEffectParams` の共用体である

### Requirement: aura-haste スキル定義
`SKILL_DEFINITIONS` に `aura-haste` エントリを追加しなければならない（SHALL）。`targeting: 'ally'`、`cooldown: 12`、`range: 400`、`effect` は `BuffEffectParams` で `buffType: 'speed'`、`value: 80`、`duration: 3`、`isDebuff: false` でなければならない（SHALL）。

#### Scenario: aura-haste スキル定義の参照
- **WHEN** `getSkillDefinition('aura-haste')` を呼び出す
- **THEN** `targeting: 'ally'`、`cooldown: 12`、`range: 400`、`effect.effectType: 'buff'`、`effect.buffType: 'speed'`、`effect.value: 80`、`effect.duration: 3`、`effect.isDebuff: false` のスキル定義が返される

### Requirement: buffEffectHandler
サーバーに `buffEffectHandler` を実装しなければならない（SHALL）。`effectType: 'buff'` として効果ハンドラレジストリに登録しなければならない（SHALL）。実行時に対象ヒーロー（`ctx.targetHero ?? ctx.hero`）の `statusEffects` にスキルIDをキーとして `StatusEffectSchema` を追加しなければならない（SHALL）。同じスキルIDのエントリが既に存在する場合は `remainingDuration` と `value` を上書きしなければならない（SHALL）。

#### Scenario: 味方に速度バフを適用
- **WHEN** スキルID `aura-haste` で `targetHero` が味方、`buffType: 'speed'`、`value: 80`、`duration: 3` で実行する
- **THEN** `targetHero.statusEffects.get('aura-haste')` に `buffType: 'speed'`、`value: 80`、`remainingDuration: 3`、`isDebuff: false` が設定される

#### Scenario: 自己バフフォールバック
- **WHEN** `targetHero` が undefined で実行する
- **THEN** 自分の `statusEffects` に同エントリが追加される

#### Scenario: 同じスキルの持続時間リフレッシュ
- **WHEN** 既に `aura-haste` エントリ（`remainingDuration: 1.5`）がある状態で同じスキルを再度適用する
- **THEN** `remainingDuration` が 3 に更新される

### Requirement: バフタイマー自己管理
サーバーは毎 tick、各ヒーローの `statusEffects` を走査し、`remainingDuration` を deltaSeconds 分減算しなければならない（SHALL）。0 以下になったエントリは `statusEffects` から削除しなければならない（SHALL）。

#### Scenario: バフタイマーの減算
- **WHEN** `aura-haste` エントリの `remainingDuration` が 3.0 の状態で 0.1 秒経過する
- **THEN** `remainingDuration` が 2.9 になる

#### Scenario: バフの期限切れ削除
- **WHEN** `aura-haste` エントリの `remainingDuration` が 0.05 の状態で 0.1 秒経過する
- **THEN** `statusEffects` から `aura-haste` エントリが削除される

### Requirement: getStatusEffectValue ヘルパー
`getStatusEffectValue(hero, buffType)` 関数を提供しなければならない（SHALL）。`statusEffects` 内の `buffType` が一致する全エントリの `value` を合算して返さなければならない（SHALL）。該当エントリが存在しなければ 0 を返さなければならない（SHALL）。

#### Scenario: 単一バフの値取得
- **WHEN** `aura-haste`（`buffType: 'speed'`, `value: 80`）のみがある状態で `getStatusEffectValue(hero, 'speed')` を呼ぶ
- **THEN** 80 が返される

#### Scenario: 複数ソースの合算
- **WHEN** `aura-haste`（`buffType: 'speed'`, `value: +80`）と `aura-slow`（`buffType: 'speed'`, `value: -50`）がある状態で `getStatusEffectValue(hero, 'speed')` を呼ぶ
- **THEN** 30 が返される

#### Scenario: バフなしの取得
- **WHEN** バフがない状態で `getStatusEffectValue(hero, 'speed')` を呼ぶ
- **THEN** 0 が返される

### Requirement: 移動速度へのバフ反映
`ServerMovementSystem` でヒーローの移動速度を計算する際、`hero.speed + getStatusEffectValue(hero, 'speed')` を実効速度として使用しなければならない（SHALL）。

#### Scenario: バフ中の移動速度
- **WHEN** `hero.speed` が 200、`speed` バフの合算値が 80 の状態で移動する
- **THEN** 実効移動速度が 280 px/sec で計算される
