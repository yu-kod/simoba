## Why

ゾーン（地面設置型の持続効果エリア）はスキルカタログの基盤カテゴリの一つだが、現在のコードベースにはゾーンシステムが存在しない。Slow Field を最初のゾーンスキルとして実装し、後続の Sanctuary (#217)、Trap (#205) 等のゾーンスキルの基盤を構築する。

## What Changes

- `ZoneEffectParams` 型を `skillDefinitions.ts` の判別共用体に追加
- `ZoneSchema` を新規作成し、ゾーンエンティティの状態を管理
- `zoneEffectHandler` を新規作成し、ゾーンの生成を担当
- `ServerZoneSystem` を新規作成し、毎フレームのゾーンティック（範囲内判定 + 効果適用 + 持続時間管理）を担当
- `GameRoom` にゾーンの `MapSchema` とティック処理を追加
- `aura-slow-field` スキル定義を追加（targeting: point, 範囲内の敵に移動速度デバフ）

## Non-goals

- ゾーンのクライアント側描画（別 Issue で対応）
- キャスター追従型ゾーン（Sanctuary 等は別 Issue #217）
- ゾーン同士の重複・相互作用ルール

## Capabilities

### New Capabilities
- `slow-field`: AURA の Slow Field スキル定義、ゾーンエフェクトハンドラー、ゾーンシステム（持続エリア効果の基盤）

### Modified Capabilities

（なし）

## Impact

- `shared/skills/skillDefinitions.ts` — 型追加 + スキル定義追加
- `server/src/schema/` — `ZoneSchema` 新規
- `server/src/game/skills/handlers/` — `zoneEffectHandler` 新規、`index.ts` 登録
- `server/src/game/` — `ServerZoneSystem` 新規
- `server/src/rooms/GameRoom.ts` — ゾーン MapSchema + ティック追加
- `server/src/schema/HeroSchema.ts` — 変更なし（既存の StatusEffect を活用）
