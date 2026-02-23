## Why

`GameRoom.onJoin()` で `heroType` が `'BLADE'` にハードコードされており、オンラインモードでは全プレイヤーが BLADE になる。ヒーロー選択はゲームの多様性を支える中核機能であり、Phase 2 のオンラインプレイを成立させるために必要。

## What Changes

- **ロビーにヒーロー選択 UI を追加**: LobbyScene の waiting 状態でヒーロータイプを選択できるボタンを表示
- **joinOrCreate 時に heroType を送信**: クライアントが選択した heroType を join options として送信
- **サーバー側で heroType に応じたステータスで生成**: GameRoom.onJoin で受け取った heroType の HERO_DEFINITIONS を参照してヒーローを初期化
- **バリデーション**: サーバー側で不正な heroType をリジェクト（デフォルト BLADE にフォールバック）

## Non-goals

- ゲーム中のヒーロー切り替え（デバッグ用キー 1/2/3 のオンライン対応は別 Issue）
- ヒーローのロック/アンロック機構
- チーム内での重複ヒーロー禁止ルール
- ヒーロー選択の時間制限やカウントダウン

## Capabilities

### New Capabilities

- `hero-selection`: ロビーでのヒーロー選択 UI、join options による heroType 送信、サーバー側バリデーション

### Modified Capabilities

(なし — 既存の heroes spec の要件自体は変更しない。実装レベルのハードコード解消のみ)

## Impact

- **Client**: `LobbyScene.ts` — ヒーロー選択 UI 追加、`NetworkClient.ts` — join options 対応
- **Server**: `GameRoom.ts` — onJoin で heroType を受け取り適用
- **Shared**: `HeroType` 型は既存 (`@shared/types`)
- **API**: `joinOrCreate` の options に `{ heroType: HeroType }` を追加
- 参照: `openspec/specs/heroes.md`, `openspec/specs/lobby-scene/spec.md`
