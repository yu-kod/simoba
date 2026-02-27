## Why

Phaser のキャンバスが `resolution: 1` で描画されているため、DPR > 1 のディスプレイ（Retina 等）でテキストや図形がボケて表示される。CSS スケーリングで引き伸ばされるため、物理ピクセルより低い解像度で描画されている。

## What Changes

- `gameConfig` に `resolution: window.devicePixelRatio` を追加し、高DPIディスプレイでネイティブ解像度で描画する
- ゲーム内座標系（1280x720）は変更なし（Phaser が内部で吸収）
- `lineStyle` やフォントサイズはゲーム座標系で指定されているため、調整不要

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `hero-rendering`: gameConfig の resolution 設定追加（描画品質の変更）

## Impact

- **コード**: `src/config/gameConfig.ts` — `resolution` プロパティ追加
- **テスト**: `src/config/__tests__/gameConfig.test.ts` — resolution テスト追加
- **パフォーマンス**: 描画ピクセル数が DPR² 倍になるため、低スペック端末で負荷増加の可能性あり（ただし Phase 1 のジオメトリ描画では影響は軽微）
