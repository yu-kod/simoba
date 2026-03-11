## Why

BOLT の火力ビルドパスに Depth 5 のアクティブスキルが不足している。Snipe（狙撃態勢）は移動速度を犠牲にして通常攻撃を大幅強化するモード切替スキルで、ポジショニングのリスク・リターンを生むゲームプレイを追加する。Issue #209。

## What Changes

- `shared/skills/skillDefinitions.ts` に `bolt-snipe` スキル定義を追加（`buff` effectType、self targeting）
- `shared/talents/boltTalents.ts` に `bolt-snipe` タレントノードを追加（Depth 5, Cost 2）
- サーバー側テスト追加（スキル定義・バフ適用・移動速度低下の検証）
- 既存の `buff` エフェクトハンドラの `additionalBuffs` 機能をそのまま活用（新ハンドラ不要）

## Capabilities

### New Capabilities
- `bolt-snipe`: BOLT の Snipe スキル定義、パラメータ、タレントノード配置

### Modified Capabilities

（なし — 既存の buff システムをそのまま利用）

## Impact

- `shared/skills/skillDefinitions.ts` — スキル定義追加
- `shared/talents/boltTalents.ts` — タレントノード追加
- `server/src/__tests__/` — テストファイル追加
- クライアント側の変更なし（バフは既存の StatusEffect レンダリングで表示される）
