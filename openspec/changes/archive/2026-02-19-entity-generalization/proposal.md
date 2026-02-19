## Why

EntityManager が `_localHero`/`_enemy`（専用フィールド）、`_remotePlayers`（Map）、`_entities`（Map）の3系統で管理されており、ダメージ適用・ターゲット検索・死亡判定のすべてに分岐が必要。タワーが localHero にダメージを与えられないバグの原因もこの構造。ミニオン (#21)・ボス (#32) 追加のたびに分岐が増える前にアーキテクチャを統一する。

## What Changes

- **BREAKING**: `EntityManager` を World モデルに書き換え — 全エンティティを単一 `Map<string, CombatEntityState>` で管理
- **BREAKING**: `_localHero`/`_enemy` 専用フィールドを廃止 → `localHeroId`/`enemyHeroId` による参照に変更。`localHero`/`enemy` getter は後方互換で維持
- Player 概念を導入 — `localPlayerId` + `controlledHeroId` でプレイヤーの操縦対象を特定
- `CombatManager.applyLocalDamage()` の4分岐を統一 `updateEntity()` 1行に簡略化
- `GameScene.updateDeathRespawn()` のヒーロー個別処理をエンティティループに統一
- `getEntity(id)` の4箇所チェックを単一 Map lookup に
- `getEnemiesOf(team)` の4コレクション走査を1回のフィルタに

## Capabilities

### New Capabilities
- `unified-world`: 全エンティティの統一管理モデル（World + Player 操縦構造）

### Modified Capabilities
- `entity-registry`: EntityManager を World ベースに書き換え。単一 Map 管理、hero 互換 getter 維持
- `attack-system`: applyLocalDamage の分岐を統一パスに変更

## Impact

- `src/scenes/EntityManager.ts` — 大幅リファクタ（内部構造変更、外部 API は getter で互換維持）
- `src/scenes/CombatManager.ts` — applyLocalDamage 簡略化、processTowerAttacks 簡略化
- `src/scenes/GameScene.ts` — 死亡/リスポーン処理のループ化、レンダラー管理の統一
- `shared/types.ts` — HeroState に `controlledBy` フィールド追加
- テストファイル — EntityManager/CombatManager のテスト更新（helper でモック構築は維持）
- 既存の外部 API (`localHero`, `enemy`, `getEntity`, `getEnemiesOf`) は後方互換 getter で維持し、呼び出し側の変更を最小化
