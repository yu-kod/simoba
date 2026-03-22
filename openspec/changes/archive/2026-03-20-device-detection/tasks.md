## 1. デバイス判別ユーティリティ（`specs/device-detection/spec.md` — デバイス種別の判定）

- [x] 1.1 `DeviceType`, `DeviceInfo` の型定義と `detectDevice()` 関数のテストを作成（TDD: テスト先行）
- [x] 1.2 `src/config/deviceDetection.ts` に `detectDevice()` を実装し、テストをパスさせる

## 2. タイトル画面への表示（`specs/device-detection/spec.md` — タイトル画面にデバイス判定結果を表示）

- [x] 2.1 タイトル画面（LobbyScene 等）のコードを確認し、表示追加箇所を特定する
- [x] 2.2 タイトル画面の右下にデバイス判定結果を薄い文字で表示する実装とテスト
