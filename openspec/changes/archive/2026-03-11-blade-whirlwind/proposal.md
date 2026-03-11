## Why

BLADE の火力ビルドパスに Depth 3 の AoE スキルが欠けている。Whirlwind（旋風）を実装して近接火力ビルドの中核スキルを完成させ、集団戦での BLADE の差別化を実現する。

## What Changes

- `blade-whirlwind` スキル定義を `skillDefinitions.ts` に追加（targeting: self, 持続 AoE）
- 既存の zone システムを再利用して「自分中心に追従するダメージゾーン」を実装
  - 通常の zone は固定座標だが、Whirlwind はキャスター追従が必要 → zone の tick ごとに座標更新
- zone の `tickDamage` パラメータを追加し、持続的にダメージを与えるゾーンタイプを拡張
- Whirlwind 発動中の移動制限（移動速度低下）を status effect で実現
- `ZoneRenderer` に Whirlwind 用ビジュアル（回転エフェクト）を追加

## Capabilities

### New Capabilities
- `blade-whirlwind`: BLADE の持続 AoE スキル。自分中心の追従ゾーンで周囲の敵に tick ダメージを与える

### Modified Capabilities
（なし — 既存の zone システムの内部拡張のみで、既存スキルの要件変更は発生しない）

## Impact

- **Server**: `ZoneSchema` に `tickDamage` / `followHeroId` フィールド追加、`ServerZoneSystem.ts` に追従ロジックとティックダメージ追加
- **Shared**: `skillDefinitions.ts` に定義追加、`ZoneEffectParams` に `tickDamage` / `followCaster` パラメータ追加
- **Client**: `ZoneRenderer.ts` に Whirlwind ビジュアル追加
- **既存スキルへの影響**: なし（新規フィールドは optional、既存 zone スキルは変更不要）
