## 1. ドメイン層: 入力型定義

- [x] 1.1 `src/domain/input/InputState.ts` に `InputState`, `TargetingState`, `SkillSlot`, `CastMode` 型を定義する (spec: input-system — InputState の Phaser 非依存性)
- [x] 1.2 `src/domain/input/InputState.ts` にデフォルト `InputState` を生成する `createDefaultInputState()` 関数を実装する

## 2. ドメイン層: 純粋関数

- [x] 2.1 `src/domain/input/computeMovement.ts` に WASD キー状態から正規化方向ベクトルを算出する `computeMovement()` を実装する (spec: input-system — WASD 8方向移動入力)
- [x] 2.2 `src/domain/input/computeAim.ts` にヒーロー位置とマウスワールド座標からエイム方向を算出する `computeAimDirection()` を実装する (spec: input-system — マウスエイム方向)
- [x] 2.3 `src/domain/input/targetingReducer.ts` にターゲティングステートマシンの遷移関数 `updateTargeting()` を実装する (spec: input-system — スキルターゲティング Normal Cast / Quick Cast)

## 3. ユニットテスト: ドメイン層

- [x] 3.1 `computeMovement` のユニットテストを作成する（4方向、斜め正規化、対向キー相殺、未押下）
- [x] 3.2 `computeAimDirection` のユニットテストを作成する（右上方向、同一位置ゼロベクトル）
- [x] 3.3 `updateTargeting` のユニットテストを作成する（Normal Cast 発火、キャンセル、スキル切り替え、Quick Cast 発火、Quick Cast キャンセル）

## 4. アダプター層: Phaser 入力ブリッジ

- [x] 4.1 `src/scenes/InputHandler.ts` に Phaser シーンから WASD/マウス/スキルキー/右クリック/Space の生イベントを取得し `InputState` に変換する `InputHandler` クラスを実装する
- [x] 4.2 マウススクリーン座標 → ワールド座標変換を `InputHandler` 内で `camera.getWorldPoint()` を使って実装する
- [x] 4.3 右クリックのコンテキストメニュー抑制を実装する

## 5. GameScene 統合

- [x] 5.1 `GameScene` から `readInput()` メソッドと `cursors` フィールドを削除し、`InputHandler` に置き換える (spec: input-system — InputState の Phaser 非依存性)
- [x] 5.2 `GameScene.update()` で `InputHandler` から `InputState` を取得し、移動ロジックに渡すよう変更する

## 6. game-mechanics spec 更新

- [x] 6.1 `openspec/specs/game-mechanics.md` の Controls テーブルを右クリック攻撃 + スキルターゲティングモードに更新する (spec: game-mechanics — Controls)

## 7. テスト & 検証

- [x] 7.1 全ユニットテストが PASS することを確認する (`npm run test:unit`)
- [x] 7.2 E2E テストが PASS することを確認する (`npm run test:e2e`)
- [x] 7.3 TypeScript コンパイルが通ることを確認する (`npx tsc --noEmit`)
