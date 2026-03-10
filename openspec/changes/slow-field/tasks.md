## 1. Shared 型定義・スキル定義

- [x] 1.1 `ZoneEffectParams` インターフェースを `skillDefinitions.ts` に追加し、`SkillEffectParams` 共用体に含める
- [x] 1.2 `aura-slow-field` スキル定義を `SKILL_DEFINITIONS` に追加（targeting: 'point', cooldown: 14, range: 600, zoneRadius: 200, zoneDuration: 4, speed -60）
- [x] 1.3 スキル定義テスト — `getSkillDefinition('aura-slow-field')` が正しいパラメータを返すことを検証

## 2. ZoneSchema・GameRoomState

- [x] 2.1 `server/src/schema/ZoneSchema.ts` を新規作成（x, y, radius, remainingDuration, team, casterId, skillId）
- [x] 2.2 `GameRoomState` に `zones: MapSchema<ZoneSchema>` を追加

## 3. zoneEffectHandler

- [x] 3.1 `SkillExecutionContext` に `zones` フィールドを追加
- [x] 3.2 `server/src/game/skills/handlers/zoneEffectHandler.ts` を新規作成 — ゾーン生成ロジック
- [x] 3.3 `handlers/index.ts` に `zoneEffectHandler` を登録
- [x] 3.4 `executeSkill` に `zones` パラメータを追加し、コンテキストに渡す
- [x] 3.5 `GameRoom` で `executeSkill` 呼び出しに `zones` を渡す

## 4. ServerZoneSystem

- [x] 4.1 `server/src/game/ServerZoneSystem.ts` を新規作成 — `tickZones(zones, heroes, dt)` 関数
- [x] 4.2 `GameRoom` の update ループに `tickZones` 呼び出しを追加（tickBuffs の前）
- [x] 4.3 ゾーンシステムテスト — ゾーンの持続時間が減少し、0 以下で削除されることを検証
- [x] 4.4 ゾーンシステムテスト — 範囲内の敵にデバフが適用されることを検証
- [x] 4.5 ゾーンシステムテスト — 範囲外のヒーローには効果なしを検証
- [x] 4.6 ゾーンシステムテスト — 味方には効果なし（enemy ターゲット時）を検証
- [x] 4.7 ゾーンシステムテスト — 死亡ヒーローは対象外を検証

## 5. 統合テスト

- [x] 5.1 `executeSkill` 経由で `aura-slow-field` を発動し、ゾーンが生成されることを検証
- [x] 5.2 `executeSkill` 経由で CD が 14 秒にセットされることを検証
- [x] 5.3 全テスト・lint パス確認
