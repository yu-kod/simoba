## 1. プロダクトコード修正 (heroType 受け渡しバグ)

- [x] 1.1 `LobbyScene.startOffline()` が `selectedHeroType` を GameScene に渡すよう修正
- [x] 1.2 `GameScene.init()` が `heroType` パラメータを受け取り、ヒーロー生成に使用するよう修正

## 2. E2E ヘルパー更新

- [x] 2.1 `helpers.ts` の `OFFLINE_PLAY_BUTTON.y` を 420 → 460 に修正
- [x] 2.2 `selectHeroInLobby(page, heroType)` ヘルパー関数を追加 (ロビーのヒーロー選択ボタンをクリック)
- [x] 2.3 `startOfflineGame(page, heroType?)` にオプション引数を追加し、指定時は `selectHeroInLobby` を呼ぶ

## 3. E2E テスト修正

- [x] 3.1 `debug-hero-switch.spec.ts` を削除
- [x] 3.2 `hero-selection.spec.ts` を新規作成 (ロビーでのヒーロー選択テスト: デフォルト BLADE、BOLT 切替、AURA 切替)
- [x] 3.3 `projectile-attack.spec.ts` を `startOfflineGame(page, 'BOLT')` に更新 (デバッグキー依存を除去)

## 4. テスト実行・検証

- [x] 4.1 `npm run test:unit` でユニットテスト全 PASS を確認
- [x] 4.2 `npx playwright test` で E2E テスト実行し、修正対象テストが PASS することを確認
