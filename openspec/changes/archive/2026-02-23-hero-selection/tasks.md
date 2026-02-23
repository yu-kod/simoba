## 1. Server: heroType バリデーション & 適用

- [x] 1.1 `GameRoom.onJoin` で `options.heroType` を受け取り、`HERO_DEFINITIONS` のキーでバリデーション。無効値は BLADE フォールバック (spec: server-validates-and-applies-heroType)
- [x] 1.2 既存の `GameRoom.test.ts` を更新: options 付き join テスト（有効 heroType, 無効 heroType, heroType なし）

## 2. Client: NetworkClient options 対応

- [x] 2.1 `NetworkClient.connect()` に `options?: Record<string, unknown>` パラメータ追加、`joinOrCreate` に渡す (spec: join-options-include-heroType)
- [x] 2.2 `NetworkClient` のユニットテスト更新（options 引数の型チェック） — 既存テストなし。薄い colyseus.js ラッパーのため TypeScript コンパイル（4.2）で型安全性を担保

## 3. Client: LobbyScene ヒーロー選択 UI

- [x] 3.1 LobbyScene の menu 状態にヒーロー選択ボタン（BLADE, BOLT, AURA）を横並びで追加。デフォルト BLADE 選択状態 (spec: hero-selection-ui-in-lobby)
- [x] 3.2 選択状態のハイライト切り替えロジック（`selectedHeroType` 状態管理 + ボタン色更新）
- [x] 3.3 `startOnline()` で `NetworkClient.connect('game', { heroType: selectedHeroType })` を呼び出す

## 4. テスト & 検証

- [x] 4.1 全ユニットテスト PASS を確認 (`npm run test:unit`)
- [x] 4.2 TypeScript コンパイル確認（client + server）
