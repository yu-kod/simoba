## Why

サーバー権威モード（#98）移行後、オンラインモードの戦闘で**全ての視覚フィードバックが欠落**している。HP減少・死亡判定はサーバーで正しく処理されるが、クライアント側でダメージフラッシュ・メレースイング・死亡非表示が一切表示されない。オフラインモードでは `processAttack()` の戻り値から直接エフェクトをトリガーしているが、オンラインモードではこのパスが存在しない。

Issue #101 参照。

## What Changes

- `handleServerHeroUpdate` で HP 減少を検知し、ダメージフラッシュ（`flash()`）を発火
- `handleServerTowerUpdate` で HP 減少を検知し、タワーのダメージフラッシュを発火
- `updateOnlineInput` で攻撃中のメレースイングを楽観的に再生
- 死亡→リスポーン時に `MovementPredictor` と `InputBuffer` をリセットして予測ズレを防止

## Capabilities

### New Capabilities

_(なし — 既存の仕組みにオンライン対応を追加する実装変更)_

### Modified Capabilities

_(なし — 仕様レベルの要件変更はなく、実装の接続不足を修正するバグフィックス)_

## Non-goals

- ネットワークスムージング / Entity Interpolation（#100 で別途対応）
- オフラインモードのエフェクト変更（既に動作している）
- 新しいエフェクト種類の追加

## Impact

- `src/scenes/GameScene.ts` — `handleServerHeroUpdate`, `handleServerTowerUpdate`, `updateOnlineInput` の修正
- `src/scenes/effects/MeleeSwingRenderer.ts` — 変更なし（既存 API を呼ぶだけ）
- `src/scenes/HeroRenderer.ts` — 変更なし（`flash()` と `sync()` は既存）
- `src/network/InputBuffer.ts`, `src/network/MovementPredictor.ts` — リセット API の追加 or 呼び出し

関連スペック: `openspec/specs/attack-system/`, `openspec/specs/death-respawn/`, `openspec/specs/hero-rendering/`
