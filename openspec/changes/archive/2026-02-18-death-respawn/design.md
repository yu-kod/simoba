## Context

現在のヒーローは `HeroState` に `hp` を持ち、`applyDamage` で HP を減少させるが、HP が 0 になっても何も起きない。攻撃対象からも除外されず、描画も残り続ける。

本設計では `HeroState` に死亡状態を追加し、ゲームループ内で死亡判定→非表示→リスポーンタイマー→復活の一連のサイクルを実装する。

## Goals / Non-Goals

**Goals:**

- HP 0 で死亡状態に遷移し、攻撃不可・攻撃対象外になる
- 死亡中もカメラを WASD で自由に動かせる（観戦モード）
- リスポーンタイマー経過後、復活位置で HP 全回復して復活
- リスポーンタイマーを画面に表示
- 敵 Bot も同じ死亡・リスポーンルールに従う
- リスポーンタイマー・復活位置を可変にできる構造

**Non-Goals:**

- 経験値・キル報酬（#27）
- 死亡アニメーション演出（#37）
- リスポーン時間のレベル連動（#84）
- リスポーン後の無敵時間

## Decisions

### 1. 死亡状態の表現: `HeroState` にフィールド追加

`HeroState` に以下を追加する:

```typescript
readonly dead: boolean
readonly respawnTimer: number    // 残りリスポーン秒数 (0 = 生存中)
readonly deathPosition: Position // 死亡地点（将来の復活位置計算用）
```

**理由:** イミュータブルな state オブジェクトに死亡情報を含めることで、純粋関数で死亡判定・リスポーン処理を記述できる。`dead` フラグを boolean にすることで、攻撃対象フィルタや描画判定がシンプルになる。

**代替案:** `status: 'alive' | 'dead'` の enum 型 → 将来的に `'stunned'` 等が増える可能性はあるが、現時点では boolean で十分。ステータスエフェクトが必要になった段階で拡張する。

### 2. リスポーン処理: 純粋関数 `updateDeathState`

新しい domain 関数を作成:

```typescript
function checkDeath(hero: HeroState): HeroState
// HP <= 0 なら dead: true にし、respawnTimer をセット

function updateRespawnTimer(hero: HeroState, deltaSeconds: number): HeroState
// dead 中のみタイマーを減算。0 以下になったら復活処理

function respawn(hero: HeroState, respawnPosition: Position): HeroState
// dead: false, hp: maxHp, position: respawnPosition にリセット
```

**理由:** 各ステップを独立した純粋関数にすることで、テストが容易かつ Colyseus サーバー移植時にそのまま使える。

### 3. リスポーンタイマー: 定数で定義、関数引数で可変対応

```typescript
// constants.ts
export const DEFAULT_RESPAWN_TIME = 5 // seconds
```

`checkDeath` にリスポーン時間を引数で渡す設計にし、デフォルトは定数を使う。将来的にレベル連動（#84）する際は呼び出し側で計算して渡す。

**理由:** ロジック側が定数に直接依存しないため、テストでもレベル連動でも自由にタイマー値を差し替えられる。

### 4. 復活位置: `RespawnStrategy` を引数で渡す

```typescript
type RespawnPositionResolver = (hero: HeroState) => Position
```

デフォルト実装はチームベースの中央を返す:

```typescript
const baseRespawn: RespawnPositionResolver = (hero) => {
  const base = MAP_LAYOUT.bases[hero.team]
  return { x: base.x + base.width / 2, y: base.y + base.height / 2 }
}
```

**理由:** 「死亡地点で復活するヒーロー能力」に対応するため、復活位置の決定ロジックを差し替え可能にする。`deathPosition` を `HeroState` に保持しているので、strategy 内でそれを参照可能。

### 5. 死亡中のカメラ: ヒーロー追従を解除、WASD でカメラ移動

死亡時:
- `cameras.main.stopFollow()` でヒーロー追従を解除
- `InputHandler` はカメラ移動用の入力を返し続ける
- GameScene はカメラ位置を WASD で直接操作

リスポーン時:
- カメラをベース位置に即座に移動（`cameras.main.centerOn()`）
- ヒーロー追従を再開（`cameras.main.startFollow()`）

**理由:** 死亡中にマップを見回せることで、戦況把握が可能になる。リスポーン時にカメラがベースに戻るのは、復活位置がベースなので自然な挙動。

### 6. 攻撃対象からの除外

`EntityManager.getEnemies()` で `dead === true` のエンティティを除外する。`findClickTarget` や `processAttack` は既存ロジックのまま、入力リストから死亡エンティティが消えることで自然に除外される。

**理由:** フィルタを入口（`getEnemies`）に集約することで、各 system 関数の変更を最小限にする。

### 7. リスポーンタイマー UI: DOM オーバーレイ

画面中央に「Respawning in X...」のテキストを表示。Phaser の Text オブジェクトを使い、dead 中のみ表示する。

**理由:** シンプルな表示で十分。HUD 整備（#34）の際にデザインを統一する。

## Risks / Trade-offs

- **[Risk] Bot の死亡中に Bot AI が動こうとする** → `dead` チェックを Bot AI ループの先頭に入れて、dead 中はスキップする。現状 Bot AI は未実装（#29）なので、EntityManager レベルのフィルタで十分。
- **[Risk] オンライン同期で死亡状態がズレる** → Phase 1 はオフラインのため問題なし。Phase 2 でサーバー権威型に移行する際、死亡判定はサーバー側で行う設計にする。現在の純粋関数設計はそのまま移植可能。
- **[Trade-off] カメラ追従の ON/OFF 切り替え** → Phaser の `startFollow`/`stopFollow` は副作用を伴うが、GameScene 内に閉じ込められるため許容範囲。
