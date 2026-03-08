# Specification

## Purpose

BOLT ヒーローの Dash スキル — 方向指定の短距離瞬間移動。ダメージなしの純粋な機動スキルで、リポジショニング・離脱に使用する。

## ADDED Requirements

### Requirement: Dash スキル定義
BOLT ヒーローのスキル `bolt-dash` は以下のパラメータで定義されなければならない（SHALL）：targeting = `'direction'`、effectType = `'dash'`、damage = 0、cooldown・distance・duration はバランス定数テーブルで管理しなければならない（SHALL）。

#### Scenario: Dash のメタデータ取得
- **WHEN** スキルID `bolt-dash` のメタデータを参照する
- **THEN** targeting が `'direction'`、effectType が `'dash'`、damage が 0 で定義されている

### Requirement: Dash 瞬間移動
サーバーは Dash 発動時、ヒーローをターゲット方向に向かって `distance` 分だけ `duration` 秒かけて直線移動させなければならない（SHALL）。duration は BLADE Charge より大幅に短く、ほぼ瞬間移動の操作感を実現しなければならない（SHALL）。

#### Scenario: Dash による瞬間移動
- **WHEN** BOLT が位置 (100, 200) で右方向 (1, 0) に Dash を発動する（distance = 180, duration = 0.05）
- **THEN** 0.05 秒で (280, 200) まで移動する

### Requirement: Dash はダメージを与えない
`bolt-dash` は damage = 0 であり、ダッシュ中に敵エンティティと接触してもダメージを与えてはならない（SHALL）。

#### Scenario: ダッシュ中の敵との接触
- **WHEN** Dash 中に敵ヒーローの判定円と重なる
- **THEN** 敵ヒーローにダメージは適用されない

### Requirement: BLADE Charge との差別化
`bolt-dash` は `blade-charge` と同じ dash effectType を使用するが、以下の点で差別化されなければならない（SHALL）：duration が大幅に短い（瞬間移動）、damage が 0（攻撃性なし）、distance が短い（リポジション用途）。

#### Scenario: パラメータ比較
- **WHEN** `bolt-dash` と `blade-charge` のパラメータを比較する
- **THEN** `bolt-dash` の duration は `blade-charge` より短く、damage は 0、distance は `blade-charge` より短い

### Requirement: タレントツリーからの取得
`bolt-dash` スキルは BOLT のタレントツリーで `grant_skill` エフェクトにより取得されなければならない（SHALL）。タレントノード `bolt-dash`（Depth 2, Cost 2, prerequisites: `bolt-fleet-foot`）が既に定義されており、スキル定義の追加により機能しなければならない（SHALL）。

#### Scenario: タレント取得後のスキル使用
- **WHEN** BOLT が タレントノード `bolt-dash` を取得する
- **THEN** `bolt-dash` スキルが `ownedSkills` に追加され、スロットに装備して発動可能になる
