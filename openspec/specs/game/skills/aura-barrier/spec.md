# Specification

## Purpose
AURA ヒーローの Barrier スキル仕様 — 指定地点にダメージ軽減ゾーンを設置し味方を保護する

## Requirements

### Requirement: Barrier スキル定義
システムは `SKILL_DEFINITIONS` に `aura-barrier` を登録しなければならない（SHALL）。`targeting: 'point'`、`effectType: 'zone'`、`cooldown: 14`、`range: 500`、`zoneRadius: 180`、`zoneDuration: 4`。

#### Scenario: スキル定義が登録されている
- **WHEN** `getSkillDefinition('aura-barrier')` が呼ばれる
- **THEN** `effectType: 'zone'`、`cooldown: 14`、`zoneRadius: 180`、`zoneDuration: 4` を持つ有効な `SkillDefinition` が返される

### Requirement: Barrier はターゲット位置に固定ゾーンを生成する
AURA ヒーローが `aura-barrier` を発動すると、サーバーはターゲット位置にゾーンを生成しなければならない（SHALL）。ゾーンはキャスターに追従しない（SHALL NOT）。

#### Scenario: ターゲット位置にゾーンが生成される
- **WHEN** AURA ヒーローが位置 (600, 400) をターゲットに `aura-barrier` を発動する
- **THEN** `x: 600`、`y: 400`、`radius: 180`、`remainingDuration: 4`、`followHeroId: ''` のゾーンが生成される

### Requirement: Barrier は範囲内の味方にダメージ軽減を適用する
ゾーンは範囲内のすべての味方ヒーローに `damageReduction` ステータスエフェクト（`value: 0.30`）を適用しなければならない（SHALL）。効果は範囲内にいる間リフレッシュされ、離脱後まもなく消滅する。

#### Scenario: 味方がダメージ軽減を受ける
- **WHEN** 味方ヒーローが Barrier ゾーン中心から 180px 以内にいる
- **THEN** 味方は `value: 0.30` の `damageReduction` ステータスエフェクトを持つ

#### Scenario: 敵は影響を受けない
- **WHEN** 敵ヒーローが Barrier ゾーン半径内にいる
- **THEN** 敵はゾーンからステータスエフェクトを受けない（SHALL NOT）

#### Scenario: ゾーン離脱後にエフェクトが消滅する
- **WHEN** 味方ヒーローがゾーン半径外に移動する
- **THEN** `damageReduction` エフェクトは `ZONE_EFFECT_DURATION`（0.1秒）以内に消滅する

### Requirement: Barrier クールダウン
発動成功後、スキルのクールダウンは 14 秒に設定されなければならない（SHALL）。

#### Scenario: 発動後にクールダウンが適用される
- **WHEN** `aura-barrier` がスロット Q で発動に成功する
- **THEN** キャスターの `cooldownQ` が 14 に設定される

### Requirement: Barrier はダッシュ中にブロックされる
キャスターが現在ダッシュ中の場合、Barrier の発動は拒否されなければならない（SHALL）。

#### Scenario: ダッシュ中に発動が拒否される
- **WHEN** `dashTimer > 0` のヒーローが `aura-barrier` を発動しようとする
- **THEN** 発動は null を返し、ゾーンは生成されない

### Requirement: Barrier ゾーンのビジュアル
クライアントは `ZONE_VISUALS` で緑シアンのカラースキームで Barrier ゾーンをレンダリングしなければならない（SHALL）。ゾーンはすべてのプレイヤーに表示される。

#### Scenario: ゾーンがすべてのプレイヤーに表示される
- **WHEN** Barrier ゾーンがアクティブである
- **THEN** 味方・敵の両プレイヤーがゾーンを塗りつぶし円＋ボーダーとして見ることができる

### Requirement: Barrier ゾーンは持続時間後に消滅する
ゾーンは持続時間満了後（4秒）に削除されなければならない（SHALL）。

#### Scenario: 持続時間後にゾーンが削除される
- **WHEN** Barrier 設置から 4 秒が経過する
- **THEN** ゾーンが削除される
