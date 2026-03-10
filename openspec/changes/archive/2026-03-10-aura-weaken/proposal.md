## Why

AURA の Weaken スキル（#214）を実装する。初のデバフスキルであり、敵ヒーローの攻撃力を一定時間低下させる。これにより `enemy` ターゲティングの基盤が整い、今後の敵対象スキル（Slow Field, Nova 等）の土台となる。StatusEffect システム（aura-haste で構築済み）の `isDebuff: true` パスを実戦投入する最初のケース。

## What Changes

- `SkillTargeting` に `'enemy'` を追加
- `resolveEnemyTarget` を実装（クリック座標から最寄りの敵チーム生存ヒーローを range 内で検索）
- `executeSkill` 内で `enemy` ターゲティング時に `resolveEnemyTarget` を呼び、結果を `targetHero` に渡す
- `SKILL_DEFINITIONS` に `aura-weaken` エントリを追加（`effectType: 'buff'`, `isDebuff: true`, `buffType: 'attackDamage'`）
- `ServerCombatManager` でヒーローの攻撃ダメージ計算時に `getStatusEffectValue(hero, 'attackDamage')` を加算
- `buffEffectHandler` はそのまま再利用（既存ハンドラで敵デバフも処理可能）

## Capabilities

### New Capabilities
- `aura-weaken`: Weaken スキル定義、敵ターゲティング、攻撃力デバフ反映

### Modified Capabilities
- `skill-execution`: `SkillTargeting` に `'enemy'` 追加、`resolveEnemyTarget` 実装、`executeSkill` での敵ターゲット解決

## Impact

- `shared/skills/skillDefinitions.ts` — `SkillTargeting` 型拡張、`aura-weaken` 定義
- `server/src/game/ServerSkillExecutionSystem.ts` — `resolveEnemyTarget`、`executeSkill` 分岐追加
- `server/src/game/ServerCombatManager.ts` — 攻撃ダメージに StatusEffect 反映
- テスト: 敵ターゲティング、デバフ適用、攻撃力低下の各テスト追加
