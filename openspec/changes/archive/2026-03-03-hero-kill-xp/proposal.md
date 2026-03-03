## Why

現在 XP の獲得源はミニオンキルのみ（`MINION_XP_REWARD = 20`）で、ヒーローを倒しても XP が付与されない。PvP に報酬がないため「敵ヒーローを倒す動機」が薄く、MOBA の正のフィードバックループ（キル → XP → レベルアップ → リスポーン延長）が成立していない。ヒーローキル XP を追加することで、PvP に意味を持たせ Phase 1 の「5 分で楽しい」体験を完成させる。

## What Changes

- ヒーローキル時の XP 報酬定数 `HERO_KILL_XP_REWARD` を追加
- `ServerDeathSystem.processDeathAndRespawn` で死亡検知時にキラーを特定し、XP を付与
- キラー特定のため `HeroSchema` に `lastAttackerSessionId` フィールドを追加（ダメージ適用時に記録）
- XP 付与後に既存の `computeLevelUp` + `applyStatsGrowth` を再利用してレベルアップ判定

## Non-goals

- アシスト XP の分配（キラー以外への XP 付与）
- 倒した相手のレベルに応じた報酬変動（全レベル固定報酬）
- キルストリーク・シャットダウンボーナス
- キルログ UI やキルフィード表示（別 Issue で対応）

## Capabilities

### New Capabilities
- `hero-kill-xp`: ヒーローキル時の XP 付与ロジック、キラー追跡、報酬定数

### Modified Capabilities
- `death-respawn`: 死亡検知時にキラーへ XP を付与する処理を追加
- `xp-level-sync`: ヒーローキル XP 経由のレベルアップ判定を含む

## Impact

- `shared/constants.ts` — `HERO_KILL_XP_REWARD` 定数追加
- `server/src/schema/HeroSchema.ts` — `lastAttackerSessionId` フィールド追加
- `server/src/game/combatUtils.ts` — ダメージ適用時に attacker ID を記録
- `server/src/game/ServerDeathSystem.ts` — キラーへの XP 付与 + レベルアップ処理
- `server/src/game/ServerProjectileSystem.ts` — 投射物ヒット時の attacker 記録
- 関連テストファイル — 新規テスト + 既存テスト更新
