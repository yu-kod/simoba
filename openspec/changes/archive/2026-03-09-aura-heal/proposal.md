## Why

AURAの味方支援ビルドの起点となるスキル Heal を実装する。現在のスキルシステムは攻撃系（dash, projectile）のみで、味方を対象とするスキルが存在しない。Heal は「味方または自分のHPを回復する」というシンプルな仕様で、新しい `heal` effectType と `ally` ターゲティングの最初の実装として最適。今後の Haste, Barrier 等の味方支援スキル基盤となる。

## What Changes

- `shared/skills/skillDefinitions.ts` に `HealEffectParams` インターフェースと `aura-heal` スキル定義を追加
- `SkillEffectParams` 共用体に `HealEffectParams` を追加
- サーバーに `healEffectHandler` を新規作成（スキル発動時にターゲットのHPを回復）
- `SkillExecutionContext` に `heroes` MapSchema 参照を追加（味方ターゲット解決のため）
- `executeSkill` で `ally` ターゲティング時にクリック座標から最寄り味方を検索するロジックを追加
- クライアント側のターゲティングUIで `ally` モードの視覚フィードバック（既存の色変更で対応可能）

## Capabilities

### New Capabilities
- `aura-heal`: Heal スキルの定義、heal effectType ハンドラ、味方ターゲット解決の実装

### Modified Capabilities
- `skill-execution`: `ally` ターゲティングのサポート追加（最寄り味方検索、射程チェック）

## Impact

- **shared/skills/**: `HealEffectParams` 追加、`SkillEffectParams` 共用体拡張
- **server/src/game/skills/handlers/**: 新規 `healEffectHandler.ts`
- **server/src/game/**: `ServerSkillExecutionSystem` に ally ターゲット解決ロジック追加
- **server/src/game/skills/**: `SkillExecutionContext` に heroes 参照追加
- **src/scenes/**: クライアント側ターゲティングUI（ally モード対応）
