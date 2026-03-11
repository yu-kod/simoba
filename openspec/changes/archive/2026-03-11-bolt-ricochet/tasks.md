## Tasks

### Backend — Schema & Definition
- [x] `server/src/schema/ProjectileSchema.ts` に `bounceRemaining` (int16) と `bounceRange` (float32) フィールドを追加
- [x] `shared/skills/skillDefinitions.ts` の `ProjectileEffectParams` に optional `bounceCount` と `bounceRange` を追加
- [x] `shared/skills/skillDefinitions.ts` に `bolt-ricochet` スキル定義を追加
- [x] `server/src/game/skills/handlers/projectileEffectHandler.ts` で bounceRemaining / bounceRange を設定

### Backend — Bounce Logic
- [x] `server/src/game/ServerProjectileSystem.ts` の `processLinearProjectile` にバウンスロジックを追加（ヒット時に最近接ヒーローへリダイレクト、distanceTraveled リセット）

### Tests
- [x] `server/src/__tests__/boltRicochet.test.ts` テスト作成（定義検証、バウンド動作、範囲外停止、同一敵除外、バウンス切れ、ダッシュ中拒否）

### Verification
- [x] `npm run test:unit` 全パス確認
- [x] `npm run lint` パス確認
