## Requirements

### Requirement: プロジェクタイル状態の定義
プロジェクタイルは以下の読み取り専用フィールドを持つ `ProjectileState` インターフェースで表現しなければならない（SHALL）。`id: string`、`ownerId: string`（発射者ID）、`targetId: string`（追尾対象ID）、`position: Position`（現在位置）、`damage: number`、`speed: number`（px/sec）、`radius: number`（描画・衝突判定用半径）。すべてのフィールドは `readonly` でなければならない（SHALL）。

#### Scenario: ProjectileState の生成
- **WHEN** `createProjectile` に ownerId, targetId, 発射位置, damage, speed, radius を渡す
- **THEN** 指定されたパラメータを持つ新しい `ProjectileState` が返される

#### Scenario: イミュータブルな状態
- **WHEN** `ProjectileState` を更新する
- **THEN** 元のオブジェクトは変更されず、新しいオブジェクトが返される

### Requirement: プロジェクタイルの追尾移動
プロジェクタイルは毎フレーム、ターゲットの現在位置に向かって `speed * deltaTime` 分だけ移動しなければならない（SHALL）。移動は純粋関数 `updateProjectile` で行い、ターゲットの現在位置を引数として受け取らなければならない（SHALL）。

#### Scenario: ターゲットに向かって移動する
- **WHEN** プロジェクタイルが (100, 100) にあり、ターゲットが (400, 100) にいて、speed が 600、deltaTime が 0.016
- **THEN** プロジェクタイルの位置が (109.6, 100) に更新される（右方向に 9.6px 移動）

#### Scenario: ターゲットが移動した場合の追尾
- **WHEN** プロジェクタイルが (100, 100) に向かって飛行中に、ターゲットが (100, 200) に移動した
- **THEN** プロジェクタイルは新しいターゲット位置 (100, 200) に向かって方向を変えて移動する

### Requirement: プロジェクタイルの衝突判定
プロジェクタイルとターゲットの衝突は、プロジェクタイルの `position` とターゲットの `position` の距離がターゲットの `radius` + プロジェクタイルの `radius` 以下になった時点で「命中」と判定しなければならない（SHALL）。命中判定は純粋関数 `checkProjectileHit` で行わなければならない（SHALL）。

#### Scenario: プロジェクタイルがターゲットに命中する
- **WHEN** プロジェクタイル（radius 4）が (198, 100) にあり、ターゲット（radius 18）が (200, 100) にいる
- **THEN** 距離 2 ≤ (18 + 4) = 22 なので命中と判定される

#### Scenario: プロジェクタイルがまだターゲットに届いていない
- **WHEN** プロジェクタイル（radius 4）が (150, 100) にあり、ターゲット（radius 18）が (200, 100) にいる
- **THEN** 距離 50 > (18 + 4) = 22 なので命中していないと判定される

### Requirement: プロジェクタイルプールの更新
プロジェクタイルプール全体を1フレーム分更新する純粋関数 `updateProjectiles` を提供しなければならない（SHALL）。この関数は全プロジェクタイルの移動・衝突判定を行い、命中したプロジェクタイルに対する `DamageEvent` の配列と、残存プロジェクタイルの配列を返さなければならない（SHALL）。ターゲットが消滅（HP 0 等）した場合、そのターゲットを追尾中のプロジェクタイルは即座に除去しなければならない（SHALL）。

#### Scenario: 複数のプロジェクタイルを同時に更新する
- **WHEN** 3つのプロジェクタイルが飛行中で、そのうち1つがターゲットに命中した
- **THEN** 命中した1つの DamageEvent と、残り2つのプロジェクタイルが返される

#### Scenario: ターゲットが消滅した場合のプロジェクタイル除去
- **WHEN** ターゲット（HP 0）を追尾中のプロジェクタイルが2つ存在する
- **THEN** 2つのプロジェクタイルは即座に除去され、DamageEvent は発行されない

### Requirement: HeroDefinition のプロジェクタイルパラメータ
`HeroDefinition` に `projectileSpeed: number`（px/sec、0 の場合は近接攻撃）と `projectileRadius: number`（飛翔体の描画・衝突半径）を追加しなければならない（SHALL）。`projectileSpeed` が 0 のヒーローは従来通り即時ダメージ（近接攻撃）を行わなければならない（SHALL）。

#### Scenario: BLADE は近接攻撃（projectileSpeed 0）
- **WHEN** BLADE の HeroDefinition を参照する
- **THEN** `projectileSpeed` が 0 であり、攻撃時に即時ダメージが発生する

#### Scenario: BOLT は遠距離攻撃（projectileSpeed > 0）
- **WHEN** BOLT の HeroDefinition を参照する
- **THEN** `projectileSpeed` が 600 であり、攻撃時にプロジェクタイルが生成される

#### Scenario: AURA は遠距離攻撃（projectileSpeed > 0）
- **WHEN** AURA の HeroDefinition を参照する
- **THEN** `projectileSpeed` が 400 であり、攻撃時にプロジェクタイルが生成される

### Requirement: プロジェクタイルの描画
プロジェクタイルは `ProjectileRenderer` によって小さい塗りつぶし円として描画しなければならない（SHALL）。色はプロジェクタイルの所有者のチームカラー（blue チーム: 青系、red チーム: 赤系）で描画しなければならない（SHALL）。

#### Scenario: プロジェクタイルが円として描画される
- **WHEN** プロジェクタイルが存在する
- **THEN** プロジェクタイルの `position` に `radius` サイズの塗りつぶし円が描画される

#### Scenario: チームカラーで描画される
- **WHEN** blue チームのヒーローが発射したプロジェクタイルが存在する
- **THEN** 青系の色で描画される

### Requirement: GameScene へのプロジェクタイル統合
GameScene の update ループにプロジェクタイルの更新・描画を統合しなければならない（SHALL）。プロジェクタイル配列は GameScene のフィールドとして保持し、毎フレーム `updateProjectiles` で更新しなければならない（SHALL）。命中時の DamageEvent は既存のダメージ適用ロジック（`applyDamage` + ヒットフラッシュ）を再利用しなければならない（SHALL）。

#### Scenario: プロジェクタイルが毎フレーム更新される
- **WHEN** GameScene の update が呼ばれる
- **THEN** すべてのアクティブなプロジェクタイルの位置が更新され、衝突判定が実行される

#### Scenario: プロジェクタイル命中時にダメージが適用される
- **WHEN** プロジェクタイルがターゲットに命中する
- **THEN** `applyDamage` でターゲットの HP が減少し、ヒットフラッシュが再生される
