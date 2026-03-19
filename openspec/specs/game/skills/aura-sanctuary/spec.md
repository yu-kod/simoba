# Specification

## Purpose
AURA ヒーローの Sanctuary スキル仕様 — キャスターに追従するゾーンで味方にダメージ軽減と定期回復を提供する

## Requirements

### Requirement: Sanctuary スキル定義
システムは `SKILL_DEFINITIONS` に `aura-sanctuary` を登録しなければならない（SHALL）。`targeting: 'self'`、`effectType: 'zone'`、`cooldown: 20`、`zoneRadius: 160`、`zoneDuration: 5`、`tickHeal: 15`、`tickInterval: 1.0`、`followCaster: true`。

#### Scenario: スキル定義が登録されている
- **WHEN** `getSkillDefinition('aura-sanctuary')` が呼ばれる
- **THEN** `effectType: 'zone'`、`cooldown: 20`、`zoneRadius: 160`、`zoneDuration: 5` を持つ有効な `SkillDefinition` が返される

### Requirement: Sanctuary は発動時にキャスター追従ゾーンを生成する
AURA ヒーローが `aura-sanctuary` を発動すると、サーバーはキャスターの位置を中心にゾーンを生成し、`followHeroId` をキャスターのセッション ID に設定しなければならない（SHALL）。ゾーンは毎ティックキャスターに追従する。

#### Scenario: キャスター位置にゾーンが生成される
- **WHEN** 位置 (400, 300) の AURA ヒーローが `aura-sanctuary` を発動する
- **THEN** `x: 400`、`y: 300`、`radius: 160`、`followHeroId` がキャスターのセッション ID、`remainingDuration: 5` のゾーンが生成される

#### Scenario: ゾーンがキャスターの移動に追従する
- **WHEN** キャスターが Sanctuary 中に (400, 300) から (500, 350) に移動する
- **THEN** ゾーンの座標が毎ティック (500, 350) に更新される

### Requirement: Sanctuary は範囲内の味方にダメージ軽減を適用する
ゾーンは範囲内のすべての味方ヒーローに `damageReduction` ステータスエフェクト（`value: 0.25`）を適用しなければならない（SHALL）。効果は範囲内にいる間リフレッシュされ、離脱後 `ZONE_EFFECT_DURATION` で消滅する。

#### Scenario: 味方がダメージ軽減を受ける
- **WHEN** 味方ヒーローが Sanctuary ゾーン中心から 160px 以内にいる
- **THEN** 味方は `value: 0.25` の `damageReduction` ステータスエフェクトを持つ

#### Scenario: ゾーン離脱後にダメージ軽減が消滅する
- **WHEN** 味方ヒーローがゾーン半径外に移動する
- **THEN** `damageReduction` ステータスエフェクトは `ZONE_EFFECT_DURATION`（0.1秒）以内に消滅する

#### Scenario: 敵はダメージ軽減の影響を受けない
- **WHEN** 敵ヒーローが Sanctuary ゾーン半径内にいる
- **THEN** 敵はゾーンからステータスエフェクトを受けない（SHALL NOT）

### Requirement: Sanctuary は味方を定期的に回復する
ゾーンは範囲内のすべての味方ヒーローを `tickInterval` ごとに `tickHeal` HP 回復しなければならない（SHALL）。回復は `maxHp` を超えない（SHALL NOT）。

#### Scenario: 味方がティック回復を受ける
- **WHEN** 味方ヒーローがゾーン中心から 160px 以内にいて、最後のティックから 1.0 秒が経過する
- **THEN** 味方は 15 HP 回復する（maxHp 上限）

#### Scenario: 回復は maxHp を超えない
- **WHEN** HP 645/650 の味方ヒーローが回復ティック時に Sanctuary ゾーン内にいる
- **THEN** 味方の HP は 650 に設定される（660 ではない）

#### Scenario: 複数の味方が同時に回復される
- **WHEN** 回復ティック時に 2 人の味方ヒーローがゾーン半径内にいる
- **THEN** 両方の味方がそれぞれ 15 HP 回復する

#### Scenario: 全持続時間での合計回復量
- **WHEN** 味方が Sanctuary ゾーン内に 5 秒間の全持続時間とどまる
- **THEN** 味方は合計約 75 の回復を受ける（15 HP × 5 ティック、1.0 秒間隔）

#### Scenario: 敵は回復されない
- **WHEN** 回復ティック時に敵ヒーローが Sanctuary ゾーン半径内にいる
- **THEN** 敵は回復を受けない（SHALL NOT）

### Requirement: Sanctuary ゾーンはキャスター死亡時に削除される
キャスターが Sanctuary アクティブ中に死亡した場合、ゾーンは即座に削除されなければならない（SHALL）。

#### Scenario: Sanctuary 中にキャスターが死亡する
- **WHEN** Sanctuary ゾーンがアクティブな状態でキャスターの HP が 0 になる
- **THEN** ゾーンは同ティックで削除される

### Requirement: Sanctuary はダッシュ中にブロックされる
キャスターが現在ダッシュ中の場合、Sanctuary の発動は拒否されなければならない（SHALL）。

#### Scenario: ダッシュ中に発動が拒否される
- **WHEN** `dashTimer > 0` のヒーローが `aura-sanctuary` を発動しようとする
- **THEN** 発動は null を返し、ゾーンは生成されない

### Requirement: Sanctuary クールダウン
発動成功後、スキルのクールダウンは 20 秒に設定されなければならない（SHALL）。

#### Scenario: 発動後にクールダウンが適用される
- **WHEN** `aura-sanctuary` がスロット Q で発動に成功する
- **THEN** キャスターの `cooldownQ` が 20 に設定される

### Requirement: Sanctuary ゾーンのビジュアル
クライアントは `ZONE_VISUALS` で青ゴールドのカラースキームで Sanctuary ゾーンをレンダリングしなければならない（SHALL）。ゾーンはすべてのプレイヤーに表示される。

#### Scenario: ゾーンがすべてのプレイヤーに表示される
- **WHEN** Sanctuary ゾーンがアクティブである
- **THEN** 味方・敵の両プレイヤーがゾーンを塗りつぶし円＋ボーダーとして見ることができる

### Requirement: Sanctuary はキャスターにデバフを適用しない
Whirlwind とは異なり、Sanctuary はキャスターにデバフを適用しない（SHALL NOT）。キャスターはゾーン持続時間中フル移動速度を維持する。

#### Scenario: 発動時にセルフスローが発生しない
- **WHEN** AURA ヒーローが `aura-sanctuary` を発動する
- **THEN** キャスターに新しいデバフステータスエフェクトは適用されない（SHALL NOT）
