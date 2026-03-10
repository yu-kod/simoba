## Why

AURA ヒーローの攻撃的スキルが不在。現状は支援（Heal, Haste）とデバフ（Weaken）のみで、集団戦で敵に直接ダメージを与える手段がない。Nova は地点指定の範囲攻撃 + 味方回復という二面効果で、AURA の戦術的価値を高める。また、スキルシステムに `effectType: 'aoe'` を新設し、今後の範囲スキル（Whirlwind, Slow Field 等）の基盤となる。

## What Changes

- `shared/skills/skillDefinitions.ts` に `aura-nova` スキル定義を追加（`targeting: 'point'`, `effectType: 'aoe'`）
- `AoEEffectParams` 型を `SkillEffectParams` 判別共用体に追加
- 新規 `aoeEffectHandler` を実装 — 指定地点を中心に半径内の敵にダメージ、味方に回復
- `shared/skills/skillDefinitions.ts` に `'point'` ターゲティングの解決ロジック追加（`ServerSkillExecutionSystem` で座標をそのまま `targetPosition` として渡す — 既存動作で対応済み）
- ハンドラ登録（`handlers/index.ts`）

## Capabilities

### New Capabilities
- `aura-nova`: AURA の Nova スキル定義、AoE エフェクトハンドラー、地点指定範囲ダメージ+回復の仕様

### Modified Capabilities
なし — `skill-execution` spec の `targeting: 'point'` は既に定義済み。`executeSkill` は `targetPosition` を既にコンテキストに渡しており、追加のターゲット解決ロジックは不要。

## Non-goals

- 範囲エフェクトの視覚演出（円形インジケーター等）は別 Issue で対応
- 持続型 AoE（Whirlwind 等）の tick ダメージフレームワークは本スコープ外
- タレントツリーへの配置は別 Issue

## Impact

- **Server**: `server/src/game/skills/handlers/aoeEffectHandler.ts`（新規）、`handlers/index.ts`（登録追加）
- **Shared**: `shared/skills/skillDefinitions.ts`（`AoEEffectParams` 型 + `aura-nova` 定義）
- **既存コード変更なし**: `ServerSkillExecutionSystem` は `targeting: 'point'` を `direction` と同様に処理（方向正規化 + targetPosition）。特別なターゲット解決は不要
- **参照スペック**: `openspec/specs/skill-execution/spec.md`, `openspec/specs/heroes.md`
