## Context

現在の `GameScene.readInput()` は矢印キーのみを読み取り、移動方向ベクトルを返すだけのシンプルな実装。仕様では WASD 移動・マウスエイム・右クリック攻撃・Q/E/R スキル（Quick Cast / Normal Cast）・Space ドッジが必要。

既存コードでは入力読み取りが Phaser シーンに直接埋め込まれている（`GameScene.readInput()`）。Issue #14 の方針に従い、入力ロジックを Phaser から分離した純粋なドメイン層に移す。

## Goals / Non-Goals

**Goals:**
- 入力状態を Phaser 非依存の純粋データ構造 `InputState` で表現
- Phaser の入力イベントを `InputState` に変換するアダプター層を提供
- WASD 移動・マウスエイム・右クリック攻撃・スキルターゲティング・ドッジを統一的に扱う
- Quick Cast / Normal Cast の両方をサポートするステートマシン
- 後続システム（攻撃・スキル・ドッジ）が `InputState` を消費するだけで動作する設計

**Non-Goals:**
- スキル発動ロジック・攻撃判定・ドッジ移動の実装
- ターゲティング UI（範囲インジケーター等）
- キーリバインド・設定画面
- モバイル対応

## Decisions

### 1. ドメイン層に `InputState` 型を定義する

**選択:** `src/domain/input/InputState.ts` に純粋な型を定義

```typescript
interface InputState {
  readonly movement: Position        // WASD → 正規化済み方向ベクトル
  readonly aimDirection: Position    // マウス → ヒーローからの正規化方向
  readonly aimWorldPosition: Position // マウスのワールド座標
  readonly attack: boolean           // 右クリック
  readonly skills: SkillInputState   // Q/E/R のターゲティング状態
  readonly dodge: boolean            // Space
}
```

**理由:** 入力をフレームごとのスナップショットとして扱うことで、ゲームロジック側は Phaser への依存なしに `InputState` を受け取るだけでよくなる。Phase 2 でサーバー移行時にも同じインターフェースを維持できる。

**代替案:** Phaser のイベントシステムをそのまま使う → Phaser 依存が全体に伝播するため却下。

### 2. スキルターゲティングのステートマシン

**選択:** `TargetingState` を discriminated union で表現

```typescript
type TargetingState =
  | { readonly phase: 'idle' }
  | { readonly phase: 'targeting'; readonly skill: SkillSlot; readonly mode: CastMode }
  | { readonly phase: 'fired'; readonly skill: SkillSlot; readonly target: Position }
  | { readonly phase: 'cancelled' }
```

遷移:
- `idle` → Q/E/R 押下 → `targeting`
- `targeting` + Quick Cast → キーリリース → `fired`
- `targeting` + Normal Cast → 左クリック → `fired`
- `targeting` → 右クリック → `cancelled`（→ 次フレームで `idle` に戻る）

**理由:** discriminated union により不正な状態遷移がコンパイル時に排除される。各フェーズで利用可能な操作が型レベルで明確。

**代替案:** boolean フラグの組み合わせ → 状態の組み合わせ爆発が起きやすく、バグの温床になるため却下。

### 3. Phaser アダプター層の分離

**選択:** `src/scenes/InputHandler.ts` に Phaser 依存の入力ブリッジを配置

- Phaser の `KeyboardPlugin`, `Pointer` から生のイベントを取得
- 毎フレーム `readInputState(scene): InputState` を呼び出して純粋データに変換
- マウスのスクリーン座標 → ワールド座標変換もここで実施

**理由:** シーンクラスを薄く保ち、テスト可能なロジックをドメイン層に集中させる。

### 4. キャストモード設定

**選択:** スキルスロットごとに `CastMode` を保持（将来的に設定可能）

```typescript
type CastMode = 'quick' | 'normal'
type SkillSlot = 'Q' | 'E' | 'R'
```

Phase 1 ではデフォルト値をハードコードし、全スキルを `normal` で統一。Quick Cast はステートマシンとしては実装するが、UI 設定切り替えは Non-goal。

**理由:** ステートマシンの遷移ロジックに Quick Cast を含めておけば、後から設定画面を追加するだけで切り替え可能。

### 5. 移動方向の正規化を純粋関数化

**選択:** `computeMovement(keys: WASDKeys): Position` を `src/domain/input/` に配置

既存の `GameScene.readInput()` 内の正規化ロジックをそのまま抽出。WASD の押下状態から正規化済み方向ベクトルを返す。

## Risks / Trade-offs

- **[Quick Cast と Normal Cast の同時サポート]** → Phase 1 では全スキル `normal` にデフォルト固定し複雑性を抑制。ステートマシン自体は両モード対応だが、UI 切り替えは後回し。
- **[マウス座標変換の精度]** → Phaser の `camera.getWorldPoint()` を使用。カメラ移動中のフレーム遅延が生じる可能性 → Phase 1 の 2v2 規模では問題にならない。
- **[Phase 2 サーバー移行時の互換性]** → `InputState` をシリアライズしてサーバーに送信する設計を想定。現時点ではローカルのみだが、型が純粋データなので移行は容易。
