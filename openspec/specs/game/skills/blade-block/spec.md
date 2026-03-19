# Specification

## Purpose
BLADE ヒーローの Block スキル仕様 — セルフバフで固定値のダメージ吸収を付与し被ダメージを軽減する

## Requirements

### Requirement: Block スキル定義
システムは `blade-block` をセルフターゲティングバフスキルとして定義しなければならない（SHALL）。クールダウン 10 秒、`blockAmount` バフタイプ、値 30、持続時間 3 秒。

#### Scenario: Block 発動
- **WHEN** BLADE ヒーローが Block を発動する
- **THEN** キャスターに `blockAmount` ステータスエフェクト（値 30、持続時間 3 秒）が適用される

#### Scenario: Block リフレッシュ
- **WHEN** 既存の Block バフがアクティブな状態で Block が発動される
- **THEN** バフの持続時間が 3 秒にリフレッシュされる（スタックではない）

### Requirement: Block ダメージ吸収メカニクス
`HeroSchema.applyDamage` は `blockAmount` ステータスエフェクトを参照し、`damageReduction` 適用後の受けるダメージから固定値を差し引かなければならない（SHALL）。

#### Scenario: Block アクティブ時のダメージ
- **WHEN** blockAmount 30 のヒーローが 100 ダメージを受ける（damageReduction なし）
- **THEN** ヒーローは 70 ダメージを受ける（100 - 30）

#### Scenario: Block が受けるダメージ以上を吸収する
- **WHEN** blockAmount 30 のヒーローが 20 ダメージを受ける
- **THEN** ヒーローは 0 ダメージを受ける（クランプ、Block が全吸収）

#### Scenario: Block と Fortify の併用
- **WHEN** damageReduction 0.3 と blockAmount 30 のヒーローが 100 ダメージを受ける
- **THEN** ヒーローは 40 ダメージを受ける（100 * 0.7 = 70、次に 70 - 30 = 40）

#### Scenario: Block なしのダメージ
- **WHEN** blockAmount のないヒーローが 100 ダメージを受ける
- **THEN** ヒーローは 100 ダメージを受ける（変更なし）

#### Scenario: Block の期限切れ
- **WHEN** Block バフが期限切れになる
- **THEN** 以降のダメージは固定値吸収なしで適用される

### Requirement: タレントツリー統合
`blade-block` タレントノードは Depth 1（コスト 1、前提条件: `blade-toughness`）に追加され、Block スキルを付与しなければならない（SHALL）。

#### Scenario: タレントがスキルをアンロックする
- **WHEN** BLADE ヒーローが Block タレントを選択する
- **THEN** `blade-block` がヒーローのスキルスロットに表示される

### Requirement: blade-fortify への影響
`HeroSchema.applyDamage` に `blockAmount` 処理が `damageReduction` の後に追加される。順序: 生ダメージ → damageReduction（割合）→ blockAmount（固定値差し引き）→ 0 にクランプ。
