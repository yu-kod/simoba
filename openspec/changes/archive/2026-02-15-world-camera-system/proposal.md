## Why

現在の GameScene はビューポートサイズ (1280x720) をそのままワールドとして扱っており、仕様で定められた 3200x720px の横スクロールワールドが未実装。カメラシステムもないためプレイヤー追従ができない。マップ全体を使った 2v2 ゲームプレイの土台として、ワールド空間とカメラが必要。

## What Changes

- ワールド空間を 3200x720px に拡張（現在は 1280x720）
- Phaser カメラをプレイヤー位置に追従させる
- カメラをワールド境界内にクランプする（はみ出し防止）
- ワールド定数（サイズ等）を `src/domain/constants.ts` に追加
- `GameScene` を更新してカメラ設定とワールド描画を組み込む

## Non-goals

- マップ上の要素（ベース、タワー、ブッシュ等）の描画 → #45 で対応
- WASD 入力システム → #18 で対応
- ミニマップ → 将来の Issue で対応

## Capabilities

### New Capabilities

- `world-camera`: ワールド空間の定義（サイズ・境界）とカメラ追従・境界制限システム

### Modified Capabilities

（なし）

## Impact

- `src/config/gameConfig.ts` — ビューポートサイズの明確化
- `src/domain/constants.ts` — ワールド定数追加
- `src/scenes/GameScene.ts` — カメラ設定・ワールド描画の追加
- 既存のヒーロー移動がワールド座標系で動作するようになる
