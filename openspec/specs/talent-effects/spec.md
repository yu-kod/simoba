# Specification

## Purpose
タレント効果（flat/percent修正）の計算式と effectiveStats の再計算タイミングの仕様

## Requirements

### Requirement: effectiveStats の計算式
ヒーローの実効ステータスは `base + (growth × level) + Σ flat修正 + base × Σ percent修正` で計算されなければならない（SHALL）。再計算はタレント取得時およびレベルアップ時にのみ実行されなければならない（SHALL）。

#### Scenario: レベル0での実効ステータス
- **WHEN** level=0, base.attackDamage=60, growth.attackDamage=3 でタレント未取得
- **THEN** effectiveStats.attackDamage = 60 + (3 × 0) = 60

#### Scenario: レベル15での実効ステータス
- **WHEN** level=15, base.attackDamage=60, growth.attackDamage=3 でタレント未取得
- **THEN** effectiveStats.attackDamage = 60 + (3 × 15) = 105

#### Scenario: 複数タレント効果の重複適用
- **WHEN** `attackDamage +10 flat` と `attackDamage +20% percent` の両方が取得済みで、base=60, growth=3, level=10
- **THEN** effectiveStats.attackDamage = (60 + 3×10) + 10 + 90×0.20 = 118
