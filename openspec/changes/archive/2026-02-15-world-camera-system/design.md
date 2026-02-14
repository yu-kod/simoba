## Context

現在の `GameScene` は 1280x720 のビューポートをそのままワールドとして使用。仕様では 3200x720px の横スクロールワールドが必要。MVC アーキテクチャ基盤 (#38) は導入済みで、`src/domain/` に純粋 TypeScript のロジック層がある。

## Goals / Non-Goals

**Goals:**
- 3200x720 のワールド空間を確立する
- カメラがターゲット位置を追従する
- カメラがワールド境界内にクランプされる
- ワールド定数を domain 層で管理する

**Non-Goals:**
- マップ要素の描画（ベース、タワー、ブッシュ等）→ #45
- WASD 入力切り替え → #18
- ミニマップ

## Decisions

### 1. ワールド定数の配置場所

**決定:** `src/domain/constants.ts` にワールドサイズ定数を追加。

**理由:** MVC spec に従い、ゲームルール定数は domain 層に置く。ビューポートサイズ (1280x720) は Phaser 設定として `gameConfig.ts` に残す。ワールドサイズ (3200x720) はゲームルールなので domain。

### 2. カメラ制御の実装方式

**決定:** Phaser の `camera.startFollow()` + `camera.setBounds()` を使用。

**代替案:** 毎フレーム手動で `camera.scrollX/Y` を計算する方法。

**理由:** Phaser 組み込みの追従 API は十分に柔軟で、デッドゾーンやラープ（補間）も設定可能。手動計算は不要な複雑さを招く。

### 3. ワールド背景の描画方式

**決定:** `GameScene.create()` で 3200x720 の Graphics 矩形を描画。

**理由:** Phase 1 ではジオメトリック描画のみ。TileSprite は画像アセット前提なので不適。単純な矩形で十分。

### 4. ヒーロー移動のワールド境界制限

**決定:** `src/domain/systems/MovementSystem.ts` の `move()` 関数にワールド境界クランプを追加。

**理由:** 移動制限はゲームルール（domain 層）の責務。View 層の物理エンジンに依存しない。

## Risks / Trade-offs

- **[Risk]** ビューポートサイズ変更時にカメラ比率が崩れる → Phaser の `Scale.FIT` + `CENTER_BOTH` で対応済み
- **[Trade-off]** カメラの補間（ラープ）をどの程度にするか → 初期値 0.1 で開始、プレイテストで調整
