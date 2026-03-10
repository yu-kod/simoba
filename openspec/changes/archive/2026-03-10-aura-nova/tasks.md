## 1. Shared 型定義・スキル定義

- [x] 1.1 `AoEEffectParams` インターフェースを `skillDefinitions.ts` に追加し、`SkillEffectParams` 共用体に含める
- [x] 1.2 `aura-nova` スキル定義を `SKILL_DEFINITIONS` に追加（targeting: 'point', cooldown: 16, damage: 80, healAmount: 60, radius: 200）
- [x] 1.3 スキル定義テスト — `getSkillDefinition('aura-nova')` が正しいパラメータを返すことを検証

## 2. AoE エフェクトハンドラー

- [x] 2.1 `server/src/game/skills/handlers/aoeEffectHandler.ts` を新規作成 — `targetPosition` 中心に radius 内のヒーローを走査し、敵にダメージ・味方に回復
- [x] 2.2 `handlers/index.ts` に `aoeEffectHandler` を登録
- [x] 2.3 AoE ハンドラーテスト — 範囲内の敵にダメージが適用されることを検証
- [x] 2.4 AoE ハンドラーテスト — 範囲内の味方（キャスター含む）に回復が適用されることを検証
- [x] 2.5 AoE ハンドラーテスト — 範囲外のヒーローには効果なしを検証
- [x] 2.6 AoE ハンドラーテスト — 死亡ヒーローは対象外を検証
- [x] 2.7 AoE ハンドラーテスト — ダメージ時に `lastAttackerSessionId` がセットされることを検証

## 3. 統合テスト

- [x] 3.1 `executeSkill` 経由で `aura-nova` を発動し、point ターゲティングで `targetPosition` が正しく渡されることを検証
- [x] 3.2 `executeSkill` 経由で CD が 16 秒にセットされることを検証
- [x] 3.3 全テスト・lint パス確認
