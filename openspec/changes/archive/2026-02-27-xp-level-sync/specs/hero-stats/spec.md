## MODIFIED Requirements

### Requirement: HeroState の拡張
HeroState に `stats: StatBlock`（実効ステータス）と `facing: number`（ラジアン角度）と `attackCooldown: number`（次の攻撃まで残り秒数）と `attackTargetId: string | null`（現在のターゲット ID）と `talentPoints: number`（未使用タレントポイント数、初期値 0）を持たなければならない（SHALL）。`stats` は試合中にバフ・レベルアップ等で変動する現在値を保持する。

#### Scenario: createHeroState で初期状態を生成する
- **WHEN** `createHeroState({ id, type: 'BLADE', team: 'blue', position })` を呼ぶ
- **THEN** `stats` は `HERO_DEFINITIONS['BLADE'].base` と同じ値で初期化され、`facing` は 0、`attackCooldown` は 0、`attackTargetId` は `null`、`talentPoints` は 0 で初期化される

#### Scenario: 実効ステータスがイミュータブルに更新される
- **WHEN** ヒーローの移動速度がバフで変更される
- **THEN** 新しい HeroState が `{ ...state, stats: { ...state.stats, speed: newSpeed } }` のように不変更新で生成される
