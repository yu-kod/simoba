# Specification

## Purpose
BLADE ヒーローの Fortify スキル仕様 — セルフバフで割合ダメージ軽減を付与し被ダメージを削減する

## Requirements

### Requirement: Fortify スキル定義
システムは `blade-fortify` をセルフターゲティングバフスキルとして定義しなければならない（SHALL）。クールダウン 14 秒、`damageReduction` バフタイプ、値 0.3（30%）、持続時間 4 秒。

#### Scenario: Fortify 発動
- **WHEN** BLADE ヒーローが Fortify を発動する
- **THEN** キャスターに `damageReduction` ステータスエフェクト（値 0.3、持続時間 4 秒）が適用される

#### Scenario: Fortify リフレッシュ
- **WHEN** 既存の Fortify バフがアクティブな状態で Fortify が発動される
- **THEN** バフの持続時間が 4 秒にリフレッシュされる（スタックではない）

### Requirement: ダメージ軽減パイプライン
`HeroSchema.applyDamage` はダメージ軽減を以下の順序で適用しなければならない（SHALL）: damageReduction（割合）→ blockAmount（固定値差し引き）→ 0 にクランプ。

#### Scenario: Fortify アクティブ時のダメージ
- **WHEN** 30% の damageReduction を持つヒーローが 100 ダメージを受ける
- **THEN** ヒーローは 70 ダメージを受ける（100 * (1 - 0.3)）

#### Scenario: Fortify なしのダメージ
- **WHEN** damageReduction のないヒーローが 100 ダメージを受ける
- **THEN** ヒーローは 100 ダメージを受ける（変更なし）

#### Scenario: ダメージ軽減の期限切れ
- **WHEN** Fortify バフが期限切れになる
- **THEN** 以降のダメージはフル値で適用される

### Requirement: タレントツリー統合
`blade-fortify` タレントノードはステータス修飾ではなく Fortify スキルを付与（grant_skill）しなければならない（SHALL）。

#### Scenario: タレントがスキルをアンロックする
- **WHEN** BLADE ヒーローが Fortify タレントを選択する
- **THEN** `blade-fortify` がヒーローのスキルスロットに表示される

### Requirement: skill-execution への影響
スキル実行システムは既に `buffEffectHandler` を介して `buff` effectType を処理している。動作変更は不要 — `blade-fortify` は既存のバフパイプラインを新しい `buffType: 'damageReduction'` で使用する。
