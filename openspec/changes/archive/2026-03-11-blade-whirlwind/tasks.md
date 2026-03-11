## 1. Shared — スキル定義 & Zone パラメータ拡張

- [x] 1.1 `ZoneEffectParams` に `tickDamage?: number`, `tickInterval?: number`, `followCaster?: boolean` を追加 (`shared/skills/skillDefinitions.ts`)
- [x] 1.2 `blade-whirlwind` を `SKILL_DEFINITIONS` に登録（targeting: self, effectType: zone, cooldown: 12, zoneRadius: 120, zoneDuration: 3, tickDamage: 30, tickInterval: 0.5, followCaster: true, speed debuff -40）
- [x] 1.3 `ZONE_VISUALS` に `blade-whirlwind` エントリ追加（赤橙系カラー）(`shared/zone/zoneVisuals.ts`)

## 2. Server — ZoneSchema 拡張

- [x] 2.1 `ZoneSchema` に `tickDamage` (float32), `tickInterval` (float32), `tickTimer` (float32), `followHeroId` (string) フィールド追加 (`server/src/schema/ZoneSchema.ts`)

## 3. Server — Zone ハンドラ拡張

- [x] 3.1 `zoneEffectHandler` で `followCaster: true` の場合に `targetPosition` をキャスター座標に設定し、`followHeroId` / `tickDamage` / `tickInterval` を zone にセット (`server/src/game/skills/handlers/zoneEffectHandler.ts`)
- [x] 3.2 `zoneEffectHandler` で Whirlwind の自己速度 debuff status effect を付与する（buffType: speed, value: -40, duration: zoneDuration）

## 4. Server — ServerZoneSystem tick ダメージ & 追従ロジック

- [x] 4.1 `tickZones()` に追従ロジック追加：`followHeroId` が設定されている zone は毎 tick ヒーロー座標に追従 (`server/src/game/ServerZoneSystem.ts`)
- [x] 4.2 `tickZones()` にキャスター死亡時のゾーン削除追加：`followHeroId` のヒーローが dead なら zone を即削除
- [x] 4.3 `tickZones()` に tick ダメージ追加：`tickDamage > 0` の zone は `tickTimer` をデクリメントし、0 以下になったら範囲内の敵ヒーローにダメージ適用 + タイマーリセット
- [x] 4.4 tick ダメージを敵ミニオンにも適用する

## 5. Server — テスト

- [x] 5.1 `skillExecution.test.ts` に `blade-whirlwind` テスト追加（ゾーン生成、CD 設定、ダッシュ中拒否）
- [x] 5.2 `ServerZoneSystem` テストに追従ゾーンのテスト追加（座標追従、キャスター死亡時削除）
- [x] 5.3 `ServerZoneSystem` テストに tick ダメージのテスト追加（敵ダメージ、味方無害、ミニオンダメージ、合計 180 ダメージ検証）
- [x] 5.4 速度 debuff の適用・期限切れテスト

## 6. Client — Zone レンダリング

- [x] 6.1 `ZoneRenderer` が追従ゾーンの座標変更をリアルタイム反映することを確認（既存の `ServerZoneState` update で自動対応のはず）

## 7. 結合検証

- [x] 7.1 `npm run lint` パス
- [x] 7.2 `npm run test` (unit + E2E) 全パス
