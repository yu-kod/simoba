## MODIFIED Requirements

### Requirement: 攻撃クールダウン
`attackSpeed`（attacks/sec）に基づくクールダウンを管理しなければならない（SHALL）。`attackCooldown` は毎フレーム `deltaTime` 分減少し、0 以下で攻撃可能と判定しなければならない（SHALL）。攻撃発動時に `1 / attackSpeed` 秒にリセットしなければならない（SHALL）。攻撃発動時、`projectileSpeed` が 0 のヒーロー（近接）は即時 DamageEvent を発行しなければならない（SHALL）。`projectileSpeed` が 0 より大きいヒーロー（遠距離）は DamageEvent の代わりに ProjectileSpawnEvent を発行しなければならない（SHALL）。

#### Scenario: クールダウンが 0 以下で攻撃可能
- **WHEN** `attackCooldown` が 0 以下でターゲットが `attackRange` 内にいる
- **THEN** 攻撃が発動し、ダメージイベントまたはプロジェクタイル生成イベントが発行される

#### Scenario: クールダウン中は攻撃不可
- **WHEN** `attackCooldown` が 0 より大きい
- **THEN** 攻撃は発動せず、ダメージイベントもプロジェクタイル生成イベントも発行されない

#### Scenario: 攻撃発動後にクールダウンがリセットされる
- **WHEN** attackSpeed が 0.8 (attacks/sec) で攻撃が発動する
- **THEN** `attackCooldown` が `1 / 0.8 = 1.25` 秒にリセットされる

#### Scenario: クールダウンがフレームごとに減少する
- **WHEN** `attackCooldown` が 1.0 で deltaTime が 0.016（約60fps）
- **THEN** `attackCooldown` が 0.984 に更新される

#### Scenario: 近接ヒーローの攻撃発動で即時ダメージ
- **WHEN** BLADE（`projectileSpeed === 0`）の攻撃が発動する
- **THEN** 即時 DamageEvent が発行され、ターゲットの HP が減少する

#### Scenario: 遠距離ヒーローの攻撃発動でプロジェクタイル生成
- **WHEN** BOLT（`projectileSpeed === 600`）の攻撃が発動する
- **THEN** DamageEvent の代わりに ProjectileSpawnEvent が発行され、プロジェクタイルが生成される

### Requirement: 攻撃エフェクトの抽象化
攻撃エフェクトは共通インターフェース `AttackEffectRenderer` で抽象化し、差し替え可能でなければならない（SHALL）。エフェクトのパラメータはダメージ判定パラメータとは独立に定義しなければならない（SHALL）。ダメージ判定はエフェクトの有無や状態に一切依存してはならない（SHALL NOT）。近接攻撃には `MeleeSwingRenderer` を使用し、遠距離攻撃にはプロジェクタイルの飛翔自体がエフェクトとなるため `play()` 呼び出しは不要でなければならない（SHALL）。

#### Scenario: 攻撃発動時にエフェクトが再生される
- **WHEN** 近接攻撃のダメージイベントが発行される
- **THEN** `MeleeSwingRenderer.play()` が呼ばれ、近接スイングエフェクトが再生される

#### Scenario: 遠距離攻撃ではスイングエフェクトが再生されない
- **WHEN** 遠距離攻撃のプロジェクタイル生成イベントが発行される
- **THEN** `MeleeSwingRenderer.play()` は呼ばれず、プロジェクタイルの飛翔が視覚的エフェクトとなる

#### Scenario: エフェクトが差し替え可能
- **WHEN** `MeleeSwingRenderer` の代わりに別の `AttackEffectRenderer` 実装を設定する
- **THEN** ダメージ判定ロジックに変更なくエフェクトのみが変わる

#### Scenario: エフェクトなしでもダメージが発生する
- **WHEN** `AttackEffectRenderer` が設定されていない場合
- **THEN** ダメージ判定とダメージ適用は通常通り動作する
