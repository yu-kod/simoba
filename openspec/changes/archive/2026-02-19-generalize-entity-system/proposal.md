## Why

現在の戦闘エンティティ管理（`EntityManager`, `CombatManager`, `updateAttackState`）はヒーロー専用に型付けされており、タワー・ミニオン・ボスなどの新エンティティを追加できない。Phase 1 の残りデリバラブル（タワー、ミニオン、ボス）すべてがこの基盤に依存するため、先に汎用化する。

## What Changes

### 型階層の整理
- `Team` 型に `'neutral'` を追加（ボス等の中立エンティティ用。`getEnemiesOf(team)` が neutral を敵として返すために必要）
- `CombatEntityState` に `dead: boolean`, `radius: number`, `entityType` 識別子を追加（全戦闘エンティティ共通）
- `AttackerEntityState` を新設 — `CombatEntityState` を拡張し、攻撃に必要なフィールド（`stats`, `attackCooldown`, `attackTargetId`, `facing`）を持つ
- `HeroState` は `AttackerEntityState` を拡張（hero 固有: `level`, `xp`, `respawnTimer`, `deathPosition`）
- 将来の `TowerState`, `MinionState` も `AttackerEntityState` を拡張する想定

### updateAttackState の汎用化
- 入力型を `HeroState` → `<T extends AttackerEntityState>` にジェネリクス化
- 戻り値を `{ hero: HeroState, ... }` → `{ entity: T, ... }` に変更
- `applyDamage<T>` と同じパターン

### EntityManager のエンティティレジストリ
- ヒーロー以外のエンティティを登録・取得する汎用レジストリを追加
- `getEntity(id)` — 全エンティティから検索（ヒーロー + レジストリ）
- `getEnemiesOf(team)` — 指定チームの敵エンティティを返す（`dead` 除外）
- `getEntityRadius(id)` — エンティティ state の `radius` を直接参照（定義ルックアップ不要に）
- 既存のヒーロー API（`localHero`, `enemy`, `updateLocalHero` 等）は後方互換で維持

### CombatManager の汎用化
- `applyLocalDamage` — レジストリ内の全エンティティにダメージ適用可能に
- `resolveTarget` — レジストリ含めた全エンティティからターゲット解決
- `processProjectiles` — プロジェクタイルが全エンティティ（タワー・ミニオン含む）にヒット可能に

### 死亡判定とスポーンの責務分離
- **死亡判定はエンティティの責務:** 汎用 `checkDeath<T extends CombatEntityState>` を新設 — `dead: true` のみセット
- **スポーン/リスポーンはエンティティとは別の責務:** 現在の `deathRespawn.ts` にある `updateRespawnTimer` / `respawn` はヒーローのリスポーンロジック。今後ミニオンのウェーブスポーン、ボスのタイムドスポーン、タワーの初期配置も同じ「いつ・どこに・何を出現させるか」という概念。エンティティ自身の状態管理から分離する方向を意識した設計にする
- 今回のスコープ: `checkDeath` の汎用化のみ。スポーンシステム自体の実装は各エンティティ change で行う

## Non-goals

- タワー・ミニオン・ボスの具体的なエンティティ定義（別 change で行う）
- ターゲット優先度 / アグロシステム（タワー実装時に追加）
- スポーンシステムの実装（リスポーン/ウェーブスポーン/タイムドスポーン — 各エンティティ実装時に追加）
- エンティティ固有のライフサイクル（永久破壊/除去 — 各エンティティ実装時に追加）
- サーバーサイド（Colyseus スキーマ）の変更
- レンダリング層の変更
- 新しいゲームメカニクスの追加

## Capabilities

### New Capabilities
- `entity-registry`: 複数エンティティタイプ（hero, tower, minion, boss）を統一的に登録・取得・更新するレジストリ。`getEntity()`, `getEnemiesOf()`, `getEntityRadius()` が全エンティティを横断検索

### Modified Capabilities
- `attack-system`: `updateAttackState` をジェネリクス化（`<T extends AttackerEntityState>`）。`CombatManager` のダメージ適用・ターゲット解決が全エンティティに対応

## Impact

- `shared/types.ts` — `CombatEntityState` に `dead`, `radius`, `entityType` 追加。`AttackerEntityState` インターフェース新設
- `src/domain/entities/Hero.ts` — `HeroState` を `AttackerEntityState` 拡張に変更。`dead`, `radius` は親から継承
- `src/domain/systems/updateAttackState.ts` — ジェネリクス化 `<T extends AttackerEntityState>`
- `src/scenes/EntityManager.ts` — 汎用エンティティレジストリ追加
- `src/scenes/CombatManager.ts` — `applyLocalDamage` / `resolveTarget` がレジストリを参照
- `src/domain/systems/deathRespawn.ts` — 汎用 `checkDeath<T>` 新設。`updateRespawnTimer` / `respawn` はヒーロー専用のまま維持（将来スポーンシステムに移行予定）
- `src/domain/entities/heroDefinitions.ts` — `createHeroState` で `radius` を state に含める
- ユニットテスト — **破壊的変更**: `CombatEntityState` への必須フィールド追加により、既存テスト全体のモックデータ修正が必要（EntityManager, CombatManager, applyDamage, findClickTarget, isInAttackRange, deathRespawn 等）
