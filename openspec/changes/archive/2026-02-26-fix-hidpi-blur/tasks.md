## Tasks

- [x] `gameConfig` の無効な `resolution` プロパティを削除（Phaser 3.90 では無視される）
- [x] `createText` ヘルパーを作成 — `Text.setResolution(DPR)` を自動適用 (`src/scenes/ui/createText.ts`)
- [x] GameScene の全テキスト生成(3箇所)を `createText` に置換
- [x] LobbyScene の全テキスト生成(7箇所)を `createText` に置換
- [x] `createText` のユニットテスト追加 (`src/scenes/ui/__tests__/createText.test.ts`)
- [x] ユニットテスト実行 (`npm run test:unit`) — 500 テスト全 PASS
- [x] E2E テスト実行 (`npm run test:e2e`) — 24 テスト全 PASS (1件フレーキー再実行で PASS)
