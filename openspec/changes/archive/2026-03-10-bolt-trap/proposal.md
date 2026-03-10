## Why

Trap はゾーンカテゴリの派生スキルで、設置型の「トリガー式」ゾーンを実現する。既存の zone システム（ZoneSchema + ServerZoneSystem）を拡張し、敵が踏んだ瞬間にダメージ+デバフを適用して消滅するワンショット型ゾーンを追加する。

## What Changes

- `ZoneSchema` に `triggerDamage`（踏んだ時のダメージ）と `triggerOnce`（1回トリガーで消滅するか）フィールドを追加
- `ServerZoneSystem.tickZones` にトリガー式ゾーンの処理を追加（敵が踏む → ダメージ + デバフ適用 → ゾーン消滅）
- `bolt-trap` スキル定義を追加（targeting: point, ダメージ + スロー）
- `ZoneEffectParams` に `triggerDamage` と `triggerOnce` フィールドを追加

## Non-goals

- 罠のクライアント側描画（ステルス表示含む）
- 設置数上限（Phase 1 では制限なし）
- 罠の可視性制御（敵チームからの不可視）

## Capabilities

### New Capabilities
- `bolt-trap`: BOLT の Trap スキル定義、トリガー式ゾーンの拡張

### Modified Capabilities

（なし — zone システムの内部拡張のみで、既存 slow-field の動作は変わらない）

## Impact

- `server/src/schema/ZoneSchema.ts` — フィールド追加
- `server/src/game/ServerZoneSystem.ts` — トリガーロジック追加
- `shared/skills/skillDefinitions.ts` — ZoneEffectParams 拡張 + スキル定義追加
- `server/src/game/skills/handlers/zoneEffectHandler.ts` — 新フィールドの転写
