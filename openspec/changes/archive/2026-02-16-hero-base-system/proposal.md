## Why

現在の GameScene にはヒーローの描画・ステータス管理がハードコードされており、BLADE 1体のみが固定色の円で表示される。通常攻撃・スキル・Bot AI 等の後続システム (#22-#29) は全て「複数ヒーローがそれぞれ固有ステータスを持ち、エイム方向が分かる描画で表示される」基盤を前提としている。この基盤を整備しないと Phase 1 の残り機能が実装できない。

## What Changes

- **HeroState を拡張**: 移動速度・攻撃力・攻撃範囲を追加し、ヒーロータイプごとに異なるベースステータスを定義
- **HeroRenderer を新設**: ジオメトリック描画（円 + 向きインジケーター + タイプ別固有色）を GameScene から分離。チーム識別は HP バー (#58) で行うため、ヒーロー本体の色はタイプごとに自由設定
- **GameScene をリファクタ**: インラインの描画コードを HeroRenderer に委譲
- **ヒーローの向き表示**: 向きインジケーター描画を追加。移動と攻撃/スキル発動は排他的（同時に行えない。攻撃・スキル発動時は立ち止まる）。向きルール: 移動中→移動方向、攻撃/スキル発動中→対象方向、どちらでもない→最後の向きを維持。通常攻撃はターゲット指定式（遠距離追尾・近接必中）であり方向ベースではない

## Capabilities

### New Capabilities
- `hero-stats`: ヒーロータイプ別ベースステータス定義（HP・速度・攻撃力・攻撃範囲）と HeroState のライフサイクル管理
- `hero-rendering`: ジオメトリック描画システム（円 + 向きインジケーター + タイプ別固有色・形状）

### Modified Capabilities
(なし — 既存 spec の要件変更はなし)

## Impact

- **変更対象**: `src/domain/entities/Hero.ts`, `src/domain/constants.ts`, `src/domain/types.ts`, `src/scenes/GameScene.ts`
- **新規ファイル**: `src/domain/entities/heroStats.ts`, `src/scenes/HeroRenderer.ts`
- **依存関係**: InputState の `aimWorldPosition` を HeroRenderer で利用
- **E2E テスト**: スクリーンショット更新が必要（ヒーローの見た目が変わるため）
