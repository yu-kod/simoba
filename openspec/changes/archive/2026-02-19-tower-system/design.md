## Context

Phase 1 のマップには既にタワーの位置定義（blue: x=600, red: x=2600）と静的な円描画が存在するが、ゲームロジックは一切ない。タワーはレーン戦の核であり、ミニオンシステムや勝敗条件の前提となる。

現在のエンティティシステムは `generalize-entity-system` で汎用化済み：
- `CombatEntityState` / `AttackerEntityState` インタフェースが定義済み
- `EntityManager._entities` マップに任意のエンティティを登録可能
- `updateAttackState()` は `AttackerEntityState` を満たす任意のエンティティに適用可能
- `applyDamage()` は `CombatEntityState` を満たす任意のエンティティに適用可能

つまり、タワーを `AttackerEntityState` として定義すれば、既存の攻撃・ダメージシステムをそのまま再利用できる。

## Goals / Non-Goals

**Goals:**
- タワーを HP・攻撃能力を持つゲームエンティティとして実装
- タワーの自動攻撃ロジック（射程内の最も近い敵を自動ターゲット）
- タワーの HP バー表示と破壊処理
- 既存の `EntityManager` / `CombatManager` にタワーを統合
- 静的描画からエンティティベース描画への移行

**Non-Goals:**
- タワーのリスポーン（破壊されたら試合終了まで復活しない）
- ミニオンとのターゲット優先度（Phase 1 にミニオンは存在しない）
- タワーの段階破壊（半壊グラフィック等）
- タワー間の連携（多段タワー構成は将来スコープ）
- エンシェント（本陣）の実装

## Decisions

### 1. タワーを AttackerEntityState として実装

**選択:** 既存の `AttackerEntityState` インタフェースを実装する `TowerState` 型を作成

**代替案:**
- (A) タワー専用の独立インタフェース → 攻撃システムの再実装が必要、DRY 違反
- (B) `CombatEntityState` のみ（攻撃なし）→ タワーが攻撃できない

**理由:** `AttackerEntityState` を実装すれば `updateAttackState()` がそのまま使える。タワーは移動しないが `position` は readonly なので問題ない。`facing` はタワーには不要だが、インタフェース互換のため 0 固定で保持する。

### 2. タワー攻撃はプロジェクタイル方式

**選択:** `projectileSpeed > 0` のプロジェクタイル攻撃

**代替案:**
- (A) 即時ダメージ（melee 方式）→ 視覚的に不自然
- (B) ビーム方式（新規システム）→ 実装コスト大

**理由:** 既存のプロジェクタイルシステムを再利用でき、視覚的にもタワーらしい。BOLT ヒーローと同じコードパスで動作する。

### 3. ターゲット選択は最近接敵

**選択:** 射程内の最も近い敵エンティティを自動ターゲット

**代替案:**
- (A) ミニオン優先 → Phase 1 にミニオンがいないため不要
- (B) HP が低い敵優先 → 複雑、標準 MOBA と異なる
- (C) 最初に射程に入った敵 → 入場順の追跡が必要

**理由:** シンプルで直感的。Phase 2 でミニオン追加時にターゲット優先度を拡張可能。`EntityManager.getEnemiesOf(team)` で敵一覧を取得し、距離でソートする純粋関数として実装。

### 4. タワー定義は towerDefinitions.ts に集約

**選択:** `heroDefinitions.ts` パターンに倣い `towerDefinitions.ts` を新規作成

```
TowerDefinition:
  stats: StatBlock (maxHp, speed=0, attackDamage, attackRange, attackSpeed)
  radius: 24 (MAP_LAYOUT.towers のまま)
  projectileSpeed: 400
  projectileRadius: 5
```

**理由:** ヒーロー定義と同じパターンでデータ駆動にすることで、将来タワー種別を追加しやすい。`speed: 0` でタワーが移動しないことを表現。

### 5. TowerRenderer は HeroRenderer パターンに準拠

**選択:** Container + bodyGraphics + HpBarRenderer の構成

**理由:** 既存レンダラーと同じパターンで一貫性を保つ。タワーは移動しないため `sync()` は HP 変更時の更新のみ。破壊時は `container.setVisible(false)` で非表示化。

### 6. CombatManager を拡張してタワー攻撃を処理

**選択:** `CombatManager` に `processTowerAttacks(deltaSeconds)` メソッドを追加

**代替案:**
- (A) GameScene で直接処理 → GameScene が肥大化
- (B) 専用の TowerCombatManager → 分離しすぎ、共通ロジックが多い

**理由:** CombatManager は既にエンティティの攻撃処理を担当しており、タワーも同じ `updateAttackState()` を使う。タワー固有のロジック（ターゲット自動選択）だけ新規追加。

### 7. タワーのターゲット選択は純粋関数として分離

**選択:** `src/domain/systems/towerTargeting.ts` に `selectTowerTarget()` を純粋関数として実装

```typescript
function selectTowerTarget(
  tower: TowerState,
  enemies: readonly CombatEntityState[]
): CombatEntityState | null
```

**理由:** テスト容易性。`EntityManager.getEnemiesOf()` の結果を渡すだけで射程内の最近接敵を返す。

## Risks / Trade-offs

### [Risk] タワー攻撃の処理順序
タワー・ヒーロー・プロジェクタイルの処理順序によって、同一フレームでの戦闘結果が変わる可能性がある。
→ **Mitigation:** ヒーロー攻撃 → タワー攻撃 → プロジェクタイル解決の固定順序を `GameScene.update()` で保証。

### [Risk] タワー数増加時のパフォーマンス
各タワーが毎フレーム全敵エンティティとの距離を計算する。
→ **Mitigation:** Phase 1 はタワー 2 基 × 敵 1-2 体で計算量は無視できる。将来的に空間分割が必要になったら別 Issue で対応。

### [Risk] mapRenderer の静的描画との競合
タワーをエンティティ化すると、既存の `drawTowers()` による静的描画と二重描画になる。
→ **Mitigation:** タワーエンティティ生成時に `drawTowers()` を無効化（呼び出しを削除）。
