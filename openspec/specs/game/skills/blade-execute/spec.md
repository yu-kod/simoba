# Specification

## Purpose
BLADE の火力ビルドパス最終スキル。低HP の敵に追加ダメージを与える近接フィニッシャー。

## Requirements

### Requirement: blade-execute スキル定義
`SKILL_DEFINITIONS` に `blade-execute` エントリを追加しなければならない（SHALL）。targeting は `enemy`、effectType は `strike`、cooldown は 20 秒、range は 150 とする。

#### Scenario: スキル定義の取得
- **WHEN** `getSkillDefinition('blade-execute')` を呼び出す
- **THEN** id='blade-execute', targeting='enemy', cooldown=20, range=150 のスキル定義が返される

#### Scenario: エフェクトパラメータ
- **WHEN** blade-execute の effect を参照する
- **THEN** effectType='strike', damage=100, executeThreshold=0.3, executeBonusDamage=150 が含まれる

### Requirement: StrikeEffectParams の定義
`SkillEffectParams` ユニオンに `StrikeEffectParams` を追加しなければならない（SHALL）。フィールド: `damage`, `executeThreshold`, `executeBonusDamage`。

#### Scenario: StrikeEffectParams の型定義
- **WHEN** effectType='strike' のスキルを定義する
- **THEN** damage, executeThreshold, executeBonusDamage の各フィールドが使用可能である

### Requirement: 基本ダメージの適用
blade-execute はターゲットの敵ヒーローに `damage` 分のダメージを適用しなければならない（SHALL）。ダメージは既存のダメージパイプライン（damageReduction → blockAmount）を通す。

#### Scenario: 基本ダメージ
- **WHEN** HP 100% の敵に blade-execute を使用する
- **THEN** 敵は 100 のダメージを受ける（DR/Block なしの場合）

### Requirement: 低HP 追加ダメージ（Execute）
ターゲットの現在HPが maxHP の `executeThreshold` 以下の場合、`executeBonusDamage` を追加で適用しなければならない（SHALL）。閾値チェックはダメージ適用前に行う。

#### Scenario: 低HP ターゲットへの追加ダメージ
- **WHEN** HP が maxHP の 30% 以下の敵に blade-execute を使用する
- **THEN** 敵は 100 + 150 = 250 のダメージを受ける

#### Scenario: HP が閾値を超えるターゲット
- **WHEN** HP が maxHP の 31% 以上の敵に blade-execute を使用する
- **THEN** 敵は 100 のダメージのみを受ける

#### Scenario: 閾値ちょうどのターゲット
- **WHEN** HP が maxHP のちょうど 30% の敵に blade-execute を使用する
- **THEN** 追加ダメージが適用され、合計 250 のダメージを受ける

### Requirement: キルクレジットの設定
blade-execute でダメージを与えた場合、ターゲットの `lastAttackerSessionId` をキャスターに設定しなければならない（SHALL）。

#### Scenario: キルクレジット
- **WHEN** blade-execute で敵にダメージを与える
- **THEN** 敵の lastAttackerSessionId がキャスターのセッションIDに設定される

### Requirement: ダッシュ中の発動拒否
ダッシュ中（dashTimer > 0）は blade-execute を発動できない（SHALL）。

#### Scenario: ダッシュ中に発動を試みる
- **WHEN** dashTimer > 0 の BLADE が blade-execute を発動しようとする
- **THEN** スキルは発動されず、クールダウンは消費されない

### Requirement: 範囲外の敵への発動拒否
range 内に敵がいない場合、blade-execute は発動されず、クールダウンは消費されない（SHALL）。

#### Scenario: 範囲外の敵
- **WHEN** 150px 以内に敵がいない状態で blade-execute を発動しようとする
- **THEN** スキルは発動されず、クールダウンは消費されない
