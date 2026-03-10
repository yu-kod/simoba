## 1. Shared 型定義・スキル定義

- [x] 1.1 `ZoneEffectParams` に `triggerDamage?`, `triggerOnce?`, `zoneEffect.duration?` を追加
- [x] 1.2 `bolt-trap` スキル定義を `SKILL_DEFINITIONS` に追加
- [x] 1.3 スキル定義テスト — `getSkillDefinition('bolt-trap')` が正しいパラメータを返すことを検証

## 2. ZoneSchema 拡張

- [x] 2.1 `ZoneSchema` に `triggerDamage`, `triggerOnce`, `effectDuration` フィールドを追加

## 3. zoneEffectHandler 拡張

- [x] 3.1 `zoneEffectHandler` でトリガーフィールドを ZoneSchema に転写
- [x] 3.2 ハンドラーテスト — Trap ゾーン生成時にトリガーフィールドが正しく設定されることを検証

## 4. ServerZoneSystem トリガーロジック

- [x] 4.1 `tickZones` にトリガー式ゾーンの処理を追加（ダメージ + デバフ + 消滅）
- [x] 4.2 テスト — 敵が Trap を踏んだ時にダメージが適用されることを検証
- [x] 4.3 テスト — 敵が Trap を踏んだ時にスローデバフが effectDuration 秒で適用されることを検証
- [x] 4.4 テスト — Trap トリガー後にゾーンが削除されることを検証（triggerOnce）
- [x] 4.5 テスト — 味方は Trap をトリガーしないことを検証
- [x] 4.6 テスト — 死亡ヒーローは Trap をトリガーしないことを検証
- [x] 4.7 テスト — lastAttackerSessionId がセットされることを検証

## 5. 統合テスト

- [x] 5.1 `executeSkill` 経由で `bolt-trap` を発動し、ゾーンが生成されることを検証
- [x] 5.2 `executeSkill` 経由で CD が 10 秒にセットされることを検証
- [x] 5.3 全テスト・lint パス確認
