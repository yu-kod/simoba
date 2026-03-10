## Why

AURAの味方支援ビルドの2つ目のスキル Haste を実装する。Heal で構築した ally ターゲティング基盤を再利用しつつ、新しい `buff` effectType を導入する。Haste は「味方または自分の移動速度を一時的に上昇させる」スキルで、バフの持続時間管理という新しい仕組みの最初の実装となる。今後の Barrier, Weaken 等のバフ/デバフスキルの基盤になる。

## What Changes

- `shared/skills/skillDefinitions.ts` に `BuffEffectParams` インターフェースと `aura-haste` スキル定義を追加
- `SkillEffectParams` 共用体に `BuffEffectParams` を追加
- `SkillDefinition` に ally ターゲティング用の `range` フィールドを追加（`getAllyRange` の fragility 解消）
- `HeroSchema` に `speedBonus` と `speedBoostTimer` フィールドを追加（バフ状態管理）
- サーバーに `buffEffectHandler` を新規作成（バフ適用）
- `ServerMovementSystem` または GameRoom の tick で `speedBoostTimer` の減算とバフ解除を処理

## Capabilities

### New Capabilities
- `aura-haste`: Haste スキルの定義、buff effectType ハンドラ、速度バフ持続時間管理

### Modified Capabilities
- `skill-execution`: `SkillDefinition` に `range` フィールド追加、`getAllyRange` を汎用化

## Impact

- **shared/skills/**: `BuffEffectParams` 追加、`SkillDefinition.range` 追加、`SkillEffectParams` 共用体拡張
- **server/src/schema/**: `HeroSchema` に `speedBonus`, `speedBoostTimer` 追加
- **server/src/game/skills/handlers/**: 新規 `buffEffectHandler.ts`
- **server/src/game/**: `ServerSkillExecutionSystem` の `getAllyRange` 修正、バフタイマー tick 処理追加
