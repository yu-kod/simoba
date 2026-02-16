## Context

現在の実装:
- `HeroState` は `hp`, `maxHp`, `level`, `xp` のみ。移動速度・攻撃力・攻撃範囲がない
- `GameScene` にヒーロー描画がインラインで埋め込まれている（固定色の円1つ）
- ヒーローは1体のみ。複数ヒーローの管理構造がない
- `HERO_SPEED` が定数として全ヒーロー共通でハードコード
- 向き (facing) の概念がない

制約:
- ゲームロジック（domain 層）は Phaser に依存しない純粋関数/型で構成する
- 移動と攻撃/スキル発動は排他的（同時に行えない）
- 通常攻撃はターゲット指定式（遠距離追尾・近接必中）で方向ベースではない
- Phase 1 では Bot が操作する敵/味方ヒーローも同じ基盤を使う

## Goals / Non-Goals

**Goals:**
- ヒーロータイプ別のベースステータスを定義し、3体のヒーローを区別できるようにする
- ヒーロー描画を GameScene から分離し、再利用可能な HeroRenderer にする
- ヒーローの向き (facing) を状態として管理し、視覚的に表示する
- 後続の通常攻撃 (#22)、スキル (#23-#26)、Bot AI (#29) が自然に接続できる基盤を作る

**Non-Goals:**
- 通常攻撃・スキルの実装（#22-#26 のスコープ）
- Bot AI の行動ロジック（#29 のスコープ）
- HP バーや HUD 表示（#34 のスコープ）
- 複数ヒーロー管理 (HeroManager) — Bot AI (#29) 実装時に対応
- ヒーロー間の衝突判定（Phase 1 では不要、将来的に追加）
- 死亡・リスポーン処理

## Decisions

### 1. HeroState に facing (向き角度) を追加

**選択:** `facing: number`（ラジアン）を HeroState に追加

**理由:** 向きは移動方向・攻撃対象方向・前回の向きから決まる状態であり、毎フレーム更新される。ラジアンにすることで `Math.atan2` の結果をそのまま使え、描画時の回転にも直結する。

**代替案:**
- `facingDirection: Position`（正規化ベクトル）→ 描画時に毎回 atan2 変換が必要で冗長
- facing を HeroState に入れず描画側で計算 → 「最後の向きを維持」の要件を満たせない

### 2. CombatEntityState を導入し HP を持つ全エンティティの共通層にする

**選択:** `EntityState` と `HeroState` の間に `CombatEntityState` を追加

```typescript
interface EntityState { readonly id: string; readonly position: Position; readonly team: Team }

// HP を持つ全エンティティの共通層
interface CombatEntityState extends EntityState {
  readonly hp: number
  readonly maxHp: number
}

// Hero は CombatEntityState を拡張
interface HeroState extends CombatEntityState { ... }
// 将来: MinionState extends CombatEntityState, StructureState extends CombatEntityState
```

**理由:** ヒーロー・ミニオン・ストラクチャー・ボスは全て HP を持つ。HeroState を再設計する今のタイミングで共通層を入れれば追加コストがほぼゼロ。後からやると継承関係の破壊的変更になる。`CombatEntityState` は `hp` + `maxHp` の2フィールドだけなので過剰設計にはならない。

**代替案:**
- `StatBlock` を全エンティティで共有 → Structure に speed は不要など、エンティティごとに必要なステータスが異なるため不適切

### 3. ベースステータス（固定）と実効ステータス（変動）の二層構造

**選択:** `HeroBaseStats`（固定テーブル）と `HeroState` 内の実効ステータスフィールドの二層で管理

```typescript
// 戦闘ステータスの共通型（基礎値・成長量・実効値で共有）
interface StatBlock {
  readonly maxHp: number
  readonly speed: number
  readonly attackDamage: number
  readonly attackRange: number
  readonly attackSpeed: number // attacks per second
}

// 固定: ヒーロータイプ別の定義テーブル（変更されない）
interface HeroDefinition {
  readonly base: StatBlock       // Lv1 初期値
  readonly growth: StatBlock     // レベルアップごとの加算量（0 = 成長しない）
  readonly radius: number
}

// HeroState に実効ステータスを追加（試合中に変動する）
interface HeroState {
  // ...既存フィールド (id, position, team, type, hp, level, xp)
  readonly stats: StatBlock      // 現在の実効ステータス（バフ/レベルアップで変動）
  readonly facing: number        // 向き（ラジアン）
}
```

**StatBlock を共有する利点:**
- ステータス追加は StatBlock に1フィールド追加するだけ（3箇所の同期不要）
- base と growth が同じ型なので汎用的に計算可能: `base[key] + growth[key] * (level - 1)`
- 型の不整合が構造的に起きない

**理由:**
- `HeroDefinition` はヒーロータイプごとの初期値 + 成長率を `StatBlock` で統一管理。`createHeroState` が `base` から初期の `stats` を生成。成長率の適用ロジックは #27 (XP・レベリング) のスコープだが、データ定義はここで用意しておく
- HeroState 内の実効ステータスは試合中に変動する（レベルアップ成長、バフ/デバフ、タレント効果）
- 変動時は `{ ...state, speed: newSpeed }` でイミュータブルに更新
- 実効値を毎フレーム計算する方式（base + modifiers）は modifier スタックの管理が複雑になるため、直接値を更新する方式を採用。バフ/デバフの管理は将来のスコープ (#22+) で適切な仕組みを設計する

**代替案:**
- modifier スタック方式（base + List<Modifier> → 毎フレーム計算）→ 柔軟だが Phase 1 では過剰。バフ/デバフの実装時 (#31 等) に必要なら migration する

### 4. HeroRenderer を Phaser 依存の描画クラスとして分離

**選択:** `HeroRenderer` クラスが `Phaser.GameObjects.Container` をラップし、HeroState を受けて描画を同期

```
HeroRenderer.create(scene, heroState) → Container を生成
HeroRenderer.sync(heroState) → Container の位置・回転・色を更新
HeroRenderer.destroy() → Container を破棄
```

**理由:** GameScene から描画の詳細を切り離す。ヒーロータイプごとの形状の違い（BLADE: 三角、BOLT: ひし形、AURA: 六角形）を HeroRenderer 内に閉じ込められる。

**代替案:**
- 関数ベース (`renderHero(scene, state)`) → 毎フレーム Graphics を作り直すのは非効率。Container を保持する必要がある

### 5. 向きの更新を純粋関数で実装

**選択:** `updateFacing(currentFacing, movement, attackTarget?) → number`

```
- movement が非ゼロ → Math.atan2(movement.y, movement.x)
- attackTarget が指定 → atan2(target - heroPos)
- どちらもなし → currentFacing をそのまま返す
```

**理由:** 向きの更新ロジックは純粋関数にしてテスト可能にする。移動と攻撃が排他的なので、引数で分岐するだけでよい。攻撃ターゲットは将来 #22 で渡される想定だが、今は movement のみで動作する。

## Risks / Trade-offs

**[ヒーロータイプ別形状]** → BLADE/BOLT/AURA で異なるポリゴン形状を描画するが、厳密なデザインは未定。シンプルな形状（三角/ひし形/六角形など）で仮実装し、後から調整可能にする。

**[複数ヒーロー管理は別チケット]** → HeroManager（複数ヒーローの一括管理）と Bot ヒーローのスポーンは Bot AI (#29) 実装時にまとめて対応する。このチケットではプレイヤー1体のみ。

**[E2E スクリーンショット]** → ヒーローの見た目が変わるため既存の E2E スナップショットが壊れる。`--update-snapshots` で更新する。
