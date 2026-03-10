## Tasks

### 1. Shared 定義

- [x] 1.1 `SkillTargeting` に `'enemy'` を追加する
- [x] 1.2 `SKILL_DEFINITIONS` に `aura-weaken` エントリを追加する

### 2. ターゲット解決の統合

- [x] 2.1 `resolveHeroTarget` を実装する（フィルタ引数で ally/enemy を切り替え）
- [x] 2.2 既存の `resolveAllyTarget` を `resolveHeroTarget` + ally フィルタに置換する
- [x] 2.3 `executeSkill` に `enemy` ターゲティング分岐を追加する（`targetHero` が null なら不発）

### 3. 実効ステータス計算の汎用化

- [x] 3.1 `StatusEffectSystem.ts` に `getEffectiveStat(base, hero, buffType)` を追加する
- [x] 3.2 `ServerMovementSystem` の speed 計算を `getEffectiveStat` に置換する
- [x] 3.3 `ServerCombatManager` の `hero.attackDamage` 3箇所を `getEffectiveStat` に置換する

### 4. テスト

- [x] 4.1 `aura-weaken` スキル定義のユニットテスト
- [x] 4.2 `resolveHeroTarget` のユニットテスト（敵選択、味方選択、射程外、味方除外、死亡除外）
- [x] 4.3 `executeSkill` aura-weaken のユニットテスト（敵デバフ適用、射程外不発でCD未消費、CD設定）
- [x] 4.4 `getEffectiveStat` のユニットテスト（デバフ反映、バフ反映、エフェクトなし、0 クランプ）
- [x] 4.5 攻撃力デバフ反映のユニットテスト（メレー攻撃時のダメージ低下）
- [x] 4.6 全テスト・lint パス確認（`npm run test:unit && npm run lint`）
