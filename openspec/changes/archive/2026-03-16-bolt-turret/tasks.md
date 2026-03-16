## Tasks

### Backend — Schema & Definition
- [x] `server/src/schema/TowerSchema.ts` に `remainingDuration` (float32, default 0) と `ownerId` (string, default '') を追加
- [x] `shared/skills/skillDefinitions.ts` に `TurretEffectParams` インターフェースを追加し、`SkillEffectParams` union に含める
- [x] `shared/skills/skillDefinitions.ts` に `bolt-turret` スキル定義を追加
- [x] `shared/talents/boltTalents.ts` に `bolt-turret` タレントノードを追加（Depth 6, Cost 2, prereq: bolt-minefield）

### Backend — Skill Execution Context
- [x] `server/src/game/skills/SkillEffectHandler.ts` の `SkillExecutionContext` に `towers: MapSchema<TowerSchema>` を追加
- [x] `server/src/game/ServerSkillExecutionSystem.ts` の `executeSkill` に `towers` パラメータを追加
- [x] `server/src/rooms/GameRoom.ts` の `executeSkill` 呼び出しに `this.state.towers` を渡す

### Backend — Turret Handler
- [x] `server/src/game/skills/handlers/turretEffectHandler.ts` を作成（TowerSchema を生成し towers に追加）
- [x] `server/src/game/skills/handlers/index.ts` に turretEffectHandler を登録

### Backend — Turret Lifetime
- [x] `server/src/game/ServerTurretLifetime.ts` を作成（`processTurretLifetime` 純粋関数 — duration > 0 のタワーを減衰・除去）
- [x] `server/src/rooms/GameRoom.ts` の update ループに `processTurretLifetime` を組み込む

### Tests
- [x] `server/src/__tests__/boltTurret.test.ts` テスト作成（定義検証、スポーン検証、ライフタイム期限切れ、破壊可能、チーム継承、タレントノード）
- [x] 既存テストの `executeSkill` 呼び出しに `towers` パラメータを追加して型エラーを修正

### Verification
- [x] `npm run test:unit` 全パス確認
- [x] `npm run lint` パス確認
