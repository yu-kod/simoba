## MODIFIED Requirements

### Requirement: HeroState の拡張
HeroState に `stats: StatBlock`（実効ステータス）と `facing: number`（ラジアン角度）と `attackCooldown: number`（次の攻撃まで残り秒数）と `attackTargetId: string | null`（現在のターゲット ID）を持たなければならない（SHALL）。`stats` は試合中にバフ・レベルアップ等で変動する現在値を保持する。

#### Scenario: createHeroState で初期状態を生成する
- **WHEN** `createHeroState({ id, type: 'BLADE', team: 'blue', position })` を呼ぶ
- **THEN** `stats` は `HERO_DEFINITIONS['BLADE'].base` と同じ値で初期化され、`facing` は 0、`attackCooldown` は 0、`attackTargetId` は `null` で初期化される

#### Scenario: 実効ステータスがイミュータブルに更新される
- **WHEN** ヒーローの移動速度がバフで変更される
- **THEN** 新しい HeroState が `{ ...state, stats: { ...state.stats, speed: newSpeed } }` のように不変更新で生成される

### Requirement: HeroDefinition によるヒーロータイプ別定義
`HeroDefinition` 型を定義し、`HERO_DEFINITIONS: Record<HeroType, HeroDefinition>` でヒーロータイプ別の固定定義を管理する。`base: StatBlock`（Lv1 初期値）、`growth: StatBlock`（レベルアップごとの加算量）、`radius: number`、`canMoveWhileAttacking: boolean`（攻撃中の移動可否）を持たなければならない（SHALL）。

#### Scenario: BLADE の定義を参照する
- **WHEN** `HERO_DEFINITIONS['BLADE']` を参照する
- **THEN** BLADE 固有のベースステータス（高 HP、高攻撃力、近距離攻撃範囲、低速度）と成長量が返され、`canMoveWhileAttacking` は `true` である

#### Scenario: BOLT の定義を参照する
- **WHEN** `HERO_DEFINITIONS['BOLT']` を参照する
- **THEN** BOLT 固有のベースステータス（低 HP、中攻撃力、長距離攻撃範囲、高速度）と成長量が返され、`canMoveWhileAttacking` は `false` である

#### Scenario: AURA の定義を参照する
- **WHEN** `HERO_DEFINITIONS['AURA']` を参照する
- **THEN** AURA 固有のベースステータス（中 HP、低攻撃力、中距離攻撃範囲、中速度）と成長量が返され、`canMoveWhileAttacking` は `false` である

### Requirement: 向きの更新
純粋関数 `updateFacing` でヒーローの向きを更新する。facing の優先度は「攻撃ターゲット方向 > 移動方向 > 現在の向きを維持」でなければならない（SHALL）。攻撃中は移動の有無にかかわらずターゲット方向を向かなければならない（SHALL）。

#### Scenario: 攻撃中はターゲット方向を向く
- **WHEN** `attackTargetId` が設定済みで、ターゲットがヒーローの右方向にいる
- **THEN** facing はターゲット方向（右 = 0 ラジアン）に更新される。移動方向は無視される

#### Scenario: 攻撃中に移動しても facing はターゲット方向
- **WHEN** `attackTargetId` が設定済みで、WASD で上方向に移動しているが、ターゲットは右方向にいる
- **THEN** facing はターゲット方向（右 = 0 ラジアン）に更新され、移動方向（上）は facing に影響しない

#### Scenario: 攻撃していないとき移動方向を向く
- **WHEN** `attackTargetId` が `null` で movement が `{ x: 1, y: 0 }`（右方向）
- **THEN** facing は `0`（右方向のラジアン）に更新される

#### Scenario: 攻撃も移動もしていないとき向きを維持する
- **WHEN** `attackTargetId` が `null` で movement が `{ x: 0, y: 0 }`、現在の facing が `1.57`
- **THEN** facing は `1.57` のまま変化しない
