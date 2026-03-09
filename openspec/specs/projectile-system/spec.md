# Specification

## Purpose
プロジェクタイルの状態定義、追尾移動、衝突判定などの投射物システム全体の仕様

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

### Requirement: 直進（linear）プロジェクタイルモード
`ProjectileSchema` に飛行モードを示す `mode` フィールド（`'homing' | 'linear'`、デフォルト `'homing'`）を追加しなければならない（SHALL）。`mode: 'linear'` のプロジェクタイルは `dirX`, `dirY` 方向に毎フレーム `speed * deltaTime` 分だけ直進しなければならない（SHALL）。`targetId` による追尾は行わない。

#### Scenario: linear モードのプロジェクタイルが直進する
- **WHEN** mode='linear', dirX=1, dirY=0, speed=800 のプロジェクタイルが deltaTime=0.016 で更新される
- **THEN** x が 12.8px 増加し、y は変化しない

#### Scenario: homing モードは従来通り動作する
- **WHEN** mode='homing' のプロジェクタイルが更新される
- **THEN** targetId の現在位置に向かって追尾移動する（既存動作と同一）

### Requirement: ProjectileSchema の拡張フィールド
`ProjectileSchema` に以下のフィールドを追加しなければならない（SHALL）：`mode: string`（'homing' | 'linear'）、`dirX: float32`（直進方向X）、`dirY: float32`（直進方向Y）、`maxRange: float32`（最大飛行距離、0=無制限）、`pierceRemaining: int16`（残り貫通回数）。

#### Scenario: linear プロジェクタイルのフィールド
- **WHEN** Pierce Shot でプロジェクタイルが生成される
- **THEN** mode='linear', dirX/dirY に正規化方向ベクトル, maxRange=600, pierceRemaining=3 がセットされる

#### Scenario: homing プロジェクタイルのデフォルト値
- **WHEN** 通常攻撃でプロジェクタイルが生成される
- **THEN** mode='homing', dirX=0, dirY=0, maxRange=0, pierceRemaining=0 のデフォルト値を持つ

### Requirement: 射程による自動除去
`mode: 'linear'` のプロジェクタイルは累計移動距離を追跡し、`maxRange` を超えた時点で除去しなければならない（SHALL）。累計移動距離はサーバーサイドで管理し、Schema には含めない。

#### Scenario: 最大射程で除去される
- **WHEN** maxRange=600 の linear プロジェクタイルが合計 600px 以上移動した
- **THEN** プロジェクタイルが MapSchema から除去される

### Requirement: 貫通ヒット判定
`pierceRemaining > 0` のプロジェクタイルは、敵エンティティ（ヒーロー・タワー・ミニオン）との衝突時にダメージを与えた後も飛行を継続しなければならない（SHALL）。同じエンティティへの二重ヒットを防止するため、ヒット済みエンティティIDをサーバーサイドで追跡しなければならない（SHALL）。`pierceRemaining` をヒットごとに減算し、0 になった時点でプロジェクタイルを除去しなければならない（SHALL）。

#### Scenario: 貫通してダメージを与え続ける
- **WHEN** pierceRemaining=3 のプロジェクタイルが敵Aにヒットする
- **THEN** 敵Aにダメージが適用され、pierceRemaining が 2 に減算され、プロジェクタイルは飛行を継続する

#### Scenario: 貫通回数上限で除去される
- **WHEN** pierceRemaining=1 のプロジェクタイルが敵にヒットする
- **THEN** ダメージ適用後、pierceRemaining が 0 になりプロジェクタイルが除去される

#### Scenario: ヒット済みエンティティをスキップする
- **WHEN** プロジェクタイルが既にヒットしたエンティティの判定範囲内を通過する
- **THEN** 追加ダメージは発生せず、pierceRemaining は変化しない

### Requirement: linear プロジェクタイルの全敵衝突判定
`mode: 'linear'` のプロジェクタイルは `targetId` ではなく、飛行経路上のすべての敵チームエンティティに対して衝突判定を行わなければならない（SHALL）。味方エンティティには衝突しない（SHALL）。

#### Scenario: 経路上の敵すべてに判定される
- **WHEN** linear プロジェクタイルが飛行中に、経路上に敵ヒーロー2体と味方ヒーロー1体がいる
- **THEN** 敵ヒーロー2体に対して衝突判定が行われ、味方ヒーローはスキップされる
