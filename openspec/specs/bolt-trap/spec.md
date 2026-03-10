## ADDED Requirements

### Requirement: ZoneEffectParams にトリガーフィールド追加
`ZoneEffectParams` に `triggerDamage?: number`（トリガー時ダメージ、デフォルト 0）と `triggerOnce?: boolean`（1回トリガーで消滅、デフォルト false）を追加しなければならない（SHALL）。`zoneEffect` に `duration?: number`（デバフ持続時間秒、トリガー式で使用）を追加しなければならない（SHALL）。

#### Scenario: トリガーフィールドの型アクセス
- **WHEN** `effectType === 'zone'` の `SkillEffectParams` で `triggerDamage` と `triggerOnce` にアクセスする
- **THEN** それぞれ `number | undefined` と `boolean | undefined` として取得できる

### Requirement: bolt-trap スキル定義
`SKILL_DEFINITIONS` に `bolt-trap` エントリを追加しなければならない（SHALL）。`targeting` は `'point'`、`cooldown` は `10`、`range` は `500`、`effect.effectType` は `'zone'`、`effect.zoneRadius` は `80`、`effect.zoneDuration` は `30`（設置持続時間）、`effect.triggerDamage` は `70`、`effect.triggerOnce` は `true`、`effect.zoneEffect.buffType` は `'speed'`、`effect.zoneEffect.value` は `-50`、`effect.zoneEffect.isDebuff` は `true`、`effect.zoneEffect.target` は `'enemy'`、`effect.zoneEffect.duration` は `2` でなければならない（SHALL）。

#### Scenario: bolt-trap 定義の参照
- **WHEN** `getSkillDefinition('bolt-trap')` を呼び出す
- **THEN** 上記すべてのパラメータが正しく返される

### Requirement: ZoneSchema にトリガーフィールド追加
`ZoneSchema` に `triggerDamage: float32`（デフォルト 0）と `triggerOnce: boolean`（デフォルト false）と `effectDuration: float32`（デフォルト 0）を追加しなければならない（SHALL）。

#### Scenario: ZoneSchema のトリガーフィールド
- **WHEN** ZoneSchema を生成し `triggerDamage`, `triggerOnce`, `effectDuration` を設定する
- **THEN** 値が正しく保持される

### Requirement: zoneEffectHandler のトリガーフィールド転写
`zoneEffectHandler` は `ZoneEffectParams` の `triggerDamage`, `triggerOnce`, `zoneEffect.duration` を `ZoneSchema` の対応するフィールドに転写しなければならない（SHALL）。

#### Scenario: Trap ゾーン生成時のフィールド設定
- **WHEN** `bolt-trap` のスキルが発動される
- **THEN** 生成された ZoneSchema の `triggerDamage` が `70`、`triggerOnce` が `true`、`effectDuration` が `2` である

### Requirement: トリガー式ゾーンの動作
`tickZones` で `triggerDamage > 0` のゾーン内に対象ヒーローが入った場合、そのヒーローに `triggerDamage` のダメージを適用し、`lastAttackerSessionId` をキャスター ID にセットしなければならない（SHALL）。デバフは `effectDuration` の持続時間で適用しなければならない（SHALL）。`triggerOnce` が `true` の場合、トリガー後にゾーンを即座に削除しなければならない（SHALL）。

#### Scenario: 敵が Trap を踏む
- **WHEN** 敵ヒーローが `triggerOnce: true` の Trap ゾーン内に入る
- **THEN** 敵に `triggerDamage` のダメージが適用される
- **AND** 敵に `effectDuration` 秒のスローデバフが適用される
- **AND** `lastAttackerSessionId` がキャスター ID にセットされる
- **AND** ゾーンが削除される

#### Scenario: 味方は Trap を踏まない
- **WHEN** キャスターと同チームのヒーローが Trap ゾーン内に入る
- **THEN** ダメージもデバフも適用されない
- **AND** ゾーンは残存する

#### Scenario: 死亡ヒーローは Trap をトリガーしない
- **WHEN** 死亡した敵ヒーローが Trap ゾーン内にいる
- **THEN** ダメージもデバフも適用されない
- **AND** ゾーンは残存する
