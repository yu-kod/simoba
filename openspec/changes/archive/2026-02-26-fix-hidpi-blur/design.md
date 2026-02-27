## Context

Phaser.js はデフォルトで `resolution: 1` でキャンバスを作成する。DPR > 1 のディスプレイでは CSS でキャンバスが引き伸ばされ、テキスト・図形がボケる。現在の `gameConfig` には `resolution` が未設定。

現状のゲーム座標系は 1280x720 で、`Phaser.Scale.FIT` + `CENTER_BOTH` で画面にフィットさせている。

## Goals / Non-Goals

**Goals:**
- 高DPIディスプレイでテキスト・図形をシャープに描画する
- ゲーム内座標系（1280x720）を変更しない

**Non-Goals:**
- 低スペック端末向けの動的 DPR 切り替え（Phase 1 ではジオメトリ描画のみで負荷は軽微）
- `lineStyle` やフォントサイズの個別調整（Phaser が resolution を内部で吸収するため不要）

## Decisions

### `resolution: window.devicePixelRatio` を gameConfig に追加

**理由**: Phaser の公式な高DPI対応方法。`width`/`height` はゲーム座標系として維持され、内部のキャンバスバッファだけが DPR 倍の物理ピクセルで描画される。

**代替案**:
- `resolution: 2` 固定 — DPR が 1 の端末で無駄な描画コスト。DPR が 3 の端末でまだボケる。却下。
- CSS `image-rendering: pixelated` — ジオメトリ描画には効果なし。却下。

### lineStyle / fontSize は変更しない

Phaser が resolution を座標変換に自動適用するため、既存の `lineStyle(2, ...)` や `fontSize: '48px'` はそのまま正しく動作する。

## Risks / Trade-offs

- **パフォーマンス低下** — DPR=2 で描画ピクセル数が 4 倍。→ Phase 1 はジオメトリ描画のみで GPU 負荷は軽微。問題が出たら Issue で対応。
- **E2E テストへの影響** — Playwright の座標クリックは CSS 座標系なので影響なし。スクリーンショット比較テストがある場合はベースライン更新が必要。→ 現在スクリーンショット比較テストは未使用。
