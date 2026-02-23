## Why

ヒーロー選択機能がロビーに移動し、デバッグ用キー (1-2-3) が削除された (PR #115)。この変更により E2E テストが 4 件壊れている (Issue #117):
- `debug-hero-switch.spec.ts` — 存在しないデバッグキーに依存 (5 テスト全滅)
- `projectile-attack.spec.ts` — `page.keyboard.press('2')` で BOLT 切り替え不可 (2 テスト)

加えて、`startOffline()` がロビーで選択したヒーロータイプを `GameScene` に渡していないため、ロビーで BOLT を選んでも GameScene では常に BLADE になる実装バグも存在する。

## What Changes

- `debug-hero-switch.spec.ts` を削除し、代わりにロビーのヒーロー選択 E2E テストを新設
- `projectile-attack.spec.ts` をロビーでのヒーロー選択フローに更新
- E2E ヘルパーに `selectHeroInLobby(page, heroType)` 関数を追加
- `LobbyScene.startOffline()` が `selectedHeroType` を GameScene に渡すよう修正
- `GameScene.init()` が受け取った `heroType` を使うよう修正
- `helpers.ts` の `OFFLINE_PLAY_BUTTON.y` を実際のレイアウト (460) に修正

## Non-goals

- オンラインモードのヒーロー選択テスト (サーバー不要のオフラインテストのみ)
- 新規ヒーローの追加
- ロビー UI のデザイン変更

## Capabilities

### New Capabilities

なし — 新規 spec は不要。E2E テストの修正とバグ修正のみ。

### Modified Capabilities

なし — spec レベルの要件変更はない。ロビー→GameScene へのヒーロータイプ受け渡しは既存仕様の実装バグ修正。

## Impact

- `e2e/debug-hero-switch.spec.ts` — 削除
- `e2e/projectile-attack.spec.ts` — ロビー選択フローに書き換え
- `e2e/helpers.ts` — `selectHeroInLobby` 追加、ボタン座標修正
- `src/scenes/LobbyScene.ts` — `startOffline()` が heroType を渡す
- `src/scenes/GameScene.ts` — `init()` が heroType を受け取る
