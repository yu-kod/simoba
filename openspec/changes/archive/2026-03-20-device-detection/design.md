## Context

現在のゲームクライアントはキーボード + マウス入力のみ対応。モバイル対応（#272〜#275）の前提として、デバイス種別を判定し各コンポーネントに提供する仕組みが必要。

既存の入力・UI 構成:

- `src/scenes/InputHandler.ts` — WASD + マウス入力
- `src/scenes/ui/GameHud.ts` — HUD 描画（固定サイズ）
- `src/config/gameConfig.ts` — Phaser 設定

## Goals / Non-Goals

**Goals:**

- デバイス種別（desktop / mobile）を判定するユーティリティを提供する
- タッチ対応有無を判定する
- ゲーム起動時に1回判定し、各コンポーネントから参照可能にする

**Non-Goals:**

- UI レイアウトの切り替え実装（後続チケット）
- 入力方式の切り替え実装（後続チケット）
- タブレット専用カテゴリの導入

## Decisions

### 1. 配置場所: `src/config/deviceDetection.ts`

`gameConfig.ts` と同階層に配置。デバイス判別は環境設定の一部であり、ドメインロジックではない。

**代替案:** `src/domain/input/` — 入力に近いが、UI からも参照されるため config 層が適切。

### 2. 判定方式: Phaser.Device API を活用

Phaser 3 組み込みの `device.os.desktop` を利用する。内部では UA パターンマッチング + `maxTouchPoints`（iPad iOS 13+ 対策）で判定しており、信頼性が高い。

- `game.device.os.desktop` でデバイス種別を判定（UA ベース、エッジケース考慮済み）
- `game.device.input.touch` でタッチ対応有無を判定

**不採用案:**

- 画面幅ベース — デスクトップでブラウザリサイズすると誤判定。デバイス種別の判定には不向き。
- 自前 UA 解析 — Phaser が既に実装済みのロジックを再発明する必要がない。
- `navigator.userAgentData.mobile` — Safari/Firefox が未対応のため不十分。

### 3. インターフェース: `DeviceInfo` readonly オブジェクト

```typescript
type DeviceType = 'desktop' | 'mobile'

interface DeviceInfo {
  readonly type: DeviceType
  readonly isTouchDevice: boolean
}
```

シンプルな2フィールドで開始。viewport 情報等は必要になった時点で拡張する。

**代替案:** `isMobile()` のような単一関数 — 拡張性が低い。

### 4. 依存注入パターン: 関数引数で渡す

`detectDevice()` の結果を各コンポーネントのコンストラクタに渡す。グローバルシングルトンは使わない（テスタビリティ確保）。

### 5. テスト戦略: Phaser.Device のモック

`detectDevice()` は `Phaser.Device` を受け取る関数として設計し、テストではモックオブジェクトを渡すことで各判定パターンを検証する。

## Risks / Trade-offs

- **[Risk] iPad (iOS 13+) が macOS と同じ UA を返す** → Phaser が `maxTouchPoints > 2` で iPad と判定する補正ロジックを内蔵しているため対応済み。
- **[Risk] タッチ対応 PC（Surface 等）の分類** → `device.os.desktop` は Surface タブレットモードを非デスクトップと判定する。タッチ対応有無は `isTouchDevice` で別途参照可能。
