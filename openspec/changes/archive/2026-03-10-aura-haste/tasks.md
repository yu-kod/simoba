## 1. Shared 定義（shared/）

- [x] 1.1 `BuffEffectParams` インターフェースを追加し、`SkillEffectParams` 共用体を拡張する
- [x] 1.2 `SkillDefinition` に `range?: number` フィールドを追加する
- [x] 1.3 `aura-heal` の range を `HealEffectParams` から `SkillDefinition.range` に移行する
- [x] 1.4 `SKILL_DEFINITIONS` に `aura-haste` エントリを追加する

## 2. StatusEffect システム（server/）

- [x] 2.1 `StatusEffectSchema` を新規作成する（id, buffType, value, remainingDuration, isDebuff）
- [x] 2.2 `HeroSchema` に `statusEffects: MapSchema<StatusEffectSchema>` を追加する
- [x] 2.3 `getStatusEffectValue(hero, buffType)` ヘルパーを作成する
- [x] 2.4 `tickBuffs(hero, dt)` 関数を作成する（タイマー減算、期限切れ削除）

## 3. スキル実行システム修正（server/）

- [x] 3.1 `getAllyRange` を `def.range ?? 0` に簡素化し、effectType 依存を除去する
- [x] 3.2 GameRoom の update ループで `tickBuffs` を呼ぶ

## 4. Buff エフェクトハンドラ（server/）

- [x] 4.1 `buffEffectHandler` を作成し、ハンドラレジストリに登録する

## 5. 移動速度反映（server/）

- [x] 5.1 `ServerMovementSystem` で `hero.speed + getStatusEffectValue(hero, 'speed')` を実効速度として使う

## 6. クライアント同期（src/）

- [x] 6.1 `OnlineGameMode` で `statusEffects` の同期リスナーを追加する

## 7. テスト

- [x] 7.1 `StatusEffectSchema` と `getStatusEffectValue` のユニットテスト
- [x] 7.2 `tickBuffs` のユニットテスト（減算、期限切れ削除、複数バフ同時）
- [x] 7.3 `buffEffectHandler` のユニットテスト（味方バフ、自己フォールバック、リフレッシュ）
- [x] 7.4 `executeSkill` aura-haste のユニットテスト（発動 → バフ適用、CD 設定）
- [x] 7.5 移動速度バフ反映のユニットテスト
- [x] 7.6 全テスト・lint パス確認（`npm run test:unit && npm run lint`）
