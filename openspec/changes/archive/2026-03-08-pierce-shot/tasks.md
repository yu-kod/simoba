## Tasks

### Backend

- [x] `shared/skills/skillDefinitions.ts` に `ProjectileEffectParams` インターフェースを追加し、`SkillEffectParams` 共用体を拡張する
- [x] `shared/skills/skillDefinitions.ts` に `pierce-shot` スキル定義を `SKILL_DEFINITIONS` に追加する
- [x] `ProjectileSchema` に新フィールドを追加する（`mode`, `dirX`, `dirY`, `maxRange`, `pierceRemaining`）
- [x] `ServerProjectileSystem` に linear モードの直進移動ロジックを追加する（射程制限 + 累計移動距離追跡）
- [x] `ServerProjectileSystem` に貫通ヒット判定ロジックを追加する（全敵衝突判定、hitEntityIds 管理、pierceRemaining 減算）
- [x] `SkillExecutionContext` に `projectiles: MapSchema<ProjectileSchema>` 参照を追加する
- [x] `projectileEffectHandler` を新規作成し、エフェクトハンドラレジストリに登録する
- [x] `GameRoom` の `executeSkill` 呼び出し時に `SkillExecutionContext` へ projectiles を渡す

### Backend Tests

- [x] `skillDefinitions` テスト: Pierce Shot 定義の参照、ProjectileEffectParams の型チェック
- [x] `ServerProjectileSystem` テスト: linear モード直進移動、射程制限での除去、貫通ヒット（複数敵）、同一敵二重ヒット防止、homing モード既存動作の非破壊確認
- [x] `skillExecution` テスト: Pierce Shot 発動でプロジェクタイル生成、クールダウン設定、死亡時・CD中の拒否

### Frontend

- [x] `ProjectileRenderer` が linear モードのプロジェクタイルも正しく描画できることを確認する（既存の drawServer で対応可能 — 変更不要）

### Integration

- [x] 全テスト実行（`npm run test:unit`）で既存テストが壊れていないことを確認する
