## 1. UIスケールユーティリティ

- [x] 1.1 `src/scenes/ui/uiScale.ts` を作成 — `createUiScale(cameraZoom)` でサイズ・フォントサイズのズーム補正関数を提供
- [x] 1.2 `src/scenes/ui/__tests__/uiScale.test.ts` を作成 — ズーム2.0/1.0でのサイズ・フォントサイズ変換をテスト

## 2. スキルスロットのデータモデル

- [x] 2.1 `src/domain/ui/skillSlotConfig.ts` を作成 — `SkillSlotType`, `SkillSlotConfig` 型定義とデバッグ用初期構成 `DEBUG_SKILL_SLOTS`
- [x] 2.2 `src/domain/ui/__tests__/skillSlotConfig.test.ts` を作成 — デバッグ構成がアクティブ1+パッシブ1+空1であることをテスト

## 3. HUDレイアウト計算

- [x] 3.1 `src/domain/ui/hudLayout.ts` を作成 — スロット数・パネルサイズからHUD各要素の座標を計算する純粋関数
- [x] 3.2 `src/domain/ui/__tests__/hudLayout.test.ts` を作成 — スロット数変動時のレイアウト計算をテスト

## 4. スキルスロット描画

- [x] 4.1 `src/scenes/ui/SkillSlotRenderer.ts` を作成 — 個別スロットの描画（アクティブ/パッシブ/空の3状態、クールダウンオーバーレイ）
- [x] 4.2 アクティブスロットにキーラベル表示、パッシブにはラベルなし、空は暗い背景のみ
- [x] 4.3 クールダウン中の暗転オーバーレイ＋残り秒数テキスト表示

## 5. レベルバッジ

- [x] 5.1 `src/scenes/ui/LevelBadge.ts` を作成 — 丸型バッジにレベル数値を描画、値変更時に更新

## 6. XPプログレスバー

- [x] 6.1 `src/scenes/ui/XpBar.ts` を作成 — 横バーでXP進捗を描画、MAX_LEVEL到達時は100%表示

## 7. HUD用HPバー

- [x] 7.1 `src/scenes/ui/HudHpBar.ts` を作成 — 現在HP/最大HPの数値付き横バー、フレーム毎に更新

## 8. HUDコンテナ統合

- [x] 8.1 `src/scenes/ui/GameHud.ts` を作成 — 子コンポーネント（スロット群、レベルバッジ、XPバー、HPバー）を配置するコンテナ
- [x] 8.2 `GameHud.update(delta, heroState)` メソッドで各子コンポーネントにヒーロー状態を配信

## 9. GameScene統合

- [x] 9.1 `GameScene.create()` で `GameHud` を生成し、scrollFactor(0), depth(1100) を設定
- [x] 9.2 `GameScene.update()` で毎フレーム `GameHud.update()` を呼び出し、ローカルヒーローの状態を渡す
- [x] 9.3 マッチ終了時・リスポーン中のHUD表示状態を確認

## 10. テスト・動作確認

- [x] 10.1 ユニットテスト全パス確認（`npm run test:unit`）
- [x] 10.2 ブラウザで目視確認 — 3スロット表示、レベルバッジ、XPバー、HPバーが正しい位置に表示される
- [x] 10.3 既存E2Eテストが破壊されていないことを確認（`npm run test:e2e`）
