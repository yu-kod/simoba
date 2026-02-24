## Context

現在のゲームにはヒーロー（4体）とタワー（2基）のみ。ミニオンが存在しないため、レーン戦略が成立していない。既存のエンティティシステム（EntityManager, CombatManager, updateAttackState）は汎用設計されており、`EntityType` に `'minion'` も定義済み。タワー実装パターン（Definition → State → Schema → Renderer）を踏襲してミニオンを追加する。

## Goals / Non-Goals

**Goals:**
- 各ベースから30秒間隔で近接3体+遠距離1体のウェーブをスポーン
- ミニオンが直進し、ターゲット優先度（ミニオン > タワー > ヒーロー）で自動戦闘
- 既存の `updateAttackState` を完全共有し、近接/遠距離の区別はパラメータのみ
- タワーがミニオンも攻撃対象にする
- 敵ミニオン死亡時に近接ヒーローへXP付与
- ミニオンのHPバーを表示
- 将来のミニオンバフ（3:00 強化）を後付け可能な定数設計

**Non-Goals:**
- ミニオンバフの実装（定数設計のみ）
- 経路探索・ウェイポイント（直線移動のみ）
- アグロスワップ（ヒーロー攻撃時のタゲ変更）
- ミニオンの見た目バリエーション

## Decisions

### 1. MinionDefinition を近接/遠距離の2種に分離

**選択:** `MELEE_MINION` と `RANGED_MINION` を別定義にする

**理由:** `projectileSpeed: 0`（近接）と `> 0`（遠距離）で既存の `updateAttackState` が自動で近接/遠距離を判別するため、定義を分けるだけで攻撃タイプが切り替わる。TowerDefinition と同じパターン。

**代替案:** 単一定義 + フラグ → 不要な複雑さ。既存パターンに合わない。

### 2. ターゲット優先度付き選択関数

**選択:** `selectMinionTarget(minion, enemies)` を新設。`towerTargeting.ts` の `selectTowerTarget` と同構造だが、優先度フィルタリングを追加。

**ロジック:**
1. 射程内の敵を取得
2. ミニオンのみでフィルタ → 最近接を返す
3. ミニオンがいなければタワーのみでフィルタ → 最近接を返す
4. タワーもいなければヒーロー → 最近接を返す
5. 全ていなければ `null`

**理由:** 既存の `selectTowerTarget`（最近接のみ）とは異なるロジックなので別関数にする。`entityType` による `switch` で分岐し、各カテゴリ内で最近接を選ぶ。

### 3. ミニオンの移動: 戦闘中は停止

**選択:** `attackTargetId !== null` の場合は移動しない。ターゲットがいない場合のみ直進。

**理由:** MOBA の標準的なミニオン挙動。ミニオン同士がぶつかって「前線」が自然に形成される。

**移動方向:** blue チームは右方向（facing = 0）、red チームは左方向（facing = π）。Y座標はスポーン位置で固定（レーン中央 y=360）。

### 4. スポーン位置とウェーブ構成

**選択:** ベース直後からスポーン。ウェーブ内の配置は近接3体が先頭、遠距離1体が後方。

- Blue スポーン: x=150, y=360（近接）/ x=120, y=360（遠距離、後方）
- Red スポーン: x=3050, y=360（近接）/ x=3080, y=360（遠距離、後方）
- 近接3体は y 方向に少しオフセット（340, 360, 380）して横並び

**理由:** 前線に到達するまでの時間差で自然と近接が先行し、遠距離が後ろから撃つ構図になる。

### 5. XP 付与: 範囲ベースの均等分配（付与のみ、レベルアップは別 Issue）

**選択:** 敵ミニオン死亡時、半径 `XP_GRANT_RANGE`（500px）内の味方ヒーロー全員に均等XP付与。`HeroState.xp` に加算する純粋関数 `grantXp` のみ実装。レベルアップ判定・タレント選択は別 Issue で対応。

**理由:** 仕様「No last-hitting. XP gained by proximity when enemy minions die」に準拠。均等分配はシンプルで .io ゲーム的。XP フィールドは `HeroState` に既にあるが、レベルアップロジックは未実装なので段階的に進める。

### 6. サーバー権威 + クライアントオフラインの両対応

**選択:** ミニオンロジック（スポーン、移動AI、ターゲット選択、攻撃）を純粋関数として `shared/` または `src/domain/` に配置。オフラインモードでは `GameScene` が直接呼び出し、オンラインモードでは `GameRoom` がサーバー上で実行。

**理由:** 既存のヒーロー/タワーと同じアーキテクチャ。Phase 1 はオフライン優先だが、サーバー側も同時に整備する。

### 7. MinionRenderer: TowerRenderer パターン踏襲

**選択:** `TowerRenderer` と同じ構成（Container + bodyGraphics + HpBarRenderer）。ミニオンは小さい円（近接）または小さいダイヤモンド（遠距離）で描画。

**理由:** TowerRenderer が最もシンプルなレンダラー。HpBarRenderer は既存の再利用可能クラス。

### 8. 死亡時の処理: リスポーンなし、即削除

**選択:** ミニオンは `dead` になったら短い死亡アニメ（フェードアウト200ms）後にレジストリから完全削除。

**理由:** ミニオンはリスポーンしない。dead 状態を長く残すとエンティティ数が増え続ける。

### 9. ミニオンバフ対応の設計

**選択:** スポーン設定を `MinionWaveConfig` として定数化。`matchTime` によって異なる config を返す `getWaveConfig(matchTime)` 関数を用意し、現時点では常に同じ config を返す。

```typescript
interface MinionWaveConfig {
  readonly interval: number       // スポーン間隔（秒）
  readonly meleeCount: number     // 近接ミニオン数
  readonly rangedCount: number    // 遠距離ミニオン数
  readonly statMultiplier: number // ステータス倍率（バフ用、初期値1.0）
}
```

**理由:** 3:00 バフ実装時は `getWaveConfig` に条件分岐を追加するだけで、スポーンロジック本体は変更不要。

## Risks / Trade-offs

**パフォーマンス（レンダリング）:** 常時10-20体のミニオンが画面に存在 → 各ミニオンに Container + Graphics + HpBar
→ **軽減:** HpBarRenderer は既にシンプル。ミニオンの body は単一 Graphics で描画。問題が出たらオブジェクトプーリングを導入（別 Issue）。

**パフォーマンス（当たり判定）:** 毎フレーム全ミニオンがターゲット検索 → `getEnemiesOf` を毎回呼ぶ
→ **軽減:** 現状のエンティティ数（ミニオン最大20体 + ヒーロー4体 + タワー2基）なら O(n²) でも問題ない。

**ミニオンが死体の山を作る:** dead 状態のミニオンが溜まると Map サイズが増大
→ **軽減:** 死亡後即削除（短い delay 後に removeEntity）。

## New Files

| File | Purpose |
|------|---------|
| `shared/entities/Minion.ts` | MinionDefinition, MinionState, createMinionState, MinionWaveConfig |
| `src/domain/systems/minionTargeting.ts` | 優先度付きターゲット選択（ミニオン > タワー > ヒーロー） |
| `src/domain/systems/minionMovement.ts` | 直進移動AI（純粋関数） |
| `src/domain/systems/minionSpawn.ts` | ウェーブスポーンロジック（純粋関数） |
| `src/scenes/effects/MinionRenderer.ts` | Phaser レンダラー（body + HpBar） |
| `server/src/schema/MinionSchema.ts` | Colyseus schema |
| `server/src/game/ServerMinionSystem.ts` | サーバー側スポーン/AI/死亡処理 |

## Modified Files

| File | Change |
|------|--------|
| `shared/constants.ts` | ウェーブ間隔、XP付与量、XP範囲の定数追加 |
| `src/domain/entities/typeGuards.ts` | `isMinion()` 追加 |
| `src/scenes/EntityManager.ts` | `getMinions()` 追加 |
| `src/scenes/CombatManager.ts` | `processMinionAttacks()` 追加 |
| `src/scenes/GameScene.ts` | スポーンタイマー、ミニオン更新ループ、レンダラー同期追加 |
| `server/src/schema/GameRoomState.ts` | `minions: MapSchema<MinionSchema>` 追加 |
| `server/src/rooms/GameRoom.ts` | スポーンタイマー、ServerMinionSystem 呼び出し追加 |
| `server/src/game/ServerTowerSystem.ts` | ターゲット候補にミニオン追加 |
| `server/src/game/combatUtils.ts` | ダメージ適用先に minions MapSchema 追加 |
