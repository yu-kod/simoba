## Tasks

### Backend
- [x] `shared/skills/skillDefinitions.ts` に `bolt-snipe` スキル定義を追加（buff effectType, attackDamage +20, additionalBuffs: attackSpeed +0.4, speed -60, duration 5s, cooldown 16s）
- [x] `shared/talents/boltTalents.ts` に `bolt-snipe` タレントノードを追加（Depth 5, Cost 2, prerequisite: bolt-eagle-eye, grant_skill: bolt-snipe）
- [x] `server/src/__tests__/boltSnipe.test.ts` テスト作成（定義検証、バフ3種適用、クールダウン、ダッシュ中拒否）

### Verification
- [x] `npm run test:unit` 全パス確認
- [x] `npm run lint` パス確認
