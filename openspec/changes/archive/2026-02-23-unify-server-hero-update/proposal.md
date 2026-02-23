## Why

`handleServerHeroUpdate` が `isLocal` フラグで local/remote を分岐し、状態更新ロジック（type, radius, hp, facing, dead 等）を3箇所で重複している。また `updateOnlineInput` では `localHero` を冒頭で取得した後、途中の `updateEntity` で stale になった参照を使い続け、Issue #103 のバグ原因となった。両メソッドを整理し、全エンティティを等しく扱う構造にする。

## What Changes

- `handleServerHeroUpdate` の local/remote 分岐を統一。全ヒーローに共通の状態適用関数を適用し、予測・カメラ・ID リマップは後から追加レイヤーとして実行
- `updateOnlineInput` を読み取り→計算→書き込みのフェーズに分離し、stale reference を排除
- `updateOfflineHero` も同パターンに合わせて stale reference を排除

## Non-goals

- オフラインモードの廃止（#107 のスコープ）
- Entity Interpolation やスムージング実装（#100 のスコープ）
- EntityManager API の変更（内部構造はそのまま）

## Capabilities

### New Capabilities

なし

### Modified Capabilities

- `online-multiplayer`: `handleServerHeroUpdate` の内部構造変更（全エンティティ平等の状態適用 + 予測レイヤー分離）
- `input-system`: `updateOnlineInput` / `updateOfflineHero` の読み取り/書き込みフェーズ分離

## Impact

- `src/scenes/GameScene.ts` — `handleServerHeroUpdate`, `updateOnlineInput`, `updateOfflineHero` のリファクタ
- `src/scenes/__tests__/GameScene.test.ts` — テスト構造の更新
- 外部 API・インターフェース変更なし（内部リファクタのみ）
