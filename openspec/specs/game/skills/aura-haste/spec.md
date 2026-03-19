# Specification

## Purpose
AURA ヒーローの Haste スキル仕様 — 味方に移動速度バフを付与するサポートスキル

## Requirements

### Requirement: aura-haste スキル定義
`SKILL_DEFINITIONS` に `aura-haste` を登録しなければならない（SHALL）。`targeting: 'ally'`、`cooldown: 12`、`range: 400`、`effect` は `BuffEffectParams` で `buffType: 'speed'`、`value: 80`、`duration: 3`、`isDebuff: false` でなければならない（SHALL）。

#### Scenario: aura-haste スキル定義の参照
- **WHEN** `getSkillDefinition('aura-haste')` を呼び出す
- **THEN** `targeting: 'ally'`、`cooldown: 12`、`range: 400`、`effect.effectType: 'buff'`、`effect.buffType: 'speed'`、`effect.value: 80`、`effect.duration: 3`、`effect.isDebuff: false` のスキル定義が返される

### Requirement: 味方に速度バフを適用
Haste 発動時、対象の味方ヒーローに `speed` ステータスエフェクト（値 +80、持続 3 秒）を付与しなければならない（SHALL）。射程内に味方がいない場合は自分自身を対象にフォールバックしなければならない（SHALL）。

#### Scenario: 味方に速度バフを適用
- **WHEN** AURA ヒーローが味方をターゲットに `aura-haste` を発動する
- **THEN** 味方に `speed` +80 のステータスエフェクト（持続 3 秒）が適用される

#### Scenario: 射程内に味方がいない場合の自己バフ
- **WHEN** 射程内に味方がいない状態で `aura-haste` を発動する
- **THEN** 自分自身に `speed` +80 のステータスエフェクトが適用される

#### Scenario: 持続時間リフレッシュ
- **WHEN** 既に `aura-haste` バフ（残り 1.5 秒）がある味方に再度 Haste を適用する
- **THEN** 残り持続時間が 3 秒にリフレッシュされる

### Requirement: バフ中の移動速度への反映
バフ適用中、対象ヒーローの実効移動速度は `baseSpeed + speed ステータスエフェクトの合算値` で計算されなければならない（SHALL）。

#### Scenario: バフ中の移動速度
- **WHEN** 基本速度 200 のヒーローに `speed` +80 のバフがある
- **THEN** 実効移動速度が 280 px/sec で計算される

### Requirement: バフの期限切れ
持続時間が 0 以下になったステータスエフェクトは自動的に削除されなければならない（SHALL）。

#### Scenario: バフの期限切れ
- **WHEN** `aura-haste` バフの残り持続時間が 0 以下になる
- **THEN** ステータスエフェクトが削除され、移動速度が基本値に戻る

### Requirement: Haste クールダウン
発動成功後、スキルのクールダウンは 12 秒に設定されなければならない（SHALL）。

#### Scenario: 発動後にクールダウンが適用される
- **WHEN** `aura-haste` が発動に成功する
- **THEN** スキルスロットのクールダウンが 12 に設定される
