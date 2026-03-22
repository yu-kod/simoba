# Specification

## Purpose
ゲーム起動時にデバイス種別（desktop / mobile）とタッチ対応有無を判定し、入力方式や UI レイアウトの切り替え基盤を提供する。

## Requirements

### Requirement: デバイス種別の判定
システムは Phaser.Device API を利用してデバイス種別とタッチ対応有無を判定する `detectDevice()` 関数を提供しなければならない（SHALL）。

判定ロジック:

- デバイス種別: `game.device.os.desktop` が `true` なら `'desktop'`、`false` なら `'mobile'`
- タッチ対応: `game.device.input.touch` が `true` ならタッチ対応

返却する `DeviceInfo` は以下のフィールドを持つ:

- `type`: `'desktop'` | `'mobile'`
- `isTouchDevice`: `boolean`

#### Scenario: デスクトップ PC での判定
- **WHEN** `device.os.desktop` が `true` で `device.input.touch` が `false`
- **THEN** `type` は `'desktop'`、`isTouchDevice` は `false`

#### Scenario: モバイル端末での判定
- **WHEN** `device.os.desktop` が `false` で `device.input.touch` が `true`
- **THEN** `type` は `'mobile'`、`isTouchDevice` は `true`

#### Scenario: タッチ対応 PC での判定
- **WHEN** `device.os.desktop` が `true` で `device.input.touch` が `true`
- **THEN** `type` は `'desktop'`、`isTouchDevice` は `true`

### Requirement: タイトル画面にデバイス判定結果を表示
タイトル画面（LobbyScene）の右下に、判定されたデバイス種別を薄い文字で表示しなければならない（SHALL）。

表示形式: `Desktop` または `Mobile`（タッチ対応の場合は `Desktop (Touch)` / `Mobile (Touch)`）

#### Scenario: デスクトップ判定時の表示
- **WHEN** デバイス判定結果が `type: 'desktop'`, `isTouchDevice: false`
- **THEN** タイトル画面の右下に `Desktop` と薄い文字で表示される

#### Scenario: タッチ対応モバイル判定時の表示
- **WHEN** デバイス判定結果が `type: 'mobile'`, `isTouchDevice: true`
- **THEN** タイトル画面の右下に `Mobile (Touch)` と薄い文字で表示される
