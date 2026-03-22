## Why

モバイル対応（#272〜#275）を進めるにあたり、現在のデバイスが PC かモバイル（タッチデバイス）かを判別する仕組みが必要。入力方式（キーボード vs タッチ）や UI レイアウト（ボタンサイズ等）をデバイスに応じて切り替える前提基盤となる。

## What Changes

- デバイス判別ユーティリティ（`detectDevice()`）を新規追加
- タッチ対応有無・デバイス種別（desktop / mobile）を判定し `DeviceInfo` として返す
- ゲーム起動時に1回判定し、InputHandler・GameHud 等の各コンポーネントへ注入可能にする

## Non-goals

- 仮想ジョイスティックやタッチ UI の実装（#272, #273 で対応）
- HUD のレスポンシブレイアウト変更（#275 で対応）
- タブレット専用の最適化（まず desktop / mobile の2分類で十分）

## Capabilities

### New Capabilities
- `device-detection`: デバイス種別（desktop / mobile）とタッチ対応有無を判別するユーティリティ。ゲーム起動時に判定し、各システムから参照可能な `DeviceInfo` を提供する。

### Modified Capabilities

なし

## Impact

- `src/config/` に新規モジュール追加
- 後続の入力系・UI 系チケットがこの判別結果に依存する
- 既存コードへの変更は不要（判別結果の消費は後続チケットで行う）
