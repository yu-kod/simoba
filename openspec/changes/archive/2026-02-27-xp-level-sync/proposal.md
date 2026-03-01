## Why

HUD にレベルバッジ・XP パイチャートが実装済み (#161) だが、サーバー → クライアントの XP/レベル同期パイプラインが欠落しており常に Lv1/XP0 のまま。サーバー側の `HeroSchema` に `level` フィールドがなく、レベルアップ判定もない。

## What Changes

- サーバー `HeroSchema` に `level`, `talentPoints` フィールドを追加し、XP 閾値超過時にレベルアップ + タレントポイント付与を行う
- レベルアップ時に `talentPoints` を +1。タレント取得時に -1（タレント取得ロジック自体は本スコープ外）
- クライアントの `ServerHeroState` / `OnlineGameMode` に `xp`, `level`, `talentPoints` を追加し同期パイプラインを完成させる
- XP 閾値定数を `shared/constants.ts` に一元化する（既に移動済み、HUD 側の参照を確認）

## Capabilities

### New Capabilities
- `xp-level-sync`: サーバー→クライアント間の XP/レベル同期パイプラインとレベルアップ処理

### Modified Capabilities
- `hero-stats`: `HeroSchema` に `level` フィールド追加、レベルアップによるステータス成長

## Non-goals

- タレント選択 UI・タレント取得ロジック（別 Issue。本スコープでは `talentPoints` の付与・同期のみ）
- レベル連動リスポーンタイマー (#84)
- レベルアップ演出・エフェクト（将来 Issue）
- ヒーロースキルのレベル依存強化

## Impact

- `server/src/schema/HeroSchema.ts` — `level`, `talentPoints` フィールド追加
- `server/src/game/ServerMinionSystem.ts` — XP 配布後のレベルアップ判定
- `src/network/GameMode.ts` — `ServerHeroState` に `xp`, `level`, `talentPoints` 追加
- `src/network/OnlineGameMode.ts` — `xp`, `level`, `talentPoints` のリスナー追加・抽出
- `src/scenes/GameScene.ts` — `applyServerHeroNonPositionState` で `xp`, `level`, `talentPoints` 反映
- 既存の `shared/constants.ts` に XP 定数は集約済み
