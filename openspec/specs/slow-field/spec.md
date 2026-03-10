## ADDED Requirements

### Requirement: ZoneEffectParams 型定義
`SkillEffectParams` 判別共用体に `ZoneEffectParams` を追加しなければならない（SHALL）。`ZoneEffectParams` は `effectType: 'zone'`、`zoneRadius: number`（ゾーン半径 px）、`zoneDuration: number`（持続時間秒）、`zoneEffect: { buffType: string, value: number, isDebuff: boolean, target: 'enemy' | 'ally' | 'all' }` を持たなければならない（SHALL）。

#### Scenario: ZoneEffectParams の型識別
- **WHEN** `effectType === 'zone'` の `SkillEffectParams` を判定する
- **THEN** `zoneRadius`, `zoneDuration`, `zoneEffect` フィールドにアクセスできる

### Requirement: aura-slow-field スキル定義
`SKILL_DEFINITIONS` に `aura-slow-field` エントリを追加しなければならない（SHALL）。`targeting` は `'point'` でなければならない（SHALL）。`cooldown` は `14` 秒でなければならない（SHALL）。`range` は `600` でなければならない（SHALL）。`effect.effectType` は `'zone'` でなければならない（SHALL）。`effect.zoneRadius` は `200`、`effect.zoneDuration` は `4`、`effect.zoneEffect.buffType` は `'speed'`、`effect.zoneEffect.value` は `-60`、`effect.zoneEffect.isDebuff` は `true`、`effect.zoneEffect.target` は `'enemy'` でなければならない（SHALL）。

#### Scenario: aura-slow-field 定義の参照
- **WHEN** `getSkillDefinition('aura-slow-field')` を呼び出す
- **THEN** 上記すべてのパラメータが正しく返される

### Requirement: ZoneSchema
`ZoneSchema` Colyseus スキーマを新規作成しなければならない（SHALL）。フィールド: `x: float32`, `y: float32`, `radius: float32`, `remainingDuration: float32`, `team: string`, `casterId: string`, `skillId: string` を持たなければならない（SHALL）。

#### Scenario: ZoneSchema のインスタンス生成
- **WHEN** `new ZoneSchema()` を生成し各フィールドを設定する
- **THEN** すべてのフィールドが正しく保持される

### Requirement: GameRoomState にゾーン MapSchema を追加
`GameRoomState` に `zones: MapSchema<ZoneSchema>` を追加しなければならない（SHALL）。

#### Scenario: GameRoomState のゾーン管理
- **WHEN** `GameRoomState` を生成する
- **THEN** `zones` が空の `MapSchema` として存在する

### Requirement: zoneEffectHandler
`effectType: 'zone'` に対応する `SkillEffectHandler` を実装しなければならない（SHALL）。ハンドラーは `ZoneSchema` を生成し、`ctx.targetPosition` の座標にゾーンを配置し、ゾーン MapSchema に追加しなければならない（SHALL）。

#### Scenario: ゾーンの生成
- **WHEN** `zoneEffectHandler.execute()` が呼ばれる
- **THEN** 新しい `ZoneSchema` が生成され、`targetPosition` の座標に配置される
- **AND** ゾーンの `team`, `casterId`, `skillId`, `radius`, `remainingDuration` が正しく設定される

### Requirement: ハンドラー登録
`registerAllEffectHandlers` で `zoneEffectHandler` を登録しなければならない（SHALL）。

#### Scenario: zone ハンドラーが登録されている
- **WHEN** `registerAllEffectHandlers()` が呼ばれた後に `getEffectHandler('zone')` を呼ぶ
- **THEN** `zoneEffectHandler` が返される

### Requirement: ServerZoneSystem — 毎フレームティック
`tickZones(zones, heroes, dt)` 関数を実装しなければならない（SHALL）。この関数は毎フレーム呼ばれ、以下を処理しなければならない（SHALL）:
1. 各ゾーンの `remainingDuration` を `dt` 減算する
2. `remainingDuration <= 0` のゾーンを削除する
3. 存続中のゾーンについて、範囲内の対象ヒーローに StatusEffect を適用する

#### Scenario: ゾーンの持続時間管理
- **WHEN** ゾーンの `remainingDuration` が `dt` 以下になる
- **THEN** そのゾーンが `zones` MapSchema から削除される

#### Scenario: 範囲内の敵に移動速度デバフ
- **WHEN** `target: 'enemy'` のゾーン内に敵チームのヒーローがいる
- **THEN** そのヒーローに `buffType: 'speed'`, `value: -60` の StatusEffect が適用される
- **AND** `remainingDuration` は `0.1` にセットされる（毎フレーム上書き）

#### Scenario: 範囲外のヒーローには効果なし
- **WHEN** ヒーローがゾーンの `radius` より遠くにいる
- **THEN** そのヒーローには StatusEffect が適用されない

#### Scenario: 味方には効果なし（enemy ターゲット時）
- **WHEN** `target: 'enemy'` のゾーン内にキャスターと同じチームのヒーローがいる
- **THEN** そのヒーローには StatusEffect が適用されない

#### Scenario: 死亡ヒーローは対象外
- **WHEN** ゾーン内に死亡したヒーローがいる
- **THEN** そのヒーローには StatusEffect が適用されない

### Requirement: SkillExecutionContext にゾーン参照を追加
`SkillExecutionContext` に `zones: MapSchema<ZoneSchema>` を追加しなければならない（SHALL）。`zoneEffectHandler` がゾーンを追加できるようにするため。

#### Scenario: ゾーン参照がコンテキストに含まれる
- **WHEN** `executeSkill` が呼ばれる
- **THEN** `SkillExecutionContext.zones` に `GameRoomState.zones` が渡される
