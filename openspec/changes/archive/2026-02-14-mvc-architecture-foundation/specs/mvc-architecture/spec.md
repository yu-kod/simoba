## ADDED Requirements

### Requirement: Domain ディレクトリ構成

`src/domain/` ディレクトリを新設しなければならない (SHALL)。配下に `entities/`（エンティティ状態型）、`systems/`（ロジック純粋関数）、`types.ts`（共通型定義）を含まなければならない (SHALL)。

#### Scenario: Domain ディレクトリが存在する
- **WHEN** プロジェクトの `src/` ディレクトリを確認する
- **THEN** `src/domain/`、`src/domain/entities/`、`src/domain/systems/` が存在する

#### Scenario: Domain ディレクトリに Phaser 依存がない
- **WHEN** `src/domain/` 配下の全 `.ts` ファイルの import 文を検査する
- **THEN** `phaser` を import しているファイルが存在しない

### Requirement: 共通型定義

`src/domain/types.ts` に全レイヤーで共有する基底型を定義しなければならない (SHALL)。最低限 `Position`、`Team`、`EntityState` を含まなければならない (SHALL)。

#### Scenario: Position 型が定義されている
- **WHEN** `src/domain/types.ts` を参照する
- **THEN** `Position` 型が `readonly x: number` と `readonly y: number` プロパティを持つ

#### Scenario: Team 型が定義されている
- **WHEN** `src/domain/types.ts` を参照する
- **THEN** `Team` 型が `'blue' | 'red'` のユニオン型である

#### Scenario: EntityState 型が定義されている
- **WHEN** `src/domain/types.ts` を参照する
- **THEN** `EntityState` 型が `id`、`position`、`team` プロパティを含む

### Requirement: エンティティ状態の interface 定義

ゲームエンティティは `src/domain/entities/` に interface / type として定義しなければならない (SHALL)。class を使用してはならない (SHALL NOT)。全プロパティは `readonly` でなければならない (SHALL)。

#### Scenario: HeroState が interface で定義されている
- **WHEN** `src/domain/entities/Hero.ts` を参照する
- **THEN** `HeroState` が interface / type として定義されており、`id`、`type`、`team`、`position`、`hp`、`maxHp`、`level`、`xp` プロパティが全て `readonly` である

#### Scenario: エンティティが class ではない
- **WHEN** `src/domain/entities/` 配下の全ファイルを検査する
- **THEN** `class` キーワードが使用されていない

### Requirement: ドメインシステムの純粋関数

ゲームルール処理は `src/domain/systems/` に純粋関数として実装しなければならない (SHALL)。関数は入力を受け取り新しい状態を返さなければならない (SHALL)。引数を変更（mutation）してはならない (SHALL NOT)。

#### Scenario: MovementSystem が純粋関数である
- **WHEN** `MovementSystem.move()` を同じ引数で2回呼び出す
- **THEN** 2回とも同一の結果を返す（参照透過性）

#### Scenario: 状態更新がイミュータブルである
- **WHEN** `MovementSystem.move()` にエンティティ状態を渡す
- **THEN** 元のエンティティ状態オブジェクトは変更されず、新しいオブジェクトが返される

#### Scenario: delta パラメータでフレームレート非依存
- **WHEN** `MovementSystem.move()` に `delta` 引数を渡す
- **THEN** 移動量が `delta` に比例する（フレームレートに依存しない）

### Requirement: ゲームルール定数の分離

ゲームルールに関する定数は `src/domain/constants.ts` に定義しなければならない (SHALL)。Phaser 固有の設定（解像度、Scale 設定等）は `src/config/gameConfig.ts` に残さなければならない (SHALL)。

#### Scenario: ゲームルール定数が domain に存在する
- **WHEN** `src/domain/constants.ts` を参照する
- **THEN** ゲームルール定数（移動速度、試合時間、最大レベル等）が定義されている

#### Scenario: Phaser 設定と分離されている
- **WHEN** `src/config/gameConfig.ts` を参照する
- **THEN** ゲームルール定数（HERO_SPEED 等）が含まれておらず、Phaser 固有設定のみが存在する

### Requirement: Scene からの Domain 呼び出しパターン

`GameScene.update()` は入力読み取り → Domain 関数呼び出し → Phaser オブジェクト反映の3ステップで構成しなければならない (SHALL)。ゲームルール計算を Scene 内で直接行ってはならない (SHALL NOT)。

#### Scenario: GameScene が Domain 関数を使用する
- **WHEN** `GameScene.update()` の実装を確認する
- **THEN** `src/domain/systems/` の関数を呼び出してゲーム状態を更新している

#### Scenario: GameScene にゲームルール計算がない
- **WHEN** `GameScene` のコードを検査する
- **THEN** HP計算、ダメージ計算、移動速度計算等のゲームルールロジックが Scene 内に直接記述されていない

### Requirement: Domain 層のユニットテストがモック不要

`src/domain/` 配下のコードのユニットテストは `vi.mock('phaser')` を使用せずに実行できなければならない (SHALL)。

#### Scenario: MovementSystem のテストがモック不要で動作する
- **WHEN** `MovementSystem` のユニットテストを `vi.mock('phaser')` なしで実行する
- **THEN** テストが正常に PASS する

#### Scenario: エンティティ生成のテストがモック不要で動作する
- **WHEN** `HeroState` を生成するテストを `vi.mock('phaser')` なしで実行する
- **THEN** テストが正常に PASS する
