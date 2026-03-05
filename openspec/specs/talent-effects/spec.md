## Purpose

タレント効果システム — タレント取得時に適用される効果の定義、即時適用、ステータス再計算、スキル付与を管理する仕組み。

## Requirements

### Requirement: タレント効果タイプ
タレント効果は Tagged union（`TalentEffect`）で定義されなければならない（SHALL）。以下のタイプをサポートしなければならない（SHALL）: `stat_modifier`（ステータス修正）、`grant_skill`（スキル付与）、`modify_basic_attack`（通常攻撃変更）、`unlock_passive`（パッシブ解放）。

#### Scenario: stat_modifier 効果
- **WHEN** `{ type: 'stat_modifier', stat: 'attackDamage', value: 10, mode: 'flat' }` の効果を持つタレントが取得される
- **THEN** ヒーローの `attackDamage` が 10 増加する

#### Scenario: stat_modifier パーセント効果
- **WHEN** `{ type: 'stat_modifier', stat: 'maxHp', value: 15, mode: 'percent' }` の効果を持つタレントが取得される
- **THEN** ヒーローの `maxHp` が 15% 増加する

#### Scenario: grant_skill 効果
- **WHEN** `{ type: 'grant_skill', skillId: 'blade-charge' }` の効果を持つタレントが取得される
- **THEN** ヒーローの所持スキル一覧に `blade-charge` が追加される

#### Scenario: modify_basic_attack 効果
- **WHEN** `{ type: 'modify_basic_attack', property: 'projectileCount', value: 3 }` の効果を持つタレントが取得される
- **THEN** ヒーローの通常攻撃の該当プロパティが変更される

#### Scenario: unlock_passive 効果
- **WHEN** `{ type: 'unlock_passive', passiveId: 'lifesteal' }` の効果を持つタレントが取得される
- **THEN** ヒーローにパッシブ効果 `lifesteal` が付与される

### Requirement: 効果の即時適用
タレント取得時に全ての効果が即座に適用されなければならない（SHALL）。`stat_modifier` 効果は `effectiveStats` の再計算をトリガーしなければならない（SHALL）。

#### Scenario: 取得直後のステータス反映
- **WHEN** `attackDamage +10` のタレントが取得される
- **THEN** 次フレームから攻撃ダメージが増加している

### Requirement: effectiveStats の計算式
ヒーローの実効ステータスは `base + (growth × (level - 1)) + Σ flat修正 + base × Σ percent修正` で計算されなければならない（SHALL）。再計算はタレント取得時およびレベルアップ時にのみ実行されなければならない（SHALL）。

#### Scenario: 複数タレント効果の重複適用
- **WHEN** `attackDamage +10 flat` と `attackDamage +20% percent` の両方が取得済みで、base=60, growth=8, level=3 である
- **THEN** effectiveStats.attackDamage = (60 + 8×2) + 10 + 76×0.20 = 101.2

### Requirement: 所持スキル管理
`HeroSchema` は `ownedSkills`（`ArraySchema<string>`）フィールドを持たなければならない（SHALL）。`grant_skill` 効果によって追加されたスキルIDがこの配列に格納されなければならない（SHALL）。同じスキルIDの重複追加は防止されなければならない（SHALL）。

#### Scenario: スキル付与で所持スキルに追加
- **WHEN** `grant_skill` 効果で `blade-charge` が付与される
- **THEN** `ownedSkills` 配列に `blade-charge` が追加される

#### Scenario: 重複スキルの防止
- **WHEN** 既に `blade-charge` を所持している状態で再度 `grant_skill` が発火する
- **THEN** `ownedSkills` に重複は追加されない
