## Context

EntityManager は `_localHero`/`_enemy`（専用フィールド）、`_remotePlayers`（Map）、`_entities`（Map）の3系統で管理。`getEntity()` は4箇所チェック、`applyLocalDamage()` は4分岐、`getEnemiesOf()` は4コレクション走査。ミニオン・ボス追加のたびにこの分岐が増える。

現在のコード量: EntityManager 172行、CombatManager 308行、GameScene 379行。

## Goals / Non-Goals

**Goals:**
- 全エンティティ（ヒーロー、タワー、将来のミニオン/ボス）を単一 Map で管理
- ダメージ適用・ターゲット検索・死亡判定の分岐を解消
- Player 概念を導入し、「誰がどのヒーローを操縦しているか」を明確に分離
- `localHero`/`enemy` 専用 API を廃止し、全呼び出し側を統一 API (`getEntity`, `updateEntity`) に移行
- 新エンティティ追加時に EntityManager の変更が不要な構造

**Non-Goals:**
- ECS (Entity-Component-System) への移行 — 現在の TypeScript interface ベース継承で十分
- Phase 2 のオンラインマルチプレイ対応（remotePlayer の Server-Authoritative 化）は別 Issue
- レンダラーの自動生成（エンティティ追加で Renderer が自動で生える仕組み）

## Decisions

### D1: 単一 Map で全エンティティを管理

**選択**: `_entities: Map<string, CombatEntityState>` に localHero、enemy、remotePlayers、towers をすべて格納

**代替案**:
- A) ヒーロー用 Map とその他用 Map を分ける — 分岐は減るが2系統残る
- B) ECS ライブラリ導入 — Phase 1 では過剰

**理由**: 1つの Map にすることで `getEntity()`, `getEnemiesOf()`, `applyDamage` がすべて O(1) lookup / 1回フィルタになる。型安全性は `entityType` ディスクリミナントで担保。

### D2: Player メタデータは EntityManager の内部フィールド

**選択**: EntityManager に `_localHeroId: string` と `_controlledHeroIds: Map<string, string>`（playerId → heroId）を持つ。別クラス `Player` は作らない。

**代替案**:
- A) `Player` クラスを分離 — きれいだがPhase 1では1プレイヤーしかいないため過剰
- B) HeroState に `controlledBy` フィールド追加 — shared/types に影響が大きい

**理由**: Phase 1 では localPlayer 1人 + Bot。Player クラスを作る必要性はまだない。`_localHeroId` だけで「誰を操縦しているか」は特定できる。2v2 拡張時は `_controlledHeroIds` Map を活用。

### D3: `localHero`/`enemy` 専用 API を完全廃止

**選択**: `localHero`/`enemy` getter、`updateLocalHero()`/`updateEnemy()` をすべて削除。呼び出し側は `getEntity(localHeroId)` / `updateEntity(localHeroId, ...)` に移行。

**代替案**:
- A) getter を残して内部を Map lookup に — 移行コストは低いが「特別扱い」の匂いが残る

**理由**: ローカルプレイヤーが操作するヒーローは「マップ上のエンティティのうち、自身の入力を受け取り、カメラが追従する」だけの存在。エンティティとして特異である必要はない。`localHeroId` で「どれが自分のか」を知れれば十分。差分は大きくなるが、中途半端な互換層を残すより設計意図が明確になる。

### D4: `applyLocalDamage` を1行に統一

**現在**: 4分岐（localHero → enemy → remotePlayer → entity）
**変更後**:

```typescript
applyLocalDamage(targetId: string, amount: number): void {
  this.entityManager.updateEntity(targetId, (e) => applyDamage(e, amount))
}
```

`updateEntity` が単一 Map を参照するため、分岐不要。

### D5: `registeredEntities` の意味を変更

**現在**: `_entities` Map の値のみ（ヒーロー含まず）
**変更後**: 全エンティティを返す `allEntities` getter を追加。`registeredEntities` は deprecate（互換用に残し、中身は `allEntities` と同じ）。

### D6: レンダラー管理は entityRenderers Map に統合

**現在**: `heroRenderer`, `enemyRenderer`, `remoteRenderers`, `towerRenderers` が別々
**変更後**: `entityRenderers: Map<string, HeroRenderer | TowerRenderer>` に統合。`localHeroId` のレンダラーだけカメラ追従フラグ付き。

**flashEntityRenderer** の4分岐が `entityRenderers.get(targetId)?.flash()` 1行に。

## Risks / Trade-offs

**[リスク] 型安全性の低下** → `Map<string, CombatEntityState>` に異なるサブタイプが混在し、取り出し時にダウンキャストが必要
→ **緩和**: `entityType` ディスクリミナントによる type guard 関数（`isHero()`, `isTower()`）を提供。`updateEntity<T>` のジェネリクスで型推論を維持。

**[リスク] テスト大量修正** → EntityManager のコンストラクタ変更で全テストが壊れる
→ **緩和**: テストヘルパー `createTestEntityManager()` を用意し、テスト側は1箇所の変更で済むようにする。

**[トレードオフ] 専用 API 廃止で差分が大きい** → GameScene 15箇所+、CombatManager 5箇所+の書き換え
→ 一度やれば終わる作業。中途半端な互換層を残して後で二度手間になるより良い。
