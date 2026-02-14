## 1. ワールド定数の追加

- [x] 1.1 `src/domain/constants.ts` に `WORLD_WIDTH = 3200` と `WORLD_HEIGHT = 720` を追加する (spec: world-camera — ワールド空間の定義)

## 2. 移動システムのワールド境界クランプ

- [x] 2.1 `src/domain/systems/MovementSystem.ts` に `clampToWorld()` 関数を追加する。位置とエンティティ半径を受け取り、ワールド境界内にクランプした新しい Position を返す (spec: world-camera — ヒーロー移動のワールド境界クランプ)
- [x] 2.2 `move()` 関数で移動後に `clampToWorld()` を適用する
- [x] 2.3 `clampToWorld()` と更新後の `move()` のユニットテストを追加する（Phaser モック不要で動作すること）

## 3. GameScene のワールド・カメラ設定

- [x] 3.1 `GameScene.create()` でワールド背景を 3200x720 の Graphics 矩形に拡張する (spec: world-camera — ワールド背景の描画)
- [x] 3.2 Phaser 物理ワールド境界を `this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)` で設定する (spec: world-camera — ワールド空間の定義)
- [x] 3.3 カメラに `setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT)` を設定する (spec: world-camera — カメラのワールド境界制限)
- [x] 3.4 ヒーロー描画オブジェクトをカメラ追従ターゲットに設定する (`camera.startFollow()` + ラープ) (spec: world-camera — カメラのターゲット追従)

## 4. 動作確認

- [x] 4.1 既存のユニットテスト (`npm run test:unit`) が全て PASS することを確認する
- [x] 4.2 ブラウザでヒーローを移動させ、カメラ追従・境界制限が動作することを目視確認する
