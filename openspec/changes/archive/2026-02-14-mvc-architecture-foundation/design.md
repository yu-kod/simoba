## Context

現在の `src/` は以下のフラット構成:
- `scenes/BootScene.ts` — GameScene への遷移のみ
- `scenes/GameScene.ts` — プレースホルダー（背景描画 + テキスト表示のみ）
- `config/gameConfig.ts` — Phaser 設定 + 定数（GAME_WIDTH, GAME_HEIGHT）

Phase 1 で実装予定の機能（ヒーロー3体、ミニオン、タワー、戦闘、AI、マッチフロー等）を追加する前に、ドメインロジック層を確立する。現在のコードは最小限のため、レガシー移行の負荷はほぼない。

## Goals / Non-Goals

**Goals:**
- `src/domain/` に Phaser 非依存のゲーム状態型とロジック関数を配置する基盤を作る
- Domain 層のユニットテストが `vi.mock('phaser')` なしで動くことを実証する
- 今後の機能実装（#17〜#37）が従うべきディレクトリ規約とコーディングパターンを確立する
- 既存の GameScene/BootScene/gameConfig が新構成で引き続き動作する

**Non-Goals:**
- ゲーム機能の実装（ヒーロー、ミニオン、戦闘等は別 Issue）
- Adapter / Port パターンの導入（Phaser のラッパーは作らない）
- 状態管理ライブラリ（Redux, Zustand 等）の導入
- ECS フレームワークの導入

## Decisions

### 1. Domain 層の境界ルール

**決定**: `src/domain/` 配下のファイルは `phaser` を import してはならない。

**理由**: このルールが全ての目的（テスタビリティ、Phase 2 移行、保守性）の根幹。ESLint ルールや CI チェックでの強制は将来検討するが、まずは規約として確立する。

**代替案**:
- Phaser の型だけ import 許可 → 型だけでも依存が生まれ、サーバー移植時に問題になるため却下

### 2. エンティティの表現方法

**決定**: エンティティは interface / type で状態を定義し、class は使わない。

```typescript
// domain/types.ts
interface Position { readonly x: number; readonly y: number }
type Team = 'blue' | 'red'

// domain/entities/Hero.ts
interface HeroState {
  readonly id: string
  readonly type: 'BLADE' | 'BOLT' | 'AURA'
  readonly team: Team
  readonly position: Position
  readonly hp: number
  readonly maxHp: number
  readonly level: number
  readonly xp: number
}
```

**理由**:
- イミュータブルパターンと相性が良い（`readonly` + スプレッド演算子で新オブジェクト生成）
- 純粋関数との組み合わせでテストが容易
- Phase 2 でサーバーに送信する際、プレーンオブジェクトのためシリアライズが容易

**代替案**:
- class ベース → メソッドに状態変更ロジックが入り、mutation しやすくなるため却下
- ECS コンポーネント → 2v2 規模では過剰。interface で十分

### 3. ドメインシステムの関数設計

**決定**: システムは純粋関数のモジュールとして実装する。入力を受け取り、新しい状態を返す。

```typescript
// domain/systems/MovementSystem.ts
function move(entity: { position: Position }, direction: Position, speed: number, delta: number): Position {
  return {
    x: entity.position.x + direction.x * speed * delta,
    y: entity.position.y + direction.y * speed * delta
  }
}
```

**理由**:
- 純粋関数 → 同じ入力に対して常に同じ出力 → テストが確実
- delta を引数で受け取る → フレームレート非依存
- 特定のエンティティ型に依存しない → Hero でも Minion でも使える

**代替案**:
- クラスベースのシステム（`new MovementSystem()` + メソッド呼び出し）→ 内部状態を持つリスクがあるため却下
- Reducer パターン（`(state, action) => state`）→ 将来的に導入可能だが、現時点では関数単位で十分

### 4. Scene と Domain の接続パターン

**決定**: Scene の `update()` で入力を読み取り、domain 関数を呼び、結果を Phaser オブジェクトに反映する。

```typescript
// scenes/GameScene.ts（概念）
update(_time: number, delta: number): void {
  // 1. 入力を読み取る
  const input = this.readInput()

  // 2. domain の純粋関数で状態を更新
  this.heroState = move(this.heroState, input.direction, HERO_SPEED, delta / 1000)

  // 3. Phaser オブジェクトに反映
  this.heroSprite.setPosition(this.heroState.position.x, this.heroState.position.y)
}
```

**理由**:
- Phaser の Scene ライフサイクルをそのまま活用（フレームワークと戦わない）
- Domain 関数は状態を返すだけで、Phaser オブジェクトを知らない
- 描画の同期は Scene の責務として明確

**代替案**:
- GameController クラスで仲介 → 現時点では Scene が直接呼ぶ方がシンプル。機能が増えたら検討

### 5. ゲーム定数の配置

**決定**: Phaser 設定は `config/gameConfig.ts` に残し、ゲームルール定数は `domain/` 配下に新設する。

```typescript
// config/gameConfig.ts — Phaser 固有設定（変更なし）
export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

// domain/constants.ts — ゲームルール定数（新規）
export const HERO_SPEED = 200
export const MATCH_DURATION = 300 // seconds
export const MAX_LEVEL = 5
```

**理由**: GAME_WIDTH は Phaser の描画設定、HERO_SPEED はゲームルール。責務が異なるため分離する。

## Risks / Trade-offs

**[Scene が肥大化するリスク]** → 機能追加に伴い Scene の `update()` が長くなる可能性。対策: 機能ごとにヘルパーメソッドに分割し、将来的に Controller 層の導入を検討（別 Issue で対応）

**[Domain と Phaser の境界が曖昧になるリスク]** → 開発者が domain/ に Phaser import を入れてしまう可能性。対策: コードレビューで検出。将来的に ESLint の `no-restricted-imports` ルールで自動化

**[イミュータブル更新のパフォーマンス]** → 毎フレーム新オブジェクト生成のGC圧力。対策: 2v2 規模（エンティティ数十個）ではボトルネックにならない。問題が出てから最適化する

## Open Questions

- Scene が複雑化した場合、Controller 層をどの時点で導入するか（別 Issue で検討）
- ESLint の `no-restricted-imports` による domain/ の Phaser import 禁止を自動化するタイミング
