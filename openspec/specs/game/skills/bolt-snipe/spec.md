# Specification

## Purpose
BOLT ヒーローの Snipe スキル仕様 — セルフバフで攻撃力・攻撃速度を上昇させる代わりに移動速度が低下する

## Requirements

### Requirement: Bolt Snipe スキル定義
システムは `SKILL_DEFINITIONS` に `bolt-snipe` を登録しなければならない（SHALL）。ターゲティング `self`、クールダウン 16 秒、`buff` エフェクトタイプ。

プライマリバフは `attackDamage`（値 +20、持続時間 5 秒、`isDebuff: false`）でなければならない（SHALL）。

スキルは `additionalBuffs` を含まなければならない（SHALL）:
- `attackSpeed`（値 +0.4、40%）
- `speed`（値 -60）

#### Scenario: 正しいパラメータでスキル定義が存在する
- **WHEN** `getSkillDefinition('bolt-snipe')` が呼ばれる
- **THEN** id `bolt-snipe`、ターゲティング `self`、クールダウン 16、バフエフェクト attackDamage +20、持続時間 5 の定義が返される

#### Scenario: 追加バフに攻撃速度とスピードペナルティが含まれる
- **WHEN** スキル定義の `additionalBuffs` を確認する
- **THEN** 正確に 2 エントリが含まれる: attackSpeed +0.4 と speed -60

### Requirement: Snipe は発動時に 3 つのステータスエフェクトを適用する
`bolt-snipe` 発動時、システムはキャスターに 3 つのステータスエフェクトを適用しなければならない（SHALL）:
1. `attackDamage` バフ（+20）5 秒間
2. `attackSpeed` バフ（+0.4）5 秒間
3. `speed` デバフ（-60）5 秒間

3 つのエフェクトはすべて同じ持続時間を共有し、同時に削除されなければならない（SHALL）。

#### Scenario: フル HP のキャスターが Snipe を発動する
- **WHEN** クールダウン 0 の BOLT ヒーローが bolt-snipe を発動する
- **THEN** ヒーローは正しい値と 5 秒の持続時間を持つ 3 つのステータスエフェクト（attackDamage、attackSpeed、speed）を受ける

#### Scenario: 発動後にクールダウンが設定される
- **WHEN** bolt-snipe の発動に成功する
- **THEN** キャスターのスキルスロットのクールダウンが 16 秒に設定される

#### Scenario: ダッシュ中に発動が拒否される
- **WHEN** アクティブな dashTimer を持つヒーローが bolt-snipe を発動しようとする
- **THEN** 発動は拒否され、ステータスエフェクトは適用されない

### Requirement: Bolt Snipe タレントノード配置
システムは BOLT タレントツリーの Depth 5 にコスト 2 で `bolt-snipe` タレントノードを含めなければならない（SHALL）。`bolt-snipe` スキルを付与する。

ノードは前提条件として `bolt-eagle-eye` を要求しなければならない（SHALL）。

#### Scenario: BOLT ツリーにタレントノードが存在する
- **WHEN** BOLT タレントツリーを確認する
- **THEN** id `bolt-snipe`、コスト 2、前提条件 `bolt-eagle-eye`、エフェクト `grant_skill`（skillId `bolt-snipe`）のノードが含まれる
