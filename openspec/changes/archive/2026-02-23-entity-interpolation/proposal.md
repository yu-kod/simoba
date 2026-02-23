## Why

オンラインモードでリモートエンティティ（敵プレイヤー等）の位置がサーバー更新ごとに瞬間移動（snap）し、激しいカクつきが発生している。`handleServerHeroUpdate` が `state.x/y` を直接 `position` に書き込み、`HeroRenderer.sync()` が即座に `setPosition()` するため。ローカルヒーローも `reconcile()` がサーバー位置にリセット→入力再適用するため、予測とサーバーのズレが大きいとガクつく。

## What Changes

- **InterpolationBuffer** クラスを新設 — リモートエンティティのサーバー状態を `{ prev, target, serverTime }` でバッファリングし、2スナップショット間を時間ベースで線形補間（lerp）して描画
- **HeroRenderer の補間描画** — リモートエンティティは `sync()` で即座に位置設定するのではなく、InterpolationBuffer を参照して毎フレーム lerp した位置で描画
- **Prediction Smoothing** — ローカルヒーローの `reconcile()` 結果と現在の予測位置の間を数フレームかけてブレンド（小さいズレは徐々に補正、大きいズレは即スナップ）
- **ServerHeroState に serverTime フィールド追加** — Colyseus サーバー側でタイムスタンプを付与し、補間の時間計算に使用

## Non-goals

- サーバー側の tick rate 変更（現行 20Hz 維持）
- リモートエンティティの dead reckoning / extrapolation（補間のみ、外挿はしない）
- タワーやプロジェクタイルの補間（ヒーローのみ対象、タワーは静止物）
- オフラインモードへの影響（補間はオンラインモード専用）

## Capabilities

### New Capabilities

- `entity-interpolation`: リモートエンティティのサーバー状態バッファリングと時間ベース線形補間による滑らかな描画

### Modified Capabilities

- `online-multiplayer`: `handleServerHeroUpdate` のリモートエンティティ position 適用を直接書き込みから InterpolationBuffer 経由に変更。`ServerHeroState` に `serverTime` フィールド追加。

## Impact

- `src/network/GameMode.ts` — `ServerHeroState` に `serverTime` 追加
- `src/network/InterpolationBuffer.ts` — 新規ファイル
- `src/scenes/GameScene.ts` — `handleServerHeroUpdate` でリモートエンティティの位置を InterpolationBuffer に格納、`update()` で毎フレーム補間位置を計算
- `src/scenes/HeroRenderer.ts` — 補間位置での描画対応
- `src/network/MovementPredictor.ts` — prediction smoothing ロジック追加
- `server/src/rooms/GameRoom.ts` — `serverTime` フィールドをスキーマに追加
- `shared/schemas/PlayerState.ts` — Colyseus スキーマに `serverTime` 追加
