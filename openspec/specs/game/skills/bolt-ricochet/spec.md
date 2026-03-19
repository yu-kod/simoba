# Specification

## Purpose
BOLT ヒーローの Ricochet スキル仕様 — 敵ヒーロー間を跳ね返るバウンド弾丸を発射する

## Requirements

### Requirement: Bolt Ricochet スキル定義
システムは `SKILL_DEFINITIONS` に `bolt-ricochet` を登録しなければならない（SHALL）。ターゲティング `direction`、クールダウン 8 秒、`projectile` エフェクトタイプ。

弾丸のパラメータ: damage 50、speed 700、range 500、radius 5、pierceCount 0、homing false、visualType `diamond`、bounceCount 3、bounceRange 300。

#### Scenario: 正しいパラメータでスキル定義が存在する
- **WHEN** `getSkillDefinition('bolt-ricochet')` が呼ばれる
- **THEN** id `bolt-ricochet`、ターゲティング `direction`、クールダウン 8、弾丸エフェクト damage 50、bounceCount 3、bounceRange 300 の定義が返される

### Requirement: Ricochet 弾丸は敵間を跳ね返る
システムはヒットごとに `bounceRange` 内の最も近い未ヒットの敵ヒーローに向けて弾丸をリダイレクトし、`bounceRemaining` をデクリメントしなければならない（SHALL）。

#### Scenario: 最初のターゲットにヒット後、弾丸が最も近い敵に跳ね返る
- **WHEN** ricochet 弾丸が敵ヒーローにヒットし bounceRemaining > 0
- **THEN** 弾丸は bounceRange 内の最も近い未ヒットの敵ヒーローに向けてリダイレクトされ、bounceRemaining が 1 デクリメントされる

#### Scenario: バウンスターゲットが利用できない場合に弾丸が削除される
- **WHEN** ricochet 弾丸が敵ヒーローにヒットし bounceRemaining > 0 だが bounceRange 内に未ヒットの敵がいない
- **THEN** 弾丸は現在のターゲットにダメージを与えた後に削除される

#### Scenario: bounceRemaining が 0 に達した場合に弾丸が削除される
- **WHEN** ricochet 弾丸が敵ヒーローにヒットし bounceRemaining が 0
- **THEN** 弾丸はダメージを与えた後に削除される

### Requirement: Ricochet は同じ敵に 2 回ヒットしない
システムはどの敵がヒットされたかを追跡し、バウンスターゲット選択からそれらを除外しなければならない（SHALL）。

#### Scenario: 以前ヒットした敵がバウンスターゲットから除外される
- **WHEN** ricochet 弾丸が次のバウンスターゲットを探す
- **THEN** この弾丸で既にヒットされた敵を選択しない（SHALL NOT）
