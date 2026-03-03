## 1. 定数・スキーマ追加

- [x] 1.1 `shared/constants.ts` に `HERO_KILL_XP_REWARD = 150` を追加する（spec: `hero-kill-xp`）
- [x] 1.2 `HeroSchema` に `lastAttackerSessionId: string`（初期値 `''`）フィールドを追加する（spec: `hero-kill-xp`）

## 2. キラー追跡（ダメージ時の attacker 記録）

- [x] 2.1 `combatUtils.applyDamageToTarget` に `attackerSessionId?: string` 引数を追加し、ヒーローへのダメージ時に `lastAttackerSessionId` を更新する（spec: `hero-kill-xp`）
- [x] 2.2 `ServerCombatManager.processHeroCombat` の melee/ranged 両パスで `attackerSessionId` を渡す（spec: `hero-kill-xp`）
- [x] 2.3 `ServerProjectileSystem.processProjectiles` で投射物ヒット時に `ownerId` を `attackerSessionId` として渡す（spec: `hero-kill-xp`）
- [x] 2.4 キラー追跡のユニットテストを作成する（ヒーロー→ヒーロー、タワー→ヒーローで更新されないケース）（spec: `hero-kill-xp`）

## 3. キル XP 付与

- [x] 3.1 `ServerDeathSystem.processDeathAndRespawn` の死亡検知ブロックで `lastAttackerSessionId` からキラーを特定し、`HERO_KILL_XP_REWARD` を付与 + `computeLevelUp` + `applyStatsGrowth` を適用する（spec: `hero-kill-xp`, `death-respawn`）
- [x] 3.2 リスポーン処理で `lastAttackerSessionId` を `''` にリセットする（spec: `death-respawn`）
- [x] 3.3 キル XP 付与のユニットテストを作成する（キラーへの XP 付与、レベルアップ、タワーキルで XP なし、切断済みキラー）（spec: `hero-kill-xp`, `xp-level-sync`）

## 4. 既存テスト更新

- [x] 4.1 `ServerCombatManager.test.ts` の `applyDamageToTarget` 呼び出しが新しい引数に対応しているか確認・修正する
- [x] 4.2 `ServerProjectileSystem.test.ts` の `applyDamageToTarget` 呼び出しを更新する
- [x] 4.3 全テスト実行（`npm run test:unit`）で PASS を確認する
