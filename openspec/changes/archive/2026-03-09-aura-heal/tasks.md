## 1. Shared 定義（shared/）

- [x] 1.1 `HealEffectParams` インターフェースを追加し、`SkillEffectParams` 共用体を拡張する（specs/aura-heal/spec.md: HealEffectParams 定義）
- [x] 1.2 `SKILL_DEFINITIONS` に `aura-heal` エントリを追加する（specs/aura-heal/spec.md: aura-heal スキル定義）

## 2. サーバー基盤（server/）

- [x] 2.1 `CombatEntitySchema.applyHeal(amount)` メソッドを追加する（specs/aura-heal/spec.md: CombatEntitySchema.applyHeal）
- [x] 2.2 `SkillExecutionContext` に `heroes` と `targetHero` フィールドを追加する（specs/skill-execution/spec.md: SkillExecutionContext 拡張）
- [x] 2.3 `executeSkill` に ally ターゲット解決ロジックを追加する — 最寄り同チーム生存ヒーロー検索、射程チェック、自己フォールバック（specs/skill-execution/spec.md: useSkill メッセージ MODIFIED）
- [x] 2.4 `GameRoom` から `executeSkill` に `this.state.heroes` を渡すようにする（specs/skill-execution/spec.md: GameRoom から heroes を渡す）

## 3. Heal エフェクトハンドラ（server/）

- [x] 3.1 `healEffectHandler` を作成し、ハンドラレジストリに登録する（specs/aura-heal/spec.md: healEffectHandler）

## 4. テスト

- [x] 4.1 `CombatEntitySchema.applyHeal` のユニットテスト（通常回復、maxHp クランプ、死亡エンティティ）
- [x] 4.2 `healEffectHandler` のユニットテスト（味方回復、自己フォールバック、maxHp クランプ）
- [x] 4.3 `executeSkill` ally ターゲティングのユニットテスト（射程内味方、射程外自己フォールバック）
- [x] 4.4 全テスト・lint パス確認（`npm run test:unit && npm run lint`）
